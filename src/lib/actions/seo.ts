"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { categories, db, pages, products, seoRedirects, settings, type EntitySeo } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { requireAdmin } from "@/lib/auth";
import { clearRedirectCache } from "@/lib/redirects";
import { MATCH_TYPES, REDIRECT_CODES, SEO_SETTINGS_KEY, SEO_TYPES, mergeSeoSettings, normalizePath, type SeoSettings } from "@/lib/seo-shared";

type Result = { ok: true; id?: number } | { ok: false; error: string };
const fail = (error: string): Result => ({ ok: false, error });

const str = (max: number) => z.string().trim().max(max);
const img = z.union([z.literal(""), z.url({ protocol: /^https$/ }), z.string().regex(/^\/[^/]/)]);

// ───────── Titles & Meta / Sitemap ─────────

const typeMeta = z.object({ title: str(200), description: str(400), titleEn: str(200), descriptionEn: str(400), noindex: z.boolean() });
const settingsSchema = z.object({
  siteName: str(80).min(1, "მიუთითეთ საიტის სახელი"),
  separator: str(5),
  siteUrl: z.url({ protocol: /^https?$/, error: "საიტის მისამართი: https://..." }).transform((u) => u.replace(/\/+$/, "")),
  defaultOgImage: img,
  twitterHandle: str(40),
  verification: z.object({ google: str(200), bing: str(200), yandex: str(200) }),
  types: z.object(Object.fromEntries(SEO_TYPES.map((t) => [t, typeMeta])) as Record<(typeof SEO_TYPES)[number], typeof typeMeta>),
  sitemap: z.object({
    products: z.boolean(),
    categories: z.boolean(),
    pages: z.boolean(),
    images: z.boolean(),
    excludeOutOfStock: z.boolean(),
    exclude: str(20_000),
  }),
  robots: z.object({ disallow: str(5_000) }),
});

export async function saveSeoSettings(input: SeoSettings): Promise<Result> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(mergeSeoSettings(input));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  // verification: თუ მთელი <meta> ჩასვეს — მხოლოდ content
  const v = parsed.data.verification;
  for (const k of ["google", "bing", "yandex"] as const) v[k] = v[k].match(/content=["']([^"']+)["']/)?.[1] ?? v[k];
  await ensureSchema();
  await db
    .insert(settings)
    .values({ key: SEO_SETTINGS_KEY, value: parsed.data })
    .onConflictDoUpdate({ target: settings.key, set: { value: parsed.data, updatedAt: new Date() } });
  updateTag("seo");
  return { ok: true };
}

// ───────── ჩანაწერის SEO (პროდუქტი, კატეგორია, გვერდი) ─────────

const entitySchema = z.object({
  title: str(200).optional(),
  description: str(400).optional(),
  focusKeyword: str(120).optional(),
  ogImage: img.optional(),
  canonical: z.union([z.literal(""), z.url({ protocol: /^https?$/ }), z.string().regex(/^\/[^/]?/)]).optional(),
  noindex: z.boolean().optional(),
  en: z.object({ title: str(200).optional(), description: str(400).optional() }).optional(),
});

/** ცარიელ ველებს ვშლით: ცარიელი = შაბლონი */
function clean(seo: z.infer<typeof entitySchema>): EntitySeo {
  const out: EntitySeo = {};
  for (const k of ["title", "description", "focusKeyword", "ogImage", "canonical"] as const) if (seo[k]) out[k] = seo[k];
  if (seo.noindex) out.noindex = true;
  const en = { ...(seo.en?.title && { title: seo.en.title }), ...(seo.en?.description && { description: seo.en.description }) };
  if (Object.keys(en).length) out.en = en;
  return out;
}

export type SeoKind = "product" | "category" | "page";

export async function saveEntitySeo(kind: SeoKind, id: number, input: EntitySeo): Promise<Result> {
  await requireAdmin();
  const parsed = entitySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const seo = clean(parsed.data);
  await ensureSchema();
  if (kind === "product") await db.update(products).set({ seo, updatedAt: new Date() }).where(eq(products.id, id));
  else if (kind === "category") await db.update(categories).set({ seo }).where(eq(categories.id, id));
  else if (kind === "page") await db.update(pages).set({ seo, updatedAt: new Date() }).where(eq(pages.id, id));
  else return fail("უცნობი ტიპი");
  updateTag("seo");
  return { ok: true };
}

// ───────── Redirections ─────────

const redirectSchema = z
  .object({
    source: str(1000).min(1, "მიუთითეთ წყარო მისამართი"),
    matchType: z.enum(Object.keys(MATCH_TYPES) as [keyof typeof MATCH_TYPES]),
    target: str(1000),
    code: z.coerce.number().refine((c) => (REDIRECT_CODES as readonly number[]).includes(c), "არასწორი ტიპი"),
    active: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.code !== 410 && d.code !== 451 && !d.target) ctx.addIssue({ code: "custom", message: "მიუთითეთ სამიზნე მისამართი" });
    if (d.matchType === "regex")
      try {
        new RegExp(d.source);
      } catch {
        ctx.addIssue({ code: "custom", message: "Regex არასწორია" });
      }
  });
export type RedirectInput = z.input<typeof redirectSchema>;

export async function saveRedirect(id: number | null, input: RedirectInput): Promise<Result> {
  await requireAdmin();
  const parsed = redirectSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;
  const source = d.matchType === "regex" ? d.source : normalizePath(d.source);
  const target = d.code === 410 || d.code === 451 ? "" : /^https?:\/\//i.test(d.target) ? d.target : normalizePath(d.target);
  if (d.matchType === "exact" && source === normalizePath(target)) return fail("წყარო და სამიზნე ერთნაირია — წრიული გადამისამართება");
  await ensureSchema();
  const values = { source, matchType: d.matchType, target, code: d.code, active: d.active };
  let rid = id;
  if (id) await db.update(seoRedirects).set(values).where(eq(seoRedirects.id, id));
  else [{ id: rid }] = await db.insert(seoRedirects).values(values).returning({ id: seoRedirects.id });
  clearRedirectCache();
  return { ok: true, id: rid! };
}

export async function setRedirectActive(id: number, active: boolean): Promise<Result> {
  await requireAdmin();
  await db.update(seoRedirects).set({ active }).where(eq(seoRedirects.id, id));
  clearRedirectCache();
  return { ok: true };
}

export async function deleteRedirect(id: number): Promise<Result> {
  await requireAdmin();
  await db.delete(seoRedirects).where(eq(seoRedirects.id, id));
  clearRedirectCache();
  return { ok: true };
}
