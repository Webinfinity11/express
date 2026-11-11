import "server-only";
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, orders, settings } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { applyPaymentStatus } from "@/lib/bog";

/**
 * Flitt (flitt.com) — hosted checkout: ბარათი, Apple Pay, Google Pay ერთ გვერდზე.
 * დოკუმენტაცია: https://docs.flitt.com/api/create-order/ , /api/building-signature/ , /api/order-status/ , /api/callbacks/
 * ხელმოწერა: sha1(secret | ყველა არაცარიელი პარამეტრის მნიშვნელობა გასაღების ანბანური რიგით), signature-ის გარეშე.
 * Flitt-ის order_id = ჩვენი შეკვეთის ნომერი; ინახება orders.bog_order_id-ში (ზოგადი „ბანკის შეკვეთის ID“).
 * სატესტო მერჩანტი: merchant_id 1549901, secret "test" (ბარათი 4444555511116666, ნებისმიერი ვადა/CVV).
 */

export const FLITT_SETTINGS_KEY = "_flitt";
const API = "https://pay.flitt.com/api";

export type FlittConfig = { enabled: boolean; merchantId: string; secretKey: string };

export async function getFlittConfig(): Promise<FlittConfig> {
  const [row] = await db.select().from(settings).where(eq(settings.key, FLITT_SETTINGS_KEY));
  const v = (row?.value ?? {}) as Partial<FlittConfig>;
  return { enabled: v.enabled ?? true, merchantId: (v.merchantId ?? "").trim(), secretKey: (v.secretKey ?? "").trim() };
}

export const flittReady = (c: FlittConfig) => c.enabled && /^\d+$/.test(c.merchantId) && !!c.secretKey;

export async function flittEnabled() {
  try {
    return flittReady(await getFlittConfig());
  } catch {
    return false;
  }
}

/** checkout გვერდისთვის (ქეშირებული; ადმინში შენახვისას updateTag("payments")) */
export async function flittEnabledCached() {
  "use cache";
  cacheTag("payments");
  cacheLife("hours");
  return flittEnabled();
}

export function flittSignature(secret: string, params: Record<string, unknown>) {
  const values = Object.keys(params)
    .filter((k) => k !== "signature" && k !== "response_signature_string")
    .sort()
    .map((k) => params[k])
    .filter((v) => v !== undefined && v !== null && v !== "")
    .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)));
  return createHash("sha1").update([secret, ...values].join("|"), "utf8").digest("hex");
}

type FlittResponse = Record<string, unknown> & {
  response_status?: string;
  error_message?: string;
  error_code?: string | number;
  checkout_url?: string;
  order_status?: string;
};

async function call(c: FlittConfig, path: string, params: Record<string, unknown>): Promise<FlittResponse> {
  const request = { ...params, merchant_id: Number(c.merchantId) };
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ request: { ...request, signature: flittSignature(c.secretKey, request) } }),
  });
  const text = await res.text();
  let body: { response?: FlittResponse } = {};
  try {
    body = JSON.parse(text);
  } catch {}
  if (!res.ok || !body.response) throw new Error(`Flitt ${path} ${res.status}: ${text.slice(0, 300)}`);
  return body.response;
}

/** Flitt-ში შეკვეთის შექმნა — აბრუნებს გადახდის გვერდის ბმულს */
export async function createFlittOrder(o: { number: string; total: number; origin: string; lang?: "ka" | "en" }) {
  const c = await getFlittConfig();
  if (!flittReady(c)) throw new Error("Flitt არ არის კონფიგურირებული");
  const r = await call(c, "/checkout/url", {
    version: "1.0.1",
    order_id: o.number,
    order_desc: `Express Mix — შეკვეთა ${o.number}`,
    amount: Math.round(o.total), // თეთრებში
    currency: "GEL",
    lang: o.lang === "en" ? "en" : "ka",
    // Flitt აქ POST-ით აბრუნებს — api route გადაამისამართებს შედეგის გვერდზე
    response_url: `${o.origin}/api/payments/flitt/return?order=${encodeURIComponent(o.number)}${o.lang === "en" ? "&lang=en" : ""}`,
    // Flitt callback-ს მხოლოდ საჯარო მისამართზე აგზავნის; ლოკალურად სტატუსს result გვერდი ამოწმებს
    server_callback_url: `${o.origin}/api/payments/flitt/callback`,
    lifetime: 3600,
  });
  if (r.response_status !== "success" || !r.checkout_url) throw new Error(`Flitt: ${r.error_message ?? "უცნობი შეცდომა"} (${r.error_code ?? "?"})`);
  return { id: o.number, redirect: r.checkout_url };
}

/** კავშირის შემოწმება ადმინიდან: არარსებული შეკვეთის სტატუსი. ხელმოწერის/მერჩანტის შეცდომა = არასწორი მონაცემები */
export async function testFlitt(c: FlittConfig) {
  const r = await call(c, "/status/order_id", { version: "1.0.1", order_id: `test-${Date.now()}` });
  const msg = `${r.error_code ?? ""} ${r.error_message ?? r.response_status ?? ""}`.trim();
  const bad = /signature|merchant/i.test(String(r.error_message ?? ""));
  return { ok: !bad, msg };
}

/** Flitt-ში სტატუსის გადამოწმება და შეკვეთის განახლება */
export async function syncFlittOrder(number: string) {
  await ensureSchema();
  const [order] = await db.select().from(orders).where(eq(orders.number, number));
  if (!order || order.payment !== "flitt" || order.paymentStatus === "refunded") return order ?? null;
  const c = await getFlittConfig();
  const r = await call(c, "/status/order_id", { version: "1.0.1", order_id: order.bogOrderId || order.number });
  if (r.response_status === "failure") throw new Error(`Flitt status: ${r.error_message} (${r.error_code})`);
  const s = String(r.order_status ?? "").toLowerCase();
  // თანხის შემოწმება — სხვა თანხით გადახდილს არ ვადასტურებთ
  if (s === "approved" && Number(r.amount) !== order.total) {
    console.error("[flitt] amount mismatch", number, r.amount, order.total);
    return order;
  }
  let next = order.paymentStatus;
  if (s === "approved") next = "paid";
  else if (s === "reversed") next = "refunded";
  else if ((s === "declined" || s === "expired") && order.paymentStatus !== "paid") next = "failed";
  return applyPaymentStatus(order, next);
}
