"use client";

import Link from "next/link";
import { useRef } from "react";
import { Icon } from "../Icon";

// დამატებითი ბრენდები ტექსტური ლოგოებით — რეალური ლოგოები შეიძლება ჩანაცვლდეს სურათებით
const MORE_BRANDS = [
  ["LG", "lg"],
  ["BEKO", "beko"],
  ["Electrolux", "electrolux"],
  ["Tefal", "tefal"],
  ["BRAUN", "braun"],
  ["gorenje", "gorenje"],
  ["indesit", "indesit"],
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
        <Link href={brandHref("Toshiba")} className="wordmark toshiba">TOSHIBA</Link>
        <Link href={brandHref("Franko")} className="wordmark franko">
          franko<span>®</span>
        </Link>
        <Link href={brandHref("Samsung")} className="wordmark samsung">SAMSUNG</Link>
        <Link href={brandHref("Bosch")} className="wordmark bosch">
          <span className="bosch-sign">H</span> BOSCH
        </Link>
        <Link href={brandHref("Philips")} className="wordmark philips">PHILIPS</Link>
        <Link href={brandHref("Kenwood")} className="wordmark kenwood">KENWOOD</Link>
        {MORE_BRANDS.map(([label, cls]) => (
          <Link key={cls} href={brandHref(label)} className={`wordmark ${cls}`}>
            {label}
          </Link>
        ))}
      </div>
      <button className="brand-arrow" aria-label="შემდეგი ბრენდები" onClick={() => scroll(250)}>
        <Icon name="chevron" />
      </button>
    </section>
  );
}
