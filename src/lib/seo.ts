import "server-only";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { categories, db, pages, products, settings, type EntitySeo } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { localePath, type Lang } from "@/i18n";
import { SEO_SETTINGS_KEY, excerpt, mergeSeoSettings, renderTemplate, type SeoSettings, type SeoType, type TemplateVars } from "@/lib/seo-shared";

/** Titles & Meta / Sitemap პარამეტრები; ადმინში შენახვისას updateTag("seo"). */
export async function getSeoSettings(): Promise<SeoSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag("seo");
  await ensureSchema();
  const [row] = await db.select().from(settings).where(eq(settings.key, SEO_SETTINGS_KEY));
  return mergeSeoSettings(row?.value);
}

type Overrides = Record<string, EntitySeo>;
const filled = (s: EntitySeo | null | undefined) => !!s && Object.keys(s).length > 0;

/** ჩანაწერებზე ხელით შევსებული SEO (slug → seo). მხოლოდ სერვერზე — კლიენტის კატალოგს არ ამძიმებს. */
export async function getSeoOverrides(): Promise<{ products: Overrides; categories: Overrides; pages: Overrides }> {
  "use cache";
  cacheLife("hours");
  cacheTag("seo", "catalog", "pages");
  await ensureSchema();
  const [p, c, pg] = await Promise.all([
    db.select({ slug: products.slug, seo: products.seo }).from(products),
    db.select({ slug: categories.slug, seo: categories.seo }).from(categories),
    db.select({ slug: pages.slug, seo: pages.seo }).from(pages),
  ]);
  const map = (rows: { slug: string; seo: EntitySeo }[]) => Object.fromEntries(rows.filter((r) => filled(r.seo)).map((r) => [r.slug, r.seo]));
  return { products: map(p), categories: map(c), pages: map(pg) };
}

type BuildInput = {
  lang: Lang;
  type: SeoType;
  /** მისამართი ენის პრეფიქსის გარეშე: "/product/x" */
  path: string;
  vars?: TemplateVars;
  override?: EntitySeo;
  /** ჩანაწერის სურათი (პროდუქტი, კატეგორია) — OG სურათად, თუ ცალკე არ არის მითითებული */
  image?: string | null;
  ogType?: "website" | "article";
};

/** Rank Math-ის ლოგიკა: ჩანაწერის ველი → ტიპის შაბლონი (EN → KA) → საერთო ნაგულისხმევი */
export function resolveSeo(s: SeoSettings, { lang, type, vars = {}, override }: Pick<BuildInput, "lang" | "type" | "vars" | "override">) {
  const t = s.types[type];
  const en = lang === "en";
  const tplTitle = (en && t.titleEn.trim()) || t.title;
  const tplDesc = (en && t.descriptionEn.trim()) || t.description;
  const ownTitle = (en ? override?.en?.title?.trim() : "") || (!en ? override?.title?.trim() : "");
  const ownDesc = (en ? override?.en?.description?.trim() : "") || (!en ? override?.description?.trim() : "");
  const v = { ...vars, excerpt: vars.excerpt ? excerpt(vars.excerpt) : "" };
  return {
    title: renderTemplate(ownTitle || tplTitle, v, s),
    description: excerpt(renderTemplate(ownDesc || tplDesc, v, s), 300),
    noindex: override?.noindex ?? t.noindex,
  };
}

export async function buildMetadata(input: BuildInput): Promise<Metadata> {
  const s = await getSeoSettings();
  const { lang, path, override, image, ogType = "website" } = input;
  const { title, description, noindex } = resolveSeo(s, input);
  const url = override?.canonical?.trim() || localePath(lang, path);
  const og = override?.ogImage || image || s.defaultOgImage || undefined;
  return {
    title: { absolute: title },
    description: description || undefined,
    alternates: {
      canonical: url,
      languages: { ka: path, en: localePath("en", path), "x-default": path },
    },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: ogType,
      title,
      description: description || undefined,
      url,
      siteName: s.siteName,
      locale: lang === "en" ? "en_US" : "ka_GE",
      images: og ? [{ url: og }] : undefined,
    },
    twitter: {
      card: og ? "summary_large_image" : "summary",
      title,
      description: description || undefined,
      images: og ? [og] : undefined,
      site: s.twitterHandle || undefined,
    },
  };
}
