"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { ItemCard } from "@/components/ItemCard";
import { QtyInput } from "@/components/QtyInput";
import { useCatalog } from "@/context/CatalogContext";
import { useStore } from "@/context/StoreContext";
import { CITIES, discountPercent, gel, lineKey, money, type Product } from "@/lib/data";

const TABS = [
  ["description", "აღწერა"],
  ["specifications", "მახასიათებლები"],
  ["delivery", "მიწოდება"],
  ["reviews", "მიმოხილვები (0)"],
] as const;
type Tab = (typeof TABS)[number][0];

const pad = (n: number) => String(n).padStart(2, "0");

export function ProductView({ p }: { p: Product }) {
  const router = useRouter();
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
    setTab(TABS[n][0]);
    tabRefs.current[n]?.focus();
  };

  const share = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(
      () => showToast("ბმული დაკოპირებულია."),
      () => showToast(url),
    );
  };

  return (
    <main id="main" className="wrap internal-main product-page">
      <section className="p-layout" aria-label="პროდუქტის დეტალები">
        <div className="p-gallery">
          <div className="p-stage">
            <button className={`p-stage-main${index > 0 ? " scene-stage" : ""}`} aria-label="ფოტოს გადიდება" onClick={() => setZoom(true)}>
              <img
                src={gallery[index]}
                alt={p.name}
                data-product-kind={p.id}
                className={index > 0 ? "scene" : undefined}
                fetchPriority="high"
              />
            </button>
            {off > 0 && <span className="discount-badge">−{off}%</span>}
            <button className="icon-button p-zoom" aria-label="ფოტოს გადიდება" onClick={() => setZoom(true)}>
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
                aria-label={`პროდუქტის ფოტო ${i + 1}`}
                onClick={() => setIndex(i)}
              >
                <img src={g} alt={`${p.name} — ფოტო ${i + 1}`} />
              </button>
            ))}
            <span className="gallery-hint">
              <Icon name="zoom" /> დააჭირეთ გასადიდებლად
            </span>
          </div>
        </div>

        <div className="p-details">
          <div className="p-brand-row">
            <span className="p-brand">{p.brand.toUpperCase()}</span>
            {(variant?.sku || p.sku) && <span className="p-sku">SKU: {variant?.sku || p.sku}</span>}
          </div>
          <h1>{p.name}</h1>
          <div className="p-status">
            <span className={inStock ? "inline-green" : "inline-out"}>{inStock ? "მარაგშია" : "არ არის მარაგში"}</span>
            <i className="status-divider"></i>
            <button
              onClick={() => {
                setTab("reviews");
                contentRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              მიმოხილვები (0)
            </button>
          </div>
          <div className="p-pricebox">
            <div>
              <div className="p-prices">
                <strong>{gel(cur.price * 100)}</strong>
                {cur.oldPrice > cur.price && <del>{gel(cur.oldPrice * 100)}</del>}
              </div>
              <span className="demo-caption">სპეციალური ფასი</span>
            </div>
            {cur.oldPrice > cur.price && (
              <span className="saving-label">
                თქვენ ზოგავთ<strong>{gel((cur.oldPrice - cur.price) * 100)}</strong>
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
                ვარიაცია: <strong>{variant?.name}</strong>
              </span>
              <div className="p-variant-list" role="radiogroup" aria-label="ვარიაციის არჩევა">
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
                <span>ფერი:</span>
                <span className="color-swatch" style={{ "--product-color": p.tone } as React.CSSProperties}>
                  <Icon name="check" />
                </span>
                <strong>{p.color}</strong>
              </div>
            )
          )}
          <div className="p-buy-row">
            <QtyInput value={qty} onChange={setQty} label="პროდუქტის რაოდენობა" />
            <button className="button primary" disabled={!inStock} onClick={() => addToCart(key, qty)}>
              <Icon name="cart" /> {inStock ? "კალათაში დამატება" : "არ არის მარაგში"}
            </button>
          </div>
          <button
            className="button p-buy-now"
            disabled={!inStock}
            onClick={() => {
              if (addToCart(key, qty, false)) router.push("/cart");
            }}
          >
            შეიძინე ახლა <Icon name="arrow" />
          </button>
          <div className="p-secondary-actions">
            <button className="text-action" aria-pressed={favorite} onClick={() => toggleFavorite(p.id)}>
              <Icon name="heart" /> {favorite ? "ფავორიტებშია" : "ფავორიტებში დამატება"}
            </button>
            <button className="text-action" onClick={share}>
              <Icon name="send" /> გაზიარება
            </button>
          </div>
          <div className="p-service-rows">
            <button onClick={() => openModal("city")}>
              <Icon name="truck" />
              <span>
                <strong>მიწოდების პირობები</strong>
                <small>{CITIES[city]} · შეცვლა</small>
              </span>
            </button>
            <button onClick={() => openModal("info:warranty")}>
              <Icon name="shield" />
              <span>
                <strong>პროდუქტის გარანტია</strong>
                <small>პირობების ნახვა</small>
              </span>
            </button>
          </div>
        </div>
      </section>

      <section className="p-content" ref={contentRef}>
        <div className="p-tabs" role="tablist" aria-label="პროდუქტის ინფორმაცია">
          {TABS.map(([id, name], i) => (
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
              {name}
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
                <p>{p.desc}</p>
              </div>
              <div className="p-story-image">
                <img src={p.scene} alt={`${p.name} — ინტერიერის ფოტო`} loading="lazy" />
              </div>
            </article>
          )}
          {tab === "specifications" && (
            <div className="spec-table">
              {(
                [
                  ["ბრენდი", p.brand],
                  ["დასახელება", p.name],
                  ["პროდუქტის კოდი", variant?.sku || p.sku],
                  ["კატეგორია", categoryName(p.category)],
                  ...p.specs,
                  ["ფერი", variant?.name || p.color],
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
              <article className="delivery-info-card">
                <Icon name="truck" />
                <h3>კურიერით მიწოდება</h3>
                <p>
                  თბილისი — {money(ship.tbilisi)} ₾
                  <br />
                  ბათუმი — {money(ship.batumi)} ₾
                  <br />
                  სხვა რეგიონები — {money(ship.regions)} ₾
                  <br />
                  {money(ship.freeFrom)} ₾-დან — უფასოდ
                </p>
              </article>
              <article className="delivery-info-card">
                <Icon name="store" />
                <h3>თვითგატანა</h3>
                <p>{ship.pickupText}</p>
              </article>
              <article className="delivery-info-card">
                <Icon name="shield" />
                <h3>გარანტია და პირობები</h3>
                <p>{ship.warrantyText}</p>
              </article>
            </div>
          )}
          {tab === "reviews" && (
            <div className="reviews-empty">
              <Icon name="heart" />
              <div>
                <h3>ჯერ არ არის მიმოხილვა</h3>
                <p>იყავით პირველი, ვინც ამ პროდუქტს შეაფასებს.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="related-section">
        <div className="section-heading">
          <h2>შეიძლება მოგეწონოთ</h2>
          <Link className="text-link" href="/products">
            ყველა პროდუქტი <Icon name="arrow" />
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
          {cur.oldPrice > cur.price && <small>{gel(cur.oldPrice * 100)}-ის ნაცვლად</small>}
        </div>
        <button className="button primary" disabled={!inStock} onClick={() => addToCart(key, qty)}>
          <Icon name="cart" /> კალათაში დამატება
        </button>
      </div>

      <Dialog open={zoom} onClose={() => setZoom(false)} className="lightbox" label="პროდუქტის ფოტო">
        <button className="icon-button lightbox-close" aria-label="დახურვა" onClick={() => setZoom(false)}>
          <Icon name="close" />
        </button>
        {gallery.length > 1 && (
          <button className="icon-button lightbox-prev" aria-label="წინა ფოტო" onClick={() => go(index - 1)}>
            <Icon name="chevron" />
          </button>
        )}
        <img src={gallery[index]} alt={`${p.name} — ფოტო ${index + 1}`} />
        {gallery.length > 1 && (
          <button className="icon-button lightbox-next" aria-label="შემდეგი ფოტო" onClick={() => go(index + 1)}>
            <Icon name="chevron" />
          </button>
        )}
      </Dialog>
    </main>
  );
}
