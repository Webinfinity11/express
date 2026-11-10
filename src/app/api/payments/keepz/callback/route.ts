import { syncKeepzOrder } from "@/lib/keepz";

/** Keepz callback — ტანს არ ვენდობით: შეკვეთის სტატუსს Keepz-ის API-დან ვამოწმებთ */
async function handle(request: Request) {
  const order = new URL(request.url).searchParams.get("order")?.slice(0, 40) ?? "";
  if (!order) return new Response("bad request", { status: 400 });
  try {
    await syncKeepzOrder(order);
  } catch (e) {
    console.error("[keepz] callback sync failed", e);
    return new Response("error", { status: 500 });
  }
  return new Response("ok");
}

export const POST = handle;
export const GET = handle;
