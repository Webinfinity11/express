"use client";

import { MAX_QTY, useStore } from "@/context/StoreContext";
import { useCatalog } from "@/context/CatalogContext";
import { gel } from "@/lib/data";
import { Link, useT } from "@/i18n/client";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";

export function CartDrawer() {
  const { cart, cartCount, totals, setQuantity, removeFromCart, modal, openModal } = useStore();
  const t = useT();
  const close = () => openModal(null);
  const { line } = useCatalog();
  const entries = Object.entries(cart).flatMap(([id, qty]) => {
    const l = line(id);
    return l ? [[id, qty, l] as const] : [];
  });

  return (
    <Dialog open={modal === "cart"} onClose={close} className="drawer" labelledBy="cartTitle">
      <div className="drawer-header">
        <div>
          <span className="eyebrow">EXPRESS MIX</span>
          <h2 id="cartTitle">
            {t("თქვენი კალათა")} <span>({cartCount})</span>
          </h2>
        </div>
        <button className="icon-button" aria-label={t("კალათის დახურვა")} onClick={close}>
          <Icon name="close" />
        </button>
      </div>
      <div className="cart-items">
        {entries.length ? (
          entries.map(([id, qty, p]) => {
            return (
              <article className="cart-item" key={id}>
                <Link className="cart-item-image" href={p.href} onClick={close} aria-label={t("{name} — დეტალურად", { name: p.name })}>
                  <img src={p.image} alt={p.name} />
                </Link>
                <div>
                  <div className="cart-item-head">
                    <h3 className="cart-item-title">
                      {p.name}
                      {p.variantName && <small className="cart-item-variant">{p.variantName}</small>}
                    </h3>
                    <button className="cart-item-remove" aria-label={t("{name} — წაშლა", { name: p.name })} onClick={() => removeFromCart(id)}>
                      <Icon name="trash" />
                    </button>
                  </div>
                  <p className="cart-item-price">{gel(p.price * 100)}</p>
                  <div className="quantity-row">
                    <div className="quantity-control">
                      <button
                        aria-label={t("რაოდენობის შემცირება")}
                        onClick={() => (qty <= 1 ? removeFromCart(id) : setQuantity(id, qty - 1))}
                      >
                        <Icon name="minus" />
                      </button>
                      <span aria-live="polite">{qty}</span>
                      <button aria-label={t("რაოდენობის გაზრდა")} disabled={qty >= MAX_QTY} onClick={() => setQuantity(id, qty + 1)}>
                        <Icon name="plus" />
                      </button>
                    </div>
                    <span className="line-total">{gel(p.price * qty * 100)}</span>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty-state">
            <Icon name="cart" />
            <h3>{t("კალათა ჯერ ცარიელია")}</h3>
            <p>{t("აირჩიეთ თქვენთვის სასურველი ტექნიკა და დაამატეთ კალათაში.")}</p>
            <Link className="button primary" href="/products" onClick={close}>
              {t("პროდუქტების ნახვა")} <Icon name="arrow" />
            </Link>
          </div>
        )}
      </div>
      {entries.length > 0 && (
        <div className="cart-footer">
          <div className="cart-total">
            <span>{t("ჯამი")}</span>
            <strong>{gel(totals.sub)}</strong>
          </div>
          <p>{t("მიწოდების ღირებულება გამოითვლება კალათის გვერდზე.")}</p>
          <Link className="button primary full-width" href="/cart" onClick={close}>
            {t("კალათაში გადასვლა")} <Icon name="arrow" />
          </Link>
          <button className="button secondary full-width drawer-continue" onClick={close}>
            {t("შოპინგის გაგრძელება")}
          </button>
        </div>
      )}
    </Dialog>
  );
}
