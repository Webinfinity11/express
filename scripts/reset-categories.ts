// კატეგორიების ხის ჩანაცვლება (ძველი სატესტო პროდუქტებითა და კატეგორიებით წაშლით).
// გაშვება: npx tsx scripts/reset-categories.ts
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { slugify } from "../src/lib/admin-shared";

type Node = { name: string; children?: Node[] };

const leaf = (...names: string[]): Node[] => names.map((name) => ({ name }));

const TREE: Node[] = [
  { name: "IT", children: leaf("IT აქსესუარები", "დინამიკი", "კვების წყარო", "ლეპტოპი", "მეხსიერების ბარათი", "მონიტორი", "პრინტერი", "სენსორული დაფა მონიტორი") },
  { name: "TV", children: leaf("საკიდი კრონშტეინი") },
  { name: "გაგრილება გათბობა ჰაერის განწმენდა", children: leaf("გაზის გამათბობელი", "გათბობის ქვაბი", "გამათბობლის კრონშტეინი", "ვენტილატორი", "კონდიციონერი", "ჰაერის წმენდა და დატენიანება") },
  { name: "გართობა", children: leaf("ელ.სკუტერი", "სარბენი ბილიკი") },
  { name: "ეზო და ბაღი", children: leaf("მაყალი გრილი") },
  { name: "თმის მოვლა", children: leaf("აბაზანის სასწორი", "ეპილატორი", "თმის საკრეჭი", "თმის საშრობი", "თმის სტაილერი", "თმის უთო", "ტრიმერი", "წვერსაპარსი") },
  { name: "მსხვილი საყოფაცხოვრებო ტექნიკა", children: leaf("ინდუქციური ზედაპირი", "მაცივარი", "სარეცხი მანქანა", "სარეცხი მანქანა შრობით", "საყინულე მაცივარი", "საშრობი", "წყლის დისპენსერი", "წყლის კალონჯა", "ჭურჭლის სარეცხი მანქანა") },
  { name: "სამეურნეო პროდუქცია", children: leaf("ნაგვის ურნა") },
  { name: "სამზარეულოს აქსესუარები", children: leaf("დანა ჩანგალი", "ყავის მადუღარა", "ჩაიდანი", "ჭიქები და თერმოსები", "ჭურჭლის საშრობი", "ხის ჭურჭელი") },
  {
    name: "სამზარეულოს წვრილი ტექნიკა",
    children: leaf(
      "აეროგრილი", "ბლენდერი", "ბლინის ტაფა", "ბოსტნეულის საჭრელი", "გრილ ტოსტერი", "ელ. ღუმელი მინი",
      "ვაკუუმის აპარატი", "თერმო ჩაიდანი", "კაპუჩინატორი", "მიკროტალღური ღუმელი", "მიქსერი", "მიქსერი ჩამით",
      "მულტისახარში", "ნაყინის აპარატი", "პოპკორნის აპარატი", "პურის საცხობი", "სამზარეულოს კომბაინი",
      "სამზარეულოს სასწორი", "სლაისერი", "ტოსტერი როსტერი", "ყავის აპარატი ავტომატური", "ყავის მადუღარა ჩეზვე",
      "ყავის საფქვავი", "ყინულის აპარატი", "ჩაიდანი", "ჩირის აპარატი", "ჩოფერი", "წვენსაწური", "ხორცსაკეპი",
    ),
  },
  { name: "სახლის დასუფთავება", children: leaf("ვერტიკალური მტვერსასრუტი", "მტვერსასრუტი", "ორთქლით წმენდის აპარატი", "რობოტი მტვერსასრუტი", "უსადენო მტვერსასრუტი", "ფანჯრის საწმენდი რობოტი", "ხელის საშრობი") },
  { name: "ტაფა ქვაბები", children: leaf("ტაფა", "ტაფა-ქვაბი", "ქვაბი") },
  { name: "ტექსტილის მოვლა", children: leaf("ორთქლის გენერატორი", "ორთქლის უთო", "საუთო მაგიდა", "ხელის სტიმერი") },
  { name: "ჩასაშენებელი ტექნიკა", children: leaf("გაზქურის ზედაპირი", "გამწოვი", "ელ. ღუმელი", "მიკროტალღური ღუმელი") },
];

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // სატესტო პროდუქტები და ძველი კატეგორიები
  await sql`delete from product_variants`;
  await sql`delete from products`;
  await sql`delete from categories`;

  const used = new Set<string>();
  let count = 0;
  const insert = async (node: Node, parentId: number | null, order: number) => {
    let slug = slugify(node.name) || "category";
    while (used.has(slug)) slug += "-2";
    used.add(slug);
    const [row] = await sql`
      insert into categories (slug, name, parent_id, sort_order, show_on_home, show_in_menu)
      values (${slug}, ${node.name}, ${parentId}, ${order}, false, true)
      returning id`;
    count++;
    for (const [i, child] of (node.children ?? []).entries()) await insert(child, row.id as number, i);
  };
  for (const [i, node] of TREE.entries()) await insert(node, null, i);
  console.log(`კატეგორიები ჩაიწერა: ${count}`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
