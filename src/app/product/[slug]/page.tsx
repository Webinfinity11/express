import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InnerFooterBlocks } from "@/components/InnerFooterBlocks";
import { ProductView } from "@/components/product/ProductView";
import { BY_SLUG, PRODUCTS, categoryHref, categoryName } from "@/lib/data";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const p = BY_SLUG.get((await params).slug);
  if (!p) return {};
  return { title: `${p.name} — Express Mix`, description: p.desc };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const p = BY_SLUG.get((await params).slug);
  if (!p) notFound();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "მაღაზია", href: "/products" },
          { label: categoryName(p.category), href: categoryHref(p.category) },
          { label: p.name },
        ]}
      />
      <ProductView key={p.id} p={p} />
      <InnerFooterBlocks />
    </>
  );
}
