import type { MetadataRoute } from "next";
import { asc, eq } from "drizzle-orm";
import { db, pages, products } from "@/db";
import { localePath } from "@/i18n";
import { getCatalog } from "@/lib/catalog";
import { categoryHref, productHref } from "@/lib/data";
import { getSeoOverrides, getSeoSettings } from "@/lib/seo";

/** Rank Math → Sitemap Settings: ტიპები, სურათები, გამორიცხვები ადმინიდან (/admin/seo/sitemap). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [s, catalog, overrides] = await Promise.all([getSeoSettings(), getCatalog("ka"), getSeoOverrides()]);
  const base = (s.siteUrl || "https://emix.ge").replace(/\/+$/, "");
  const abs = (u: string) => (/^https?:\/\//.test(u) ? u : base + (u.startsWith("/") ? u : "/" + u));
  const exclude = new Set(s.sitemap.exclude.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean));
  const skip = (slug: string, type: "product" | "category" | "page", seo?: { noindex?: boolean }) =>
    exclude.has(slug) || (seo?.noindex ?? s.types[type].noindex);

  const entry = (path: string, extra: Partial<MetadataRoute.Sitemap[number]> = {}): MetadataRoute.Sitemap[number] => ({
    url: abs(path),
    alternates: { languages: { ka: abs(path), en: abs(localePath("en", path)) } },
    ...extra,
  });

  const out: MetadataRoute.Sitemap = [
    entry("/", { changeFrequency: "daily", priority: 1 }),
    entry("/products", { changeFrequency: "daily", priority: 0.9 }),
    entry("/about", { changeFrequency: "monthly", priority: 0.4 }),
    entry("/contact", { changeFrequency: "monthly", priority: 0.4 }),
  ];

  if (s.sitemap.categories && !s.types.category.noindex)
    for (const c of catalog.categories)
      if (!skip(c.id, "category", overrides.categories[c.id]))
        out.push(entry(categoryHref(c.id), { changeFrequency: "weekly", priority: 0.8, ...(s.sitemap.images && c.image && { images: [abs(c.image)] }) }));

  if (s.sitemap.products && !s.types.product.noindex) {
    const updated = new Map(
      (await db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.published, true))).map((r) => [r.slug, r.updatedAt]),
    );
    for (const p of catalog.products) {
      if (skip(p.slug, "product", overrides.products[p.slug])) continue;
      if (s.sitemap.excludeOutOfStock && !p.inStock) continue;
      out.push(
        entry(productHref(p), {
          lastModified: updated.get(p.slug),
          changeFrequency: "weekly",
          priority: 0.7,
          ...(s.sitemap.images && { images: p.gallery.filter((g) => !g.endsWith("/logo.webp")).slice(0, 5).map(abs) }),
        }),
      );
    }
  }

  if (s.sitemap.pages && !s.types.page.noindex) {
    const rows = await db.select({ slug: pages.slug, updatedAt: pages.updatedAt }).from(pages).where(eq(pages.published, true)).orderBy(asc(pages.slug));
    for (const p of rows)
      if (!skip(p.slug, "page", overrides.pages[p.slug])) out.push(entry(`/${p.slug}`, { lastModified: p.updatedAt, changeFrequency: "monthly", priority: 0.5 }));
  }

  return out;
}
