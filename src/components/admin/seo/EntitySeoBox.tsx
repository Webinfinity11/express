import { eq } from "drizzle-orm";
import { categories, db, type CategoryRow, type PageRow, type ProductRow } from "@/db";
import { getCatalog } from "@/lib/catalog";
import { categoryHref, indexCatalog, productHref } from "@/lib/data";
import { getSeoSettings, resolveSeo } from "@/lib/seo";
import type { SeoType, TemplateVars } from "@/lib/seo-shared";
import { SeoBox } from "./SeoBox";

type Props = { kind: "product"; row: ProductRow } | { kind: "category"; row: CategoryRow } | { kind: "page"; row: PageRow };

/** სერვერზე ითვლის შაბლონის მნიშვნელობებს (placeholder/preview) და აჩვენებს SEO ბლოკს */
export async function EntitySeoBox(props: Props) {
  const s = await getSeoSettings();
  let type: SeoType, path: string, ka: TemplateVars, en: TemplateVars;

  if (props.kind === "product") {
    const p = props.row;
    const [cat] = p.categoryId ? await db.select({ name: categories.name, en: categories.en }).from(categories).where(eq(categories.id, p.categoryId)) : [];
    const common = { brand: p.brand, price: String(p.price), sku: p.sku };
    type = "product";
    path = productHref(p);
    ka = { ...common, title: p.name, excerpt: p.description || p.subtitle, category: cat?.name };
    en = { ...common, title: p.en?.name || p.name, excerpt: p.en?.description || p.description || p.subtitle, category: cat?.en?.name || cat?.name };
  } else if (props.kind === "category") {
    const c = props.row;
    const catalog = await getCatalog("ka");
    const tree = indexCatalog(catalog).subtree(c.slug);
    const count = String(catalog.products.filter((p) => tree.has(p.category)).length);
    type = "category";
    path = categoryHref(c.slug);
    ka = { title: c.name, count };
    en = { title: c.en?.name || c.name, count };
  } else {
    const p = props.row;
    type = "page";
    path = `/${p.slug}`;
    ka = { title: p.title, excerpt: p.metaDescription || p.subtitle || p.body };
    en = { title: p.en?.title || p.title, excerpt: p.en?.metaDescription || p.en?.subtitle || p.metaDescription || p.subtitle };
  }

  const defaults = {
    ka: resolveSeo(s, { lang: "ka", type, vars: ka }),
    en: resolveSeo(s, { lang: "en", type, vars: en }),
  };
  return (
    <SeoBox
      key={JSON.stringify(props.row.seo)}
      kind={props.kind}
      id={props.row.id}
      initial={props.row.seo ?? {}}
      defaults={{ ka: { title: defaults.ka.title, description: defaults.ka.description }, en: { title: defaults.en.title, description: defaults.en.description } }}
      url={s.siteUrl + path}
      slug={props.row.slug}
    />
  );
}
