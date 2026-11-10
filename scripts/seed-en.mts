/**
 * ინგლისური თარგმანების ჩაწერა ბაზაში (en jsonb ველები) scripts/seed-en-data.json-დან.
 *   npx tsx scripts/seed-en.mts          — მშრალი გაშვება: რას ჩაწერს
 *   npx tsx scripts/seed-en.mts --apply  — ჩაწერა
 * ავსებს მხოლოდ ცარიელ en ველებს (ადმინში უკვე შეყვანილ ინგლისურს არ ცვლის), --force — ყველას გადაწერს.
 * ქართულ მონაცემებს არ ეხება.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

process.loadEnvFile?.(".env.local");
const sql = neon(process.env.DATABASE_URL!);
const apply = process.argv.includes("--apply");
const force = process.argv.includes("--force");

type Spec = { label: string; value: string };
type Data = {
  categories: { id: number; name: string }[];
  products: { id: number; name: string; label: string; subtitle: string; description: string; specs: Spec[]; colorName: string }[];
  variants: { id: number; name: string }[];
  pages: { id: number; title: string; eyebrow: string; subtitle: string; body: string; buttonText: string; metaDescription: string }[];
};
const data: Data = JSON.parse(readFileSync(new URL("./seed-en-data.json", import.meta.url), "utf8"));

/** ცარიელი სტრიქონები/სიები არ ინახება */
function clean(o: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (k === "id") continue;
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
    else if (Array.isArray(v)) {
      const list = (v as Spec[]).filter((s) => s?.label?.trim() && s?.value?.trim());
      if (list.length) out[k] = list;
    }
  }
  return out;
}

for (const table of ["categories", "products", "product_variants", "pages"])
  if (apply) await sql.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS en jsonb NOT NULL DEFAULT '{}'::jsonb`);

const jobs: [string, { id: number }[]][] = [
  ["categories", data.categories],
  ["products", data.products],
  ["product_variants", data.variants],
  ["pages", data.pages],
];

for (const [table, rows] of jobs) {
  let written = 0;
  let skipped = 0;
  for (const row of rows) {
    const en = clean(row as Record<string, unknown>);
    if (!Object.keys(en).length) continue;
    if (!apply) {
      written++;
      continue;
    }
    const res = await sql.query(
      `UPDATE ${table} SET en = $1::jsonb WHERE id = $2 ${force ? "" : "AND (en IS NULL OR en = '{}'::jsonb)"} RETURNING id`,
      [JSON.stringify(en), row.id],
    );
    if (res.length) written++;
    else skipped++;
  }
  console.log(`${table}: ${apply ? "written" : "would write"} ${written}${skipped ? `, skipped ${skipped} (already has English or missing)` : ""}`);
}
if (!apply) console.log("\nDry run. Add --apply to write.");
