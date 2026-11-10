import { eq } from "drizzle-orm";
import { after } from "next/server";
import { db, orders } from "@/db";
import { sendOrderEmails } from "@/lib/mail";
import { bogEnabled, commitOrderStock, createBogOrder, ensurePaymentSchema } from "@/lib/bog";
import { getCatalog } from "@/lib/catalog";
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
    payment: typeof body.payment === "string" && body.payment in PAYMENTS ? (body.payment as OrderInput["payment"]) : "manual",
    coupon: str(body.coupon, 40),
    items,
  };

  const catalog = await getCatalog();
  const cat = indexCatalog(catalog);
  const errors = validateOrder(order, (key) => !!cat.line(key)?.inStock);
  if (Object.keys(errors).length) return Response.json({ errors }, { status: 422 });

  const found = order.coupon ? await findPromo(order.coupon) : null;
  const promo = found && "promo" in found ? found.promo : null;
  const totals = orderTotals(cat, order.items, promo, order.delivery, order.city);
  if (!totals.lines.length) return Response.json({ errors: { items: "კალათა ცარიელია." } }, { status: 422 });

  const now = new Date();
  const number = `EM-${now.toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

  const online = order.payment === "card";
  if (online && !(await bogEnabled()))
    return Response.json({ error: "ონლაინ გადახდა დროებით მიუწვდომელია. აირჩიეთ სხვა მეთოდი." }, { status: 422 });

  await ensurePaymentSchema();
  const promoCode = totals.discount && promo ? promo.code : null;
  const [saved] = await db.insert(orders).values({
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
    promoCode,
    shipping: totals.shipping,
    total: totals.total,
    paymentStatus: online ? "pending" : null,
  }).returning();

  if (online) {
    // ონლაინ გადახდისას მარაგი და პრომოკოდი ჩამოიჭრება მხოლოდ გადახდის დადასტურების შემდეგ (src/lib/bog.ts)
    const origin = new URL(request.url).origin;
    try {
      const bog = await createBogOrder({
        number,
        lines: totals.lines,
        discount: totals.discount,
        shipping: totals.shipping,
        total: totals.total,
        name: order.name.trim(),
        // ბანკი callback-ს მხოლოდ https-ზე აგზავნის; ლოკალურად ტესტისას სტატუსს redirect-ის გვერდი ამოწმებს
        origin,
        lang: body.lang === "en" ? "en" : "ka",
      });
      await db.update(orders).set({ bogOrderId: bog.id }).where(eq(orders.id, saved.id));
      // მაღაზიას შეტყობინება მაშინვე (გადახდის მოლოდინში); გადახდის შემდეგ — მეორე მეილი (src/lib/bog.ts)
      after(() => sendOrderEmails({ ...saved, bogOrderId: bog.id }, origin.startsWith("https") ? origin : undefined));
      return Response.json({ id: number, total: totals.total, redirect: bog.redirect });
    } catch (e) {
      console.error("[bog] create order failed", e);
      await db.update(orders).set({ paymentStatus: "failed", status: "cancelled" }).where(eq(orders.id, saved.id));
      return Response.json({ error: "ბანკთან დაკავშირება ვერ მოხერხდა. სცადეთ თავიდან ან აირჩიეთ სხვა მეთოდი." }, { status: 502 });
    }
  }

  await commitOrderStock(totals.lines, promoCode);
  const origin = new URL(request.url).origin;
  after(() => sendOrderEmails(saved, origin.startsWith("https") ? origin : undefined));
  return Response.json({ id: number, total: totals.total });
}
