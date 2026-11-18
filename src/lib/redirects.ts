// Rank Math → Redirections: proxy.ts ამოწმებს ყოველ მოთხოვნაზე. სია მეხსიერებაში ინახება 60 წამით,
// რომ ბაზა ყოველ მოთხოვნაზე არ გამოიძახოს; ადმინში შენახვისას იმავე ინსტანსში მაშინვე ახლდება.
import { eq, sql } from "drizzle-orm";
import { db, seoRedirects, type RedirectRow } from "@/db";
import { normalizePath } from "@/lib/seo-shared";

type Rule = Pick<RedirectRow, "id" | "source" | "matchType" | "target" | "code"> & { re?: RegExp | null };

const TTL = 60_000;
const store = globalThis as unknown as { __redirects?: { at: number; rules: Rule[] } | null };

export function clearRedirectCache() {
  store.__redirects = null;
}

async function rules(): Promise<Rule[]> {
  const c = store.__redirects;
  if (c && Date.now() - c.at < TTL) return c.rules;
  // ცხრილს ensureSchema() ქმნის (კატალოგის პირველივე ჩატვირთვაზე); მანამდე შეცდომა = გადამისამართება არ არის
  const rows = await db
    .select({ id: seoRedirects.id, source: seoRedirects.source, matchType: seoRedirects.matchType, target: seoRedirects.target, code: seoRedirects.code })
    .from(seoRedirects)
    .where(eq(seoRedirects.active, true));
  const list: Rule[] = rows.map((r) => {
    if (r.matchType !== "regex") return { ...r, source: normalizePath(r.source) };
    try {
      return { ...r, re: new RegExp(r.source, "i") };
    } catch {
      return { ...r, re: null };
    }
  });
  store.__redirects = { at: Date.now(), rules: list };
  return list;
}

export type RedirectHit = { id: number; code: number; target: string };

/** pathname + search → შესაბამისი გადამისამართება (ან null). შეცდომისას საიტი ჩვეულებრივ მუშაობს. */
export async function matchRedirect(pathname: string, search: string): Promise<RedirectHit | null> {
  let list: Rule[];
  try {
    list = await rules();
  } catch {
    return null;
  }
  if (!list.length) return null;
  const path = normalizePath(pathname);
  const full = normalizePath(pathname + search);
  for (const r of list) {
    if (r.matchType === "regex") {
      if (!r.re) continue;
      const m = r.re.exec(path) ?? r.re.exec(full);
      // სამიზნეში $1, $2 — ჯგუფები
      if (m) return { id: r.id, code: r.code, target: r.target.replace(/\$(\d)/g, (_, i: string) => m[Number(i)] ?? "") };
    } else if (r.matchType === "starts") {
      if (path.startsWith(r.source)) return { id: r.id, code: r.code, target: r.target };
    } else if (r.source === path || r.source === full) {
      return { id: r.id, code: r.code, target: r.target };
    }
  }
  return null;
}

export function countHit(id: number) {
  return db
    .update(seoRedirects)
    .set({ hits: sql`${seoRedirects.hits} + 1`, lastHit: new Date() })
    .where(eq(seoRedirects.id, id))
    .then(
      () => undefined,
      () => undefined,
    );
}
