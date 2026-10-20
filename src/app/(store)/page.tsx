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
import { categoryHref, discountPercent, indexCatalog } from "@/lib/data";

// ბარათების ხატულები და საინფორმაციო ფანჯრები — ტექსტები ადმინიდან
const PERK_META: { info: InfoKey; icon: string }[] = [
  { info: "delivery", icon: "truck" },
  { info: "warranty", icon: "shield" },
  { info: "payment", icon: "card" },
];

const BLOCK_HREF: Record<string, string> = { sale: "sale=1", new: "new=1" };

export default async function Home() {
  const [catalog, { home }] = await Promise.all([getCatalog(), getContent()]);
  const { products, categories, brands } = catalog;
  const { subtree } = indexCatalog(catalog);
  const homeCategories = categories.filter((c) => c.showOnHome);

  // პროდუქციის ბლოკები ადმინიდან: ტიპი + კატეგორია (ქვეკატეგორიებით) + რაოდენობა
  const blocks = home.productBlocks.map((b, i) => {
    const cats = b.category ? subtree(b.category) : null;
    let list = cats ? products.filter((p) => cats.has(p.category)) : products;
    if (b.source === "featured") {
      // ⭐ მონიშნული წინ; თუ არცერთია — ყველა
      list = [...list.filter((p) => p.featured), ...list.filter((p) => !p.featured)];
    } else if (b.source === "sale") {
      list = list.filter((p) => discountPercent(p) > 0).sort((a, c) => discountPercent(c) - discountPercent(a));
    } else if (b.source === "new") {
      list = list.filter((p) => p.isNew);
    }
    const query = [b.category && `category=${b.category}`, BLOCK_HREF[b.source]].filter(Boolean).join("&");
    return {
      id: i === 0 ? "popular" : i === 1 && b.source === "sale" ? "sale" : `block-${i}`,
      kind: b.source === "sale" ? ("sale" as const) : ("popular" as const),
      title: b.title,
      href: "/products" + (query ? "?" + query : ""),
      products: list.slice(0, Math.max(1, Number(b.limit) || 12)),
    };
  });

  return (
    <main id="main">
      <Hero home={home} />
      <div className="wrap content-wrap">
        {home.showCategories && (
          <section className="categories-section" id="categories">
            <h2 className="sr-only">კატეგორიები</h2>
            <div className="categories-grid">
              {homeCategories.map((c) => (
                <Link key={c.id} className="category-card" href={categoryHref(c.id)}>
                  {c.image && <img src={c.image} alt="" width={100} height={111} loading="lazy" />}
                  <span>{c.name}</span>
                </Link>
              ))}
              <Link className="category-card sale-card" href="/products?sale=1">
                <b className="sale-badge">%</b>
                <span>აქციები</span>
              </Link>
            </div>
          </section>
        )}

        {home.showPerks && (
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
        )}

        {blocks.map((b) => b.products.length > 0 && <ProductCarousel key={b.id} {...b} />)}

        {home.showPromos && (
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
        )}

        {home.showBrands && <Brands brands={brands} />}
      </div>
      {home.showNewsletter && <Newsletter />}
    </main>
  );
}
