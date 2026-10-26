// კატალოგის ტიპები და სუფთა დამხმარე ფუნქციები (კლიენტზეც და სერვერზეც).
// მონაცემები ბაზიდან მოდის: src/lib/catalog.ts → CatalogProvider.

export type Variant = {
  id: string;
  name: string;
  colorHex: string | null;
  sku: string;
  price: number;
  oldPrice: number;
  image: string | null;
  inStock: boolean;
};

export type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  label: string;
  category: string; // კატეგორიის slug
  brand: string;
  price: number;
  oldPrice: number; // ფასდაკლების გარეშე = price
  image: string;
  gallery: string[];
  scene: string;
  color: string;
  tone: string;
  subtitle: string;
  desc: string;
  specs: [string, string][];
  featured: boolean;
  isNew: boolean;
  inStock: boolean;
  keywords: string;
  variants: Variant[];
  // ლოჯისტიკური კლასი (პროდუქტის ან კატეგორიის); null = საერთო ტარიფი
  ship: ShipClass | null;
};

export type ShipClass = { code: string; tbilisi: number; regions: number };

export type Category = { id: string; name: string; image: string; parent: string | null; showOnHome: boolean; showInMenu: boolean };
export type Brand = { name: string; logo: string | null };
export type Catalog = { products: Product[]; categories: Category[]; brands: Brand[] };

export type MenuLink = { name: string; href: string };
export type MenuGroup = { title: string; href: string; items?: MenuLink[] };
export type MenuSection = { id: string; name: string; image: string; href: string; groups: MenuGroup[] };

export type Promo = { code: string; kind: "percent" | "fixed"; value: number; minTotal: number };

export const PLACEHOLDER_IMAGE = "/images/logo.webp";

export const discountPercent = (p: { price: number; oldPrice: number }) =>
  p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n).replace(/,/g, " ");
/** ლარი → "1 299" */
export const money = (value: number) => fmt(value);
/** თეთრი → "1 299 ₾" */
export const gel = (tetri: number) => fmt(tetri / 100) + " ₾";

export const productHref = (p: { slug: string }) => "/product/" + p.slug;
export const categoryHref = (slug: string) => "/products?category=" + slug;

/** კალათის გასაღები: "12" ან ვარიაციით "12:5" */
export const lineKey = (productId: string, variantId?: string | null) => (variantId ? `${productId}:${variantId}` : productId);

// მიწოდება (ტარიფები ადმინიდან — content.shipping)
export const CITIES = { tbilisi: "თბილისი", batumi: "ბათუმი", regions: "სხვა რეგიონები" } as const;
export type City = keyof typeof CITIES;
export type Shipping = { tbilisi: number; batumi: number; regions: number; freeFrom: number };

/** კლასის ფასი ქალაქისთვის (₾): თბილისი ან რეგიონი */
export const classPrice = (c: ShipClass, city: City) => (city === "tbilisi" ? c.tbilisi : c.regions);

/** მიწოდების ღირებულება თეთრებში: კლასიანი ნივთი — კლასის ფასი × რაოდენობა,
 *  კლასის გარეშე ნივთებზე — საერთო ტარიფი ერთხელ. */
export function shippingCost(
  s: Shipping,
  city: City,
  afterDiscount: number,
  items: { ship: ShipClass | null; qty: number }[],
  courier: boolean,
) {
  if (!items.length || !courier || afterDiscount >= Math.round(s.freeFrom * 100)) return 0;
  const classed = items.reduce((n, i) => n + (i.ship ? Math.round(classPrice(i.ship, city) * 100) * i.qty : 0), 0);
  const flat = items.some((i) => !i.ship) ? Math.round((s[city] ?? 0) * 100) : 0;
  return classed + flat;
}

/** პრომოკოდის ფასდაკლება თეთრებში */
export function promoDiscount(promo: Promo | null, sub: number) {
  if (!promo || sub < Math.round(promo.minTotal * 100)) return 0;
  const off = promo.kind === "percent" ? Math.round((sub * Math.min(100, promo.value)) / 100) : Math.round(promo.value * 100);
  return Math.min(sub, off);
}

/** კატალოგის ძიების ცხრილები და კალათის ხაზის ამოხსნა */
export function indexCatalog(c: Catalog) {
  const byId = new Map(c.products.map((p) => [p.id, p]));
  const bySlug = new Map(c.products.map((p) => [p.slug, p]));
  const catBySlug = new Map(c.categories.map((x) => [x.id, x]));
  const children = new Map<string, Category[]>();
  for (const x of c.categories) {
    const k = x.parent ?? "";
    children.set(k, [...(children.get(k) ?? []), x]);
  }

  const categoryName = (slug: string) => catBySlug.get(slug)?.name ?? "ყველა პროდუქტი";
  /** კატეგორია და მისი ყველა ქვეკატეგორია */
  const subtree = (slug: string) => {
    const out = new Set<string>([slug]);
    const walk = (s: string) => (children.get(s) ?? []).forEach((x) => (out.add(x.id), walk(x.id)));
    walk(slug);
    return out;
  };

  const line = (key: string) => {
    const [pid, vid] = key.split(":");
    const p = byId.get(pid);
    if (!p) return null;
    const v = vid ? p.variants.find((x) => x.id === vid) : undefined;
    if (vid && !v) return null;
    if (!vid && p.variants.length) return null;
    return {
      key,
      product: p,
      variant: v ?? null,
      name: p.name,
      variantName: v?.name ?? null,
      image: v?.image || p.image,
      price: v ? v.price : p.price,
      oldPrice: v ? v.oldPrice : p.oldPrice,
      sku: v?.sku || p.sku,
      inStock: v ? v.inStock : p.inStock,
      href: productHref(p),
    };
  };

  /** ბარათიდან დამატებისას: ვარიაციებიანი პროდუქტი → პირველი მარაგში არსებული ვარიაცია */
  const defaultKey = (p: Product) => {
    if (!p.variants.length) return p.id;
    const v = p.variants.find((x) => x.inStock) ?? p.variants[0];
    return lineKey(p.id, v.id);
  };

  // ჰედერის მენიუ: მხოლოდ „მენიუში“ მონიშნული კატეგორიები
  const inMenu = (slug: string) => (children.get(slug) ?? []).filter((x) => x.showInMenu);
  const menu: MenuSection[] = inMenu("").map((s) => ({
    id: s.id,
    name: s.name,
    image: s.image,
    href: categoryHref(s.id),
    groups: inMenu(s.id).map((g) => {
      const items = inMenu(g.id);
      return {
        title: g.name,
        href: categoryHref(g.id),
        items: items.length ? items.map((i) => ({ name: i.name, href: categoryHref(i.id) })) : undefined,
      };
    }),
  }));

  return { ...c, byId, bySlug, catBySlug, categoryName, subtree, line, defaultKey, menu };
}

export type CatalogIndex = ReturnType<typeof indexCatalog>;
export type CartLine = NonNullable<ReturnType<CatalogIndex["line"]>>;
