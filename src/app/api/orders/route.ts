import { and, eq, isNotNull, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db, orders, productVariants, products, promoCodes } from "@/db";
import { getCatalog } from "@/lib/catalog";
import { getContent } from "@/lib/content";
import { CITIES, indexCatalog } from "@/lib/data";
import { PAYMENTS, normalizePhone, orderTotals, validateOrder, type OrderInput } from "@/lib/order";
import { findPromo } from "@/lib/promo";

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.slice(0, max) : "");

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "არასწორი მოთხოვნა." }, { status: 400 });
  }

  const items: Record<string, number> = {};
  if (body.items && typeof body.items === "object") {
    for (const [id, q] of Object.entries(body.items as Record<string, unknown>).slice(0, 100)) {
      if (typeof q === "number" && Number.isInteger(q) && q > 0) items[id.slice(0, 40)] = Math.min(99, q);
    }
  }

  const order: OrderInput = {
    name: str(body.name, 120),
    phone: str(body.phone, 30),
    email: str(body.email, 180),
    delivery: body.delivery === "pickup" ? "pickup" : "courier",
    city: typeof body.city === "string" && body.city in CITIES ? (body.city as OrderInput["city"]) : "tbilisi",
    address: str(body.address, 300),
    comment: str(body.comment, 1000),
    payment: typeof body.payment === "string" && body.payment in PAYMENTS ? (body.payment as OrderInput["payment"]) : "on-delivery",
    coupon: str(body.coupon, 40),
    items,
  };

  const [catalog, content] = await Promise.all([getCatalog(), getContent()]);
  const cat = indexCatalog(catalog);
  const errors = validateOrder(order, (key) => !!cat.line(key)?.inStock);
  if (Object.keys(errors).length) return Response.json({ errors }, { status: 422 });

  const found = order.coupon ? await findPromo(order.coupon) : null;
  const promo = found && "promo" in found ? found.promo : null;
  const totals = orderTotals(cat, order.items, promo, order.delivery, order.city, content.shipping);
  if (!totals.lines.length) return Response.json({ errors: { items: "კალათა ცარიელია." } }, { status: 422 });

  const now = new Date();
  const number = `EM-${now.toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

  await db.insert(orders).values({
    number,
    name: order.name.trim(),
    phone: normalizePhone(order.phone),
    email: order.email.trim(),
    delivery: order.delivery,
    city: order.city,
    address: order.delivery === "courier" ? order.address.trim() : "",
    comment: order.comment.trim(),
    payment: order.payment,
    items: totals.lines,
    subtotal: totals.sub,
    discount: totals.discount,
    promoCode: totals.discount && promo ? promo.code : null,
    shipping: totals.shipping,
    total: totals.total,
  });

  // პრომოკოდის გამოყენების მთვლელი და აღრიცხული მარაგი
  if (totals.discount && promo)
    await db.update(promoCodes).set({ usedCount: sql`${promoCodes.usedCount} + 1` }).where(eq(promoCodes.code, promo.code));
  for (const l of totals.lines) {
    if (l.variantId)
      await db
        .update(productVariants)
        .set({ stockQty: sql`greatest(${productVariants.stockQty} - ${l.qty}, 0)` })
        .where(and(eq(productVariants.id, l.variantId), isNotNull(productVariants.stockQty)));
    else
      await db
        .update(products)
        .set({ stockQty: sql`greatest(${products.stockQty} - ${l.qty}, 0)` })
        .where(and(eq(products.id, l.productId), isNotNull(products.stockQty)));
  }
  revalidateTag("catalog", "max");

  return Response.json({ id: number, total: totals.total });
}
