import "server-only";
import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, pages } from "@/db";
import { ensureSchema } from "@/db/ensure";
import type { Lang } from "@/i18n";

const pick = (lang: Lang, ka: string, en: string | undefined) => (lang === "en" && en?.trim() ? en.trim() : ka);

/** გამოქვეყნებული გვერდები მოცემულ ენაზე (ცარიელი ინგლისური ველი = ქართული); ადმინში შენახვისას updateTag("pages"). */
export async function getPages(lang: Lang = "ka") {
  "use cache";
  cacheLife("hours");
  cacheTag("pages");
  await ensureSchema();
  const rows = await db.select().from(pages).where(eq(pages.published, true)).orderBy(asc(pages.title));
  return rows.map((p) => ({
    ...p,
    title: pick(lang, p.title, p.en?.title),
    eyebrow: pick(lang, p.eyebrow, p.en?.eyebrow),
    subtitle: pick(lang, p.subtitle, p.en?.subtitle),
    body: pick(lang, p.body, p.en?.body),
    buttonText: pick(lang, p.buttonText, p.en?.buttonText),
    metaDescription: pick(lang, p.metaDescription, p.en?.metaDescription),
  }));
}
