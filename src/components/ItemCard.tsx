"use client";

import { useState } from "react";
import { useCatalog } from "@/context/CatalogContext";
import { useStore } from "@/context/StoreContext";
import { discountPercent, gel, productHref, type Product } from "@/lib/data";
import { Link, useT } from "@/i18n/client";
import { Icon } from "./Icon";

export function ItemCard({ p }: { p: Product }) {
  const { addToCart, isFavorite, toggleFavorite } = useStore();
  const { categoryName } = useCatalog();
  const [added, setAdded] = useState(false);
  const t = useT();
  const on = isFavorite(p.id);
  const off = discountPercent(p);
  const href = productHref(p);

  return (
    <article className="item-card">
      <Link className="item-photo" href={href} aria-label={t("{name} — დეტალურად", { name: p.name })}>
        <img src={p.image} alt={p.name} data-kind={p.id} loading="lazy" width={200} height={210} />
      </Link>
      {off > 0 && <span className="discount-badge">−{off}%</span>}
      {p.isNew && <span className="card-new">{t("ახალი")}</span>}
      <button
        className={`favorite-toggle${on ? " selected" : ""}`}
        aria-label={t("{name} — ფავორიტი", { name: p.name })}
        aria-pressed={on}
        onClick={() => toggleFavorite(p.id)}
      >
        <Icon name="heart" />
      </button>
      <div className="item-body">
        {p.brandLogo ? <img className="item-brand-logo" src={p.brandLogo} alt={p.brand} /> : <span className="item-brand">{p.brand.toUpperCase()}</span>}
        <Link className="item-name" href={href}>
          {p.name}
        </Link>
        <span className="inline-green">{t("მარაგშია")}</span>
        <p className="item-extra">
          {[categoryName(p.category), p.variants.length > 1 ? t("{n} ფერი", { n: p.variants.length }) : p.color].filter(Boolean).join(" · ")}
        </p>
        <div className="item-foot">
          <div className="item-prices">
            <strong>{gel(p.price * 100)}</strong>
            {p.oldPrice > p.price && <del>{gel(p.oldPrice * 100)}</del>}
          </div>
          <button
            className={`add-cart${added ? " added" : ""}`}
            aria-label={t("{name} — კალათაში დამატება", { name: p.name })}
            onClick={() => {
              if (!addToCart(p.id)) return;
              setAdded(true);
              setTimeout(() => setAdded(false), 950);
            }}
          >
            <Icon name={added ? "check" : "cart"} />
          </button>
        </div>
      </div>
    </article>
  );
}
