"use client";

import { createContext, useContext, useMemo } from "react";
import type { Content } from "@/lib/content-schema";
import { indexCatalog, type Catalog, type CatalogIndex } from "@/lib/data";

type Value = CatalogIndex & { content: Content };
const Ctx = createContext<Value | null>(null);

/** ბაზიდან წამოღებული კატალოგი და საიტის ტექსტები კლიენტის კომპონენტებისთვის */
export function CatalogProvider({ catalog, content, children }: { catalog: Catalog; content: Content; children: React.ReactNode }) {
  const value = useMemo(() => ({ ...indexCatalog(catalog), content }), [catalog, content]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCatalog must be used inside CatalogProvider");
  return ctx;
}
