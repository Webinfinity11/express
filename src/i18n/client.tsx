"use client";

import NextLink from "next/link";
import { useRouter as useNextRouter } from "next/navigation";
import { createContext, useContext, useMemo, type ComponentProps } from "react";
import { getT, localePath, type Lang, type T } from "./index";

const LangContext = createContext<Lang>("ka");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** const t = useT(); t("კალათა") */
export function useT(): T {
  const lang = useLang();
  return useMemo(() => getT(lang), [lang]);
}

/** შიდა ბმული მიმდინარე ენით: href="/products" → /en/products ინგლისურ ვერსიაზე */
export function useLocalePath() {
  const lang = useLang();
  return (path: string) => localePath(lang, path);
}

/** next/link-ის ჩამნაცვლებელი — href ავტომატურად იღებს ენის პრეფიქსს */
export function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const lang = useLang();
  const h = typeof href === "string" ? localePath(lang, href) : href;
  return <NextLink href={h} {...props} />;
}

/** useRouter, რომლის push/replace ენის პრეფიქსს თავად ამატებს */
export function useRouter() {
  const router = useNextRouter();
  const lang = useLang();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, opts?: Parameters<typeof router.push>[1]) => router.push(localePath(lang, href), opts),
      replace: (href: string, opts?: Parameters<typeof router.replace>[1]) => router.replace(localePath(lang, href), opts),
    }),
    [router, lang],
  );
}
