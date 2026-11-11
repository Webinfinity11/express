import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { bogEnabledCached } from "@/lib/bog";
import { flittEnabledCached } from "@/lib/flitt";
import { getT, toLang } from "@/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/checkout">): Promise<Metadata> {
  const t = getT(toLang((await params).lang));
  return { title: t("შეკვეთის გაფორმება | Express Mix"), robots: { index: false } };
}

export default async function CheckoutPage({ params }: PageProps<"/[lang]/checkout">) {
  const t = getT(toLang((await params).lang));
  const [cardEnabled, flittEnabled] = await Promise.all([bogEnabledCached(), flittEnabledCached()]);
  return (
    <>
      <Breadcrumbs items={[{ label: t("კალათა"), href: "/cart" }, { label: t("გაფორმება") }]} />
      <CheckoutView cardEnabled={cardEnabled} flittEnabled={flittEnabled} />
    </>
  );
}
