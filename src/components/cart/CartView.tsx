"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { ItemCard } from "@/components/ItemCard";
import { QtyInput } from "@/components/QtyInput";
import { useStore } from "@/context/StoreContext";
import { useCatalog } from "@/context/CatalogContext";
import { gel } from "@/lib/data";
import { Link, useT } from "@/i18n/client";

export function CartView() {
  const store = useStore();
  const t = useT();
  const { cart, cartCount, totals: tot, coupon } = store;
  const { line, products: PRODUCTS } = useCatalog();
  const entries = Object.entries(cart).flatMap(([id, q]) => {
    const l = line(id);
    return l ? [[id, q, l] as const] : [];
  });
  const [couponInput, setCouponInput] = useState(coupon);
  const [couponError, setCouponError] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

  const inCart = new Set(entries.map(([, , l]) => l.product.id));
  const recommended = PRODUCTS.filter((p) => !inCart.has(p.id)).slice(0, 4);

  return (
    <main id="main" className="wrap internal-main cart-page">
      <div className="cart-page-heading">
        <div>
          <span className="eyebrow small-eyebrow">YOUR NEXT EVERYDAY ESSENTIALS</span>
          <h1>
            {t("თქვენი კალათა")} <span>({cartCount})</span>
          </h1>
          <p>{t("თქვენი სახლისთვის შერჩეული ტექნიკა.")}</p>
        </div>
        <div className="checkout-steps" aria-label={t("შეკვეთის ეტაპები")}>
          <span className="current">
            <b>01</b> {t("კალათა")}
          </span>
          <i></i>
          <span>
            <b>02</b> {t("გაფორმება")}
          </span>
          <i></i>
          <span>
            <b>03</b> {t("დასრულება")}
          </span>
        </div>
      </div>

      {!entries.length ? (
        <div className="cart-empty">
          <div className="empty-cart-art">
            <Icon name="cart" />
          </div>
          <h2>{t("კალათა ჯერ ცარიელია")}</h2>
          <p>{t("შეარჩიეთ სასურველი ტექნიკა და დაამატეთ კალათაში. თქვენი ახალი კომფორტი აქ იწყება.")}</p>
          <div className="empty-buttons">
            <Link className="button primary" href="/products">
              {t("მაღაზიაში გადასვლა")} <Icon name="arrow" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-main-column">
            <section className="cart-products-box" aria-label={t("კალათის პროდუქტები")}>
              <div className="cart-table-head">
                <span>{t("პროდუქტი")}</span>
                <span>{t("რაოდენობა")}</span>
                <span>{t("ჯამი")}</span>
                <span></span>
              </div>
              {entries.map(([id, q, p]) => {
                const on = store.isFavorite(p.product.id);
                return (
                  <article className="cart-product-row" key={id}>
                    <div className="cart-row-product">
                      <Link className="cart-row-image" href={p.href} aria-label={p.name}>
                        <img src={p.image} alt={p.name} />
                      </Link>
                      <div>
                        <span className="item-brand">{p.product.brand.toUpperCase()}</span>
                        <h2>
                          <Link href={p.href}>{p.name}</Link>
                        </h2>
                        <span className="cart-variant">{p.variantName || p.product.color}</span>
                        <div className="cart-unit-price">
                          <span>{gel(p.price * 100)}</span>
                          {p.oldPrice > p.price && <del>{gel(p.oldPrice * 100)}</del>}
                        </div>
                        <button className="text-action" aria-pressed={on} onClick={() => store.toggleFavorite(p.product.id)}>
                          <Icon name="heart" /> {on ? t("ფავორიტებშია") : t("ფავორიტებში")}
                        </button>
                      </div>
                    </div>
                    <QtyInput value={q} onChange={(n) => store.setQuantity(id, n)} label={t("{name} რაოდენობა", { name: p.name })} />
                    <div className="cart-row-total">
                      {gel(p.price * q * 100)}
                      <small>
                        {q} × {gel(p.price * 100)}
                      </small>
                    </div>
                    <button className="cart-remove" aria-label={t("{name} — კალათიდან წაშლა", { name: p.name })} onClick={() => store.removeFromCart(id)}>
                      <Icon name="trash" />
                    </button>
                  </article>
                );
              })}
            </section>

            <div className="cart-bottom-actions">
              <Link className="continue-link" href="/products">
                <Icon name="arrow" /> {t("შოპინგის გაგრძელება")}
              </Link>
              <button className="text-action" onClick={() => store.openModal("clear-cart")}>
                <Icon name="trash" /> {t("გასუფთავება")}
              </button>
            </div>

          </div>

          <aside className="cart-summary-column">
            <section className="order-summary" aria-labelledby="summaryTitle">
              <div className="summary-title">
                <h2 id="summaryTitle">{t("შეკვეთის შეჯამება")}</h2>
                <Icon name="box" />
              </div>
              <div className="summary-line">
                <span>{t("პროდუქტები ({n})", { n: cartCount })}</span>
                <strong>{gel(tot.list)}</strong>
              </div>
              {tot.sale > 0 && (
                <div className="summary-line discount">
                  <span>{t("ფასდაკლება")}</span>
                  <strong>−{gel(tot.sale)}</strong>
                </div>
              )}
              <div className="summary-line subtotal">
                <span>{t("ქვეჯამი")}</span>
                <strong>{gel(tot.sub)}</strong>
              </div>
              {tot.coupon > 0 && (
                <div className="summary-line discount">
                  <span>{t("პრომოკოდი {code}", { code: coupon })}</span>
                  <strong>−{gel(tot.coupon)}</strong>
                </div>
              )}
              <div className="summary-line">
                <span>{t("მიწოდება")}</span>
                <strong>{t("გაფორმებისას")}</strong>
              </div>
              <form
                className="coupon-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (couponBusy) return;
                  setCouponBusy(true);
                  setCouponError((await store.applyCoupon(couponInput)) ?? "");
                  setCouponBusy(false);
                }}
              >
                <label className="sr-only" htmlFor="couponInput">
                  {t("პრომოკოდი")}
                </label>
                <input
                  id="couponInput"
                  type="text"
                  maxLength={24}
                  autoComplete="off"
                  placeholder={t("პრომოკოდი")}
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  aria-describedby="couponFeedback"
                />
                <button type="submit">{t("გამოყენება")}</button>
              </form>
              <div className={`coupon-feedback${couponError ? " error" : ""}`} id="couponFeedback" role="status">
                {(couponError && t(couponError)) ||
                  (coupon && (
                    <>
                      <span>{t("კოდი გამოყენებულია")}</span>
                      <button
                        onClick={() => {
                          store.removeCoupon();
                          setCouponInput("");
                        }}
                      >
                        {t("წაშლა")}
                      </button>
                    </>
                  ))}
              </div>
              <div className="summary-total" aria-live="polite">
                <span>{t("ჯამი")}</span>
                <strong>{gel(tot.after)}</strong>
              </div>
              <Link className="button primary full-width checkout-cta" href="/checkout">
                {t("გაფორმებაზე გადასვლა")} <Icon name="arrow" />
              </Link>
              <div className="secure-note">
                <Icon name="lock" /> {t("უსაფრთხო შეკვეთა")}
              </div>
              <div className="payment-options">
                <span>
                  <Icon name="card" /> {t("ბარათით გადახდა")}
                </span>
                <span>Visa</span>
                <span>Mastercard</span>
              </div>
            </section>
            {tot.saved > 0 && (
              <div className="cart-savings-note">
                {t("თქვენი დანაზოგი ამ კალათაში:")} <strong>{gel(tot.saved)}</strong>
              </div>
            )}
          </aside>
        </div>
      )}

      <section className="related-section cart-related" aria-labelledby="cartRelatedTitle">
        <div className="section-heading">
          <h2 id="cartRelatedTitle">{t("კიდევ უფრო მეტი კომფორტი")}</h2>
          <Link className="text-link" href="/products">
            {t("ყველა პროდუქტი")} <Icon name="arrow" />
          </Link>
        </div>
        <div className="related-grid">
          {(recommended.length ? recommended : PRODUCTS.slice(0, 4)).map((p) => (
            <ItemCard key={p.id} p={p} />
          ))}
        </div>
      </section>
    </main>
  );
}
