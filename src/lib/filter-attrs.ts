/** კატეგორიის ფილტრები: მახასიათებლების ავტომატური ჯგუფები (Shop-ისა და ადმინის საერთო ლოგიკა). */
export const ATTR_AUTO_LIMIT = 5;

export const normVal = (v: string) => v.replace(/\s+/g, " ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim();

export type AttrGroup = { label: string; values: [string, number][]; total: number };

/** პროდუქტების specs-იდან ფილტრად ვარგისი მახასიათებლები, ყველაზე ხშირი წინ. */
export function computeAttrGroups(specsList: [string, string][][]): AttrGroup[] {
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
    .filter((g) => g.total >= 3 && g.values.length >= 2 && g.values.length <= 16)
    .sort((a, b) => b.total - a.total);
}

export const FILTER_KEYS = { price: "price", brand: "brand", offers: "offers" } as const;
export const attrKey = (label: string) => `attr:${label}`;
