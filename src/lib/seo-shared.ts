// SEO-ს ტიპები, ნაგულისხმევი მნიშვნელობები და შაბლონები — კლიენტზეც (ადმინის ფორმები) და სერვერზეც.

export const SEO_SETTINGS_KEY = "seo";

/** ერთი ტიპის (პროდუქტი, კატეგორია...) Titles & Meta შაბლონი; ცარიელი EN = ქართული შაბლონი */
export type TypeMeta = {
  title: string;
  description: string;
  titleEn: string;
  descriptionEn: string;
  noindex: boolean;
};

export const SEO_TYPES = ["home", "shop", "product", "category", "page"] as const;
export type SeoType = (typeof SEO_TYPES)[number];

export type SeoSettings = {
  siteName: string;
  separator: string;
  siteUrl: string;
  defaultOgImage: string;
  twitterHandle: string;
  verification: { google: string; bing: string; yandex: string };
  types: Record<SeoType, TypeMeta>;
  sitemap: {
    products: boolean;
    categories: boolean;
    pages: boolean;
    images: boolean;
    excludeOutOfStock: boolean;
    /** slug-ები, მძიმით ან ახალი ხაზით */
    exclude: string;
  };
  robots: {
    /** დამატებითი აკრძალული მისამართები (თითო ხაზზე) */
    disallow: string;
  };
};

const type = (title: string, description: string, titleEn = "", descriptionEn = ""): TypeMeta => ({
  title,
  description,
  titleEn,
  descriptionEn,
  noindex: false,
});

export const SEO_DEFAULTS: SeoSettings = {
  siteName: "Express Mix",
  separator: "|",
  siteUrl: "https://emix.ge",
  defaultOgImage: "",
  twitterHandle: "",
  verification: { google: "", bing: "", yandex: "" },
  types: {
    home: type(
      "%sitename% %sep% ტექნიკა თქვენი სახლისთვის",
      "Express Mix: სახლისა და სამზარეულოს ტექნიკა. ხარისხიანი ბრენდები, საუკეთესო ფასები, კომფორტული შოპინგი.",
      "%sitename% %sep% Appliances for your home",
      "Express Mix: home and kitchen appliances. Quality brands, best prices, comfortable shopping.",
    ),
    shop: type(
      "მაღაზია %sep% %sitename%",
      "სახლისა და სამზარეულოს ტექნიკა: მაცივრები, სარეცხი მანქანები, ღუმელები, მტვერსასრუტები და სხვა.",
      "Shop %sep% %sitename%",
      "Home and kitchen appliances: refrigerators, washing machines, ovens, vacuum cleaners and more.",
    ),
    product: type("%title% %sep% %sitename%", "%excerpt%", "", ""),
    category: type(
      "%title% %sep% %sitename%",
      "%title% — %count% პროდუქტი Express Mix-ში. ხარისხიანი ბრენდები და საუკეთესო ფასები.",
      "",
      "%title% — %count% products at Express Mix. Quality brands and best prices.",
    ),
    page: type("%title% %sep% %sitename%", "%excerpt%", "", ""),
  },
  sitemap: { products: true, categories: true, pages: true, images: true, excludeOutOfStock: false, exclude: "" },
  robots: { disallow: "" },
};

/** შენახული პარამეტრები + ნაგულისხმევი (ახალი ველები ავტომატურად ივსება) */
export function mergeSeoSettings(raw: unknown): SeoSettings {
  const v = (raw ?? {}) as Partial<SeoSettings>;
  const d = SEO_DEFAULTS;
  return {
    ...d,
    ...v,
    verification: { ...d.verification, ...v.verification },
    types: Object.fromEntries(SEO_TYPES.map((t) => [t, { ...d.types[t], ...v.types?.[t] }])) as SeoSettings["types"],
    sitemap: { ...d.sitemap, ...v.sitemap },
    robots: { ...d.robots, ...v.robots },
  };
}

export type TemplateVars = Partial<Record<"title" | "excerpt" | "category" | "brand" | "price" | "sku" | "count", string>>;

export const TEMPLATE_VARS: [string, string][] = [
  ["%title%", "ჩანაწერის სახელი (პროდუქტი, კატეგორია, გვერდი)"],
  ["%sitename%", "საიტის სახელი"],
  ["%sep%", "გამყოფი სიმბოლო"],
  ["%excerpt%", "აღწერის დასაწყისი (160 სიმბოლო)"],
  ["%category%", "პროდუქტის კატეგორია"],
  ["%brand%", "ბრენდი"],
  ["%price%", "ფასი (₾)"],
  ["%sku%", "არტიკული"],
  ["%count%", "პროდუქტების რაოდენობა (კატეგორია)"],
];

/** შაბლონის შევსება: უცნობი/ცარიელი ცვლადი ქრება, ზედმეტი გამყოფები და სივრცეები სუფთავდება */
export function renderTemplate(tpl: string, vars: TemplateVars, s: Pick<SeoSettings, "siteName" | "separator">): string {
  const all: Record<string, string> = { ...vars, sitename: s.siteName, sep: s.separator } as Record<string, string>;
  const sep = s.separator.trim();
  let out = tpl.replace(/%([a-z]+)%/g, (_, k: string) => all[k] ?? "");
  out = out.replace(/\s+/g, " ").trim();
  if (sep) {
    const e = sep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out
      .replace(new RegExp(`(\\s*${e}\\s*){2,}`, "g"), ` ${sep} `)
      .replace(new RegExp(`^\\s*${e}\\s*|\\s*${e}\\s*$`, "g"), "")
      .trim();
  }
  return out;
}

/** აღწერის ტექსტი meta description-ისთვის: სუფთა ერთი ხაზი, სიტყვის საზღვარზე მოჭრილი */
export function excerpt(text: string, max = 160): string {
  const clean = text.replace(/[#*_>`]+/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:–-]+$/, "") + "…";
}

/** Redirections */
export const REDIRECT_CODES = [301, 302, 307, 410, 451] as const;
export const MATCH_TYPES = { exact: "ზუსტი", starts: "იწყება", regex: "Regex" } as const;
export type MatchType = keyof typeof MATCH_TYPES;

/** მისამართის ნორმალიზება შედარებისთვის: დომენის გარეშე, დეკოდირებული, ბოლო „/“-ის გარეშე */
export function normalizePath(input: string): string {
  let p = input.trim();
  try {
    if (/^https?:\/\//i.test(p)) {
      const u = new URL(p);
      p = u.pathname + u.search;
    }
  } catch {}
  try {
    p = decodeURI(p);
  } catch {}
  if (!p.startsWith("/")) p = "/" + p;
  if (p.length > 1) p = p.replace(/\/+(?=\?|$)/, "");
  return p || "/";
}
