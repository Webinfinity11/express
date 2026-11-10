"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useCatalog } from "@/context/CatalogContext";
import { useStore } from "@/context/StoreContext";
import { stripLang } from "@/i18n";
import { Link, useLang, useRouter, useT } from "@/i18n/client";
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
  const { content } = useCatalog();
  const [query, setQuery] = useState("");

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
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" aria-label={t("ძიება")}>
            <Icon name="search" />
          </button>
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
