// საიტის ბმულები ადმინის „ბმულის არჩევისთვის“ და საიტიდან რედაქტორზე გადასასვლელად. კლიენტისთვის უსაფრთხოა.

export type LinkOption = { group: string; label: string; href: string; edit?: string };

/** კოდში აწყობილი გვერდები: მისამართი → ადმინის რედაქტორი */
export const BUILTIN_PAGES: { label: string; href: string; edit: string; note: string }[] = [
  { label: "მთავარი", href: "/", edit: "/admin/content/home", note: "ბანერები, პროდუქციის ბლოკები, სარეკლამო ბლოკები" },
  { label: "მაღაზია", href: "/products", edit: "/admin/categories", note: "კატეგორიები და პროდუქცია" },
  { label: "აქციები", href: "/products?sale=1", edit: "/admin/products", note: "ფასდაკლებული პროდუქცია (ძველი ფასით)" },
  { label: "ახალი პროდუქტები", href: "/products?new=1", edit: "/admin/products", note: "„ახალი“ მონიშნული პროდუქცია" },
  { label: "ჩვენ შესახებ", href: "/about", edit: "/admin/content/about", note: "ტექსტები და სურათები" },
  { label: "კონტაქტი", href: "/contact", edit: "/admin/content/contact", note: "ტექსტები; ტელეფონი/მისამართი — საკონტაქტოში" },
  { label: "კალათა", href: "/cart", edit: "/admin/content/shipping", note: "მიწოდების ტარიფები" },
];

// /{slug} მისამართები, რომლებიც საიტს უკვე უკავია
export const RESERVED_SLUGS = ["about", "contact", "products", "product", "cart", "checkout", "admin", "api", "images", "fonts", "icon.svg"];

/** ბმულიდან ადმინის რედაქტორის მისამართი (თუ ცნობილია) */
export function editUrlFor(href: string, options: LinkOption[]) {
  const h = href.trim();
  if (!h) return null;
  const exact = options.find((o) => o.href === h && o.edit);
  if (exact) return exact.edit!;
  const path = h.split(/[?#]/)[0];
  return options.find((o) => o.href === path && o.edit)?.edit ?? null;
}
