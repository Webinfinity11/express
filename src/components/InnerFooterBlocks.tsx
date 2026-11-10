"use client";

import { InfoButton } from "./InfoButton";
import { Newsletter } from "./home/Newsletter";
import type { InfoKey } from "@/context/StoreContext";
import { useT } from "@/i18n/client";
import type { T } from "@/i18n";

const benefits = (t: T): { info: InfoKey; icon: string; title: string; text: string }[] => [
  { info: "delivery", icon: "truck", title: t("სწრაფი მიწოდება"), text: t("პირობები შეკვეთისას") },
  { info: "warranty", icon: "shield", title: t("პროდუქტის გარანტია"), text: t("ინფორმაცია პირობებზე") },
  { info: "contact", icon: "headphones", title: t("კონსულტაცია"), text: t("არჩევანში დაგეხმარებით") },
  { info: "payment", icon: "card", title: t("მოქნილი გადახდა"), text: t("გადახდის პირობები") },
];

/** შიდა გვერდების ბოლო ბლოკები: სერვისები + სიახლეების გამოწერა */
export function InnerFooterBlocks() {
  const t = useT();
  return (
    <>
      <div className="wrap">
        <section aria-label={t("ჩვენი სერვისები")} className="benefits inner-benefits">
          {benefits(t).map((b) => (
            <InfoButton key={b.info} info={b.info} className="benefit">
              <svg className="benefit-icon" aria-hidden="true">
                <use href={`#i-${b.icon}`} />
              </svg>
              <span>
                <strong>{b.title}</strong>
                <small>{b.text}</small>
              </span>
            </InfoButton>
          ))}
        </section>
      </div>
      <Newsletter />
    </>
  );
}
