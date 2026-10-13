"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "../Icon";

const SLIDES = [
  {
    image: "/images/hero-washer.webp",
    position: "50% 78%",
    alt: "სარეცხი მანქანა თანამედროვე ინტერიერში",
    label: "სარეცხი მანქანები",
    title: (
      <>
        კომფორტი
        <br />
        ყველა <span>დეტალში</span>
      </>
    ),
    description: "თანამედროვე საყოფაცხოვრებო ტექნიკა მყუდრო და ტექნოლოგიური სახლისთვის",
    href: "/products?category=washers",
  },
  {
    image: "/images/promo-kitchen.webp",
    position: "50% 60%",
    alt: "ციტრუსის საწური სამზარეულოში",
    label: "სამზარეულოს ტექნიკა",
    title: (
      <>
        ახალი დღე.
        <br />
        <span>ახალი ენერგია.</span>
      </>
    ),
    description: "თქვენი საყვარელი გემოები და მეტი კომფორტი სამზარეულოში",
    href: "/products?category=kitchen",
  },
  {
    image: "/images/promo-iron.webp",
    position: "50% 62%",
    alt: "შავი და ოქროსფერი უთო",
    label: "უთოები",
    title: (
      <>
        იდეალური ზრუნვა
        <br />
        <span>ყველა დეტალზე</span>
      </>
    ),
    description: "აღმოაჩინეთ თქვენი ახალი ყოველდღიური დამხმარე",
    href: "/products?category=irons",
  },
  {
    image: "/images/washer-2.webp",
    position: "50% 66%",
    alt: "სარეცხი მანქანა ნათელ სამრეცხაოში",
    label: "ტექნიკა სახლისთვის",
    title: (
      <>
        სუფთა სახლი.
        <br />
        <span>მეტი სიმშვიდე.</span>
      </>
    ),
    description: "ტექნიკა, რომელიც ყოველდღიურ ზრუნვას უფრო მარტივს ხდის",
    href: "/products",
  },
];

const BENEFITS = [
  { icon: "truck", title: "სწრაფი მიწოდება", text: "მთელ საქართველოში" },
  { icon: "shield", title: "ოფიციალური გარანტია", text: "ყველა პროდუქტზე" },
  { icon: "card", title: "მოსახერხებელი გადახდა", text: "ბარათით და განვადებით" },
];

export function Hero() {
  const [index, setIndex] = useState(0);
  const go = (i: number) => setIndex((i + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[index];

  return (
    <section className="hx wrap" aria-label="მთავარი შეთავაზებები" aria-roledescription="კარუსელი">
      <div className="hx-media">
        <img key={slide.image} src={slide.image} alt={slide.alt} fetchPriority="high" style={{ objectPosition: slide.position }} />
      </div>
      <div className="hx-shade" />
      <div className="hx-content">
        <span className="hx-eyebrow">ტექნიკა თქვენი სახლისთვის</span>
        <h1>{slide.title}</h1>
        <p>{slide.description}</p>
        <Link className="button primary hx-cta" href={slide.href}>
          კატალოგის ნახვა <Icon name="arrow" />
        </Link>
        <div className="hx-dots" role="group" aria-label="ბანერის არჩევა">
          {SLIDES.map((s, i) => (
            <button
              key={i}
              className={i === index ? "active" : undefined}
              aria-label={`ბანერი ${i + 1}: ${s.label}`}
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
