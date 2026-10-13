import { CITIES, COUPONS } from "@/lib/data";
import { PAYMENTS, normalizePhone, orderTotals, validateOrder, type OrderInput } from "@/lib/order";

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
    for (const [id, q] of Object.entries(body.items as Record<string, unknown>)) {
      if (typeof q === "number" && Number.isInteger(q) && q > 0) items[id] = Math.min(99, q);
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
    coupon: typeof body.coupon === "string" && body.coupon in COUPONS ? body.coupon : "",
    items,
  };

  const errors = validateOrder(order);
  if (Object.keys(errors).length) return Response.json({ errors }, { status: 422 });

  const totals = orderTotals(order.items, order.coupon, order.delivery, order.city);
  const now = new Date();
  const id = `EM-${now.toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

  // TODO: შეკვეთის მიწოდება მაღაზიამდე (ელფოსტა / Telegram / მონაცემთა ბაზა / ადმინ პანელი).
  // ამ ეტაპზე შეკვეთა მხოლოდ სერვერის ლოგში იწერება.
  console.log("[order]", JSON.stringify({ id, createdAt: now.toISOString(), ...order, phone: normalizePhone(order.phone), totals }));

  return Response.json({ id, total: totals.total });
}
