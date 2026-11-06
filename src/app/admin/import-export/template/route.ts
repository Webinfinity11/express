import { categories, db, shippingClasses } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { buildWorkbook } from "@/lib/product-sheet";

export async function GET() {
  await requireAdmin();
  const [cats, classes] = await Promise.all([db.select().from(categories), db.select().from(shippingClasses)]);
  const body = await buildWorkbook([], cats, classes);
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="emix-products-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
