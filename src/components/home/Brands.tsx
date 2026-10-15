"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Brand } from "@/lib/data";
import { Icon } from "../Icon";

const brandHref = (b: string) => `/products?brand=${encodeURIComponent(b)}`;

/** ბრენდების ზოლი — ლოგო ადმინიდან; ლოგოს გარეშე ბრენდი ტექსტად ჩანს */
export function Brands({ brands }: { brands: Brand[] }) {
  const listRef = useRef<HTMLDivElement>(null);
  const scroll = (left: number) => listRef.current?.scrollBy({ left, behavior: "smooth" });
  if (!brands.length) return null;

  return (
    <section className="brands" id="brands" aria-label="ბრენდები">
      <button className="brand-arrow" aria-label="წინა ბრენდები" onClick={() => scroll(-250)}>
        <Icon name="chevron" />
      </button>
      <div className="brand-list" ref={listRef}>
        {brands.map((b) =>
          b.logo ? (
            <Link key={b.name} href={brandHref(b.name)} className="brand-logo">
              <img src={b.logo} alt={b.name} loading="lazy" />
            </Link>
          ) : (
            <Link key={b.name} href={brandHref(b.name)} className="wordmark">
              {b.name}
            </Link>
          ),
        )}
      </div>
      <button className="brand-arrow" aria-label="შემდეგი ბრენდები" onClick={() => scroll(250)}>
        <Icon name="chevron" />
      </button>
    </section>
  );
}
