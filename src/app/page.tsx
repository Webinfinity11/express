import Link from "next/link";
import { Icon } from "@/components/Icon";
import { InfoButton } from "@/components/InfoButton";
import type { InfoKey } from "@/context/StoreContext";
import { Brands } from "@/components/home/Brands";
import { Hero } from "@/components/home/Hero";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { Newsletter } from "@/components/home/Newsletter";
import { CATEGORIES, PRODUCTS, categoryHref, discountPercent } from "@/lib/data";

const PERKS: { info: InfoKey; icon: string; title: string; text: string }[] = [
  { info: "delivery", icon: "truck", title: "უფასო მიწოდება", text: "მთელ საქართველოში" },
  { info: "warranty", icon: "shield", title: "ხარისხის გარანტია", text: "ოფიციალური გარანტია ყველა ტექნიკაზე" },
  { info: "payment", icon: "card", title: "იყიდე ახლა — გადაიხადე ნაწილ-ნაწილ", text: "განვადება პარტნიორ ბანკებთან" },
];

export default function Home() {
  // პოპულარული: ჯერ featured, შემდეგ დანარჩენი; ფასდაკლებული: ყველაზე დიდი ფასდაკლებით
  const popular = [...PRODUCTS.filter((p) => p.featured), ...PRODUCTS.filter((p) => !p.featured)];
  const onSale = PRODUCTS.filter((p) => discountPercent(p) > 0).sort((a, b) => discountPercent(b) - discountPercent(a));

  return (
    <main id="main">
      <Hero />
      <div className="wrap content-wrap">
        <section className="categories-section" id="categories">
          <h2 className="sr-only">კატეგორიები</h2>
          <div className="categories-grid">
            {CATEGORIES.map((c) => (
              <Link key={c.id} className="category-card" href={categoryHref(c.id)}>
                <img src={c.image} alt="" width={100} height={111} loading="lazy" />
                <span>{c.name}</span>
              </Link>
            ))}
            <Link className="category-card sale-card" href="/products?filter=sale">
              <b className="sale-badge">%</b>
              <span>აქციები</span>
            </Link>
          </div>
        </section>

        <section className="perks" aria-label="ჩვენი უპირატესობები">
          {PERKS.map((p) => (
            <InfoButton key={p.info} info={p.info} className="perk">
              <span className="perk-icon">
                <svg aria-hidden="true">
                  <use href={`#i-${p.icon}`} />
                </svg>
              </span>
              <span>
                <strong>{p.title}</strong>
                <small>{p.text}</small>
              </span>
            </InfoButton>
          ))}
        </section>

        <ProductCarousel id="popular" title="პოპულარული პროდუქტები" href="/products" products={popular} />
        <ProductCarousel id="sale" title="ფასდაკლებული პროდუქცია" href="/products?sale=1" products={onSale} />

        <section className="promo-grid" aria-label="სპეციალური შეთავაზებები">
          <article className="promo promo-kitchen">
            <img src="/images/promo-kitchen.webp" alt="Franko-ს ციტრუსის საწური და ახალი ხილი" loading="lazy" />
            <div className="promo-shade"></div>
            <div className="promo-copy">
              <span className="eyebrow">EXPRESS MIX</span>
              <h2>
                სამზარეულოში
                <br />
                <span>უფრო მეტი კომფორტი</span>
              </h2>
              <p>
                თანამედროვე ტექნიკა
                <br />
                თქვენი ყოველდღიურობისთვის.
              </p>
              <Link className="button primary" href={categoryHref("kitchen")}>
                ნახე შეთავაზებები <Icon name="arrow" />
              </Link>
            </div>
          </article>
          <article className="promo promo-iron">
            <img src="/images/promo-iron.webp" alt="Franko Premier შავი და ოქროსფერი უთო" loading="lazy" />
            <div className="promo-shade"></div>
            <div className="promo-copy">
              <span className="eyebrow">სპეციალური ფასები</span>
              <h2>
                საყოფაცხოვრებო
                <br />
                ტექნიკაზე
              </h2>
              <p>
                პატარა დეტალები.
                <br />
                დიდი განსხვავება.
              </p>
              <Link className="button primary" href={categoryHref("irons")}>
                ნახე აქციები <Icon name="arrow" />
              </Link>
            </div>
          </article>
        </section>

        <Brands />
      </div>
      <Newsletter />
    </main>
  );
}
