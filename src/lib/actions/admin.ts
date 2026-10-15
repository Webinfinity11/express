"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { put } from "@vercel/blob";
import { and, eq, ne, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { brands, categories, db, orders, pages, productVariants, products, promoCodes, settings } from "@/db";
import { ORDER_STATUSES, slugify } from "@/lib/admin-shared";
import { createSession, destroySession, requireAdmin } from "@/lib/auth";
import { sanitizeSection } from "@/lib/content";
import { contentDefaults, type ContentKey } from "@/lib/content-schema";
import { RESERVED_SLUGS } from "@/lib/site-links";

export type ActionResult = { ok: true; id?: number } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });

// ───────── შესვლა ─────────

const digest = (s: string) => createHash("sha256").update(s).digest();

export async function login(_: unknown, form: FormData): Promise<ActionResult> {
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const expectedUser = (process.env.ADMIN_USERNAME ?? "").trim().toLowerCase();
  const expected = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expected || !process.env.AUTH_SECRET) return fail("ადმინის მონაცემები სერვერზე არ არის დაყენებული");
  // ჰეშების შედარება მუდმივ დროში; ორივე მოწმდება, რომ არ გამოჩნდეს რომელია არასწორი
  const userOk = timingSafeEqual(digest(username), digest(expectedUser));
  const passOk = timingSafeEqual(digest(password), digest(expected));
  if (!userOk || !passOk) return fail("მომხმარებელი ან პაროლი არასწორია");
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// ───────── სურათები ─────────

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml"];

export async function uploadImage(form: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false, error: "ფაილი ვერ მოიძებნა" };
  if (!IMAGE_TYPES.includes(file.type)) return { ok: false, error: "მხოლოდ სურათები (JPG, PNG, WEBP, SVG)" };
  if (file.size > 6 * 1024 * 1024) return { ok: false, error: "სურათი 6MB-ზე მეტია" };
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const blob = await put(`uploads/${Date.now()}.${ext}`, file, { access: "public", addRandomSuffix: true });
  return { ok: true, url: blob.url };
}

// ───────── საერთო ─────────

const money = z.coerce.number().min(0).max(10_000_000);
const optMoney = z.union([z.literal(""), z.null(), money]).optional();
const optInt = z.union([z.literal(""), z.null(), z.coerce.number().int().min(0).max(1_000_000)]).optional();
// ატვირთული (https) ან საიტის საკუთარი (/images/...) სურათი
const imageUrl = z.union([z.url({ protocol: /^https$/ }), z.string().regex(/^\/[^/]/)]);
const hex = z.union([z.literal(""), z.null(), z.string().regex(/^#[0-9a-fA-F]{6}$/, "ფერი ფორმატით #RRGGBB")]).optional();
const num = (v: unknown) => (v === "" || v == null ? null : Number(v));

async function uniqueSlug(table: typeof products | typeof categories, base: string, id?: number) {
  const root = base || "item";
  for (let n = 1; ; n++) {
    const slug = n === 1 ? root : `${root}-${n}`;
    const [hit] = await db
      .select({ id: table.id })
      .from(table)
      .where(id ? and(eq(table.slug, slug), ne(table.id, id)) : eq(table.slug, slug));
    if (!hit) return slug;
  }
}

// ───────── პროდუქტები ─────────

const variantSchema = z.object({
  id: z.number().int().nullable(),
  name: z.string().trim().min(1, "მიუთითეთ ვარიაციის სახელი").max(80),
  colorHex: hex,
  sku: z.string().trim().max(60),
  price: optMoney,
  oldPrice: optMoney,
  image: z.union([z.literal(""), z.null(), imageUrl]).optional(),
  inStock: z.boolean(),
  stockQty: optInt,
});

const productSchema = z.object({
  name: z.string().trim().min(2, "მიუთითეთ დასახელება").max(200),
  slug: z.string().trim().max(100).optional(),
  sku: z.string().trim().max(60),
  label: z.string().trim().max(120),
  brand: z.string().trim().max(80),
  categoryId: z.number().int().nullable(),
  price: money,
  oldPrice: optMoney,
  images: z.array(imageUrl).max(12),
  sceneImage: z.union([z.literal(""), z.null(), imageUrl]).optional(),
  subtitle: z.string().max(300),
  description: z.string().max(20000),
  specs: z.array(z.object({ label: z.string().trim().max(80), value: z.string().trim().max(200) })).max(40),
  keywords: z.string().max(1000),
  colorName: z.string().trim().max(80),
  colorHex: hex,
  featured: z.boolean(),
  isNew: z.boolean(),
  published: z.boolean(),
  inStock: z.boolean(),
  stockQty: optInt,
  variants: z.array(variantSchema).max(50),
});
export type ProductInput = z.input<typeof productSchema>;

export async function saveProduct(id: number | null, input: ProductInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;
  const oldPrice = num(d.oldPrice);
  if (oldPrice !== null && oldPrice <= d.price) return fail("ძველი ფასი ახალ ფასზე მეტი უნდა იყოს (ან დატოვეთ ცარიელი)");

  const values = {
    name: d.name,
    slug: await uniqueSlug(products, slugify(d.slug || d.name), id ?? undefined),
    sku: d.sku,
    label: d.label,
    brand: d.brand,
    categoryId: d.categoryId,
    price: d.price,
    oldPrice,
    images: d.images,
    sceneImage: d.sceneImage || null,
    subtitle: d.subtitle.trim(),
    description: d.description.trim(),
    specs: d.specs.filter((s) => s.label && s.value),
    keywords: d.keywords.trim(),
    colorName: d.colorName,
    colorHex: d.colorHex || null,
    featured: d.featured,
    isNew: d.isNew,
    published: d.published,
    inStock: d.inStock,
    stockQty: num(d.stockQty),
    updatedAt: new Date(),
  };

  let productId = id;
  if (id) await db.update(products).set(values).where(eq(products.id, id));
  else [{ id: productId }] = await db.insert(products).values(values).returning({ id: products.id });

  // ვარიაციები: არსებული განახლდება, ახალი დაემატება, ამოღებული წაიშლება
  const existing = await db.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, productId!));
  const keep = new Set(d.variants.map((v) => v.id).filter((x): x is number => x !== null));
  for (const v of existing) if (!keep.has(v.id)) await db.delete(productVariants).where(eq(productVariants.id, v.id));
  for (const [i, v] of d.variants.entries()) {
    const row = {
      productId: productId!,
      name: v.name,
      colorHex: v.colorHex || null,
      sku: v.sku,
      price: num(v.price),
      oldPrice: num(v.oldPrice),
      image: v.image || null,
      inStock: v.inStock,
      stockQty: num(v.stockQty),
      sortOrder: i,
    };
    if (v.id && existing.some((e) => e.id === v.id)) await db.update(productVariants).set(row).where(eq(productVariants.id, v.id));
    else await db.insert(productVariants).values(row);
  }

  updateTag("catalog");
  return { ok: true, id: productId! };
}

export async function deleteProduct(id: number): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, id));
  updateTag("catalog");
  return { ok: true };
}

export async function setProductFlag(id: number, flag: "published" | "inStock" | "featured", value: boolean): Promise<ActionResult> {
  await requireAdmin();
  await db.update(products).set({ [flag]: value, updatedAt: new Date() }).where(eq(products.id, id));
  updateTag("catalog");
  return { ok: true };
}

// ───────── კატეგორიები ─────────

const categorySchema = z.object({
  name: z.string().trim().min(2, "მიუთითეთ დასახელება").max(120),
  slug: z.string().trim().max(100).optional(),
  parentId: z.number().int().nullable(),
  image: z.union([z.literal(""), z.null(), imageUrl]),
  showOnHome: z.boolean(),
  showInMenu: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(-1000).max(1000),
});
export type CategoryInput = z.input<typeof categorySchema>;

export async function saveCategory(id: number | null, input: CategoryInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;

  if (id && d.parentId) {
    // კატეგორია საკუთარ თავში ან ქვეკატეგორიაში ვერ გადავა
    const all = await db.select({ id: categories.id, parentId: categories.parentId }).from(categories);
    for (let p: number | null = d.parentId; p; p = all.find((c) => c.id === p)?.parentId ?? null)
      if (p === id) return fail("კატეგორია საკუთარ ქვეკატეგორიაში ვერ გადავა");
  }

  const values = {
    name: d.name,
    slug: await uniqueSlug(categories, slugify(d.slug || d.name), id ?? undefined),
    parentId: d.parentId,
    image: d.image || null,
    showOnHome: d.showOnHome,
    ...(d.showInMenu !== undefined && { showInMenu: d.showInMenu }),
    sortOrder: d.sortOrder,
  };
  let categoryId = id;
  if (id) await db.update(categories).set(values).where(eq(categories.id, id));
  else [{ id: categoryId }] = await db.insert(categories).values(values).returning({ id: categories.id });
  updateTag("catalog");
  return { ok: true, id: categoryId! };
}

export async function setCategoryFlag(id: number, flag: "showOnHome" | "showInMenu", value: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (flag !== "showOnHome" && flag !== "showInMenu") return fail("უცნობი ველი");
  await db.update(categories).set({ [flag]: value }).where(eq(categories.id, id));
  updateTag("catalog");
  return { ok: true };
}

export async function deleteCategory(id: number): Promise<ActionResult> {
  await requireAdmin();
  const [{ children }] = await db
    .select({ children: sql<number>`count(*)::int` })
    .from(categories)
    .where(eq(categories.parentId, id));
  if (children > 0) return fail("ჯერ წაშალეთ ან გადაიტანეთ ქვეკატეგორიები");
  await db.delete(categories).where(eq(categories.id, id));
  updateTag("catalog");
  return { ok: true };
}

// ───────── ბრენდები ─────────

const brandSchema = z.object({
  name: z.string().trim().min(1, "მიუთითეთ სახელი").max(80),
  logo: z.union([z.literal(""), z.null(), imageUrl]),
  showInStrip: z.boolean(),
  sortOrder: z.coerce.number().int().min(-1000).max(1000),
});
export type BrandInput = z.input<typeof brandSchema>;

export async function saveBrand(id: number | null, input: BrandInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;
  const [dup] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(id ? and(eq(brands.name, d.name), ne(brands.id, id)) : eq(brands.name, d.name));
  if (dup) return fail("ასეთი ბრენდი უკვე არსებობს");
  const values = { name: d.name, logo: d.logo || null, showInStrip: d.showInStrip, sortOrder: d.sortOrder };
  let brandId = id;
  if (id) await db.update(brands).set(values).where(eq(brands.id, id));
  else [{ id: brandId }] = await db.insert(brands).values(values).returning({ id: brands.id });
  updateTag("catalog");
  return { ok: true, id: brandId! };
}

export async function deleteBrand(id: number): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(brands).where(eq(brands.id, id));
  updateTag("catalog");
  return { ok: true };
}

// ───────── პრომოკოდები ─────────

const dateOrNull = z.union([z.literal(""), z.null(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional();
const promoSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "კოდი მინიმუმ 3 სიმბოლო")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "კოდში მხოლოდ ლათინური ასოები, ციფრები, - და _"),
  kind: z.enum(["percent", "fixed"]),
  value: z.coerce.number().positive("მიუთითეთ ფასდაკლება").max(1_000_000),
  minTotal: money,
  maxUses: optInt,
  startsAt: dateOrNull,
  endsAt: dateOrNull,
  active: z.boolean(),
});
export type PromoInput = z.input<typeof promoSchema>;

export async function savePromo(id: number | null, input: PromoInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = promoSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;
  if (d.kind === "percent" && d.value > 100) return fail("პროცენტი 100-ზე მეტი ვერ იქნება");
  const code = d.code.toUpperCase();
  const [dup] = await db
    .select({ id: promoCodes.id })
    .from(promoCodes)
    .where(id ? and(eq(promoCodes.code, code), ne(promoCodes.id, id)) : eq(promoCodes.code, code));
  if (dup) return fail("ასეთი კოდი უკვე არსებობს");
  // თარიღები თბილისის დროით: დასაწყისი დღის დასაწყისიდან, დასასრული დღის ბოლომდე
  const values = {
    code,
    kind: d.kind,
    value: d.value,
    minTotal: d.minTotal,
    maxUses: num(d.maxUses),
    startsAt: d.startsAt ? new Date(`${d.startsAt}T00:00:00+04:00`) : null,
    endsAt: d.endsAt ? new Date(`${d.endsAt}T23:59:59+04:00`) : null,
    active: d.active,
  };
  let promoId = id;
  if (id) await db.update(promoCodes).set(values).where(eq(promoCodes.id, id));
  else [{ id: promoId }] = await db.insert(promoCodes).values(values).returning({ id: promoCodes.id });
  return { ok: true, id: promoId! };
}

export async function deletePromo(id: number): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(promoCodes).where(eq(promoCodes.id, id));
  return { ok: true };
}

export async function setPromoActive(id: number, active: boolean): Promise<ActionResult> {
  await requireAdmin();
  await db.update(promoCodes).set({ active }).where(eq(promoCodes.id, id));
  return { ok: true };
}

// ───────── შეკვეთები ─────────

export async function setOrderStatus(id: number, status: string): Promise<ActionResult> {
  await requireAdmin();
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) return fail("უცნობი სტატუსი");
  await db.update(orders).set({ status }).where(eq(orders.id, id));
  return { ok: true };
}

export async function deleteOrder(id: number): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(orders).where(eq(orders.id, id));
  return { ok: true };
}

// ───────── საიტის ტექსტები ─────────

export async function saveContent(key: string, value: unknown): Promise<ActionResult> {
  await requireAdmin();
  if (!(key in contentDefaults)) return fail("უცნობი სექცია");
  const clean = sanitizeSection(key as ContentKey, value);
  await db
    .insert(settings)
    .values({ key, value: clean })
    .onConflictDoUpdate({ target: settings.key, set: { value: clean, updatedAt: new Date() } });
  updateTag("content");
  return { ok: true };
}

export async function resetContent(key: string): Promise<ActionResult> {
  await requireAdmin();
  if (!(key in contentDefaults)) return fail("უცნობი სექცია");
  await db.delete(settings).where(eq(settings.key, key));
  updateTag("content");
  return { ok: true };
}

// ───────── გვერდები ─────────

const pageSchema = z.object({
  title: z.string().trim().min(2, "მიუთითეთ სათაური").max(160),
  slug: z.string().trim().max(100).optional(),
  eyebrow: z.string().trim().max(120),
  subtitle: z.string().trim().max(400),
  image: z.union([z.literal(""), z.null(), imageUrl]),
  body: z.string().max(50_000),
  buttonText: z.string().trim().max(80),
  buttonHref: z.union([z.literal(""), z.string().trim().regex(/^(\/(?!\/)|https?:\/\/|tel:|mailto:|#)/i, "ღილაკის ბმული არასწორია")]),
  metaDescription: z.string().trim().max(300),
  published: z.boolean(),
});
export type PageInput = z.input<typeof pageSchema>;

export async function savePage(id: number | null, input: PageInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = pageSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;
  let slug = slugify(d.slug || d.title) || "page";
  if (RESERVED_SLUGS.includes(slug)) slug += "-page";
  for (let n = 2; ; n++) {
    const [hit] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(id ? and(eq(pages.slug, slug), ne(pages.id, id)) : eq(pages.slug, slug));
    if (!hit) break;
    slug = `${slug.replace(/-\d+$/, "")}-${n}`;
  }
  const values = { ...d, slug, image: d.image || null, updatedAt: new Date() };
  let pageId = id;
  if (id) await db.update(pages).set(values).where(eq(pages.id, id));
  else [{ id: pageId }] = await db.insert(pages).values(values).returning({ id: pages.id });
  updateTag("pages");
  return { ok: true, id: pageId! };
}

export async function deletePage(id: number): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(pages).where(eq(pages.id, id));
  updateTag("pages");
  return { ok: true };
}

export async function setPagePublished(id: number, published: boolean): Promise<ActionResult> {
  await requireAdmin();
  await db.update(pages).set({ published, updatedAt: new Date() }).where(eq(pages.id, id));
  updateTag("pages");
  return { ok: true };
}
