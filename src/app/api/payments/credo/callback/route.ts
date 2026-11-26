import { syncCredoOrder, syncPendingCredoOrders } from "@/lib/credo";

/**
 * კრედოს callback. მისი ფორმატი დოკუმენტაციაში არ არის, ამიტომ orderCode-ს ვიღებთ query-დან, JSON-იდან
 * ან ფორმიდან. გამოგზავნილ სტატუსს არ ვენდობით — ყოველთვის კრედოს API-დან (hash-ით) ვამოწმებთ.
 * orderCode-ის გარეშე გამოძახება მოლოდინში მყოფ ყველა განვადებას ამოწმებს (გარე cron-ისთვისაც).
 */
let lastFullSync = 0;

async function readOrderCode(request: Request) {
  const query = new URL(request.url).searchParams.get("orderCode");
  if (query) return query;
  if (request.method !== "POST") return "";
  const raw = await request.text();
  try {
    const body = JSON.parse(raw) as { orderCode?: unknown } | null;
    return typeof body?.orderCode === "string" ? body.orderCode : "";
  } catch {
    return new URLSearchParams(raw).get("orderCode") ?? "";
  }
}

async function handle(request: Request) {
  try {
    const code = (await readOrderCode(request)).slice(0, 50);
    if (code) await syncCredoOrder(code);
    // სრული შემოწმება წუთში ერთხელ, რომ გარე გამოძახებებმა კრედო არ გადატვირთოს
    else if (Date.now() - lastFullSync > 60_000) {
      lastFullSync = Date.now();
      await syncPendingCredoOrders();
    }
  } catch (e) {
    console.error("[credo] callback sync failed", e);
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true });
}

export const GET = handle;
export const POST = handle;
