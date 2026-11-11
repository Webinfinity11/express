import { syncFlittOrder } from "@/lib/flitt";

/** Flitt server callback — ტანიდან მხოლოდ order_id-ს ვიღებთ, სტატუსს Flitt-ის API-დან (ხელმოწერით) ვამოწმებთ */
export async function POST(request: Request) {
  const raw = await request.text();
  let data: Record<string, unknown> = {};
  try {
    const j = JSON.parse(raw);
    data = (j?.response ?? j) as Record<string, unknown>;
  } catch {
    data = Object.fromEntries(new URLSearchParams(raw));
  }
  const order = typeof data.order_id === "string" ? data.order_id.slice(0, 40) : "";
  if (!order) return new Response("bad request", { status: 400 });
  try {
    await syncFlittOrder(order);
  } catch (e) {
    console.error("[flitt] callback sync failed", e);
    return new Response("error", { status: 500 });
  }
  return new Response("ok");
}
