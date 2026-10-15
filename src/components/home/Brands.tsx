"use client";

import Link from "next/link";
import { useRef } from "react";
import { Icon } from "../Icon";

// ბრენდების ლოგოები — public/images/brands (Wikimedia Commons); Franko-ს ლოგო არ მოიძებნა, რჩება ტექსტად
const LOGOS = [
  ["Toshiba", "toshiba"],
  ["Samsung", "samsung"],
  ["Bosch", "bosch"],
  ["Philips", "philips"],
  ["Kenwood", "kenwood"],
  ["LG", "lg"],
  ["Beko", "beko"],
  ["Electrolux", "electrolux"],
  ["Tefal", "tefal"],
  ["Braun", "braun"],
  ["Gorenje", "gorenje"],
  ["Indesit", "indesit"],
  ["Midea", "midea"],
  ["De’Longhi", "delonghi"],
  ["Xiaomi", "xiaomi"],
] as const;

const brandHref = (b: string) => `/products?brand=${encodeURIComponent(b)}`;

export function Brands() {
  const listRef = useRef<HTMLDivElement>(null);
  const scroll = (left: number) => listRef.current?.scrollBy({ left, behavior: "smooth" });

  return (
    <section className="brands" id="brands" aria-label="ბრენდები">
      <button className="brand-arrow" aria-label="წინა ბრენდები" onClick={() => scroll(-250)}>
        <Icon name="chevron" />
      </button>
      <div className="brand-list" ref={listRef}>
        <Link href={brandHref("Toshiba")} className="brand-logo">
          <img src="/images/brands/toshiba.svg" alt="Toshiba" loading="lazy" />
        </Link>
        <Link href={brandHref("Franko")} className="wordmark franko">
          franko<span>®</span>
        </Link>
        {LOGOS.slice(1).map(([label, file]) => (
          <Link key={file} href={brandHref(label)} className={`brand-logo ${file}`}>
            <img src={`/images/brands/${file}.svg`} alt={label} loading="lazy" />
          </Link>
        ))}
      </div>
      <button className="brand-arrow" aria-label="შემდეგი ბრენდები" onClick={() => scroll(250)}>
        <Icon name="chevron" />
      </button>
    </section>
  );
}
