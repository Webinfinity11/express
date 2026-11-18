import type { MetadataRoute } from "next";
import { getSeoSettings } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const s = await getSeoSettings();
  const base = (s.siteUrl || "https://emix.ge").replace(/\/+$/, "");
  const extra = s.robots.disallow.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/cart", "/checkout", "/en/cart", "/en/checkout", ...extra] },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
