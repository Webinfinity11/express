import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db, settings } from "@/db";
import { contentDefaults, contentSections, type Content, type ContentKey, type FieldSpec, type Sub } from "@/lib/content-schema";
import { translate, type Lang } from "@/i18n";

/** ინგლისური ვერსიის ტექსტების გასაღები settings-ში: "en:home" და ა.შ. */
export const enKey = (key: string) => `en:${key}`;

/** ყველა სტრიქონი ლექსიკონით (ბმულები/სურათები ლექსიკონში არ არის და უცვლელი რჩება) */
function translateDeep(v: unknown): unknown {
  if (typeof v === "string") return translate("en", v);
  if (Array.isArray(v)) return v.map(translateDeep);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, translateDeep(x)]));
  return v;
}

/**
 * საიტის ტექსტები: ადმინის ცვლილებები საწყის მნიშვნელობებზე დადებული.
 * ინგლისური: ქართული ტექსტების თარგმანი (src/i18n/en) + ადმინში ინგლისურად შეცვლილი სექციები ("en:<key>").
 */
export async function getContent(lang: Lang = "ka"): Promise<Content> {
  "use cache";
  cacheLife("hours");
  cacheTag("content");
  const rows = await db.select().from(settings);
  const merged = structuredClone(contentDefaults) as Record<string, Record<string, unknown>>;
  for (const row of rows) {
    if (row.key in merged) merged[row.key] = { ...merged[row.key], ...row.value };
  }
  if (lang === "en") {
    for (const key of Object.keys(merged)) merged[key] = translateDeep(merged[key]) as Record<string, unknown>;
    for (const row of rows) {
      const key = row.key.startsWith("en:") ? row.key.slice(3) : "";
      if (key in merged) merged[key] = overlayEnText(key, merged[key], row.value);
    }
  }
  return merged as unknown as Content;
}

/** ტექსტური ველი? (სურათები, ბმულები, ჩამრთველები, არჩევანი — ყოველთვის ქართული ვერსიიდან) */
export const isTextSub = (s: Sub) => !s.image && !s.options && s.name !== "href";
export const isTextField = (f: FieldSpec) => f.type === "text" || f.type === "textarea" || f.type === "list" || f.type === "objects";

/** ადმინში ინგლისურად შეცვლილი ტექსტები — მხოლოდ ტექსტური ველები; სტრუქტურა (სურათები, ბმულები, რაოდენობა) ქართულიდან */
function overlayEnText(key: string, base: Record<string, unknown>, saved: Record<string, unknown>) {
  const spec = contentSections.find((s) => s.key === key);
  if (!spec) return base;
  const out = { ...base };
  for (const f of spec.fields) {
    const v = saved[f.name];
    if (v === undefined) continue;
    if (f.type === "text" || f.type === "textarea") {
      if (typeof v === "string" && v.trim()) out[f.name] = v;
    } else if (f.type === "list") {
      if (Array.isArray(v) && v.length) out[f.name] = v;
    } else if (f.type === "objects" && Array.isArray(base[f.name]) && Array.isArray(v)) {
      out[f.name] = (base[f.name] as Record<string, unknown>[]).map((item, i) => {
        const e = v[i] as Record<string, unknown> | undefined;
        if (!e) return item;
        const o = { ...item };
        for (const s of f.fields) if (isTextSub(s) && typeof e[s.name] === "string" && (e[s.name] as string).trim()) o[s.name] = e[s.name];
        return o;
      });
    }
  }
  return out;
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
