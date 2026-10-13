"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { discountPercent, money, productHref, type Product } from "@/lib/data";
import { Icon } from "./Icon";

export function Prices({ p }: { p: Product }) {
  return (
    <div className="prices">
      <span className="price">
        {money(p.price)} <small>₾</small>
      </span>
      {p.oldPrice > p.price && <span className="old-price">{money(p.oldPrice)} ₾</span>}
    </div>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const { addToCart, isFavorite, toggleFavorite } = useStore();
  const [added, setAdded] = useState(false);
  const favorite = isFavorite(p.id);
  const discount = discountPercent(p);
  const href = productHref(p);

  return (
    <article className="product-card">
      {discount > 0 && <span className="discount-badge">-{discount}%</span>}
      <button
        className={`favorite-toggle${favorite ? " selected" : ""}`}
        aria-label={`${p.name} — ფავორიტი`}
        aria-pressed={favorite}
        onClick={() => toggleFavorite(p.id)}
      >
        <Icon name="heart" />
      </button>
      <Link className="product-image-button" href={href} aria-label={`${p.name} — დეტალურად`}>
        <img data-kind={p.id} src={p.image} alt={p.name} loading="lazy" width={180} height={178} />
      </Link>
      <div className="product-info">
        <Link className="product-title" href={href}>
          {p.name}
        </Link>
        <div className="product-bottom">
          <Prices p={p} />
          <button
            className={`add-cart${added ? " added" : ""}`}
            aria-label={`${p.name} — კალათაში დამატება`}
            title="კალათაში დამატება"
            onClick={() => {
              if (!addToCart(p.id)) return;
              setAdded(true);
              setTimeout(() => setAdded(false), 1100);
            }}
          >
            <Icon name={added ? "check" : "cart"} />
          </button>
        </div>
      </div>
    </article>
  );
}
