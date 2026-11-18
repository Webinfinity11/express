import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InnerFooterBlocks } from "@/components/InnerFooterBlocks";
import { ProductView } from "@/components/product/ProductView";
import { getT, localePath, toLang, type Lang } from "@/i18n";
import { getCatalog } from "@/lib/catalog";
import { categoryHref, productHref } from "@/lib/data";
import { buildMetadata, getSeoOverrides } from "@/lib/seo";

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const { products } = await getCatalog(toLang(params.lang));
  // Cache Components-ს ერთი პარამეტრი მაინც სჭირდება; პროდუქტების გარეშე → 404
  // პროდუქტი ბევრია (1700+), ყველას build-ზე არ ვაგენერირებთ — დანარჩენი პირველ ვიზიტზე გენერირდება და იქეშება
  return products.length ? products.slice(0, 20).map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}

async function find(lang: Lang, slug: string) {
  const catalog = await getCatalog(lang);
  return { catalog, p: catalog.products.find((x) => x.slug === decodeURIComponent(slug)) };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/product/[slug]">): Promise<Metadata> {
  const { lang: l, slug } = await params;
  const lang = toLang(l);
  const [{ catalog, p }, overrides] = await Promise.all([find(lang, slug), getSeoOverrides()]);
  if (!p) return {};
  const category = catalog.categories.find((c) => c.id === p.category);
  return buildMetadata({
    lang,
    type: "product",
    path: productHref(p),
    override: overrides.products[p.slug],
    image: p.image,
    vars: {
      title: p.name,
      excerpt: p.desc || p.subtitle,
      category: category?.name,
      brand: p.brand,
      price: String(p.price),
      sku: p.sku,
    },
  });
}

export default async function ProductPage({ params }: PageProps<"/[lang]/product/[slug]">) {
  const { lang: l, slug } = await params;
  const lang = toLang(l);
  const t = getT(lang);
  const { catalog, p } = await find(lang, slug);
  if (!p) notFound();
  const category = catalog.categories.find((c) => c.id === p.category);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t("მაღაზია"), href: "/products" },
          ...(category ? [{ label: category.name, href: categoryHref(category.id) }] : []),
          { label: p.name },
        ]}
      />
      <ProductView key={p.id} p={p} />
      <InnerFooterBlocks />
    </>
  );
}
