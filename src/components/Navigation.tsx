"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONTACT } from "@/lib/contact";
import { MENU } from "@/lib/menu";
import { Icon } from "./Icon";

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("large");
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const canHover = () => window.matchMedia("(hover: hover)").matches;
  // კურსორით: ღილაკზე მიტანისას იხსნება, გატანისას მცირე დაყოვნებით იხურება
  const hoverOpen = () => {
    if (!canHover()) return;
    clearTimeout(hoverTimer.current);
    setOpen(true);
  };
  const hoverClose = () => {
    if (!canHover()) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(false), 180);
  };
  const section = MENU.find((m) => m.id === active) ?? MENU[0];
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !toggleRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <nav className="navigation" aria-label="მთავარი ნავიგაცია">
      <div className="nav-inner wrap">
        <button
          ref={toggleRef}
          className="catalog-toggle"
          aria-expanded={open}
          aria-controls="megaMenu"
          onClick={() => setOpen((o) => !o)}
          onMouseEnter={hoverOpen}
          onMouseLeave={hoverClose}
        >
          <Icon name="menu" />
          <span>კატეგორიები</span>
          <Icon name="chevron" className="small down" />
        </button>
        <div className="nav-links">
          <Link href="/products" aria-current={pathname === "/products" ? "page" : undefined}>
            მაღაზია
          </Link>
          <Link href="/products?sale=1">
            აქციები <span className="nav-dot"></span>
          </Link>
          <Link href="/products?new=1">ახალი პროდუქტები</Link>
          <Link href="/#brands">ბრენდები</Link>
          <Link href="/about" aria-current={pathname === "/about" ? "page" : undefined}>
            ჩვენ შესახებ
          </Link>
          <Link href="/contact" aria-current={pathname === "/contact" ? "page" : undefined}>
            კონტაქტი
          </Link>
        </div>
        <a className="nav-contact" href={CONTACT.phoneHref}>
          <Icon name="phone" />
          <span>{CONTACT.phone}</span>
        </a>
        <div className="mega-menu" id="megaMenu" ref={menuRef} hidden={!open} onMouseEnter={hoverOpen} onMouseLeave={hoverClose}>
          <ul className="mega-sections">
            {MENU.map((m) => (
              <li key={m.id}>
                <Link
                  className={`mega-section${m.id === section.id ? " active" : ""}`}
                  href={m.href}
                  onMouseEnter={() => setActive(m.id)}
                  onFocus={() => setActive(m.id)}
                  onClick={(e) => {
                    // სენსორულ ეკრანზე პირველი შეხება ქვეკატეგორიებს აჩვენებს
                    if (!canHover() && m.id !== section.id) {
                      e.preventDefault();
                      setActive(m.id);
                    } else close();
                  }}
                >
                  <img src={m.image} alt="" width={34} height={36} />
                  <span>{m.name}</span>
                  <Icon name="chevron" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mega-panel">
            <div className="mega-panel-head">
              <h3>{section.name}</h3>
              <Link className="text-link" href={section.href} onClick={close}>
                ყველას ნახვა <Icon name="arrow" />
              </Link>
            </div>
            <div className="mega-groups">
              {section.groups.map((g) => (
                <div className="mega-group" key={g.title}>
                  <Link className="mega-group-title" href={g.href} onClick={close}>
                    {g.title}
                  </Link>
                  {g.items?.map((it) => (
                    <Link key={it.name} className="mega-item" href={it.href} onClick={close}>
                      {it.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
