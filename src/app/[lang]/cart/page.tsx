import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InnerFooterBlocks } from "@/components/InnerFooterBlocks";
import { CartView } from "@/components/cart/CartView";
import { getT, toLang } from "@/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/cart">): Promise<Metadata> {
  const t = getT(toLang((await params).lang));
  return { title: t("კალათა | Express Mix") };
}

export default async function CartPage({ params }: PageProps<"/[lang]/cart">) {
  const t = getT(toLang((await params).lang));
  return (
    <>
      <Breadcrumbs items={[{ label: t("კალათა") }]} />
      <CartView />
      <InnerFooterBlocks />
    </>
  );
}
