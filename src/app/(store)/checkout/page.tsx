import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = { title: "შეკვეთის გაფორმება | Express Mix", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "კალათა", href: "/cart" }, { label: "გაფორმება" }]} />
      <CheckoutView />
    </>
  );
}
