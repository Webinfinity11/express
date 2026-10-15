import "server-only";
import { asc } from "drizzle-orm";
import { categories, db, pages, products } from "@/db";
import { categoryHref } from "@/lib/data";
import { BUILTIN_PAGES, type LinkOption } from "@/lib/site-links";

/** ადმინის „ბმულის არჩევის“ სია: გვერდები, კატეგორიები, პროდუქცია */
export async function getLinkOptions(): Promise<LinkOption[]> {
  const [pageRows, cats, prods] = await Promise.all([
    db.select({ id: pages.id, slug: pages.slug, title: pages.title }).from(pages).orderBy(asc(pages.title)),
    db.select({ id: categories.id, slug: categories.slug, name: categories.name, parentId: categories.parentId }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select({ id: products.id, slug: products.slug, name: products.name }).from(products).orderBy(asc(products.name)),
  ]);
  const depth = (id: number | null): number => {
    const c = cats.find((x) => x.id === id);
    return c?.parentId ? 1 + depth(c.parentId) : 0;
  };
  const tree: typeof cats = [];
  const walk = (pid: number | null) =>
    cats.filter((c) => c.parentId === pid).forEach((c) => (tree.push(c), walk(c.id)));
  walk(null);

  return [
    ...BUILTIN_PAGES.map((p) => ({ group: "გვერდები", label: p.label, href: p.href, edit: p.edit })),
    ...pageRows.map((p) => ({ group: "ჩემი გვერდები", label: p.title, href: `/${p.slug}`, edit: `/admin/pages/${p.id}` })),
    ...tree.map((c) => ({ group: "კატეგორიები", label: `${"— ".repeat(depth(c.id))}${c.name}`, href: categoryHref(c.slug), edit: `/admin/categories/${c.id}` })),
    ...prods.map((p) => ({ group: "პროდუქცია", label: p.name, href: `/product/${p.slug}`, edit: `/admin/products/${p.id}` })),
  ];
}
