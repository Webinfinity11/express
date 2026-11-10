import { syncBogOrder, verifyBogSignature } from "@/lib/bog";

/** საქართველოს ბანკის callback — გადახდის სტატუსის ცვლილებისას */
export async function POST(request: Request) {
  const raw = await request.text();
  const signed = verifyBogSignature(raw, request.headers.get("callback-signature"));
  if (!signed) console.warn("[bog] callback without valid signature — status re-checked via API");

  let orderId = "";
  try {
    orderId = String(JSON.parse(raw)?.body?.order_id ?? "");
  } catch {}
  if (!orderId) return new Response("bad request", { status: 400 });

  try {
    // სტატუსს ყოველთვის ბანკის API-დან ვამოწმებთ, ამიტომ ყალბი callback ვერაფერს შეცვლის
    await syncBogOrder(orderId);
  } catch (e) {
    console.error("[bog] callback sync failed", e);
    return new Response("error", { status: 500 });
  }
  return new Response("ok");
}
