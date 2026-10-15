"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/admin";

const links = [
  ["/admin", "მთავარი"],
  ["/admin/orders", "შეკვეთები"],
  ["/admin/products", "პროდუქცია"],
  ["/admin/categories", "კატეგორიები"],
  ["/admin/brands", "ბრენდები"],
  ["/admin/promos", "პრომოკოდები"],
  ["/admin/pages", "გვერდები და მენიუ"],
] as const;

export function AdminNav({ newOrders = 0 }: { newOrders?: number }) {
  const path = usePathname();
  const active = (href: string) =>
    href === "/admin" ? path === href : path.startsWith(href) || (href === "/admin/pages" && path.startsWith("/admin/content"));
  return (
    <aside className="md:w-60 md:min-h-screen bg-white border-b md:border-b-0 md:border-r border-slate-200 md:sticky md:top-0 md:h-screen flex md:flex-col">
      <Link href="/admin" className="hidden md:block p-4 border-b border-slate-100">
        <span className="block rounded-lg bg-[#151515] p-2.5">
          <img src="/images/logo.webp" alt="Express Mix" width={459} height={191} className="w-full h-auto" />
        </span>
      </Link>
      <nav className="flex md:flex-col gap-1 p-2 md:p-3 overflow-x-auto flex-1">
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={`whitespace-nowrap rounded-lg px-3 py-2.5 font-semibold ${
              active(href) ? "bg-orange-50 text-[#ff5a00]" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {label}
            {href === "/admin/orders" && newOrders > 0 && (
              <span className="ml-2 inline-grid min-w-5 h-5 px-1.5 place-items-center rounded-full bg-red-500 text-white text-xs font-bold">{newOrders}</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="hidden md:grid gap-1 p-3 border-t border-slate-100 text-sm">
        <a href="/" target="_blank" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50">
          საიტის ნახვა ↗
        </a>
        <form action={logout}>
          <button className="w-full text-left rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50">გასვლა</button>
        </form>
      </div>
    </aside>
  );
}
