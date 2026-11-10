import "server-only";
import { constants, createCipheriv, createDecipheriv, privateDecrypt, publicEncrypt, randomBytes, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, orders, settings } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { applyPaymentStatus } from "@/lib/bog";

/**
 * Keepz (კრედო ბანკის ონლაინ გადახდა) — eCommerce API.
 * ოფიციალური დოკუმენტაცია საჯარო არ არის; სქემა აღებულია Keepz-ის PHP SDK-დან:
 *   მოთხოვნა: { identifier, encryptedData, encryptedKeys, aes: true }
 *   encryptedData = AES-256-CBC(JSON), encryptedKeys = RSA-OAEP-SHA256(base64(key) + "." + base64(iv)) Keepz-ის საჯარო გასაღებით
 *   პასუხი იშიფრება ჩვენი (მერჩანტის) პირადი გასაღებით.
 * Keepz-ის შეკვეთის ID-ს ვინახავთ orders.bog_order_id-ში (ზოგადი „ბანკის შეკვეთის ID“).
 */

export const KEEPZ_SETTINGS_KEY = "_keepz";
export const KEEPZ_DEFAULT_URL = "https://gateway.keepz.me/ecommerce-service";
export type KeepzConfig = {
  enabled: boolean;
  integratorId: string;
  receiverId: string;
  receiverType: string;
  publicKey: string; // Keepz-ის საჯარო გასაღები (PEM)
  privateKey: string; // მერჩანტის პირადი გასაღები (PEM)
  baseUrl: string;
};

export async function getKeepzConfig(): Promise<KeepzConfig> {
  const [row] = await db.select().from(settings).where(eq(settings.key, KEEPZ_SETTINGS_KEY));
  const v = (row?.value ?? {}) as Partial<KeepzConfig>;
  return {
    enabled: v.enabled ?? true,
    integratorId: (v.integratorId ?? "").trim(),
    receiverId: (v.receiverId ?? "").trim(),
    receiverType: (v.receiverType || "BRANCH").trim(),
    publicKey: v.publicKey ?? "",
    privateKey: v.privateKey ?? "",
    baseUrl: (v.baseUrl || KEEPZ_DEFAULT_URL).trim().replace(/\/+$/, ""),
  };
}

export const keepzReady = (c: KeepzConfig) => c.enabled && !!c.integratorId && !!c.receiverId && !!c.publicKey.trim() && !!c.privateKey.trim();

export async function keepzEnabled() {
  try {
    return keepzReady(await getKeepzConfig());
  } catch {
    return false;
  }
}

/** PEM-ის აღდგენა, თუ ადმინში ხაზების გარეშე ჩაიწერა */
function pem(key: string, kind: "PUBLIC" | "PRIVATE") {
  const k = key.trim().replace(/\\n/g, "\n");
  if (k.includes("-----BEGIN")) return k;
  const body = k.replace(/\s+/g, "").match(/.{1,64}/g)?.join("\n") ?? "";
  return kind === "PUBLIC" ? `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----` : `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;
}

const OAEP = { padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" } as const;

function encrypt(c: KeepzConfig, data: unknown) {
  const key = randomBytes(32);
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encryptedData = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]).toString("base64");
  const encryptedKeys = publicEncrypt(
    { key: pem(c.publicKey, "PUBLIC"), ...OAEP },
    Buffer.from(`${key.toString("base64")}.${iv.toString("base64")}`, "utf8"),
  ).toString("base64");
  return { identifier: c.integratorId, encryptedData, encryptedKeys, aes: true };
}

function decrypt<T>(c: KeepzConfig, res: { encryptedData?: string; encryptedKeys?: string }): T {
  const keys = privateDecrypt({ key: pem(c.privateKey, "PRIVATE"), ...OAEP }, Buffer.from(res.encryptedKeys ?? "", "base64")).toString("utf8");
  const dot = keys.indexOf(".");
  const key = Buffer.from(keys.slice(0, dot), "base64");
  const iv = Buffer.from(keys.slice(dot + 1), "base64");
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  const json = Buffer.concat([decipher.update(Buffer.from(res.encryptedData ?? "", "base64")), decipher.final()]).toString("utf8");
  return JSON.parse(json) as T;
}

async function call<T>(c: KeepzConfig, method: "GET" | "POST", path: string, data: Record<string, unknown>): Promise<T> {
  const env = encrypt(c, data);
  const url = new URL(c.baseUrl + path);
  let init: RequestInit = { method, cache: "no-store", headers: { Accept: "application/json" } };
  if (method === "GET") for (const [k, v] of Object.entries(env)) url.searchParams.set(k, String(v));
  else init = { ...init, headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(env) };
  const res = await fetch(url, init);
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(text);
  } catch {}
  if (!res.ok || !body.aes) throw new Error(`Keepz ${path} ${res.status}: ${text.slice(0, 300)}`);
  return decrypt<T>(c, body as { encryptedData: string; encryptedKeys: string });
}

/** Keepz-ში შეკვეთის შექმნა — აბრუნებს გადახდის გვერდის ბმულს */
export async function createKeepzOrder(o: { number: string; total: number; origin: string; lang?: "ka" | "en" }) {
  const c = await getKeepzConfig();
  if (!keepzReady(c)) throw new Error("Keepz არ არის კონფიგურირებული");
  const id = randomUUID();
  const prefix = o.lang === "en" ? "/en" : "";
  const result = `${o.origin}${prefix}/checkout/result?order=${encodeURIComponent(o.number)}`;
  const data = await call<{ integratorOrderId: string; urlForQR: string }>(c, "POST", "/api/integrator/order", {
    integratorId: c.integratorId,
    integratorOrderId: id,
    amount: Math.round(o.total) / 100,
    receiverId: c.receiverId,
    receiverType: c.receiverType,
    currency: "GEL",
    language: o.lang === "en" ? "EN" : "KA",
    successRedirectUri: result,
    failRedirectUri: result,
    // callback-ის ფორმატი უცნობია — შეკვეთის ნომერს მისამართში ვატანთ და სტატუსს API-დან ვამოწმებთ
    callbackUri: `${o.origin}/api/payments/keepz/callback?order=${encodeURIComponent(o.number)}`,
  });
  return { id, redirect: data.urlForQR };
}

/** კავშირის შემოწმება ადმინიდან: არარსებული შეკვეთის სტატუსი — პასუხი (თუნდაც შეცდომა) ნიშნავს, რომ სერვერი გვცნობს */
export async function testKeepz(c: KeepzConfig) {
  encrypt(c, { test: true }); // საჯარო გასაღების ფორმატი
  pem(c.privateKey, "PRIVATE");
  const res = await fetch(`${c.baseUrl}/api/integrator/order/status?${new URLSearchParams(Object.entries(encrypt(c, { integratorId: c.integratorId, integratorOrderId: randomUUID() })).map(([k, v]) => [k, String(v)]))}`, { cache: "no-store" });
  return { status: res.status, body: (await res.text()).slice(0, 300) };
}

const PAID = new Set(["SUCCESS"]);
const REFUNDED = new Set(["REFUNDED_BY_INTEGRATOR", "PARTIALLY_REFUNDED", "REFUNDED"]);
const FAILED = new Set(["CANCELED", "CANCELLED", "FAILED", "EXPIRED", "REJECTED"]);

/** Keepz-ში სტატუსის გადამოწმება და შეკვეთის განახლება */
export async function syncKeepzOrder(number: string) {
  await ensureSchema();
  const [order] = await db.select().from(orders).where(eq(orders.number, number));
  if (!order || order.payment !== "keepz" || !order.bogOrderId || order.paymentStatus === "refunded") return order ?? null;
  const c = await getKeepzConfig();
  const r = await call<{ status: string }>(c, "GET", "/api/integrator/order/status", { integratorId: c.integratorId, integratorOrderId: order.bogOrderId });
  const key = String(r.status ?? "").toUpperCase();
  let next = order.paymentStatus;
  if (PAID.has(key)) next = "paid";
  else if (REFUNDED.has(key)) next = "refunded";
  else if (FAILED.has(key) && order.paymentStatus !== "paid") next = "failed";
  return applyPaymentStatus(order, next);
}

/** checkout გვერდისთვის (ქეშირებული; ადმინში შენახვისას updateTag("payments")) */
export async function keepzEnabledCached() {
  "use cache";
  cacheTag("payments");
  cacheLife("hours");
  return keepzEnabled();
}

/** ტესტებისთვის */
export const keepzCrypto = { encrypt, decrypt };
