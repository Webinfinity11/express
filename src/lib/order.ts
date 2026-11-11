import { CITIES, promoDiscount, shippingCost, type CatalogIndex, type City, type Promo } from "./data";

export type Delivery = "courier" | "pickup";
// manual — ონლაინ გადახდა გამორთულია: ოპერატორი დაუკავშირდება
export type Payment = "card" | "flitt" | "manual";

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

export const PAYMENTS: Record<Payment, { title: string; text: string; logos?: { src: string; alt: string; w: number }[] }> = {
  card: {
    title: "ბარათით გადახდა",
    text: "Visa და Mastercard ბარათებით — საქართველოს ბანკის დაცულ გვერდზე",
    logos: [{ src: "/images/payments/bog.svg", alt: "საქართველოს ბანკი", w: 40 }],
  },
  flitt: {
    title: "ბარათი, Apple Pay, Google Pay",
    text: "Visa, Mastercard, Apple Pay და Google Pay — Flitt-ის დაცულ გვერდზე",
    // Flitt TBC-ის ჯგუფისაა — ორივე ლოგო, რომ კლიენტმა იცნოს
    logos: [
      { src: "/images/payments/flitt.svg", alt: "Flitt", w: 52 },
      { src: "/images/payments/tbc.svg", alt: "თიბისი ბანკი", w: 30 },
    ],
  },
  manual: { title: "ოპერატორთან შეთანხმებით", text: "ოპერატორი დაგიკავშირდებათ გადახდის დეტალებისთვის" },
};

const PHONE_RE = /^5\d{8}$/;
export const normalizePhone = (v: string) => v.replace(/\D/g, "").replace(/^995/, "");

/** hasItem — კალათის გასაღები ვალიდურია თუ არა (კატალოგის მიხედვით) */
export function validateOrder(o: OrderInput, hasItem: (key: string) => boolean): OrderErrors {
  const e: OrderErrors = {};
  if (o.name.trim().length < 2) e.name = "შეიყვანეთ სახელი და გვარი.";
  if (!PHONE_RE.test(normalizePhone(o.phone))) e.phone = "შეიყვანეთ ტელეფონის ნომერი ფორმატით 5XX XX XX XX.";
  if (o.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email.trim())) e.email = "ელფოსტის ფორმატი არასწორია.";
  if (o.delivery === "courier" && o.address.trim().length < 5) e.address = "შეიყვანეთ მიწოდების მისამართი.";
  if (!Object.keys(o.items).some(hasItem)) e.items = "კალათა ცარიელია.";
  return e;
}

/** ჯამები თეთრებში — სერვერზე ითვლება ბაზის ფასებით, კლიენტის მონაცემებს არ ვენდობით */
export function orderTotals(
  cat: CatalogIndex,
  items: Record<string, number>,
  promo: Promo | null,
  delivery: Delivery,
  city: City,
) {
  const lines = Object.entries(items).flatMap(([key, q]) => {
    const l = cat.line(key);
    if (!l || !l.inStock || !Number.isInteger(q) || q <= 0) return [];
    const qty = Math.min(99, q);
    const unit = Math.round(l.price * 100);
    return [
      {
        key,
        productId: Number(l.product.id),
        variantId: l.variant ? Number(l.variant.id) : null,
        name: l.name,
        variant: l.variantName,
        sku: l.sku,
        qty,
        unit,
        total: unit * qty,
      },
    ];
  });
  const sub = lines.reduce((n, l) => n + l.total, 0);
  const discount = promoDiscount(promo, sub);
  const after = sub - discount;
  const shipItems = lines.map((l) => ({ ship: cat.byId.get(String(l.productId))?.ship ?? null, qty: l.qty }));
  const ship = shippingCost(city, shipItems, delivery === "courier");
  return { lines, sub, discount, shipping: ship, total: after + ship, cityName: CITIES[city] };
}
