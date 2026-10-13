import { InfoButton } from "./InfoButton";
import { Newsletter } from "./home/Newsletter";
import type { InfoKey } from "@/context/StoreContext";

const BENEFITS: { info: InfoKey; icon: string; title: string; text: string }[] = [
  { info: "delivery", icon: "truck", title: "სწრაფი მიწოდება", text: "პირობები შეკვეთისას" },
  { info: "warranty", icon: "shield", title: "პროდუქტის გარანტია", text: "ინფორმაცია პირობებზე" },
  { info: "contact", icon: "headphones", title: "კონსულტაცია", text: "არჩევანში დაგეხმარებით" },
  { info: "payment", icon: "card", title: "მოქნილი გადახდა", text: "გადახდის პირობები" },
];

/** შიდა გვერდების ბოლო ბლოკები: სერვისები + სიახლეების გამოწერა */
export function InnerFooterBlocks() {
  return (
    <>
      <div className="wrap">
        <section aria-label="ჩვენი სერვისები" className="benefits inner-benefits">
          {BENEFITS.map((b) => (
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
