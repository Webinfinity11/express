"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { ItemCard } from "@/components/ItemCard";
import { useStore } from "@/context/StoreContext";
import { BRANDS, CATEGORIES, PRODUCTS, categoryHref, categoryName, money } from "@/lib/data";

const PRICE_MAX = 2000;
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

const clampPrice = (v: string | null, fallback: number) => {
  const n = Number(v);
  return v !== null && Number.isFinite(n) ? Math.max(0, Math.min(PRICE_MAX, n)) : fallback;
};

function parse(sp: URLSearchParams): Filters {
  const category = sp.get("category") ?? "all";
  const sort = sp.get("sort") as Sort;
  return {
    category: CATEGORIES.some((c) => c.id === category) ? category : "all",
    brands: (sp.get("brand") ?? "").split("|").filter((b) => BRANDS.includes(b)),
    q: (sp.get("q") ?? "").slice(0, 100),
    min: clampPrice(sp.get("min"), 0),
    max: clampPrice(sp.get("max"), PRICE_MAX),
    sale: sp.get("sale") === "1",
    new: sp.get("new") === "1",
    favorites: sp.get("favorites") === "1",
    sort: SORTS.includes(sort) ? sort : "featured",
  };
}

function serialize(f: Filters) {
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
  const pathname = usePathname();
  const sp = useSearchParams();
  const { favorites, openModal } = useStore();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ფილტრების ერთადერთი წყარო URL-ია — ბმულები, header-ის ძიება და „უკან“ ღილაკი თავისით მუშაობს
  const f = useMemo(() => parse(new URLSearchParams(sp.toString())), [sp]);
  const update = (changes: Partial<Filters>) => {
    const qs = serialize({ ...f, ...changes });
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const reset = () => router.replace(pathname, { scroll: false });

  const list = useMemo(() => {
    const words = f.q.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const out = PRODUCTS.filter((p) => {
      const text = [p.name, p.brand, p.keywords, p.sku, categoryName(p.category)].join(" ").toLocaleLowerCase();
      return (
        (f.category === "all" || p.category === f.category) &&
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
    if (f.sort === "name") out.sort((a, b) => a.name.localeCompare(b.name, "ka"));
    return out;
  }, [f, favorites]);

  const title = f.q ? "ძიების შედეგები" : f.favorites ? "ფავორიტები" : f.sale ? "აქციები" : f.new ? "ახალი პროდუქტები" : categoryName(f.category);

  const chips: [string, string, () => void][] = [];
  if (f.category !== "all") chips.push(["category", categoryName(f.category), () => update({ category: "all" })]);
  if (f.q) chips.push(["q", "ძიება: " + f.q, () => update({ q: "" })]);
  for (const b of f.brands) chips.push(["brand:" + b, b, () => update({ brands: f.brands.filter((x) => x !== b) })]);
  if (f.min || f.max !== PRICE_MAX) chips.push(["price", `${money(f.min)}–${money(f.max)} ₾`, () => update({ min: 0, max: PRICE_MAX })]);
  for (const [k, l] of [["sale", "ფასდაკლებით"], ["new", "ახალი"], ["favorites", "ფავორიტები"]] as [Flag, string][])
    if (f[k]) chips.push([k, l, () => update({ [k]: false })]);

  const sidebar = (
    <aside className="shop-sidebar" aria-label="კატალოგის ფილტრები">
      <div className="sidebar-title">
        <h2>ფილტრები</h2>
        <button onClick={reset}>გასუფთავება</button>
      </div>
      <details className="filter-section" open>
        <summary>
          კატეგორიები <Icon name="chevron" />
        </summary>
        <div className="filter-section-body">
          <label className="filter-check">
            <input type="radio" name="category" checked={f.category === "all"} onChange={() => update({ category: "all" })} />
            <span>ყველა პროდუქტი</span>
            <span className="filter-n">{PRODUCTS.length}</span>
          </label>
          {CATEGORIES.map((c) => (
            <label className="filter-check" key={c.id}>
              <input type="radio" name="category" checked={f.category === c.id} onChange={() => update({ category: c.id })} />
              <span>{c.name}</span>
              <span className="filter-n">{PRODUCTS.filter((p) => p.category === c.id).length}</span>
            </label>
          ))}
        </div>
      </details>
      <details className="filter-section" open>
        <summary>
          ფასი <Icon name="chevron" />
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
                aria-label="მინიმალური ფასი"
                onBlur={(e) => {
                  const min = clampPrice(e.target.value, 0);
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
                aria-label="მაქსიმალური ფასი"
                onBlur={(e) => {
                  const max = clampPrice(e.target.value, PRICE_MAX);
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
            aria-label="ფასის ზედა ზღვარი"
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
          ბრენდი <Icon name="chevron" />
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
          შეთავაზებები <Icon name="chevron" />
        </summary>
        <div className="filter-section-body">
          {(
            [
              ["sale", "ფასდაკლებით"],
              ["new", "ახალი პროდუქტები"],
              ["favorites", "მხოლოდ ფავორიტები"],
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
        <strong>გჭირდებათ დახმარება?</strong>
        <p>ერთად შევარჩიოთ თქვენი ტექნიკა.</p>
        <button className="button secondary" onClick={() => openModal("info:contact")}>
          დაგვიკავშირდით <Icon name="arrow" />
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
            ტექნიკა თქვენი
            <br />
            <span>ყოველდღიურობისთვის.</span>
          </h1>
          <p>თქვენი სახლი. თქვენი არჩევანი. Express Mix.</p>
          <span className="collection-caption">
            {PRODUCTS.length} პროდუქტი <i></i> {CATEGORIES.length} კატეგორია
          </span>
        </div>
        <div className="shop-hero-photo">
          <img src="/images/hero-washer.webp" alt="სარეცხი მანქანა სახლის ინტერიერში" fetchPriority="high" />
        </div>
      </section>

      <div className="shop-categories" aria-label="კატეგორიის არჩევა">
        {CATEGORIES.map((c) => {
          const active = f.category === c.id;
          return (
            <button
              key={c.id}
              className={`shop-cat${active ? " active" : ""}`}
              aria-pressed={active}
              onClick={() => update({ category: active ? "all" : c.id })}
            >
              <img src={c.image} alt="" width={60} height={65} />
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>

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
                <Icon name="filter" /> ფილტრი
              </button>
              <label className="sort-label">
                <span className="sr-only">დალაგება</span>
                <select value={f.sort} onChange={(e) => update({ sort: e.target.value as Sort })}>
                  <option value="featured">რეკომენდებული</option>
                  <option value="price-asc">ფასი: ზრდადობით</option>
                  <option value="price-desc">ფასი: კლებადობით</option>
                  <option value="new">ჯერ ახალი</option>
                  <option value="name">დასახელებით</option>
                </select>
              </label>
              <div className="view-switch" role="group" aria-label="კატალოგის ხედი">
                {(
                  [
                    ["grid", "grid", "ბადის ხედი"],
                    ["list", "list", "სიის ხედი"],
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
                <h3>პროდუქტი ვერ მოიძებნა</h3>
                <p>შეცვალეთ საძიებო სიტყვა ან გაასუფთავეთ ფილტრები.</p>
                <button className="button primary compact" onClick={reset}>
                  ყველა პროდუქტი <Icon name="arrow" />
                </button>
              </div>
            )}
          </div>
          {list.length > 0 && (
            <div className="catalog-end">
              <span>
                ნაჩვენებია {list.length} / {list.length} პროდუქტი
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
            კომფორტი იწყება
            <br />
            <span>სწორი არჩევანით.</span>
          </h2>
        </div>
        <img src="/images/juicer.webp" alt="ციტრუსის საწური" loading="lazy" />
        <Link className="button primary" href={categoryHref("kitchen")}>
          სამზარეულოს ტექნიკა <Icon name="arrow" />
        </Link>
      </div>

      <Dialog open={filtersOpen} onClose={() => setFiltersOpen(false)} className="filter-dialog" labelledBy="mobileFilterTitle">
        <div className="filter-dialog-heading">
          <h2 id="mobileFilterTitle">ფილტრები</h2>
          <button className="icon-button" aria-label="დახურვა" onClick={() => setFiltersOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        {filtersOpen && sidebar}
        <button className="button primary full-width" onClick={() => setFiltersOpen(false)}>
          შედეგების ნახვა <Icon name="arrow" />
        </button>
      </Dialog>
    </main>
  );
}
