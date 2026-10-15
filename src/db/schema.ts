import { boolean, index, integer, jsonb, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export type Spec = { label: string; value: string };
export type OrderLine = {
  key: string;
  productId: number;
  variantId: number | null;
  name: string;
  variant: string | null;
  sku: string;
  qty: number;
  unit: number; // თეთრი
  total: number; // თეთრი
};

const money = (name: string) => numeric(name, { precision: 10, scale: 2, mode: "number" });
const created = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/** სექცია → ჯგუფი → ქვეკატეგორია (parentId-ით). showOnHome — მთავარი გვერდის ბადე და მაღაზიის ზოლი. */
export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    parentId: integer("parent_id"),
    image: text("image"),
    showOnHome: boolean("show_on_home").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("categories_parent_idx").on(t.parentId)],
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    sku: text("sku").notNull().default(""),
    name: text("name").notNull(),
    label: text("label").notNull().default(""),
    brand: text("brand").notNull().default(""),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    price: money("price").notNull().default(0),
    oldPrice: money("old_price"),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    sceneImage: text("scene_image"),
    subtitle: text("subtitle").notNull().default(""),
    description: text("description").notNull().default(""),
    specs: jsonb("specs").$type<Spec[]>().notNull().default([]),
    keywords: text("keywords").notNull().default(""),
    colorName: text("color_name").notNull().default(""),
    colorHex: text("color_hex"),
    featured: boolean("featured").notNull().default(false),
    isNew: boolean("is_new").notNull().default(false),
    published: boolean("published").notNull().default(true),
    inStock: boolean("in_stock").notNull().default(true),
    // null = მარაგი არ აღირიცხება
    stockQty: integer("stock_qty"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: created(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("products_category_idx").on(t.categoryId)],
);

/** ვარიაცია (მაგ. ფერი): ფასი/სურათი ცარიელი = პროდუქტის ფასი/სურათი. */
export const productVariants = pgTable(
  "product_variants",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    colorHex: text("color_hex"),
    sku: text("sku").notNull().default(""),
    price: money("price"),
    oldPrice: money("old_price"),
    image: text("image"),
    inStock: boolean("in_stock").notNull().default(true),
    stockQty: integer("stock_qty"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  logo: text("logo"),
  showInStrip: boolean("show_in_strip").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  // percent: value = % (1–100); fixed: value = ₾
  kind: text("kind").notNull().default("percent"),
  value: money("value").notNull(),
  minTotal: money("min_total").notNull().default(0),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: created(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().default(""),
  delivery: text("delivery").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull().default(""),
  comment: text("comment").notNull().default(""),
  payment: text("payment").notNull(),
  items: jsonb("items").$type<OrderLine[]>().notNull(),
  // თანხები თეთრებში
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").notNull().default(0),
  promoCode: text("promo_code"),
  shipping: integer("shipping").notNull().default(0),
  total: integer("total").notNull(),
  // new → confirmed → delivered | cancelled
  status: text("status").notNull().default("new"),
  createdAt: created(),
});

/** საიტის ტექსტები (ჰედერი, ფუტერი, გვერდები) — ერთი JSON დოკუმენტი სექციაზე. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CategoryRow = typeof categories.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type VariantRow = typeof productVariants.$inferSelect;
export type BrandRow = typeof brands.$inferSelect;
export type PromoRow = typeof promoCodes.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
