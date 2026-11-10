"use client";

import { Link, useRouter, useT } from "@/i18n/client";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { ItemCard } from "@/components/ItemCard";
import { QtyInput } from "@/components/QtyInput";
import { useCatalog } from "@/context/CatalogContext";
import { useStore } from "@/context/StoreContext";
import { CITIES, discountPercent, gel, lineKey, money, type Product } from "@/lib/data";

const TABS = ["description", "specifications", "delivery", "reviews"] as const;
type Tab = (typeof TABS)[number];

const pad = (n: number) => String(n).padStart(2, "0");

export function ProductView({ p }: { p: Product }) {
  const router = useRouter();
  const t = useT();
  const tabNames: Record<Tab, string> = {
    description: t("აღწერა"),
    specifications: t("მახასიათებლები"),
    delivery: t("მიწოდება"),
    reviews: t("მიმოხილვები ({n})", { n: 0 }),
  };
  const { addToCart, isFavorite, toggleFavorite, city, openModal, showToast } = useStore();
  const { products, categoryName, content } = useCatalog();
  const ship = content.shipping;
  // ვარიაცია (ფერი): ფასი, SKU, მარაგი და მთავარი ფოტო მისგან მოდის
  const [vid, setVid] = useState(p.variants.find((v) => v.inStock)?.id ?? p.variants[0]?.id ?? null);
  const variant = p.variants.find((v) => v.id === vid) ?? null;
  const cur = variant ?? p;
  const inStock = variant ? variant.inStock : p.inStock;
  const key = lineKey(p.id, variant?.id);
  const [index, setIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>("description");
  const [zoom, setZoom] = useState(false);
  const contentRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const gallery = variant?.image ? [variant.image, ...p.gallery.filter((g) => g !== variant.image)] : p.gallery;
  const go = (n: number) => setIndex((n + gallery.length) % gallery.length);
  const off = discountPercent(cur);
  const favorite = isFavorite(p.id);
  const [first, ...rest] = p.subtitle.split(". ");

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => (i + (e.key === "ArrowRight" ? 1 : -1) + gallery.length) % gallery.length);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoom, gallery.length]);

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const n =
      e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    setTab(TABS[n]);
    tabRefs.current[n]?.focus();
  };

  const share = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(
      () => showToast(t("ბმული დაკოპირებულია.")),
      () => showToast(url),
    );
  };

  return (
    <main id="main" className="wrap internal-main product-page">
      <section className="p-layout" aria-label={t("პროდუქტის დეტალები")}>
        <div className="p-gallery">
          <div className="p-stage">
            <button className={`p-stage-main${index > 0 ? " scene-stage" : ""}`} aria-label={t("ფოტოს გადიდება")} onClick={() => setZoom(true)}>
              <img
                src={gallery[index]}
                alt={p.name}
                data-product-kind={p.id}
                className={index > 0 ? "scene" : undefined}
                fetchPriority="high"
              />
            </button>
            {off > 0 && <span className="discount-badge">−{off}%</span>}
            <button className="icon-button p-zoom" aria-label={t("ფოტოს გადიდება")} onClick={() => setZoom(true)}>
              <Icon name="zoom" />
            </button>
            <span className="gallery-wordmark">{p.brand.toUpperCase()}</span>
            <span className="gallery-count">
              {pad(index + 1)} / {pad(gallery.length)}
            </span>
          </div>
          <div className="p-thumbnails">
            {gallery.map((g, i) => (
              <button
                key={g}
                className={`p-thumb${i ? " scene-thumb" : ""}${i === index ? " active" : ""}`}
                aria-pressed={i === index}
                aria-label={t("პროდუქტის ფოტო {n}", { n: i + 1 })}
                onClick={() => setIndex(i)}
              >
                <img src={g} alt={t("{name} — ფოტო {n}", { name: p.name, n: i + 1 })} />
              </button>
            ))}
            <span className="gallery-hint">
              <Icon name="zoom" /> {t("დააჭირეთ გასადიდებლად")}
            </span>
          </div>
        </div>

        <div className="p-details">
          <div className="p-brand-row">
            {p.brandLogo ? (
              <img className="p-brand-logo" src={p.brandLogo} alt={p.brand} />
            ) : (
              <span className="p-brand">{p.brand.toUpperCase()}</span>
            )}
            {(variant?.sku || p.sku) && <span className="p-sku">SKU: {variant?.sku || p.sku}</span>}
          </div>
          <h1>{p.name}</h1>
          <div className="p-status">
            <span className={inStock ? "inline-green" : "inline-out"}>{inStock ? t("მარაგშია") : t("არ არის მარაგში")}</span>
            <i className="status-divider"></i>
            <button
              onClick={() => {
                setTab("reviews");
                contentRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {t("მიმოხილვები ({n})", { n: 0 })}
            </button>
          </div>
          <div className="p-pricebox">
            <div>
              <div className="p-prices">
                <strong>{gel(cur.price * 100)}</strong>
                {cur.oldPrice > cur.price && <del>{gel(cur.oldPrice * 100)}</del>}
              </div>
              <span className="demo-caption">{t("სპეციალური ფასი")}</span>
            </div>
            {cur.oldPrice > cur.price && (
              <span className="saving-label">
                {t("თქვენ ზოგავთ")}<strong>{gel((cur.oldPrice - cur.price) * 100)}</strong>
              </span>
            )}
          </div>
          <dl className="p-mini-specs">
            {p.specs.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {p.variants.length > 0 ? (
            <div className="p-variants">
              <span className="p-variants-label">
                {t("ვარიაცია:")} <strong>{variant?.name}</strong>
              </span>
              <div className="p-variant-list" role="radiogroup" aria-label={t("ვარიაციის არჩევა")}>
                {p.variants.map((v) => {
                  const pick = () => {
                    setVid(v.id);
                    setIndex(0);
                  };
                  return v.colorHex ? (
                    <button
                      key={v.id}
                      role="radio"
                      aria-checked={v.id === vid}
                      aria-label={v.name}
                      title={v.name}
                      className={`color-swatch variant-swatch${v.id === vid ? " active" : ""}${v.inStock ? "" : " out"}`}
                      style={{ "--product-color": v.colorHex } as React.CSSProperties}
                      onClick={pick}
                    >
                      {v.id === vid && <Icon name="check" />}
                    </button>
                  ) : (
                    <button
                      key={v.id}
                      role="radio"
                      aria-checked={v.id === vid}
                      className={`variant-pill${v.id === vid ? " active" : ""}${v.inStock ? "" : " out"}`}
                      onClick={pick}
                    >
                      {v.name}
                      {v.price !== p.price && <small>{money(v.price)} ₾</small>}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            p.color && (
              <div className="p-color">
                <span>{t("ფერი:")}</span>
                <span className="color-swatch" style={{ "--product-color": p.tone } as React.CSSProperties}>
                  <Icon name="check" />
                </span>
                <strong>{p.color}</strong>
              </div>
            )
          )}
          <div className="p-buy-row">
            <QtyInput value={qty} onChange={setQty} label={t("პროდუქტის რაოდენობა")} />
            <button className="button primary" disabled={!inStock} onClick={() => addToCart(key, qty)}>
              <Icon name="cart" /> {inStock ? t("კალათაში დამატება") : t("არ არის მარაგში")}
            </button>
          </div>
          <button
            className="button p-buy-now"
            disabled={!inStock}
            onClick={() => {
              if (addToCart(key, qty, false)) router.push("/cart");
            }}
          >
            {t("შეიძინე ახლა")} <Icon name="arrow" />
          </button>
          <div className="p-secondary-actions">
            <button className="text-action" aria-pressed={favorite} onClick={() => toggleFavorite(p.id)}>
              <Icon name="heart" /> {favorite ? t("ფავორიტებშია") : t("ფავორიტებში დამატება")}
            </button>
            <button className="text-action" onClick={share}>
              <Icon name="send" /> {t("გაზიარება")}
            </button>
          </div>
          <div className="p-service-rows">
            <button onClick={() => openModal("city")}>
              <Icon name="truck" />
              <span>
                <strong>{t("მიწოდების პირობები")}</strong>
                <small>
                  {t(CITIES[city])} · {t("შეცვლა")}
                </small>
              </span>
            </button>
            <button onClick={() => openModal("info:warranty")}>
              <Icon name="shield" />
              <span>
                <strong>{t("პროდუქტის გარანტია")}</strong>
                <small>{t("პირობების ნახვა")}</small>
              </span>
            </button>
          </div>
        </div>
      </section>

      <section className="p-content" ref={contentRef}>
        <div className="p-tabs" role="tablist" aria-label={t("პროდუქტის ინფორმაცია")}>
          {TABS.map((id, i) => (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => setTab(id)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {tabNames[id]}
            </button>
          ))}
        </div>
        <div className="p-tab-panel" role="tabpanel" tabIndex={0} id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "description" && (
            <article className="p-story">
              <div className="p-story-copy">
                <span className="eyebrow">MADE FOR YOUR EVERYDAY</span>
                <h2>
                  {rest.length ? (
                    <>
                      {first}.
                      <br />
                      <span>{rest.join(". ")}</span>
                    </>
                  ) : (
                    p.subtitle
                  )}
                </h2>
                <p style={{ whiteSpace: "pre-line" }}>{p.desc}</p>
              </div>
              <div className="p-story-image">
                <img src={p.scene} alt={t("{name} — ინტერიერის ფოტო", { name: p.name })} loading="lazy" />
              </div>
            </article>
          )}
          {tab === "specifications" && (
            <div className="spec-table">
              {(
                [
                  [t("ბრენდი"), p.brand],
                  [t("დასახელება"), p.name],
                  [t("პროდუქტის კოდი"), variant?.sku || p.sku],
                  [t("კატეგორია"), categoryName(p.category)],
                  ...p.specs,
                  [t("ფერი"), variant?.name || p.color],
                ] as [string, string][]
              )
                .filter(([, v]) => v)
                .map(([k, v]) => (
                <div key={k}>
                  <span>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          )}
          {tab === "delivery" && (
            <div className="delivery-panel">
              {p.ship && (
                <article className="delivery-info-card">
                  <Icon name="truck" />
                  <h3>{t("კურიერით მიწოდება")}</h3>
                  <p>
                    {t("თბილისი: {price} ₾", { price: money(p.ship.tbilisi) })}
                    <br />
                    {t("რეგიონები: {price} ₾", { price: money(p.ship.regions) })}
                  </p>
                </article>
              )}
              <article className="delivery-info-card">
                <Icon name="store" />
                <h3>{t("თვითგატანა")}</h3>
                <p>{ship.pickupText}</p>
              </article>
              <article className="delivery-info-card">
                <Icon name="shield" />
                <h3>{t("გარანტია და პირობები")}</h3>
                <p>{ship.warrantyText}</p>
              </article>
            </div>
          )}
          {tab === "reviews" && (
            <div className="reviews-empty">
              <Icon name="heart" />
              <div>
                <h3>{t("ჯერ არ არის მიმოხილვა")}</h3>
                <p>{t("იყავით პირველი, ვინც ამ პროდუქტს შეაფასებს.")}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="related-section">
        <div className="section-heading">
          <h2>{t("შეიძლება მოგეწონოთ")}</h2>
          <Link className="text-link" href="/products">
            {t("ყველა პროდუქტი")} <Icon name="arrow" />
          </Link>
        </div>
        <div className="related-grid">
          {[
            ...products.filter((x) => x.id !== p.id && x.category === p.category),
            ...products.filter((x) => x.id !== p.id && x.category !== p.category),
          ]
            .slice(0, 4)
            .map((x) => (
              <ItemCard key={x.id} p={x} />
            ))}
        </div>
      </section>

      <div className="mobile-buy-bar">
        <div>
          <strong>{gel(cur.price * 100)}</strong>
          {cur.oldPrice > cur.price && <small>{t("{price}-ის ნაცვლად", { price: gel(cur.oldPrice * 100) })}</small>}
        </div>
        <button className="button primary" disabled={!inStock} onClick={() => addToCart(key, qty)}>
          <Icon name="cart" /> {t("კალათაში დამატება")}
        </button>
      </div>

      <Dialog open={zoom} onClose={() => setZoom(false)} className="lightbox" label={t("პროდუქტის ფოტო")}>
        <button className="icon-button lightbox-close" aria-label={t("დახურვა")} onClick={() => setZoom(false)}>
          <Icon name="close" />
        </button>
        {gallery.length > 1 && (
          <button className="icon-button lightbox-prev" aria-label={t("წინა ფოტო")} onClick={() => go(index - 1)}>
            <Icon name="chevron" />
          </button>
        )}
        <img src={gallery[index]} alt={t("{name} — ფოტო {n}", { name: p.name, n: index + 1 })} />
        {gallery.length > 1 && (
          <button className="icon-button lightbox-next" aria-label={t("შემდეგი ფოტო")} onClick={() => go(index + 1)}>
            <Icon name="chevron" />
          </button>
        )}
      </Dialog>
    </main>
  );
}
