import "server-only";
import { createVerify } from "node:crypto";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { db, orders, productVariants, products, promoCodes, settings, type OrderLine } from "@/db";

/** საქართველოს ბანკის ონლაინ გადახდა — https://api.bog.ge/docs/en/payments/introduction */
const TOKEN_URL = "https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token";
const API = "https://api.bog.ge/payments/v1";

// ბანკის საჯარო გასაღები callback-ის ხელმოწერის შესამოწმებლად (დოკუმენტაციიდან)
const BOG_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhx
tcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g
4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPn
PwIDAQAB
-----END PUBLIC KEY-----`;

/**
 * ონლაინ გადახდის ველები orders ცხრილში — თუ ჯერ არ არსებობს, ერთხელ ემატება (ცარიელი ველები,
 * არსებულ მონაცემებს არ ეხება). drizzle-kit push-ის ნაცვლად, რომ ადმინიდან/საიტიდან თავად მოეწყოს.
 */
let schemaReady: Promise<unknown> | null = null;
export function ensurePaymentSchema() {
  schemaReady ??= db
    .execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text, ADD COLUMN IF NOT EXISTS bog_order_id text`)
    .catch((e) => {
      schemaReady = null;
      throw e;
    });
  return schemaReady;
}

/** პარამეტრები ადმინიდან (settings, key "_bog" — საიტის ტექსტებში არ ერევა და კლიენტს არ მიეწოდება) */
export const BOG_SETTINGS_KEY = "_bog";
export type BogConfig = { enabled: boolean; clientId: string; clientSecret: string };

export async function getBogConfig(): Promise<BogConfig> {
  const [row] = await db.select().from(settings).where(eq(settings.key, BOG_SETTINGS_KEY));
  const v = (row?.value ?? {}) as Partial<BogConfig>;
  return {
    enabled: v.enabled ?? true,
    clientId: (v.clientId || process.env.BOG_CLIENT_ID || "").trim(),
    clientSecret: (v.clientSecret || process.env.BOG_CLIENT_SECRET || "").trim(),
  };
}

export async function bogEnabled() {
  try {
    const c = await getBogConfig();
    return c.enabled && !!c.clientId && !!c.clientSecret;
  } catch {
    return false;
  }
}

/** checkout გვერდისთვის (ქეშირებული; ადმინში შენახვისას updateTag("payments")) */
export async function bogEnabledCached() {
  "use cache";
  cacheTag("payments");
  cacheLife("hours");
  return bogEnabled();
}

let cached: { token: string; until: number; clientId: string } | null = null;

/** ტოკენის მიღება; cfg გადაეცემა „კავშირის შემოწმებისას“ ადმინიდან */
export async function token(cfg?: BogConfig) {
  const c = cfg ?? (await getBogConfig());
  if (!c.clientId || !c.clientSecret) throw new Error("BOG client_id / secret არ არის მითითებული");
  if (!cfg && cached && cached.clientId === c.clientId && cached.until > Date.now()) return cached.token;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${c.clientId}:${c.clientSecret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`BOG auth ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  // expires_in ზოგჯერ წამებშია, ზოგჯერ timestamp — უსაფრთხოდ მაქს. 10 წუთი ვინახავთ
  const secs = typeof data.expires_in === "number" && data.expires_in < 86400 ? data.expires_in : 600;
  cached = { clientId: c.clientId, token: data.access_token, until: Date.now() + Math.min(secs, 600) * 1000 - 30_000 };
  return data.access_token;
}

const tetri = (n: number) => Math.round(n) / 100;

/** ბანკში შეკვეთის შექმნა — აბრუნებს გადახდის გვერდის ბმულს */
export async function createBogOrder(o: {
  number: string;
  lines: OrderLine[];
  discount: number;
  shipping: number;
  total: number;
  name: string;
  origin: string;
}) {
  const body = {
    callback_url: `${o.origin}/api/payments/bog/callback`,
    external_order_id: o.number,
    buyer: { full_name: o.name },
    purchase_units: {
      currency: "GEL",
      total_amount: tetri(o.total),
      ...(o.discount ? { total_discount_amount: tetri(o.discount) } : {}),
      ...(o.shipping ? { delivery: { amount: tetri(o.shipping) } } : {}),
      basket: o.lines.map((l) => ({
        product_id: l.sku || String(l.productId),
        description: (l.variant ? `${l.name} (${l.variant})` : l.name).slice(0, 250),
        quantity: l.qty,
        unit_price: tetri(l.unit),
      })),
    },
    redirect_urls: {
      success: `${o.origin}/checkout/result?order=${encodeURIComponent(o.number)}`,
      fail: `${o.origin}/checkout/result?order=${encodeURIComponent(o.number)}`,
    },
    ttl: 30,
    // მხოლოდ ბარათით გადახდა (Apple/Google Pay და სხვა მეთოდები არ გამოიყენება)
    payment_method: ["card"],
  };
  const res = await fetch(`${API}/ecommerce/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": "ka",
      "Idempotency-Key": crypto.randomUUID(),
      Authorization: `Bearer ${await token()}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`BOG order ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { id: string; _links: { redirect: { href: string } } };
  return { id: data.id, redirect: data._links.redirect.href };
}

type Receipt = { order_id: string; external_order_id?: string; order_status: { key: string } };

export async function getBogReceipt(bogOrderId: string): Promise<Receipt> {
  const res = await fetch(`${API}/receipt/${encodeURIComponent(bogOrderId)}`, {
    headers: { Authorization: `Bearer ${await token()}`, "Accept-Language": "ka" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`BOG receipt ${res.status}: ${await res.text()}`);
  return res.json();
}

export function verifyBogSignature(raw: string, signature: string | null) {
  if (!signature) return false;
  try {
    const v = createVerify("SHA256");
    v.update(raw);
    return v.verify(BOG_PUBLIC_KEY, signature, "base64");
  } catch {
    return false;
  }
}

/** მარაგის ჩამოჭრა + პრომოკოდის გამოყენება — შეკვეთის დადასტურებისას (ან ონლაინ გადახდის შემდეგ) */
export async function commitOrderStock(lines: OrderLine[], promoCode: string | null) {
  if (promoCode) await db.update(promoCodes).set({ usedCount: sql`${promoCodes.usedCount} + 1` }).where(eq(promoCodes.code, promoCode));
  for (const l of lines) {
    if (l.variantId)
      await db
        .update(productVariants)
        .set({ stockQty: sql`greatest(${productVariants.stockQty} - ${l.qty}, 0)` })
        .where(and(eq(productVariants.id, l.variantId), isNotNull(productVariants.stockQty)));
    else
      await db
        .update(products)
        .set({ stockQty: sql`greatest(${products.stockQty} - ${l.qty}, 0)` })
        .where(and(eq(products.id, l.productId), isNotNull(products.stockQty)));
  }
  revalidateTag("catalog", "max");
}

const PAID = new Set(["completed"]);
const FAILED = new Set(["rejected"]);
const REFUNDED = new Set(["refunded", "refunded_partially"]);

/**
 * ბანკიდან სტატუსის გადამოწმება და შეკვეთის განახლება.
 * ბანკის პასუხს ყოველთვის თავად ვკითხულობთ (receipt), callback-ის ტანს არ ვენდობით.
 */
export async function syncBogOrder(bogOrderId: string) {
  await ensurePaymentSchema();
  const [order] = await db.select().from(orders).where(eq(orders.bogOrderId, bogOrderId));
  if (!order || order.paymentStatus === "refunded") return order ?? null;
  const r = await getBogReceipt(bogOrderId);
  const key = r.order_status?.key;
  let next = order.paymentStatus;
  if (PAID.has(key)) next = "paid";
  else if (REFUNDED.has(key)) next = "refunded";
  else if (FAILED.has(key) && order.paymentStatus !== "paid") next = "failed";
  if (next === order.paymentStatus) return order;

  // ატომური გადასვლა pending → paid, რომ მარაგი ორჯერ არ ჩამოიჭრას (callback + redirect ერთდროულად)
  const [updated] = await db
    .update(orders)
    .set({ paymentStatus: next, ...(next === "failed" && order.status === "new" ? { status: "cancelled" } : {}) })
    .where(and(eq(orders.id, order.id), order.paymentStatus ? eq(orders.paymentStatus, order.paymentStatus) : undefined))
    .returning();
  if (!updated) return (await db.select().from(orders).where(eq(orders.id, order.id)))[0];
  if (next === "paid" && order.paymentStatus !== "paid") await commitOrderStock(order.items, order.discount ? order.promoCode : null);
  return updated;
}
