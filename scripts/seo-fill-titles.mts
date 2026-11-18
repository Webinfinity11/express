// ყველა პროდუქტს SEO title-ს უწერს (KA + EN), თუ ჯერ არ აქვს.
// გაშვება: npx tsx scripts/seo-fill-titles.mts            (--force — არსებულსაც გადაწერს, --dry — მხოლოდ აჩვენებს)
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const force = process.argv.includes("--force");
const dry = process.argv.includes("--dry");
const sql = neon(process.env.DATABASE_URL!);
const SITE = "Express Mix";
const MAX = 60;

const price = (v: string | number) => {
  const n = Number(v);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
};
const georgian = /[Ⴀ-ჿ]/;

function kaTitle(name: string, p: string) {
  const full = `${name} — ფასი ${p}₾ | ${SITE}`;
  return full.length <= MAX + 8 ? full : `${name} | ${SITE}`;
}

function enTitle(r: { name: string; en: string | null; brand: string; caten: string | null }, p: string) {
  let base = r.en?.trim();
  if (!base) {
    // ქართული სიტყვები ამოვიღოთ: „BOSCH სარეცხი მანქანა WGK264" → „BOSCH WGK264" + კატეგორია
    const model = r.name
      .split(/\s+/)
      .filter((w) => !georgian.test(w))
      .join(" ")
      .replace(new RegExp(`^${r.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "")
      .trim();
    base = [r.brand, r.caten?.replace(/s$/, ""), model].filter(Boolean).join(" ");
  }
  const full = `${base} — Price ${p} GEL | ${SITE}`;
  return full.length <= MAX + 8 ? full : `${base} | ${SITE}`;
}

// იგივე, რასაც src/db/ensure.ts აკეთებს (IF NOT EXISTS — უსაფრთხოა)
if (!dry) await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS seo jsonb NOT NULL DEFAULT '{}'::jsonb`;

const rows = (await sql`
  select p.id, p.name, p.brand, p.price, p.seo, p.en->>'name' as en, c.en->>'name' as caten
  from products p left join categories c on c.id = p.category_id
  order by p.id`) as { id: number; name: string; brand: string; price: string; seo: Record<string, unknown>; en: string | null; caten: string | null }[];

const todo = rows.filter((r) => force || !r.seo?.title);
const updates = todo.map((r) => {
  const p = price(r.price);
  return { id: r.id, ka: kaTitle(r.name, p), en: enTitle(r, p) };
});
console.log(`პროდუქტები: ${rows.length}, შესავსები: ${updates.length}`);
for (const u of updates.slice(0, 5)) console.log(`  #${u.id}\n    KA: ${u.ka}\n    EN: ${u.en}`);
if (dry) process.exit(0);

for (let i = 0; i < updates.length; i += 300) {
  const chunk = updates.slice(i, i + 300);
  await sql.query(
    `update products p set seo = p.seo
       || jsonb_build_object('title', v.ka)
       || jsonb_build_object('en', coalesce(p.seo->'en', '{}'::jsonb) || jsonb_build_object('title', v.en))
     from jsonb_to_recordset($1::jsonb) as v(id int, ka text, en text)
     where p.id = v.id`,
    [JSON.stringify(chunk)],
  );
  console.log(`  ჩაიწერა ${Math.min(i + 300, updates.length)} / ${updates.length}`);
}
console.log("მზადაა.");
