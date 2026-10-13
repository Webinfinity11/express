"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { Icon } from "./Icon";

export function Header() {
  const router = useRouter();
  const { cartCount, favorites, openModal } = useStore();
  const [query, setQuery] = useState("");

  return (
    <header className="site-header">
      <div className="header-main wrap">
        <Link className="brand" href="/" aria-label="Express Mix — მთავარი">
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
            პროდუქტის ძიება
          </label>
          <input
            type="search"
            id="searchInput"
            placeholder="რას ეძებთ?"
            autoComplete="off"
            maxLength={100}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" aria-label="ძიება">
            <Icon name="search" />
          </button>
        </form>
        <div className="header-actions">
          <button className="header-action profile-action" onClick={() => openModal("info:account")}>
            <Icon name="user" />
            <span>შესვლა</span>
          </button>
          <button
            className="header-action"
            aria-label={`ფავორიტები: ${favorites.length} პროდუქტი`}
            onClick={() => openModal("favorites")}
          >
            <span className="icon-wrap">
              <Icon name="heart" />
              <span className="count" hidden={favorites.length === 0}>
                {favorites.length}
              </span>
            </span>
            <span>ფავორიტები</span>
          </button>
          <Link className="header-action" href="/cart" aria-label={`კალათა: ${cartCount} პროდუქტი`}>
            <span className="icon-wrap">
              <Icon name="cart" />
              <span className="count">{cartCount}</span>
            </span>
            <span>კალათა</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
