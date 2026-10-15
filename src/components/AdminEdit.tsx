"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCatalog } from "@/context/CatalogContext";
import { BUILTIN_PAGES } from "@/lib/site-links";

/** შესულ ადმინს საიტზე უჩანს ღილაკი, რომელიც მიმდინარე გვერდის რედაქტორს ხსნის. */
export function AdminEdit() {
  const pathname = usePathname();
  const { bySlug } = useCatalog();
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    if (!document.cookie.split("; ").includes("em_admin_ui=1")) return setHref(null);
    const search = window.location.search;
    let edit: string;
    if (pathname.startsWith("/product/")) {
      const p = bySlug.get(decodeURIComponent(pathname.slice(9)));
      edit = p ? `/admin/products/${p.id}` : "/admin/products";
    } else if (pathname === "/products") {
      edit = search.includes("category=") ? "/admin/categories" : "/admin/products";
    } else {
      const builtin = BUILTIN_PAGES.find((b) => b.href === pathname);
      edit = builtin ? builtin.edit : pathname === "/checkout" ? "/admin/content/shipping" : `/admin/pages${pathname}`;
    }
    setHref(edit);
  }, [pathname, bySlug]);

  if (!href) return null;
  return (
    <div className="admin-edit">
      <a href={href}>✎ რედაქტირება</a>
      <a href="/admin">ადმინი</a>
    </div>
  );
}
