// საწყისი მონაცემების ჩაწერა ბაზაში: კატეგორიების ხე (მენიუდან), დემო პროდუქტები, ბრენდები.
// გაშვება: npx tsx scripts/seed.ts   (ცარიელ ბაზაზე; --force — არსებულს წაშლის)
import { config } from "dotenv";
config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { slugify } from "../src/lib/admin-shared";
import { PRODUCTS } from "./seed-data";

type Node = { slug?: string; name: string; image?: string; home?: number; children?: Node[] };

// სექცია → ჯგუფი → ქვეკატეგორია. home = მთავარი გვერდის ბადეში რიგითობა.
const TREE: Node[] = [
  {
    slug: "large",
    name: "მსხვილი საყოფაცხოვრებო ტექნიკა",
    image: "/images/cat-washers.webp",
    children: [
      { slug: "fridges", name: "მაცივრები", image: "/images/cat-fridges.webp", home: 1 },
      { slug: "washers", name: "სარეცხი მანქანები", image: "/images/cat-washers.webp", home: 2 },
      { name: "საშრობი მანქანა" },
      { name: "ჭურჭლის სარეცხი მანქანა" },
      { slug: "ovens", name: "ღუმელები", image: "/images/cat-ovens.webp", home: 3 },
      { name: "გაზქურა" },
      { name: "გამწოვი" },
      {
        name: "ჩასაშენებელი ტექნიკა",
        children: [
          { name: "ჩასაშენებელი ელექტრო ღუმელი" },
          { name: "ჩასაშენებელი ქურა" },
          { name: "ჩასაშენებელი გამწოვი" },
          { name: "ჩასაშენებელი მიკროტალღური" },
          { name: "ჩასაშენებელი ყავის აპარატი" },
        ],
      },
      {
        name: "კლიმატური ტექნიკა",
        children: [
          { name: "კონდიციონერი" },
          { name: "გაზის გამათბობელი" },
          { name: "ელექტრო გამათბობელი" },
          { name: "ჰაერის გამწმენდი და დამატენიანებელი" },
          { name: "გამაგრილებელი" },
          { name: "ვენტილატორი" },
          { name: "პორტატული კონდიციონერი" },
        ],
      },
      { name: "წყლის დისპენსერი" },
      { name: "ორთქლის კარადა" },
      { name: "საყოფაცხოვრებო ტექნიკის აქსესუარები" },
    ],
  },
  {
    slug: "small",
    name: "წვრილი საოჯახო ტექნიკა",
    image: "/images/cat-kitchen.webp",
    children: [
      {
        slug: "kitchen",
        name: "სამზარეულოს ტექნიკა",
        image: "/images/cat-kitchen.webp",
        home: 5,
        children: [
          { slug: "blenders", name: "ბლენდერები", image: "/images/cat-blenders.webp", home: 8 },
          { name: "ელექტრო ღუმელი" },
          { name: "პურის საცხობი" },
          { name: "მიქსერი" },
          { name: "მულტი სახარში" },
          { name: "სენდვიჩ მეიქერი" },
          { name: "ვაფლის მეიქერი" },
          { name: "ტოსტერი" },
          { name: "გრილი" },
          { name: "წვენსაწური" },
          { name: "ჩირის აპარატი" },
          { name: "ფრის აპარატი" },
          { name: "სამზარეულოს სასწორი" },
        ],
      },
      {
        name: "ყავის მოყვარულთათვის",
        children: [
          { name: "ყავის აპარატი" },
          { name: "ყავის მადუღარა" },
          { name: "ყავის საფქვავი" },
          { name: "რძის ამომყვანი" },
        ],
      },
      { slug: "microwaves", name: "მიკროტალღური", image: "/images/cat-microwaves.webp", home: 6 },
      { name: "ელექტრო ჩაიდანი" },
      { name: "სამზარეულოს კომბაინი" },
      { name: "ხორცსაკეპი" },
    ],
  },
  {
    slug: "home-care",
    name: "სახლის და ეზოს მოვლა",
    image: "/images/cat-vacuums.webp",
    children: [
      { slug: "vacuums", name: "მტვერსასრუტები", image: "/images/cat-vacuums.webp", home: 4 },
      { slug: "irons", name: "უთოები", image: "/images/cat-irons.webp", home: 7 },
    ],
  },
];

const BRANDS = [
  ["Toshiba", "toshiba"],
  ["Franko", null],
  ["Samsung", "samsung"],
  ["Bosch", "bosch"],
  ["Philips", "philips"],
  ["Kenwood", "kenwood"],
  ["LG", "lg"],
  ["Beko", "beko"],
  ["Electrolux", "electrolux"],
  ["Tefal", "tefal"],
  ["Braun", "braun"],
  ["Gorenje", "gorenje"],
  ["Indesit", "indesit"],
  ["Midea", "midea"],
  ["De’Longhi", "delonghi"],
  ["Xiaomi", "xiaomi"],
] as const;

async function main() {
  const { db, brands, categories, productVariants, products } = await import("../src/db");
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(products);
  if (n > 0 && !process.argv.includes("--force")) {
    console.log(`ბაზაში უკვე ${n} პროდუქტია — გამოტოვებულია (--force წაშლის და თავიდან ჩაწერს).`);
    return;
  }
  await db.delete(productVariants);
  await db.delete(products);
  await db.delete(categories);
  await db.delete(brands);

  const ids = new Map<string, number>();
  const used = new Set<string>();
  const insert = async (node: Node, parentId: number | null, order: number) => {
    let slug = node.slug ?? slugify(node.name);
    while (used.has(slug)) slug += "-2";
    used.add(slug);
    const [row] = await db
      .insert(categories)
      .values({ slug, name: node.name, parentId, image: node.image ?? null, showOnHome: !!node.home, sortOrder: node.home ?? 100 + order })
      .returning({ id: categories.id });
    ids.set(slug, row.id);
    for (const [i, child] of (node.children ?? []).entries()) await insert(child, row.id, i);
  };
  for (const [i, node] of TREE.entries()) await insert(node, null, i);
  console.log(`კატეგორიები: ${ids.size}`);

  for (const [i, p] of PRODUCTS.entries()) {
    await db.insert(products).values({
      slug: p.slug,
      sku: p.sku,
      name: p.name,
      label: p.label,
      brand: p.brand,
      categoryId: ids.get(p.category) ?? null,
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
  console.log(`პროდუქტები: ${PRODUCTS.length}`);

  await db.insert(brands).values(
    BRANDS.map(([name, file], i) => ({ name, logo: file ? `/images/brands/${file}.svg` : null, sortOrder: i })),
  );
  console.log(`ბრენდები: ${BRANDS.length}`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
