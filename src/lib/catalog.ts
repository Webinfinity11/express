import "server-only";
import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { brands, categories, db, productVariants, products, shippingClasses } from "@/db";
import { PLACEHOLDER_IMAGE, type Catalog, type Product, type ShipClass } from "@/lib/data";
import { ensureSchema } from "@/db/ensure";
import type { Lang } from "@/i18n";

/** ინგლისური ტექსტი, თუ შევსებულია; თორემ ქართული */
const pick = (lang: Lang, ka: string, en: string | undefined) => (lang === "en" && en?.trim() ? en.trim() : ka);

/** გამოქვეყნებული კატალოგი კლიენტის ფორმატში; ადმინში შენახვისას updateTag("catalog") ანახლებს. */
export async function getCatalog(lang: Lang = "ka"): Promise<Catalog> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  await ensureSchema();

  const [cats, rows, variants, brandRows, classRows] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id)),
    db.select().from(products).where(eq(products.published, true)).orderBy(asc(products.sortOrder), asc(products.id)),
    db.select().from(productVariants).orderBy(asc(productVariants.sortOrder), asc(productVariants.id)),
    db.select().from(brands).orderBy(asc(brands.sortOrder), asc(brands.id)),
    db.select().from(shippingClasses),
  ]);
  const slugOf = new Map(cats.map((c) => [c.id, c.slug]));

  // ლოჯისტიკური კლასი: პროდუქტის → კატეგორიის → მშობელი კატეგორიის
  const classes = new Map<number, ShipClass>(classRows.map((c) => [c.id, { code: c.code, tbilisi: c.tbilisi, regions: c.regions }]));
  const catById = new Map(cats.map((c) => [c.id, c]));
  const categoryClass = (id: number | null): ShipClass | null => {
    for (let n = 0, c = id ? catById.get(id) : undefined; c && n < 10; n++, c = c.parentId ? catById.get(c.parentId) : undefined)
      if (c.shippingClassId && classes.has(c.shippingClassId)) return classes.get(c.shippingClassId)!;
    return null;
  };

  const logoOf = new Map(brandRows.filter((b) => b.logo && !b.logo.startsWith("/images/brands/")).map((b) => [b.name.trim().toLowerCase(), b.logo!]));
  const list: Product[] = rows.map((p) => {
    const price = p.price;
    const oldPrice = p.oldPrice && p.oldPrice > price ? p.oldPrice : price;
    const gallery = p.images.length ? p.images : [PLACEHOLDER_IMAGE];
    const vs = variants
      .filter((v) => v.productId === p.id)
      .map((v) => {
        const vPrice = v.price ?? price;
        const vOld = v.oldPrice && v.oldPrice > vPrice ? v.oldPrice : v.price == null ? oldPrice : vPrice;
        return {
          id: String(v.id),
          name: pick(lang, v.name, v.en?.name),
          colorHex: v.colorHex,
          sku: v.sku,
          price: vPrice,
          oldPrice: vOld,
          image: v.image,
          inStock: v.stockQty == null ? v.inStock : v.stockQty > 0,
        };
      });
    return {
      id: String(p.id),
      slug: p.slug,
      sku: p.sku,
      name: pick(lang, p.name, p.en?.name),
      label: pick(lang, p.label, p.en?.label),
      category: (p.categoryId && slugOf.get(p.categoryId)) || "",
      brand: p.brand,
      brandLogo: logoOf.get(p.brand.trim().toLowerCase()) ?? null,
      price,
      oldPrice,
      image: gallery[0],
      gallery,
      scene: p.sceneImage || gallery[gallery.length - 1],
      color: pick(lang, p.colorName, p.en?.colorName),
      tone: p.colorHex || "#151515",
      subtitle: pick(lang, p.subtitle, p.en?.subtitle),
      desc: pick(lang, p.description, p.en?.description),
      specs: (lang === "en" && p.en?.specs?.length ? p.en.specs : p.specs).map((s) => [s.label, s.value] as [string, string]),
      // ძიება ორივე ენაზე
      keywords: lang === "en" ? [p.keywords, p.name].filter(Boolean).join(" ") : p.keywords,
      featured: p.featured,
      isNew: p.isNew,
      inStock: vs.length ? vs.some((v) => v.inStock) : p.stockQty == null ? p.inStock : p.stockQty > 0,
      variants: vs,
      ship: (p.shippingClassId && classes.get(p.shippingClassId)) || categoryClass(p.categoryId),
    };
  });

  return {
    products: list,
    categories: cats.map((c) => ({
      id: c.slug,
      name: pick(lang, c.name, c.en?.name),
      image: c.image || "",
      parent: c.parentId ? (slugOf.get(c.parentId) ?? null) : null,
      showOnHome: c.showOnHome,
      showInMenu: c.showInMenu,
    })),
    brands: brandRows.filter((b) => b.showInStrip).map((b) => ({ name: b.name, logo: b.logo })),
  };
}
