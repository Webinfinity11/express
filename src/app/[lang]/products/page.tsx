import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InnerFooterBlocks } from "@/components/InnerFooterBlocks";
import { Shop } from "@/components/shop/Shop";
import { getT, localePath, toLang } from "@/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/products">): Promise<Metadata> {
  const lang = toLang((await params).lang);
  const t = getT(lang);
  return {
    title: t("მაღაზია | Express Mix"),
    description: t("სახლისა და სამზარეულოს ტექნიკა: მაცივრები, სარეცხი მანქანები, ღუმელები, მტვერსასრუტები და სხვა."),
    alternates: { canonical: localePath(lang, "/products"), languages: { ka: "/products", en: "/en/products" } },
  };
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
    </>
  );
}
