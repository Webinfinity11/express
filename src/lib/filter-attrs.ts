/** კატეგორიის ფილტრები: მახასიათებლების ავტომატური ჯგუფები (Shop-ისა და ადმინის საერთო ლოგიკა). */
export const ATTR_AUTO_LIMIT = 5;

export const normVal = (v: string) => v.replace(/\s+/g, " ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim();

/** „7 კგ“, „198 ლ“, „68 dB“: რიცხვი + ერთეული; ასეთ მახასიათებელს ბევრი მნიშვნელობაც შეიძლება ჰქონდეს (ჩატვირთვა, მოცულობა). */
const isMeasure = (values: [string, number][]) => values.filter(([v]) => /^\d+([.,]\d+)?\s*\p{L}+$/u.test(v)).length >= values.length * 0.8;

export type AttrGroup = { label: string; values: [string, number][]; total: number };

/** პროდუქტების specs-იდან ფილტრად ვარგისი მახასიათებლები, ყველაზე ხშირი წინ. */
export function computeAttrGroups(specsList: [string, string][][], opts: { all?: boolean } = {}): AttrGroup[] {
  const groups = new Map<string, Map<string, number>>();
  for (const specs of specsList) {
    const seen = new Set<string>();
    for (const [k, v] of specs) {
      const label = k.trim(), val = normVal(v);
      if (!label || !val || val.length > 28 || label === "ბრენდი" || seen.has(label)) continue;
      seen.add(label);
      const m = groups.get(label) ?? new Map<string, number>();
      m.set(val, (m.get(val) ?? 0) + 1);
      groups.set(label, m);
    }
  }
  return [...groups.entries()]
    .map(([label, m]) => ({ label, values: [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ka", { numeric: true })), total: [...m.values()].reduce((a, b) => a + b, 0) }))
    .filter((g) => (opts.all ? g.total >= 1 && g.values.length >= 2 : g.total >= 3 && g.values.length >= 2 && (g.values.length <= 16 || (g.values.length <= 120 && isMeasure(g.values)))))
    .map((g) => (g.values.length > 16 ? { ...g, values: [...g.values].sort((a, b) => a[0].localeCompare(b[0], "ka", { numeric: true })) } : g))
    .sort((a, b) => b.total - a.total);
}

/** ავტომატურ რეჟიმში ჩანს ის, რაც ამ წესებს აკმაყოფილებს (ადმინში „ავტო“ ნიშნით). */
export function autoAttrLabels(specsList: [string, string][][]): string[] {
  return computeAttrGroups(specsList).slice(0, ATTR_AUTO_LIMIT).map((g) => g.label);
}

export const FILTER_KEYS = { categories: "categories", price: "price", brand: "brand", offers: "offers" } as const;
export const attrKey = (label: string) => `attr:${label}`;
