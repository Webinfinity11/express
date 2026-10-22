import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InnerFooterBlocks } from "@/components/InnerFooterBlocks";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "კალათა | Express Mix" };

export default function CartPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "კალათა" }]} />
      <CartView />
      <InnerFooterBlocks />
    </>
  );
}
