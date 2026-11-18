import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InnerFooterBlocks } from "@/components/InnerFooterBlocks";
import { Shop } from "@/components/shop/Shop";
import { getT, toLang } from "@/i18n";
import { getCatalog } from "@/lib/catalog";
import { categoryHref, indexCatalog } from "@/lib/data";
import { buildMetadata, getSeoOverrides } from "@/lib/seo";

export async function generateMetadata({ params, searchParams }: PageProps<"/[lang]/products">): Promise<Metadata> {
  const lang = toLang((await params).lang);
  const sp = await searchParams;
  const slug = typeof sp.category === "string" ? sp.category : "";
  // ფილტრები (ფასი, ბრენდი, ძიება...) — დუბლიკატი გვერდები, ინდექსაციის გარეშე
  const filtered = Object.keys(sp).some((k) => k !== "category");
  if (slug) {
    const [catalog, overrides] = await Promise.all([getCatalog(lang), getSeoOverrides()]);
    const category = catalog.categories.find((c) => c.id === slug);
    if (category) {
      const tree = indexCatalog(catalog).subtree(category.id);
      const meta = await buildMetadata({
        lang,
        type: "category",
        path: categoryHref(category.id),
        override: overrides.categories[category.id],
        image: category.image || null,
        vars: { title: category.name, count: String(catalog.products.filter((p) => tree.has(p.category)).length) },
      });
      return filtered ? { ...meta, robots: { index: false, follow: true } } : meta;
    }
  }
  const meta = await buildMetadata({ lang, type: "shop", path: "/products" });
  return filtered ? { ...meta, robots: { index: false, follow: true } } : meta;
}

// მეტამონაცემები searchParams-ზეა დამოკიდებული (კატეგორია) — გვერდის დანარჩენი ნაწილი სტატიკური რჩება
async function Connection() {
  await connection();
  return null;
}

export default async function ProductsPage({ params }: PageProps<"/[lang]/products">) {
  const t = getT(toLang((await params).lang));
  return (
    <>
      <Breadcrumbs items={[{ label: t("მაღაზია") }]} />
      <Suspense>
        <Shop />
      </Suspense>
      <InnerFooterBlocks />
      <Suspense>
        <Connection />
      </Suspense>
    </>
  );
}
