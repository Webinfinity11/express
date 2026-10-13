"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { ItemCard } from "@/components/ItemCard";
import { QtyInput } from "@/components/QtyInput";
import { useStore } from "@/context/StoreContext";
import { BY_ID, PRODUCTS, gel, productHref } from "@/lib/data";

export function CartView() {
  const store = useStore();
  const { cart, cartCount, totals: t, coupon } = store;
  const entries = Object.entries(cart).filter(([id]) => BY_ID.has(id));
  const [couponInput, setCouponInput] = useState(coupon);
  const [couponError, setCouponError] = useState("");

  const recommended = PRODUCTS.filter((p) => !cart[p.id]).slice(0, 4);

  return (
    <main id="main" className="wrap internal-main cart-page">
      <div className="cart-page-heading">
        <div>
          <span className="eyebrow small-eyebrow">YOUR NEXT EVERYDAY ESSENTIALS</span>
          <h1>
            თქვენი კალათა <span>({cartCount})</span>
          </h1>
          <p>თქვენი სახლისთვის შერჩეული ტექნიკა.</p>
        </div>
        <div className="checkout-steps" aria-label="შეკვეთის ეტაპები">
          <span className="current">
            <b>01</b> კალათა
          </span>
          <i></i>
          <span>
            <b>02</b> გაფორმება
          </span>
          <i></i>
          <span>
            <b>03</b> დასრულება
          </span>
        </div>
      </div>

      {!entries.length ? (
        <div className="cart-empty">
          <div className="empty-cart-art">
            <Icon name="cart" />
          </div>
          <h2>კალათა ჯერ ცარიელია</h2>
          <p>შეარჩიეთ სასურველი ტექნიკა და დაამატეთ კალათაში. თქვენი ახალი კომფორტი აქ იწყება.</p>
          <div className="empty-buttons">
            <Link className="button primary" href="/products">
              მაღაზიაში გადასვლა <Icon name="arrow" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-main-column">
            <section className="cart-products-box" aria-label="კალათის პროდუქტები">
              <div className="cart-table-head">
                <span>პროდუქტი</span>
                <span>რაოდენობა</span>
                <span>ჯამი</span>
                <span></span>
              </div>
              {entries.map(([id, q]) => {
                const p = BY_ID.get(id)!;
                const on = store.isFavorite(id);
                return (
                  <article className="cart-product-row" key={id}>
                    <div className="cart-row-product">
                      <Link className="cart-row-image" href={productHref(p)} aria-label={p.name}>
                        <img src={p.image} alt={p.name} />
                      </Link>
                      <div>
                        <span className="item-brand">{p.brand.toUpperCase()}</span>
                        <h2>
                          <Link href={productHref(p)}>{p.name}</Link>
                        </h2>
                        <span className="cart-variant">{p.color}</span>
                        <div className="cart-unit-price">
                          <span>{gel(p.price * 100)}</span>
                          {p.oldPrice > p.price && <del>{gel(p.oldPrice * 100)}</del>}
                        </div>
                        <button className="text-action" aria-pressed={on} onClick={() => store.toggleFavorite(id)}>
                          <Icon name="heart" /> {on ? "ფავორიტებშია" : "ფავორიტებში"}
                        </button>
                      </div>
                    </div>
                    <QtyInput value={q} onChange={(n) => store.setQuantity(id, n)} label={`${p.name} რაოდენობა`} />
                    <div className="cart-row-total">
                      {gel(p.price * q * 100)}
                      <small>
                        {q} × {gel(p.price * 100)}
                      </small>
                    </div>
                    <button className="cart-remove" aria-label={`${p.name} — კალათიდან წაშლა`} onClick={() => store.removeFromCart(id)}>
                      <Icon name="trash" />
                    </button>
                  </article>
                );
              })}
            </section>

            <div className="cart-bottom-actions">
              <Link className="continue-link" href="/products">
                <Icon name="arrow" /> შოპინგის გაგრძელება
              </Link>
              <button className="text-action" onClick={() => store.openModal("clear-cart")}>
                <Icon name="trash" /> გასუფთავება
              </button>
            </div>

          </div>

          <aside className="cart-summary-column">
            <section className="order-summary" aria-labelledby="summaryTitle">
              <div className="summary-title">
                <h2 id="summaryTitle">შეკვეთის შეჯამება</h2>
                <Icon name="box" />
              </div>
              <div className="summary-line">
                <span>პროდუქტები ({cartCount})</span>
                <strong>{gel(t.list)}</strong>
              </div>
              {t.sale > 0 && (
                <div className="summary-line discount">
                  <span>ფასდაკლება</span>
                  <strong>−{gel(t.sale)}</strong>
                </div>
              )}
              <div className="summary-line subtotal">
                <span>ქვეჯამი</span>
                <strong>{gel(t.sub)}</strong>
              </div>
              {t.coupon > 0 && (
                <div className="summary-line discount">
                  <span>პრომოკოდი {coupon}</span>
                  <strong>−{gel(t.coupon)}</strong>
                </div>
              )}
              <div className="summary-line">
                <span>მიწოდება</span>
                <strong>გაფორმებისას</strong>
              </div>
              <form
                className="coupon-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const code = couponInput.trim().toUpperCase();
                  if (!code) return setCouponError("შეიყვანეთ პრომოკოდი.");
                  setCouponError(store.applyCoupon(code) ? "" : "პრომოკოდი ვერ მოიძებნა.");
                }}
              >
                <label className="sr-only" htmlFor="couponInput">
                  პრომოკოდი
                </label>
                <input
                  id="couponInput"
                  type="text"
                  maxLength={24}
                  autoComplete="off"
                  placeholder="პრომოკოდი"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  aria-describedby="couponFeedback"
                />
                <button type="submit">გამოყენება</button>
              </form>
              <div className={`coupon-feedback${couponError ? " error" : ""}`} id="couponFeedback" role="status">
                {couponError ||
                  (coupon && (
                    <>
                      <span>კოდი გამოყენებულია</span>
                      <button
                        onClick={() => {
                          store.removeCoupon();
                          setCouponInput("");
                        }}
                      >
                        წაშლა
                      </button>
                    </>
                  ))}
              </div>
              <div className="summary-total" aria-live="polite">
                <span>ჯამი</span>
                <strong>{gel(t.after)}</strong>
              </div>
              <Link className="button primary full-width checkout-cta" href="/checkout">
                გაფორმებაზე გადასვლა <Icon name="arrow" />
              </Link>
              <div className="secure-note">
                <Icon name="lock" /> უსაფრთხო შეკვეთა
              </div>
              <div className="payment-options">
                <span>
                  <Icon name="card" /> ბარათი
                </span>
                <span>
                  <Icon name="card" /> განვადება
                </span>
                <span>
                  <Icon name="box" /> მიღებისას
                </span>
              </div>
            </section>
            {t.saved > 0 && (
              <div className="cart-savings-note">
                თქვენი დანაზოგი ამ კალათაში: <strong>{gel(t.saved)}</strong>
              </div>
            )}
          </aside>
        </div>
      )}

      <section className="related-section cart-related" aria-labelledby="cartRelatedTitle">
        <div className="section-heading">
          <h2 id="cartRelatedTitle">კიდევ უფრო მეტი კომფორტი</h2>
          <Link className="text-link" href="/products">
            ყველა პროდუქტი <Icon name="arrow" />
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
