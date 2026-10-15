"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCatalog } from "@/context/CatalogContext";
import { Icon } from "./Icon";

export function Navigation() {
  const pathname = usePathname();
  const { menu: MENU, content } = useCatalog();
  const CONTACT = content.site;
  // აქციების ბმულს ნარინჯისფერი წერტილი აქვს
  const NAV_LINKS = content.header.navLinks.map((l) => ({ ...l, dot: l.href.includes("sale=1") }));
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState(MENU[0]?.id ?? "");
  const [openGroup, setOpenGroup] = useState<string | null>(null);
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

  // მობილური მენიუ: იხურება გარეთ დაჭერით ან Escape-ით
  useEffect(() => {
    if (!mobileOpen) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".mobile-nav, .nav-burger")) setMobileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const close = () => setOpen(false);

  return (
    <nav className="navigation" aria-label="მთავარი ნავიგაცია">
      <div className="nav-inner wrap">
        <button
          ref={toggleRef}
          className="catalog-toggle"
          aria-expanded={open}
          aria-controls="megaMenu"
          onClick={() => {
            setMobileOpen(false);
            setOpen((o) => !o);
          }}
          onMouseEnter={hoverOpen}
          onMouseLeave={hoverClose}
        >
          <Icon name="menu" />
          <span>კატეგორიები</span>
          <Icon name="chevron" className="small down" />
        </button>
        <div className="nav-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
              {l.label} {l.dot && <span className="nav-dot"></span>}
            </Link>
          ))}
        </div>
        <a className="nav-contact" href={CONTACT.phoneHref}>
          <Icon name="phone" />
          <span>{CONTACT.phone}</span>
        </a>
        <button
          className="nav-burger"
          aria-expanded={mobileOpen}
          aria-controls="mobileNav"
          aria-label="მენიუ"
          onClick={() => {
            setOpen(false);
            setMobileOpen((o) => !o);
          }}
        >
          <Icon name={mobileOpen ? "close" : "menu"} />
          <span>მენიუ</span>
        </button>
        <div className="mobile-nav" id="mobileNav" hidden={!mobileOpen}>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              {l.label} {l.dot && <span className="nav-dot"></span>}
              <Icon name="chevron" />
            </Link>
          ))}
          <a className="mobile-nav-phone" href={CONTACT.phoneHref}>
            <Icon name="phone" /> {CONTACT.phone}
          </a>
        </div>
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
                      setOpenGroup(null);
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
          {section && (
            <div className="mega-panel">
              <div className="mega-panel-head">
                <h3>{section.name}</h3>
                <Link className="text-link" href={section.href} onClick={close}>
                  ყველას ნახვა <Icon name="arrow" />
                </Link>
              </div>
              <div className="mega-groups">
                {section.groups.map((g) => {
                  const hasItems = !!g.items?.length;
                  const isOpen = openGroup === g.title;
                  return (
                    <div className={`mega-group${hasItems ? " has-items" : ""}${isOpen ? " open" : ""}`} key={g.title}>
                      <Link
                        className="mega-group-title"
                        href={g.href}
                        aria-expanded={hasItems ? isOpen : undefined}
                        onClick={(e) => {
                          // სენსორულ ეკრანზე ქვეკატეგორიების მქონე ჯგუფი იშლება, გვერდზე არ გადადის
                          if (hasItems && !canHover()) {
                            e.preventDefault();
                            setOpenGroup(isOpen ? null : g.title);
                          } else close();
                        }}
                      >
                        {g.title}
                        {hasItems && <Icon name="chevron" className="small mega-group-chevron" />}
                      </Link>
                      {hasItems && (
                        <div className="mega-items">
                          {g.items!.map((it) => (
                            <Link key={it.name} className="mega-item" href={it.href} onClick={close}>
                              {it.name}
                            </Link>
                          ))}
                          <Link className="mega-item mega-item-all" href={g.href} onClick={close}>
                            ყველა — {g.title} <Icon name="arrow" />
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
