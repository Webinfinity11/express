// სატესტო (დემო) პროდუქტების მიბმა ყველა ბოლო კატეგორიაზე, რომ კატეგორიები საიტზე გამოჩნდეს.
// პროდუქტები ციკლურად აიღება scripts/seed-data.ts-დან; თითო ბოლო კატეგორიას ერთი პროდუქტი ხვდება.
// გაშვება: npx tsx scripts/attach-test-products.ts   (უკვე არსებულ პროდუქტებს არ ეხება; --force ჯერ წაშლის)
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { PRODUCTS } from "./seed-data";

async function main() {
  const { db, categories, productVariants, products } = await import("../src/db");

  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(products);
  if (n > 0) {
    if (!process.argv.includes("--force")) {
      console.log(`ბაზაში უკვე ${n} პროდუქტია — გამოტოვებულია (--force წაშლის და თავიდან ჩაწერს).`);
      return;
    }
    await db.delete(productVariants);
    await db.delete(products);
  }

  const all = await db.select().from(categories);
  const parentIds = new Set(all.map((c) => c.parentId).filter((x): x is number => x !== null));
  const leaves = all.filter((c) => !parentIds.has(c.id)).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  for (const [i, cat] of leaves.entries()) {
    const p = PRODUCTS[i % PRODUCTS.length];
    await db.insert(products).values({
      slug: `${p.slug}-${cat.slug}`,
      sku: `${p.sku}-${cat.id}`,
      name: p.name,
      label: p.label,
      brand: p.brand,
      categoryId: cat.id,
      price: p.price,
      oldPrice: p.oldPrice > p.price ? p.oldPrice : null,
      images: p.gallery.length ? p.gallery : [p.image],
      sceneImage: p.scene,
      subtitle: p.subtitle,
      description: p.desc,
      specs: p.specs.map(([label, value]) => ({ label, value })),
      keywords: p.keywords,
      colorName: p.color,
      colorHex: p.tone,
      featured: p.featured,
      isNew: p.isNew,
      sortOrder: i,
    });
  }
  console.log(`ბოლო კატეგორიები: ${leaves.length}, პროდუქტები ჩაიწერა: ${leaves.length}`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
