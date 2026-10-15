import Link from "next/link";
import { Icon } from "@/components/Icon";
import { InfoButton } from "@/components/InfoButton";
import type { InfoKey } from "@/context/StoreContext";
import { Brands } from "@/components/home/Brands";
import { Hero } from "@/components/home/Hero";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { Newsletter } from "@/components/home/Newsletter";
import { getCatalog } from "@/lib/catalog";
import { getContent } from "@/lib/content";
import { categoryHref, discountPercent } from "@/lib/data";

// ბარათების ხატულები და საინფორმაციო ფანჯრები — ტექსტები ადმინიდან
const PERK_META: { info: InfoKey; icon: string }[] = [
  { info: "delivery", icon: "truck" },
  { info: "warranty", icon: "shield" },
  { info: "payment", icon: "card" },
];

export default async function Home() {
  const [{ products, categories, brands }, { home }] = await Promise.all([getCatalog(), getContent()]);
  // პოპულარული: ჯერ featured, შემდეგ დანარჩენი; ფასდაკლებული: ყველაზე დიდი ფასდაკლებით
  const popular = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)];
  const onSale = products.filter((p) => discountPercent(p) > 0).sort((a, b) => discountPercent(b) - discountPercent(a));
  const homeCategories = categories.filter((c) => c.showOnHome);

  return (
    <main id="main">
      <Hero home={home} />
      <div className="wrap content-wrap">
        <section className="categories-section" id="categories">
          <h2 className="sr-only">კატეგორიები</h2>
          <div className="categories-grid">
            {homeCategories.map((c) => (
              <Link key={c.id} className="category-card" href={categoryHref(c.id)}>
                <img src={c.image} alt="" width={100} height={111} loading="lazy" />
                <span>{c.name}</span>
              </Link>
            ))}
            <Link className="category-card sale-card" href="/products?sale=1">
              <b className="sale-badge">%</b>
              <span>აქციები</span>
            </Link>
          </div>
        </section>

        <section className="perks" aria-label="ჩვენი უპირატესობები">
          {home.perks.slice(0, 3).map((p, i) => (
            <InfoButton key={i} info={PERK_META[i].info} className="perk">
              <span className="perk-icon">
                <svg aria-hidden="true">
                  <use href={`#i-${PERK_META[i].icon}`} />
                </svg>
              </span>
              <span>
                <strong>{p.title}</strong>
                <small>{p.text}</small>
              </span>
            </InfoButton>
          ))}
        </section>

        {popular.length > 0 && <ProductCarousel id="popular" title={home.popularTitle} href="/products" products={popular} />}
        {onSale.length > 0 && <ProductCarousel id="sale" title={home.saleTitle} href="/products?sale=1" products={onSale} />}

        <section className="promo-grid" aria-label="სპეციალური შეთავაზებები">
          {home.promos.slice(0, 2).map((p, i) => (
            <article key={i} className={`promo ${i === 0 ? "promo-kitchen" : "promo-iron"}`}>
              {p.image && <img src={p.image} alt="" loading="lazy" />}
              <div className="promo-shade"></div>
              <div className="promo-copy">
                <span className="eyebrow">{p.eyebrow}</span>
                <h2>
                  {p.title}
                  {p.accent && (
                    <>
                      <br />
                      {i === 0 ? <span>{p.accent}</span> : p.accent}
                    </>
                  )}
                </h2>
                <p>{p.text}</p>
                {p.button && (
                  <Link className="button primary" href={p.href || "/products"}>
                    {p.button} <Icon name="arrow" />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </section>

        <Brands brands={brands} />
      </div>
      <Newsletter />
    </main>
  );
}
