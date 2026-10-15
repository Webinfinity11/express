"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/data";
import { Icon } from "../Icon";

// kind: მობილურზე რამდენი ბარათი ჩანს (popular — 6, sale — 4)
type Props = { id: string; kind?: "popular" | "sale"; title: string; href: string; products: Product[] };

export function ProductCarousel({ id, kind = "popular", title, href, products }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sync]);

  // ერთ დაჭერაზე გადაადგილდება ერთი „გვერდი“ — რამდენი ბარათიც ეტევა
  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  return (
    <section className={`products-section carousel-section carousel-${kind}`} aria-labelledby={`${id}-title`}>
      <div className="section-heading">
        <h2 id={`${id}-title`}>{title}</h2>
        <div className="carousel-head-actions">
          <Link className="text-link" href={href}>
            ყველას ნახვა <Icon name="arrow" />
          </Link>
          <div className="carousel-arrows">
            <button className="carousel-arrow prev" aria-label="წინა" disabled={edges.start} onClick={() => scroll(-1)}>
              <Icon name="chevron" />
            </button>
            <button className="carousel-arrow" aria-label="შემდეგი" disabled={edges.end} onClick={() => scroll(1)}>
              <Icon name="chevron" />
            </button>
          </div>
        </div>
      </div>
      <div className="carousel-track" ref={trackRef} onScroll={sync}>
        {products.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
      {/* მობილურზე ბადის ქვეშ */}
      <Link className="button secondary carousel-more" href={href}>
        ყველას ნახვა <Icon name="arrow" />
      </Link>
    </section>
  );
}
