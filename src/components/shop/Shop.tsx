"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { ItemCard } from "@/components/ItemCard";
import { useCatalog } from "@/context/CatalogContext";
import { useStore } from "@/context/StoreContext";
import { categoryHref, money } from "@/lib/data";
import { Link, useLang, useT } from "@/i18n/client";

const SORTS = ["featured", "price-asc", "price-desc", "new", "name"] as const;
type Sort = (typeof SORTS)[number];
type Flag = "sale" | "new" | "favorites";

type Filters = {
  category: string;
  brands: string[];
  q: string;
  min: number;
  max: number;
  sale: boolean;
  new: boolean;
  favorites: boolean;
  sort: Sort;
};

type Limits = { categories: Set<string>; brands: string[]; priceMax: number };

const clampPrice = (v: string | null, fallback: number, PRICE_MAX: number) => {
  const n = Number(v);
  return v !== null && Number.isFinite(n) ? Math.max(0, Math.min(PRICE_MAX, n)) : fallback;
};

function parse(sp: URLSearchParams, { categories, brands, priceMax: PRICE_MAX }: Limits): Filters {
  const category = sp.get("category") ?? "all";
  const sort = sp.get("sort") as Sort;
  return {
    category: categories.has(category) ? category : "all",
    brands: (sp.get("brand") ?? "").split("|").filter((b) => brands.includes(b)),
    q: (sp.get("q") ?? "").slice(0, 100),
    min: clampPrice(sp.get("min"), 0, PRICE_MAX),
    max: clampPrice(sp.get("max"), PRICE_MAX, PRICE_MAX),
    sale: sp.get("sale") === "1",
    new: sp.get("new") === "1",
    favorites: sp.get("favorites") === "1",
    sort: SORTS.includes(sort) ? sort : "featured",
  };
}

function serialize(f: Filters, PRICE_MAX: number) {
  const p = new URLSearchParams();
  if (f.category !== "all") p.set("category", f.category);
  if (f.brands.length) p.set("brand", f.brands.join("|"));
  if (f.q) p.set("q", f.q);
  if (f.min) p.set("min", String(f.min));
  if (f.max !== PRICE_MAX) p.set("max", String(f.max));
  for (const k of ["sale", "new", "favorites"] as const) if (f[k]) p.set(k, "1");
  if (f.sort !== "featured") p.set("sort", f.sort);
  return p.toString();
}

export function Shop() {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { favorites, openModal } = useStore();
  const { products: PRODUCTS, categories, categoryName, subtree } = useCatalog();
  // ფასის შკალის ზედა ზღვარი — ყველაზე ძვირი პროდუქტი, დამრგვალებული 100-მდე
  const PRICE_MAX = Math.max(100, Math.ceil(Math.max(0, ...PRODUCTS.map((p) => p.price)) / 100) * 100);
  const BRANDS = useMemo(() => [...new Set(PRODUCTS.map((p) => p.brand).filter(Boolean))].sort(), [PRODUCTS]);
  // კატეგორიის რაოდენობა ქვეკატეგორიების ჩათვლით; ცარიელი კატეგორიები ფილტრში არ ჩანს
  const counts = useMemo(
    () => new Map(categories.map((c) => [c.id, PRODUCTS.filter((p) => subtree(c.id).has(p.category)).length])),
    [categories, PRODUCTS, subtree],
  );
  const CATEGORIES = categories.filter((c) => (counts.get(c.id) ?? 0) > 0);
  const STRIP = categories.filter((c) => c.showOnHome);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  // კატეგორიების ზოლის ისრები
  const catsRef = useRef<HTMLDivElement>(null);
  const [catEdges, setCatEdges] = useState({ start: true, end: false });
  const syncCats = () => {
    const el = catsRef.current;
    if (!el) return;
    setCatEdges({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };
  useEffect(() => {
    syncCats();
    window.addEventListener("resize", syncCats);
    return () => window.removeEventListener("resize", syncCats);
  }, []);
  const scrollCats = (dir: number) => {
    const el = catsRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  // ფილტრების ერთადერთი წყარო URL-ია — ბმულები, header-ის ძიება და „უკან“ ღილაკი თავისით მუშაობს
  const f = useMemo(
    () => parse(new URLSearchParams(sp.toString()), { categories: new Set(categories.map((c) => c.id)), brands: BRANDS, priceMax: PRICE_MAX }),
    [sp, categories, BRANDS, PRICE_MAX],
  );
  const update = (changes: Partial<Filters>) => {
    const qs = serialize({ ...f, ...changes }, PRICE_MAX);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const reset = () => router.replace(pathname, { scroll: false });

  const list = useMemo(() => {
    const words = f.q.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const inCategory = f.category === "all" ? null : subtree(f.category);
    const out = PRODUCTS.filter((p) => {
      const text = [p.name, p.brand, p.keywords, p.sku, categoryName(p.category)].join(" ").toLocaleLowerCase();
      return (
        (!inCategory || inCategory.has(p.category)) &&
        (!f.brands.length || f.brands.includes(p.brand)) &&
        p.price >= f.min &&
        p.price <= f.max &&
        (!f.sale || p.oldPrice > p.price) &&
        (!f.new || p.isNew) &&
        (!f.favorites || favorites.includes(p.id)) &&
        words.every((w) => text.includes(w))
      );
    });
    if (f.sort === "price-asc") out.sort((a, b) => a.price - b.price);
    if (f.sort === "price-desc") out.sort((a, b) => b.price - a.price);
    if (f.sort === "new") out.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    if (f.sort === "name") out.sort((a, b) => a.name.localeCompare(b.name, lang));
    return out;
  }, [f, favorites, PRODUCTS, categoryName, subtree, lang]);

  const title = f.q
    ? t("ძიების შედეგები")
    : f.favorites
      ? t("ფავორიტები")
      : f.sale
        ? t("აქციები")
        : f.new
          ? t("ახალი პროდუქტები")
          : f.category === "all"
            ? t("ყველა პროდუქტი")
            : categoryName(f.category);

  const chips: [string, string, () => void][] = [];
  if (f.category !== "all") chips.push(["category", categoryName(f.category), () => update({ category: "all" })]);
  if (f.q) chips.push(["q", t("ძიება: {q}", { q: f.q }), () => update({ q: "" })]);
  for (const b of f.brands) chips.push(["brand:" + b, b, () => update({ brands: f.brands.filter((x) => x !== b) })]);
  if (f.min || f.max !== PRICE_MAX) chips.push(["price", `${money(f.min)}–${money(f.max)} ₾`, () => update({ min: 0, max: PRICE_MAX })]);
  for (const [k, l] of [["sale", t("ფასდაკლებით")], ["new", t("ახალი")], ["favorites", t("ფავორიტები")]] as [Flag, string][])
    if (f[k]) chips.push([k, l, () => update({ [k]: false })]);

  const sidebar = (
    <aside className="shop-sidebar" aria-label={t("კატალოგის ფილტრები")}>
      <div className="sidebar-title">
        <h2>{t("ფილტრები")}</h2>
        <button onClick={reset}>{t("გასუფთავება")}</button>
      </div>
      <details className="filter-section" open>
        <summary>
          {t("კატეგორიები")} <Icon name="chevron" />
        </summary>
        <div className="filter-section-body">
          <label className="filter-check">
            <input type="radio" name="category" checked={f.category === "all"} onChange={() => update({ category: "all" })} />
            <span>{t("ყველა პროდუქტი")}</span>
            <span className="filter-n">{PRODUCTS.length}</span>
          </label>
          {CATEGORIES.filter((c) => !c.parent).map((top) => {
            const subs = CATEGORIES.filter((c) => c.parent === top.id);
            const topLabel = (
              <label className="filter-check">
                <input type="radio" name="category" checked={f.category === top.id} onChange={() => update({ category: top.id })} />
                <span>{top.name}</span>
                <span className="filter-n">{counts.get(top.id)}</span>
              </label>
            );
            if (!subs.length) return <div key={top.id}>{topLabel}</div>;
            return (
              <details className="filter-tree" key={top.id} open={f.category === top.id || subs.some((s) => s.id === f.category)}>
                <summary>
                  {topLabel}
                </summary>
                {subs.map((c) => (
                  <label className="filter-check filter-sub" key={c.id}>
                    <input type="radio" name="category" checked={f.category === c.id} onChange={() => update({ category: c.id })} />
                    <span>{c.name}</span>
                    <span className="filter-n">{counts.get(c.id)}</span>
                  </label>
                ))}
              </details>
            );
          })}
        </div>
      </details>
      <details className="filter-section" open>
        <summary>
          {t("ფასი")} <Icon name="chevron" />
        </summary>
        <div className="filter-section-body">
          <div className="price-fields">
            <label>
              <input
                type="number"
                min={0}
                max={PRICE_MAX}
                defaultValue={f.min}
                key={"min" + f.min}
                aria-label={t("მინიმალური ფასი")}
                onBlur={(e) => {
                  const min = clampPrice(e.target.value, 0, PRICE_MAX);
                  update({ min, max: Math.max(min, f.max) });
                }}
              />
              <span>₾</span>
            </label>
            <label>
              <input
                type="number"
                min={0}
                max={PRICE_MAX}
                defaultValue={f.max}
                key={"max" + f.max}
                aria-label={t("მაქსიმალური ფასი")}
                onBlur={(e) => {
                  const max = clampPrice(e.target.value, PRICE_MAX, PRICE_MAX);
                  update({ max, min: Math.min(max, f.min) });
                }}
              />
              <span>₾</span>
            </label>
          </div>
          <input
            className="price-range"
            type="range"
            min={0}
            max={PRICE_MAX}
            step={10}
            value={f.max}
            aria-label={t("ფასის ზედა ზღვარი")}
            onChange={(e) => {
              const max = Number(e.target.value);
              update({ max, min: Math.min(max, f.min) });
            }}
          />
          <div className="price-range-labels">
            <span>0 ₾</span>
            <span>{money(PRICE_MAX)} ₾</span>
          </div>
        </div>
      </details>
      <details className="filter-section" id="brandFilters" open>
        <summary>
          {t("ბრენდი")} <Icon name="chevron" />
        </summary>
        <div className="filter-section-body">
          {BRANDS.map((b) => (
            <label className="filter-check" key={b}>
              <input
                type="checkbox"
                checked={f.brands.includes(b)}
                onChange={(e) => update({ brands: e.target.checked ? [...f.brands, b] : f.brands.filter((x) => x !== b) })}
              />
              <span>{b}</span>
              <span className="filter-n">{PRODUCTS.filter((p) => p.brand === b).length}</span>
            </label>
          ))}
        </div>
      </details>
      <details className="filter-section" open>
        <summary>
          {t("შეთავაზებები")} <Icon name="chevron" />
        </summary>
        <div className="filter-section-body">
          {(
            [
              ["sale", t("ფასდაკლებით")],
              ["new", t("ახალი პროდუქტები")],
              ["favorites", t("მხოლოდ ფავორიტები")],
            ] as [Flag, string][]
          ).map(([k, l]) => (
            <label className="filter-check" key={k}>
              <input type="checkbox" checked={f[k]} onChange={(e) => update({ [k]: e.target.checked })} />
              <span>{l}</span>
            </label>
          ))}
        </div>
      </details>
      <div className="filter-help">
        <Icon name="headphones" />
        <strong>{t("გჭირდებათ დახმარება?")}</strong>
        <p>{t("ერთად შევარჩიოთ თქვენი ტექნიკა.")}</p>
        <button className="button secondary" onClick={() => openModal("info:contact")}>
          {t("დაგვიკავშირდით")} <Icon name="arrow" />
        </button>
      </div>
    </aside>
  );

  return (
    <main id="main" className="wrap internal-main shop-page">
      <section className="shop-hero">
        <div className="shop-hero-copy">
          <span className="eyebrow">HOME &amp; KITCHEN / THE COLLECTION</span>
          <h1>
            {t("ტექნიკა თქვენი")}
            <br />
            <span>{t("ყოველდღიურობისთვის.")}</span>
          </h1>
          <p>{t("თქვენი სახლი. თქვენი არჩევანი. Express Mix.")}</p>
          <span className="collection-caption">
            {t("{n} პროდუქტი", { n: PRODUCTS.length })} <i></i> {t("{n} კატეგორია", { n: STRIP.length })}
          </span>
        </div>
        <div className="shop-hero-photo">
          <img src="/images/hero-washer.webp" alt={t("სარეცხი მანქანა სახლის ინტერიერში")} fetchPriority="high" />
        </div>
      </section>

      <div className="catalog-layout">
        <div id="filterHome">{sidebar}</div>
        <section className="catalog-results" aria-labelledby="catalogTitle">
          <div className="catalog-toolbar">
            <div>
              <span className="eyebrow small-eyebrow">EXPLORE EXPRESS MIX</span>
              <h2 id="catalogTitle">
                {title} <span>{list.length}</span>
              </h2>
            </div>
            <div className="sort-tools">
              <button className="button secondary mobile-filter-button" onClick={() => setFiltersOpen(true)}>
                <Icon name="filter" /> {t("ფილტრი")}
              </button>
              <label className="sort-label">
                <span className="sr-only">{t("დალაგება")}</span>
                <select value={f.sort} onChange={(e) => update({ sort: e.target.value as Sort })}>
                  <option value="featured">{t("რეკომენდებული")}</option>
                  <option value="price-asc">{t("ფასი: ზრდადობით")}</option>
                  <option value="price-desc">{t("ფასი: კლებადობით")}</option>
                  <option value="new">{t("ჯერ ახალი")}</option>
                  <option value="name">{t("დასახელებით")}</option>
                </select>
              </label>
              <div className="view-switch" role="group" aria-label={t("კატალოგის ხედი")}>
                {(
                  [
                    ["grid", "grid", t("ბადის ხედი")],
                    ["list", "list", t("სიის ხედი")],
                  ] as const
                ).map(([v, icon, label]) => (
                  <button
                    key={v}
                    className={view === v ? "active" : undefined}
                    aria-pressed={view === v}
                    aria-label={label}
                    onClick={() => setView(v)}
                  >
                    <Icon name={icon} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          {chips.length > 0 && (
            <div className="active-filters">
              {chips.map(([k, l, remove]) => (
                <button key={k} className="filter-chip" onClick={remove}>
                  {l} <Icon name="close" />
                </button>
              ))}
            </div>
          )}
          <div className={`shop-product-grid${view === "list" ? " list-view" : ""}`} aria-live="polite">
            {list.length ? (
              list.map((p) => <ItemCard key={p.id} p={p} />)
            ) : (
              <div className="empty-state">
                <Icon name="search" />
                <h3>{t("პროდუქტი ვერ მოიძებნა")}</h3>
                <p>{t("შეცვალეთ საძიებო სიტყვა ან გაასუფთავეთ ფილტრები.")}</p>
                <button className="button primary compact" onClick={reset}>
                  {t("ყველა პროდუქტი")} <Icon name="arrow" />
                </button>
              </div>
            )}
          </div>
          {list.length > 0 && (
            <div className="catalog-end">
              <span>
                {t("ნაჩვენებია {n} / {total} პროდუქტი", { n: list.length, total: list.length })}
              </span>
              <span className="end-line">
                <i></i>
              </span>
            </div>
          )}
        </section>
      </div>

      <div className="shop-bottom-banner">
        <div>
          <span className="eyebrow">LESS HOUSEWORK. MORE LIFE.</span>
          <h2>
            {t("კომფორტი იწყება")}
            <br />
            <span>{t("სწორი არჩევანით.")}</span>
          </h2>
        </div>
        <img src="/images/juicer.webp" alt={t("ციტრუსის საწური")} loading="lazy" />
        <Link className="button primary" href={categoryHref("kitchen")}>
          {t("სამზარეულოს ტექნიკა")} <Icon name="arrow" />
        </Link>
      </div>

      <Dialog open={filtersOpen} onClose={() => setFiltersOpen(false)} className="filter-dialog" labelledBy="mobileFilterTitle">
        <div className="filter-dialog-heading">
          <h2 id="mobileFilterTitle">{t("ფილტრები")}</h2>
          <button className="icon-button" aria-label={t("დახურვა")} onClick={() => setFiltersOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        {filtersOpen && sidebar}
        <button className="button primary full-width" onClick={() => setFiltersOpen(false)}>
          {t("შედეგების ნახვა")} <Icon name="arrow" />
        </button>
      </Dialog>
    </main>
  );
}
