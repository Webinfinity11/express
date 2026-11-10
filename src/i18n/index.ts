/**
 * ენები: ქართული (ძირითადი, პრეფიქსის გარეშე: /products) და ინგლისური (/en/products).
 *
 * თარგმანი ქართული ტექსტით ხდება: t("კალათა") → "Cart" (en/*.ts ლექსიკონებიდან).
 * თუ თარგმანი არ არის — ქართული რჩება. ცვლადები: t("სულ {n} პროდუქტი", { n: 5 }).
 * შემოწმება: node scripts/i18n-check.mjs — აჩვენებს t("...")-ებს, რომლებსაც ინგლისური აკლია.
 */
import { en } from "./en";

export const LANGS = ["ka", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "ka";
export const isLang = (v: unknown): v is Lang => v === "ka" || v === "en";
export const toLang = (v: unknown): Lang => (isLang(v) ? v : DEFAULT_LANG);

export type Vars = Record<string, string | number>;
export type T = (s: string, vars?: Vars) => string;

export function translate(lang: Lang, s: string, vars?: Vars): string {
  let out = lang === "en" ? (en[s] ?? s) : s;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

export const getT =
  (lang: Lang): T =>
  (s, vars) =>
    translate(lang, s, vars);

const UNPREFIXED = /^\/(en|admin|api|images|fonts|uploads|_next)(\/|\?|#|$)/;

/** შიდა ბმული მიმდინარე ენაზე: ("en", "/products") → "/en/products" */
export function localePath(lang: Lang, path: string): string {
  if (lang === DEFAULT_LANG || !path.startsWith("/") || path.startsWith("//") || UNPREFIXED.test(path)) return path;
  return path === "/" ? "/en" : `/en${path}`;
}

/** მისამართი ენის პრეფიქსის გარეშე: "/en/products?x" → "/products?x" */
export function stripLang(path: string): string {
  const m = path.match(/^\/en(?=\/|\?|#|$)/);
  if (!m) return path;
  const rest = path.slice(3);
  return rest.startsWith("/") ? rest : `/${rest}`;
}

/** ორივე ენის ფასის ფორმატი */
export const LOCALE: Record<Lang, string> = { ka: "ka-GE", en: "en-GB" };
