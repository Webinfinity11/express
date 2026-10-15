import { findPromo } from "@/lib/promo";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code") ?? "";
  const res = await findPromo(code);
  if ("error" in res) return Response.json({ error: res.error }, { status: 404 });
  return Response.json(res.promo);
}
