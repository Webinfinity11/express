import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq, gt } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, orders, settings, type OrderLine } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { applyPaymentStatus } from "@/lib/bog";

/**
 * კრედო ბანკის ონლაინ განვადება — https://4developers.credo.ge/apidoc/docs-site/6000022
 * შეკვეთა: POST /widget_api/order.php → data.URL (კლიენტი გადადის კრედოს გვერდზე).
 * check = MD5(ყველა პროდუქტის id+title+amount+price+type + პაროლი); ფასი თეთრებში.
 * სტატუსი: GET /widget/api.php, hash = MD5(merchantId+orderCode+პაროლი).
 * callback და საიტზე დაბრუნების ბმული დოკუმენტაციაში არ არის — სტატუსს თავად ვკითხულობთ (ადმინის შეკვეთები).
 */

export const CREDO_SETTINGS_KEY = "_credo";
const API = "https://ganvadeba.credo.ge";

export type CredoConfig = { enabled: boolean; merchantId: string; password: string };

export async function getCredoConfig(): Promise<CredoConfig> {
  const [row] = await db.select().from(settings).where(eq(settings.key, CREDO_SETTINGS_KEY));
  const v = (row?.value ?? {}) as Partial<CredoConfig>;
  return { enabled: v.enabled ?? true, merchantId: (v.merchantId ?? "").trim(), password: v.password ?? "" };
}

const ready = (c: CredoConfig) => c.enabled && !!c.merchantId && !!c.password;

export async function credoEnabled() {
  try {
    return ready(await getCredoConfig());
  } catch {
    return false;
  }
}

/** checkout გვერდისთვის (ქეშირებული; ადმინში შენახვისას updateTag("payments")) */
export async function credoEnabledCached() {
  "use cache";
  cacheTag("payments");
  cacheLife("hours");
  return credoEnabled();
}

const md5 = (s: string) => createHash("md5").update(s, "utf8").digest("hex");

type CredoProduct = { id: string; title: string; amount: number; price: number; type: string };

/**
 * კრედოს არ აქვს ფასდაკლებისა და მიწოდების ველები, ხოლო ჯამი შეკვეთის ჯამს უნდა ემთხვეოდეს:
 * ფასდაკლება ხაზებზე პროპორციულად ნაწილდება, მიწოდება ცალკე ხაზია.
 */
export function credoProducts(lines: OrderLine[], discount: number, shipping: number): CredoProduct[] {
  let left = discount;
  let rest = lines.reduce((n, l) => n + l.total, 0);
  const out: CredoProduct[] = [];
  for (const l of lines) {
    const off = rest > 0 ? Math.round((left * l.total) / rest) : 0;
    left -= off;
    rest -= l.total;
    const total = l.total - off;
    const unit = Math.floor(total / l.qty);
    const extra = total - unit * l.qty; // ამდენი ცალი ერთი თეთრით ძვირია
    const id = l.sku || String(l.productId);
    const title = (l.variant ? `${l.name} (${l.variant})` : l.name).slice(0, 200);
    if (l.qty - extra > 0) out.push({ id, title, amount: l.qty - extra, price: unit, type: "0" });
    if (extra > 0) out.push({ id, title, amount: extra, price: unit + 1, type: "0" });
  }
  if (shipping > 0) out.push({ id: "delivery", title: "მიწოდება", amount: 1, price: shipping, type: "0" });
  return out;
}

export const credoCheck = (products: CredoProduct[], password: string) =>
  md5(products.map((p) => `${p.id}${p.title}${p.amount}${p.price}${p.type}`).join("") + password);

/** კრედოში განაცხადის შექმნა — აბრუნებს განვადების გვერდის ბმულს */
export async function createCredoOrder(o: { number: string; lines: OrderLine[]; discount: number; shipping: number }) {
  const c = await getCredoConfig();
  if (!ready(c)) throw new Error("კრედოს განვადება არ არის კონფიგურირებული");
  const products = credoProducts(o.lines, o.discount, o.shipping);
  const res = await fetch(`${API}/widget_api/order.php`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchantId: c.merchantId, orderCode: o.number, check: credoCheck(products, c.password), products }),
  });
  const text = await res.text();
  let body: { status?: number; data?: { URL?: string } } = {};
  try {
    body = JSON.parse(text);
  } catch {}
  const url = body.data?.URL;
  if (!res.ok || body.status !== 200 || !url?.startsWith("https://")) throw new Error(`Credo order ${res.status}: ${text.slice(0, 300)}`);
  return { id: o.number, redirect: url };
}

/** კრედოს სტატუსები (დოკუმენტაციიდან) */
export const CREDO_STATUSES: Record<number, string> = {
  11: "დრაფტი — მომხმარებელი ჯერ არ არის იდენტიფიცირებული",
  10: "საჭიროა იდენტიფიკაცია",
  2: "განიხილება",
  9: "გადაგზავნილია ფილიალში",
  14: "ხელახლა განიხილება",
  13: "ვიდეო შემოწმებაზე",
  3: "დამტკიცებული (შესაძლოა დასჭირდეს შემოსავლის შემოწმება)",
  4: "დამტკიცებული — ელოდება ხელმოწერას",
  12: "ხელი მოწერილია — გასაგზავნია პროდუქცია",
  5: "დასრულებული — თანხა ჩარიცხულია",
  6: "უარყოფილი",
  7: "გაუქმებული ან ვადაგასული",
};

/** განაცხადის სტატუსის კოდი კრედოდან; null = სტატუსი ვერ მივიღეთ */
export async function getCredoStatus(orderCode: string): Promise<number | null> {
  const c = await getCredoConfig();
  if (!c.merchantId || !c.password) return null;
  const q = new URLSearchParams({ merchantId: c.merchantId, orderCode, hash: md5(c.merchantId + orderCode + c.password) });
  const res = await fetch(`${API}/widget/api.php?${q}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  const body = (await res.json().catch(() => null)) as { status?: number; data?: unknown } | null;
  if (body?.status !== 200 || body.data == null) return null;
  return Number(body.data);
}

/** მოლოდინში მყოფი განვადებების გადამოწმება; აბრუნებს შეცვლილების რაოდენობას. გამოიძახება მხოლოდ server action-იდან. */
export async function syncPendingCredoOrders() {
  await ensureSchema();
  const since = new Date(Date.now() - 60 * 24 * 3600_000);
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.payment, "credo"), eq(orders.paymentStatus, "pending"), gt(orders.createdAt, since)))
    .orderBy(desc(orders.createdAt))
    .limit(30);
  let changed = 0;
  for (const order of rows) {
    try {
      const s = await getCredoStatus(order.number);
      // 12/5 = ხელშეკრულება გაფორმებულია; 6/7 = უარი ან გაუქმება; დანარჩენი — ისევ მოლოდინში
      const next = s === 12 || s === 5 ? "paid" : s === 6 || s === 7 ? "failed" : null;
      if (!next) continue;
      await applyPaymentStatus(order, next);
      changed++;
    } catch (e) {
      console.error("[credo] status sync failed", order.number, e);
    }
  }
  return changed;
}
