import { asc } from "drizzle-orm";
import { categories, db, products, shippingClasses } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { buildWorkbook } from "@/lib/product-sheet";

export async function GET() {
  await requireAdmin();
  const [rows, cats, classes] = await Promise.all([
    db.select().from(products).orderBy(asc(products.id)),
    db.select().from(categories),
    db.select().from(shippingClasses),
  ]);
  const body = await buildWorkbook(rows, cats, classes);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="emix-products-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
