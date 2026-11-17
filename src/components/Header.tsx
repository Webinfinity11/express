"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useCatalog } from "@/context/CatalogContext";
import { useStore } from "@/context/StoreContext";
import { stripLang } from "@/i18n";
import { Link, useLang, useRouter, useT } from "@/i18n/client";
import { categoryHref, productHref } from "@/lib/data";
import { Icon } from "./Icon";

/** ენის გადამრთველი — იგივე გვერდი მეორე ენაზე (სრული გადატვირთვით) */
function LangSwitchLinks() {
  const lang = useLang();
  const pathname = usePathname() || "/";
  const search = useSearchParams()?.toString();
  const path = stripLang(pathname);
  const qs = search ? `?${search}` : "";
  const ka = path + qs;
  const en = (path === "/" ? "/en" : `/en${path}`) + qs;
  return (
    <>
      <a href={ka} hrefLang="ka" lang="ka" aria-current={lang === "ka" ? "true" : undefined} className={lang === "ka" ? "active" : undefined}>
        KA
      </a>
      <span aria-hidden="true">|</span>
      <a href={en} hrefLang="en" lang="en" aria-current={lang === "en" ? "true" : undefined} className={lang === "en" ? "active" : undefined}>
        EN
      </a>
    </>
  );
}

function LangSwitch() {
  const lang = useLang();
  const t = useT();
  return (
    <div className="lang-switch" role="group" aria-label={t("ენის არჩევა")}>
      <Suspense
        fallback={
          <>
            <span className={lang === "ka" ? "active" : undefined}>KA</span>
            <span aria-hidden="true">|</span>
            <span className={lang === "en" ? "active" : undefined}>EN</span>
          </>
        }
      >
        <LangSwitchLinks />
      </Suspense>
    </div>
  );
}

export function Header() {
  const router = useRouter();
  const t = useT();
  const { cartCount, favorites, openModal } = useStore();
  const { content, products, categories, categoryName } = useCatalog();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const suggestions = useMemo(() => {
    const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const match = (text: string) => words.every((w) => text.toLocaleLowerCase().includes(w));
    const cats = categories.filter((c) => match(c.name)).slice(0, 4).map((c) => ({ key: "c" + c.id, label: c.name, sub: t("კატეგორია"), href: categoryHref(c.id), image: "" }));
    const prods = products
      .filter((p) => match([p.name, p.brand, p.sku].join(" ")))
      .slice(0, 6)
      .map((p) => ({ key: "p" + p.id, label: p.name, sub: categoryName(p.category), href: productHref(p), image: p.image }));
    return [...cats, ...prods];
  }, [query, products, categories, categoryName, t]);
  const go = (href: string) => {
    setOpen(false);
    setActive(-1);
    router.push(href);
  };

  return (
    <header className="site-header">
      <div className="header-main wrap">
        <Link className="brand" href="/" aria-label={t("Express Mix — მთავარი")}>
          <img src="/images/logo.webp" alt="Express Mix — Home & Kitchen" width={459} height={191} />
        </Link>
        <form
          className="search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (active >= 0 && suggestions[active]) return go(suggestions[active].href);
            setOpen(false);
            const q = query.trim();
            router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
          }}
        >
          <label className="sr-only" htmlFor="searchInput">
            {t("პროდუქტის ძიება")}
          </label>
          <input
            type="search"
            id="searchInput"
            placeholder={content.header.searchPlaceholder}
            autoComplete="off"
            maxLength={100}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              else if (e.key === "ArrowDown" && suggestions.length) (e.preventDefault(), setOpen(true), setActive((a) => (a + 1) % suggestions.length));
              else if (e.key === "ArrowUp" && suggestions.length) (e.preventDefault(), setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1)));
            }}
          />
          <button type="submit" aria-label={t("ძიება")}>
            <Icon name="search" />
          </button>
          {open && suggestions.length > 0 && (
            <ul className="search-suggest" role="listbox">
              {suggestions.map((x, i) => (
                <li key={x.key} role="option" aria-selected={i === active}>
                  <a
                    href={x.href}
                    className={i === active ? "active" : undefined}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      go(x.href);
                    }}
                  >
                    {x.image ? <img src={x.image} alt="" width={36} height={36} /> : <span className="ss-ico"><Icon name="search" /></span>}
                    <span className="ss-text"><b>{x.label}</b><small>{x.sub}</small></span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </form>
        <div className="header-actions">
          <LangSwitch />
          <button
            className="header-action"
            aria-label={t("ფავორიტები: {n} პროდუქტი", { n: favorites.length })}
            onClick={() => openModal("favorites")}
          >
            <span className="icon-wrap">
              <Icon name="heart" />
              <span className="count" hidden={favorites.length === 0}>
                {favorites.length}
              </span>
            </span>
            <span>{t("ფავორიტები")}</span>
          </button>
          <Link className="header-action" href="/cart" aria-label={t("კალათა: {n} პროდუქტი", { n: cartCount })}>
            <span className="icon-wrap">
              <Icon name="cart" />
              <span className="count">{cartCount}</span>
            </span>
            <span>{t("კალათა")}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
