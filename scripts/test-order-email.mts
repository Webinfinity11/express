/**
 * სატესტო შეკვეთის მეილი (ბაზაში არაფერს წერს): npx tsx scripts/test-order-email.mts
 * საჭიროა SMTP_* env (მაგ. .env.local-ში ან ბრძანების წინ).
 */
import { sendOrderEmails } from "../src/lib/mail";

const now = new Date();
await sendOrderEmails({
  id: 0,
  number: "TEST-0001",
  name: "სატესტო მომხმარებელი",
  phone: "555123456",
  email: "",
  delivery: "courier",
  city: "tbilisi",
  address: "თბილისი, სატესტო ქუჩა 1",
  comment: "ეს სატესტო შეკვეთაა — ნამდვილი არ არის",
  payment: "card",
  paymentStatus: "paid",
  bogOrderId: null,
  items: [
    { key: "1", productId: 1, variantId: null, name: "სატესტო პროდუქტი", variant: null, sku: "TEST-1", qty: 1, unit: 129900, total: 129900 },
    { key: "2", productId: 2, variantId: null, name: "მეორე სატესტო პროდუქტი", variant: "შავი", sku: "TEST-2", qty: 2, unit: 4500, total: 9000 },
  ],
  subtotal: 138900,
  discount: 0,
  promoCode: null,
  shipping: 1000,
  total: 139900,
  status: "new",
  createdAt: now,
} as Parameters<typeof sendOrderEmails>[0]);
console.log("done");
