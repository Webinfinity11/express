import "server-only";
import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { brands, categories, db, productVariants, products, shippingClasses } from "@/db";
import { PLACEHOLDER_IMAGE, type Catalog, type Product, type ShipClass } from "@/lib/data";

/** გამოქვეყნებული კატალოგი კლიენტის ფორმატში; ადმინში შენახვისას updateTag("catalog") ანახლებს. */
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

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
          name: v.name,
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
      name: p.name,
      label: p.label,
      category: (p.categoryId && slugOf.get(p.categoryId)) || "",
      brand: p.brand,
      price,
      oldPrice,
      image: gallery[0],
      gallery,
      scene: p.sceneImage || gallery[gallery.length - 1],
      color: p.colorName,
      tone: p.colorHex || "#151515",
      subtitle: p.subtitle,
      desc: p.description,
      specs: p.specs.map((s) => [s.label, s.value] as [string, string]),
      featured: p.featured,
      isNew: p.isNew,
      inStock: vs.length ? vs.some((v) => v.inStock) : p.stockQty == null ? p.inStock : p.stockQty > 0,
      keywords: p.keywords,
      variants: vs,
      ship: (p.shippingClassId && classes.get(p.shippingClassId)) || categoryClass(p.categoryId),
    };
  });

  return {
    products: list,
    categories: cats.map((c) => ({
      id: c.slug,
      name: c.name,
      image: c.image || "",
      parent: c.parentId ? (slugOf.get(c.parentId) ?? null) : null,
      showOnHome: c.showOnHome,
      showInMenu: c.showInMenu,
    })),
    brands: brandRows.filter((b) => b.showInStrip).map((b) => ({ name: b.name, logo: b.logo })),
  };
}
