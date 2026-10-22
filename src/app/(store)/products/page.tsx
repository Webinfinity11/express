import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InnerFooterBlocks } from "@/components/InnerFooterBlocks";
import { Shop } from "@/components/shop/Shop";

export const metadata: Metadata = {
  title: "მაღაზია | Express Mix",
  description: "სახლისა და სამზარეულოს ტექნიკა: მაცივრები, სარეცხი მანქანები, ღუმელები, მტვერსასრუტები და სხვა.",
};

export default function ProductsPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "მაღაზია" }]} />
      <Suspense>
        <Shop />
      </Suspense>
      <InnerFooterBlocks />
    </>
  );
}
