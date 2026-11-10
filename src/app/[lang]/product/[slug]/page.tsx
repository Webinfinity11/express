import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InnerFooterBlocks } from "@/components/InnerFooterBlocks";
import { ProductView } from "@/components/product/ProductView";
import { getT, localePath, toLang, type Lang } from "@/i18n";
import { getCatalog } from "@/lib/catalog";
import { categoryHref, productHref } from "@/lib/data";

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const { products } = await getCatalog(toLang(params.lang));
  // Cache Components-ს ერთი პარამეტრი მაინც სჭირდება; პროდუქტების გარეშე → 404
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}

async function find(lang: Lang, slug: string) {
  const catalog = await getCatalog(lang);
  return { catalog, p: catalog.products.find((x) => x.slug === decodeURIComponent(slug)) };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/product/[slug]">): Promise<Metadata> {
  const { lang: l, slug } = await params;
  const lang = toLang(l);
  const { p } = await find(lang, slug);
  if (!p) return {};
  const path = productHref(p);
  return {
    title: `${p.name} | Express Mix`,
    description: p.desc.slice(0, 160),
    alternates: { canonical: localePath(lang, path), languages: { ka: path, en: localePath("en", path) } },
  };
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
