import { db, productVariants, products } from "@/db";

export type AttrSuggestions = {
  /** მახასიათებლის სახელები, ხშირად გამოყენებული პირველად */
  specLabels: string[];
  /** სახელი → უკვე შეყვანილი მნიშვნელობები */
  specValues: Record<string, string[]>;
  /** კატეგორია → მის პროდუქტებში გამოყენებული მახასიათებლები (რიგითობით) */
  categorySpecs: Record<number, string[]>;
  /** ვარიაციის / ფერის სახელები ფერის კოდით */
  colors: { name: string; hex: string | null }[];
};

const byCount = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);

/** ადმინის ფორმისთვის: ყველაფერი, რაც უკვე შეყვანილია სხვა პროდუქტებში. */
export async function getAttrSuggestions(): Promise<AttrSuggestions> {
  const [rows, variants] = await Promise.all([
    db.select({ categoryId: products.categoryId, specs: products.specs, colorName: products.colorName, colorHex: products.colorHex }).from(products),
    db.select({ name: productVariants.name, colorHex: productVariants.colorHex }).from(productVariants),
  ]);

  const labels = new Map<string, number>();
  const values = new Map<string, Map<string, number>>();
  const perCat = new Map<number, Map<string, number>>();
  const colors = new Map<string, { hex: string | null; n: number }>();
  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

  for (const p of rows) {
    for (const s of p.specs) {
      const label = s.label.trim();
      const value = s.value.trim();
      if (!label) continue;
      bump(labels, label);
      if (value) bump(values.get(label) ?? values.set(label, new Map()).get(label)!, value);
      if (p.categoryId) bump(perCat.get(p.categoryId) ?? perCat.set(p.categoryId, new Map()).get(p.categoryId)!, label);
    }
    if (p.colorName.trim()) addColor(colors, p.colorName.trim(), p.colorHex);
  }
  for (const v of variants) if (v.name.trim()) addColor(colors, v.name.trim(), v.colorHex);

  return {
    specLabels: byCount(labels),
    specValues: Object.fromEntries([...values].map(([k, m]) => [k, byCount(m).slice(0, 50)])),
    categorySpecs: Object.fromEntries([...perCat].map(([k, m]) => [k, byCount(m)])),
    colors: [...colors.entries()].sort((a, b) => b[1].n - a[1].n).map(([name, c]) => ({ name, hex: c.hex })),
  };
}

function addColor(m: Map<string, { hex: string | null; n: number }>, name: string, hex: string | null) {
  const c = m.get(name);
  if (c) {
    c.n++;
    c.hex ??= hex;
  } else m.set(name, { hex, n: 1 });
}
