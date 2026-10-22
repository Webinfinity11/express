import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InnerFooterBlocks } from "@/components/InnerFooterBlocks";
import { ProductView } from "@/components/product/ProductView";
import { getCatalog } from "@/lib/catalog";
import { categoryHref } from "@/lib/data";

export async function generateStaticParams() {
  const { products } = await getCatalog();
  // Cache Components-ს ერთი პარამეტრი მაინც სჭირდება; პროდუქტების გარეშე → 404
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}

async function find(slug: string) {
  const catalog = await getCatalog();
  return { catalog, p: catalog.products.find((x) => x.slug === decodeURIComponent(slug)) };
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { p } = await find((await params).slug);
  if (!p) return {};
  return { title: `${p.name} | Express Mix`, description: p.desc.slice(0, 160) };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { catalog, p } = await find((await params).slug);
  if (!p) notFound();
  const category = catalog.categories.find((c) => c.id === p.category);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "მაღაზია", href: "/products" },
          ...(category ? [{ label: category.name, href: categoryHref(category.id) }] : []),
          { label: p.name },
        ]}
      />
      <ProductView key={p.id} p={p} />
      <InnerFooterBlocks />
    </>
  );
}
