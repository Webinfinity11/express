"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Content } from "@/lib/content-schema";
import { Icon } from "../Icon";

const BENEFIT_ICONS = ["truck", "shield", "card"];

export function Hero({ home }: { home: Content["home"] }) {
  const SLIDES = home.slides.length ? home.slides : [{ image: "", title: "", title2: "", accent: "", text: "", href: "/products" }];
  const BENEFITS = home.heroBenefits.slice(0, 3).map((b, i) => ({ ...b, icon: BENEFIT_ICONS[i] }));
  const [index, setIndex] = useState(0);
  const go = (i: number) => setIndex((i + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[index];
  // მობილურზე თითის გასმით გადართვა
  const touchX = useRef<number | null>(null);

  return (
    <section
      className="hx wrap"
      aria-label="მთავარი შეთავაზებები"
      aria-roledescription="კარუსელი"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="hx-media">
        {slide.image && <img key={slide.image} src={slide.image} alt="" fetchPriority="high" />}
      </div>
      <div className="hx-shade" />
      <div className="hx-content">
        <span className="hx-eyebrow">{home.heroEyebrow}</span>
        <h1>
          {slide.title}
          {(slide.title2 || slide.accent) && <br />}
          {slide.title2} {slide.accent && <span>{slide.accent}</span>}
        </h1>
        <p>{slide.text}</p>
        <Link className="button primary hx-cta" href={slide.href || "/products"}>
          {home.heroButton} <Icon name="arrow" />
        </Link>
        <div className="hx-dots" role="group" aria-label="ბანერის არჩევა">
          {SLIDES.map((s, i) => (
            <button
              key={i}
              className={i === index ? "active" : undefined}
              aria-label={`ბანერი ${i + 1}: ${s.title} ${s.accent}`}
              aria-pressed={i === index}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>
      <div className="hx-arrows">
        <button className="round-button prev" aria-label="წინა ბანერი" onClick={() => go(index - 1)}>
          <Icon name="chevron" />
        </button>
        <button className="round-button" aria-label="შემდეგი ბანერი" onClick={() => go(index + 1)}>
          <Icon name="chevron" />
        </button>
      </div>
      <div className="hx-benefits">
        {BENEFITS.map((b) => (
          <div className="hx-benefit" key={b.icon}>
            <svg aria-hidden="true">
              <use href={`#i-${b.icon}`} />
            </svg>
            <span>
              {b.title}
              <br />
              {b.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
