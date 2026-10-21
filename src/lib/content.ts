import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db, settings } from "@/db";
import { contentDefaults, type Content, type ContentKey } from "@/lib/content-schema";

/** საიტის ტექსტები: ადმინის ცვლილებები საწყის მნიშვნელობებზე დადებული. */
export async function getContent(): Promise<Content> {
  "use cache";
  cacheLife("hours");
  cacheTag("content");
  const rows = await db.select().from(settings);
  const merged = structuredClone(contentDefaults) as Record<string, Record<string, unknown>>;
  for (const row of rows) {
    if (row.key in merged) merged[row.key] = { ...merged[row.key], ...row.value };
  }
  return merged as unknown as Content;
}

const SAFE_HREF = /^(\/(?!\/)|https?:\/\/|tel:|mailto:|#)/i;
const SAFE_IMAGE = /^(\/(?!\/)|https:\/\/)/i;

/**
 * რედაქტირებულ სექციას საწყისის ფორმაზე მოიყვანს: უცნობი ველები იშლება, ტიპები ემთხვევა,
 * ბმულები და სურათები მხოლოდ უსაფრთხო მისამართებით.
 */
export function sanitizeSection(key: ContentKey, input: unknown): Record<string, unknown> {
  const shape = contentDefaults[key] as Record<string, unknown>;
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const str = (v: unknown, max = 4000) => String(v ?? "").slice(0, max);
  const safe = (name: string, s: string, fallback: string) => {
    const n = name.toLowerCase();
    if ((n.endsWith("href") || ["facebook", "instagram", "tiktok"].includes(n)) && s && !SAFE_HREF.test(s)) return fallback;
    if (n.endsWith("image") && s && !SAFE_IMAGE.test(s)) return fallback;
    return s;
  };

  for (const [name, def] of Object.entries(shape)) {
    const v = src[name];
    if (typeof def === "boolean") {
      out[name] = typeof v === "boolean" ? v : def;
    } else if (typeof def === "number") {
      const n = Number(v);
      out[name] = Number.isFinite(n) ? n : def;
    } else if (typeof def === "string") {
      out[name] = safe(name, str(v).trim(), def);
    } else if (Array.isArray(def)) {
      const list = Array.isArray(v) ? v.slice(0, 50) : [];
      if (typeof def[0] === "string" || def.length === 0) {
        out[name] = list.map((x) => str(x).trim()).filter(Boolean);
      } else {
        const keys = Object.keys(def[0] as object);
        out[name] = list
          .map((item) => {
            const o = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
            const clean: Record<string, string> = {};
            for (const k of keys) clean[k] = safe(k, str(o[k]).trim(), k === "href" ? "/" : "");
            return clean;
          })
          .filter((o) => Object.values(o).some(Boolean));
      }
    }
  }
  return out;
}
