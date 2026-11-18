"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["/admin/seo", "Titles & Meta"],
  ["/admin/seo/sitemap", "Sitemap Settings"],
  ["/admin/seo/redirects", "Redirections"],
] as const;

export function SeoTabs() {
  const path = usePathname();
  return (
    <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
      {TABS.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className={`whitespace-nowrap px-4 py-2.5 -mb-px border-b-2 font-semibold ${path === href ? "border-[#ff5a00] text-[#ff5a00]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
