import { BY_ID, CITIES, COUPONS, FREE_SHIPPING_FROM, SHIPPING_RATES, type City } from "./data";

export type Delivery = "courier" | "pickup";
export type Payment = "on-delivery" | "installment";

export type OrderInput = {
  name: string;
  phone: string;
  email: string;
  delivery: Delivery;
  city: City;
  address: string;
  comment: string;
  payment: Payment;
  coupon: string;
  items: Record<string, number>;
};

export type OrderErrors = Partial<Record<"name" | "phone" | "email" | "address" | "items", string>>;

export const PAYMENTS: Record<Payment, { title: string; text: string }> = {
  "on-delivery": { title: "მიღებისას გადახდა", text: "ნაღდი ან ბარათი კურიერთან / მაღაზიაში" },
  installment: { title: "განვადება", text: "ოპერატორი დაგიკავშირდებათ დეტალებისთვის" },
};

const PHONE_RE = /^5\d{8}$/;
export const normalizePhone = (v: string) => v.replace(/\D/g, "").replace(/^995/, "");

export function validateOrder(o: OrderInput): OrderErrors {
  const e: OrderErrors = {};
  if (o.name.trim().length < 2) e.name = "შეიყვანეთ სახელი და გვარი.";
  if (!PHONE_RE.test(normalizePhone(o.phone))) e.phone = "შეიყვანეთ ტელეფონის ნომერი ფორმატით 5XX XX XX XX.";
  if (o.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email.trim())) e.email = "ელფოსტის ფორმატი არასწორია.";
  if (o.delivery === "courier" && o.address.trim().length < 5) e.address = "შეიყვანეთ მიწოდების მისამართი.";
  if (!Object.keys(o.items).some((id) => BY_ID.has(id))) e.items = "კალათა ცარიელია.";
  return e;
}

/** ჯამები თეთრებში — სერვერზე ითვლება კატალოგის ფასებით, კლიენტის მონაცემებს არ ვენდობით */
export function orderTotals(items: Record<string, number>, coupon: string, delivery: Delivery, city: City) {
  const lines = Object.entries(items)
    .filter(([id, q]) => BY_ID.has(id) && Number.isInteger(q) && q > 0)
    .map(([id, q]) => {
      const p = BY_ID.get(id)!;
      const qty = Math.min(99, q);
      return { id, name: p.name, sku: p.sku, qty, unit: Math.round(p.price * 100), total: Math.round(p.price * 100) * qty };
    });
  const sub = lines.reduce((n, l) => n + l.total, 0);
  const couponOff = COUPONS[coupon] ? Math.round(sub * COUPONS[coupon]) : 0;
  const after = sub - couponOff;
  const shipping = lines.length && delivery === "courier" && after < FREE_SHIPPING_FROM ? SHIPPING_RATES[city] : 0;
  return { lines, sub, coupon: couponOff, shipping, total: after + shipping, cityName: CITIES[city] };
}
