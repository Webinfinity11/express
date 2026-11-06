// პროდუქციის Excel ფაილი: შაბლონი, ექსპორტი, წაკითხვა და იმპორტის გეგმა.
// ბაზას არ ეხება: გეგმა არსებული მონაცემებიდან გამოითვლება, ჩაწერა actions/import-export.ts-შია.
import ExcelJS from "exceljs";
import { slugify } from "./admin-shared";
import type { categories, products, shippingClasses } from "../db/schema";

type Product = typeof products.$inferSelect;
type Category = Pick<typeof categories.$inferSelect, "id" | "name" | "parentId" | "sortOrder">;
type ShippingClass = Pick<typeof shippingClasses.$inferSelect, "id" | "name">;
export type ProductValues = Partial<typeof products.$inferInsert>;

const SHEET = "პროდუქცია";
const CATEGORY_SHEET = "კატეგორიები";
const HELP_SHEET = "ინსტრუქცია";
const MAX_ROWS = 5000;
const VALIDATION_LAST_ROW = MAX_ROWS + 1;
const CLEAR = "-";
const YES = "კი";
const NO = "არა";

const COLUMNS = [
  { key: "id", header: "ID", width: 8, help: "ავტომატურია, არ შეცვალოთ. ახალ პროდუქტს ცარიელი დაუტოვეთ." },
  { key: "name", header: "დასახელება", width: 38, required: true, help: "სავალდებულოა ახალი პროდუქტისთვის." },
  { key: "sku", header: "SKU", width: 16, text: true, help: "პროდუქტის კოდი. ID-ის გარეშე პროდუქტი ამით იძებნება." },
  { key: "brand", header: "ბრენდი", width: 16, help: "მაგ. Franko" },
  { key: "category", header: "კატეგორია", width: 44, required: true, list: "category", help: "აირჩიეთ სიიდან. სავალდებულოა ახალი პროდუქტისთვის." },
  { key: "price", header: "ფასი", width: 11, required: true, help: "ჩვეულებრივი ფასი ლარში. სავალდებულოა ახალი პროდუქტისთვის." },
  { key: "salePrice", header: "ფასდაკლებული ფასი", width: 14, help: "ჩვეულებრივ ფასზე ნაკლები უნდა იყოს. ფასდაკლების მოსახსნელად ჩაწერეთ -" },
  { key: "stockQty", header: "რაოდენობა", width: 11, help: "მარაგის რაოდენობა. ცარიელი ახალ პროდუქტზე ნიშნავს, რომ რაოდენობა არ აღირიცხება." },
  { key: "inStock", header: "მარაგშია", width: 10, list: "bool", help: "კი ან არა. ახალ პროდუქტზე ნაგულისხმევია კი." },
  { key: "published", header: "საიტზე", width: 9, list: "bool", help: "კი ან არა. ცარიელი ახალ პროდუქტზე: სურათით კი, სურათის გარეშე არა." },
  { key: "featured", header: "პოპულარული", width: 12, list: "bool", help: "კი ან არა." },
  { key: "isNew", header: "ახალი", width: 8, list: "bool", help: "კი ან არა." },
  { key: "label", header: "იარლიყი", width: 16, help: "მოკლე წარწერა პროდუქტის ბარათზე." },
  { key: "subtitle", header: "ქვესათაური", width: 30, help: "მოკლე ტექსტი სახელის ქვეშ." },
  { key: "description", header: "აღწერა", width: 50, help: "პროდუქტის სრული აღწერა." },
  { key: "specs", header: "მახასიათებლები", width: 50, help: "ფორმატი: ტიპი: 2-in-1; ფერი: შავი" },
  { key: "keywords", header: "საძიებო სიტყვები", width: 26, help: "დამატებითი სიტყვები საიტის ძიებისთვის." },
  { key: "colorName", header: "ფერი", width: 14, help: "ფერის სახელი, მაგ. შავი" },
  { key: "colorHex", header: "ფერის კოდი", width: 11, help: "ფორმატი: #000000" },
  { key: "shippingClass", header: "ლოჯისტიკური კლასი", width: 18, list: "shipping", help: "ცარიელი ახალ პროდუქტზე ნიშნავს, რომ კლასი კატეგორიიდან მოდის." },
  { key: "images", header: "სურათები", width: 40, help: "სურათების https ბმულები, მძიმით გამოყოფილი. პირველი მთავარია." },
  { key: "sceneImage", header: "ინტერიერის სურათი", width: 30, help: "ერთი https ბმული." },
] as const;

type ColumnKey = (typeof COLUMNS)[number]["key"];

const CHANGE_LABELS: Record<string, string> = {
  name: "დასახელება",
  sku: "SKU",
  brand: "ბრენდი",
  categoryId: "კატეგორია",
  price: "ფასი",
  oldPrice: "ფასდაკლება",
  stockQty: "რაოდენობა",
  inStock: "მარაგშია",
  published: "საიტზე",
  featured: "პოპულარული",
  isNew: "ახალი",
  label: "იარლიყი",
  subtitle: "ქვესათაური",
  description: "აღწერა",
  specs: "მახასიათებლები",
  keywords: "საძიებო სიტყვები",
  colorName: "ფერი",
  colorHex: "ფერის კოდი",
  shippingClassId: "ლოჯისტიკური კლასი",
  images: "სურათები",
  sceneImage: "ინტერიერის სურათი",
};

/** ბავშვი კატეგორიები მშობლის შემდეგ, სრული გზით: „სექცია > ჯგუფი > ქვეკატეგორია“. */
function categoryPaths(cats: Category[]) {
  const out: { id: number; path: string; name: string }[] = [];
  const walk = (parentId: number | null, prefix: string) =>
    cats
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .forEach((c) => {
        const path = prefix ? `${prefix} > ${c.name}` : c.name;
        out.push({ id: c.id, path, name: c.name });
        walk(c.id, path);
      });
  walk(null, "");
  return out;
}

const specsToText = (specs: Product["specs"]) => {
  const separator = specs.some((s) => `${s.label}${s.value}`.includes(";")) ? "\n" : "; ";
  return specs.map((s) => `${s.label}: ${s.value}`).join(separator);
};

function productToRow(p: Product, categoryPath: Map<number, string>, className: Map<number, string>) {
  const hasSale = p.oldPrice != null && p.oldPrice > p.price;
  const bool = (v: boolean) => (v ? YES : NO);
  const row: Record<ColumnKey, string | number | null> = {
    id: p.id,
    name: p.name,
    sku: p.sku,
    brand: p.brand,
    category: p.categoryId ? (categoryPath.get(p.categoryId) ?? "") : "",
    price: hasSale ? p.oldPrice : p.price,
    salePrice: hasSale ? p.price : null,
    stockQty: p.stockQty,
    inStock: bool(p.inStock),
    published: bool(p.published),
    featured: bool(p.featured),
    isNew: bool(p.isNew),
    label: p.label,
    subtitle: p.subtitle,
    description: p.description,
    specs: specsToText(p.specs),
    keywords: p.keywords,
    colorName: p.colorName,
    colorHex: p.colorHex,
    shippingClass: p.shippingClassId ? (className.get(p.shippingClassId) ?? "") : "",
    images: p.images.join(", "),
    sceneImage: p.sceneImage,
  };
  return row;
}

/** rows ცარიელი = შაბლონი. */
export async function buildWorkbook(rows: Product[], cats: Category[], classes: ShippingClass[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(SHEET, { views: [{ state: "frozen", ySplit: 1, xSplit: 2 }] });
  ws.columns = COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
    ...("text" in c ? { style: { numFmt: "@" } } : {}),
  }));
  const head = ws.getRow(1);
  head.height = 30;
  COLUMNS.forEach((c, i) => {
    const cell = head.getCell(i + 1);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", wrapText: true };
    const color = c.key === "id" ? "FF64748B" : "required" in c ? "FFFF5A00" : "FF334155";
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
    cell.note = c.help;
  });

  const paths = categoryPaths(cats);
  const categoryPath = new Map(paths.map((c) => [c.id, c.path]));
  const className = new Map(classes.map((c) => [c.id, c.name]));
  for (const p of rows) ws.addRow(productToRow(p, categoryPath, className));
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };

  const lists = wb.addWorksheet(CATEGORY_SHEET);
  lists.columns = [
    { header: "კატეგორია", width: 60 },
    { header: "ლოჯისტიკური კლასი", width: 30 },
  ];
  lists.getRow(1).font = { bold: true };
  paths.forEach((c, i) => (lists.getCell(i + 2, 1).value = c.path));
  classes.forEach((c, i) => (lists.getCell(i + 2, 2).value = c.name));

  const help = wb.addWorksheet(HELP_SHEET);
  help.columns = [
    { header: "სვეტი", width: 26 },
    { header: "რა უნდა ჩაიწეროს", width: 90 },
  ];
  help.getRow(1).font = { bold: true };
  COLUMNS.forEach((c) => help.addRow([c.header, c.help]));
  help.addRow([]);
  [
    "ცარიელი უჯრა არსებულ პროდუქტზე ნიშნავს, რომ ეს ველი არ იცვლება.",
    "ველის გასასუფთავებლად უჯრაში ჩაწერეთ - (ტირე).",
    "იმპორტი პროდუქტს არასდროს შლის. ფაილიდან ამოღებული სტრიქონი საიტზე უცვლელი რჩება.",
    "ჩაწერამდე ადმინი აჩვენებს, რა დაემატება და რა შეიცვლება.",
  ].forEach((t) => help.addRow(["შენიშვნა", t]));

  const column = (key: ColumnKey) => ws.getColumn(key).letter;
  const addList = (key: ColumnKey, formula: string) =>
    (ws as unknown as { dataValidations: { add(address: string, v: ExcelJS.DataValidation): void } }).dataValidations.add(
      `${column(key)}2:${column(key)}${VALIDATION_LAST_ROW}`,
      {
        type: "list",
        allowBlank: true,
        showErrorMessage: false,
        formulae: [formula],
      },
    );
  if (paths.length) addList("category", `'${CATEGORY_SHEET}'!$A$2:$A$${paths.length + 1}`);
  if (classes.length) addList("shippingClass", `'${CATEGORY_SHEET}'!$B$2:$B$${classes.length + 1}`);
  for (const c of COLUMNS) if ("list" in c && c.list === "bool") addList(c.key, `"${YES},${NO}"`);

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ───────── წაკითხვა ─────────

export type SheetRow = {
  row: number;
  cells: Partial<Record<ColumnKey, string>>;
  /** Excel-მა SKU რიცხვად შეინახა: 000275 შეიძლება 275 გახდა */
  skuIsNumber: boolean;
};

function cellText(value: ExcelJS.CellValue | undefined): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((t) => t.text).join("").trim();
    if ("text" in value) return cellText(value.text as ExcelJS.CellValue);
    if ("result" in value) return cellText(value.result as ExcelJS.CellValue);
    return "";
  }
  return String(value).trim();
}

export async function parseWorkbook(data: ArrayBuffer): Promise<{ ok: true; rows: SheetRow[] } | { ok: false; error: string }> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(data);
  } catch {
    return { ok: false, error: "ფაილი ვერ წაიკითხა. გამოიყენეთ .xlsx ფორმატი" };
  }
  const ws = wb.getWorksheet(SHEET) ?? wb.worksheets[0];
  if (!ws) return { ok: false, error: "ფაილში ფურცელი ვერ მოიძებნა" };

  const byHeader = new Map<string, ColumnKey>(COLUMNS.map((c) => [c.header, c.key]));
  const columnOf = new Map<number, ColumnKey>();
  ws.getRow(1).eachCell((cell, col) => {
    const key = byHeader.get(cellText(cell.value).replace(/\*/g, "").trim());
    if (key) columnOf.set(col, key);
  });
  const found = new Set(columnOf.values());
  if (!found.has("id") && !found.has("sku") && !found.has("name"))
    return { ok: false, error: "სვეტები ვერ მოიძებნა. გამოიყენეთ გადმოწერილი შაბლონი" };

  const rows: SheetRow[] = [];
  let tooMany = false;
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const cells: SheetRow["cells"] = {};
    let skuIsNumber = false;
    for (const [col, key] of columnOf) {
      const cell = row.getCell(col);
      const text = cellText(cell.value);
      if (text) cells[key] = text;
      if (key === "sku" && typeof cell.value === "number") skuIsNumber = true;
    }
    if (!Object.keys(cells).length) return;
    if (rows.length >= MAX_ROWS) tooMany = true;
    else rows.push({ row: rowNumber, cells, skuIsNumber });
  });
  if (tooMany) return { ok: false, error: `ერთ ფაილში მაქსიმუმ ${MAX_ROWS} პროდუქტია დაშვებული` };
  if (!rows.length) return { ok: false, error: "ფაილში პროდუქტები ვერ მოიძებნა" };
  return { ok: true, rows };
}

// ───────── იმპორტის გეგმა ─────────

export type PlanItem =
  | { action: "create"; row: number; name: string; sku: string; changes: string[]; values: ProductValues & { name: string; slug: string } }
  | { action: "update"; row: number; id: number; name: string; sku: string; changes: string[]; values: ProductValues }
  | { action: "same"; row: number; id: number; name: string; sku: string; changes: string[] };

export type ImportPlan = {
  items: PlanItem[];
  errors: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
};

function parseMoney(text: string) {
  let s = text.replace(/[₾\s]/g, "");
  s = s.includes(".") ? s.replace(/,/g, "") : s.replace(",", ".");
  const n = Number(s);
  return s !== "" && Number.isFinite(n) && n >= 0 && n <= 10_000_000 ? Math.round(n * 100) / 100 : null;
}

function parseBool(text: string) {
  const s = text.trim().toLowerCase();
  if ([YES, "yes", "true", "1"].includes(s)) return true;
  if ([NO, "no", "false", "0"].includes(s)) return false;
  return null;
}

const validImage = (s: string) => {
  if (/^\/[^/]/.test(s)) return true;
  try {
    return new URL(s).protocol === "https:";
  } catch {
    return false;
  }
};

function parseSpecs(text: string) {
  const parts = /\r?\n/.test(text) ? text.split(/\r?\n/) : text.split(";");
  const specs: { label: string; value: string }[] = [];
  for (const raw of parts) {
    const part = raw.trim();
    if (!part) continue;
    const at = part.indexOf(":");
    if (at < 1 || !part.slice(at + 1).trim()) return null;
    const value = part.slice(at + 1).replace(/^[:\s]+/, "");
    if (!value) return null;
    specs.push({ label: part.slice(0, at).trim().slice(0, 80), value: value.slice(0, 200) });
  }
  return specs.length <= 40 ? specs : null;
}

/** „გარანტია:“ და „გარანტია“ ერთი და იგივე სახელია: ცვლილებად არ ითვლება. */
const specsKey = (specs: Product["specs"]) => JSON.stringify(specs.map((s) => [s.label.replace(/[:\s]+$/, ""), s.value]));

const isSame = (field: string, before: unknown, after: unknown) =>
  field === "specs"
    ? specsKey(before as Product["specs"]) === specsKey(after as Product["specs"])
    : JSON.stringify(before ?? null) === JSON.stringify(after ?? null);

const stripZeros = (sku: string) => sku.replace(/^0+(?=.)/, "");

export function planImport(sheet: SheetRow[], existing: Product[], cats: Category[], classes: ShippingClass[]): ImportPlan {
  const plan: ImportPlan = { items: [], errors: [], warnings: [] };
  const byId = new Map(existing.map((p) => [p.id, p]));
  const paths = categoryPaths(cats);
  const pathToId = new Map(paths.map((c) => [c.path.toLowerCase(), c.id]));
  const nameToIds = new Map<string, number[]>();
  for (const c of paths) nameToIds.set(c.name.toLowerCase(), [...(nameToIds.get(c.name.toLowerCase()) ?? []), c.id]);
  const classToId = new Map(classes.map((c) => [c.name.toLowerCase(), c.id]));
  const slugs = new Set(existing.map((p) => p.slug));
  const usedIds = new Set<number>();
  const newSkus = new Set<string>();

  for (const { row, cells, skuIsNumber } of sheet) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sku = cells.sku && cells.sku !== CLEAR ? cells.sku : "";

    // ვპოულობთ არსებულ პროდუქტს: ჯერ ID, მერე SKU
    let current: Product | undefined;
    if (cells.id) {
      const id = Number(cells.id);
      current = Number.isInteger(id) ? byId.get(id) : undefined;
      if (!current) errors.push(`ID ${cells.id} ბაზაში ვერ მოიძებნა. ახალ პროდუქტს ID ცარიელი დაუტოვეთ`);
    } else if (sku) {
      let hits = existing.filter((p) => p.sku === sku);
      if (!hits.length && skuIsNumber) hits = existing.filter((p) => p.sku && stripZeros(p.sku) === stripZeros(sku));
      if (hits.length > 1) errors.push(`SKU ${sku} ${hits.length} პროდუქტს აქვს. მიუთითეთ ID`);
      else current = hits[0];
    }
    if (current && usedIds.has(current.id)) errors.push(`პროდუქტი ფაილში ორჯერ გვხვდება (ID ${current.id})`);
    if (!current && !cells.id && sku) {
      if (newSkus.has(sku)) errors.push(`SKU ${sku} ფაილში ორჯერ გვხვდება`);
      newSkus.add(sku);
    }
    // პროდუქტი ვერ დადგინდა: დანარჩენი ველების შემოწმებას აზრი არ აქვს
    if (errors.length) {
      plan.errors.push(...errors.map((message) => ({ row, message })));
      continue;
    }

    const values: ProductValues = {};
    const text = (key: ColumnKey, field: keyof ProductValues, max: number, title: string) => {
      const v = cells[key];
      if (v === undefined) return;
      if (v.length > max) errors.push(`${title}: მაქსიმუმ ${max} სიმბოლო`);
      (values as Record<string, unknown>)[field] = v === CLEAR ? "" : v;
    };
    const bool = (key: ColumnKey, field: "inStock" | "published" | "featured" | "isNew", title: string) => {
      const v = cells[key];
      if (v === undefined) return;
      const parsed = parseBool(v);
      if (parsed === null) errors.push(`${title}: ჩაწერეთ ${YES} ან ${NO}`);
      else values[field] = parsed;
    };

    if (cells.name !== undefined) {
      if (cells.name.length < 2 || cells.name.length > 200) errors.push("დასახელება 2-დან 200 სიმბოლომდე უნდა იყოს");
      values.name = cells.name;
    } else if (!current) errors.push("დასახელება სავალდებულოა");

    // SKU რიცხვად შენახვისას წინა ნულები იკარგება: არსებულ კოდს არ ვაფუჭებთ
    const skuLostZeros = skuIsNumber && current && stripZeros(current.sku) === stripZeros(sku);
    if (!skuLostZeros) text("sku", "sku", 60, "SKU");
    if (!current && skuIsNumber) warnings.push(`SKU ${sku} რიცხვად არის შენახული, წინა ნულები შეიძლება დაკარგულია`);
    if (current && sku && !skuLostZeros && sku !== current.sku && existing.some((p) => p.sku === sku && p.id !== current!.id))
      warnings.push(`SKU ${sku} სხვა პროდუქტსაც აქვს`);

    text("brand", "brand", 80, "ბრენდი");
    text("label", "label", 120, "იარლიყი");
    text("subtitle", "subtitle", 300, "ქვესათაური");
    text("description", "description", 20000, "აღწერა");
    text("keywords", "keywords", 1000, "საძიებო სიტყვები");
    text("colorName", "colorName", 80, "ფერი");
    bool("inStock", "inStock", "მარაგშია");
    bool("published", "published", "საიტზე");
    bool("featured", "featured", "პოპულარული");
    bool("isNew", "isNew", "ახალი");

    if (cells.category !== undefined) {
      const key = cells.category.toLowerCase().replace(/\s*>\s*/g, " > ");
      const byName = nameToIds.get(key) ?? [];
      const id = pathToId.get(key) ?? (byName.length === 1 ? byName[0] : undefined);
      if (id !== undefined) values.categoryId = id;
      else if (byName.length > 1) errors.push(`კატეგორია „${cells.category}“ რამდენიმეა. აირჩიეთ სიიდან სრული გზით`);
      else errors.push(`კატეგორია „${cells.category}“ ვერ მოიძებნა`);
    } else if (!current) errors.push("კატეგორია სავალდებულოა");

    // ფასი: ფაილში ჩვეულებრივი + ფასდაკლებული; ბაზაში price = მიმდინარე, oldPrice = გადახაზული
    const curSale = current && current.oldPrice != null && current.oldPrice > current.price ? current.price : null;
    const curRegular = current ? (curSale != null ? current.oldPrice! : current.price) : null;
    let regular = curRegular;
    if (cells.price !== undefined) {
      regular = parseMoney(cells.price);
      if (regular === null) errors.push(`ფასი არასწორია: ${cells.price}`);
    } else if (!current) errors.push("ფასი სავალდებულოა");
    let sale = curSale;
    if (cells.salePrice === CLEAR) sale = null;
    else if (cells.salePrice !== undefined) {
      sale = parseMoney(cells.salePrice);
      if (sale === null) errors.push(`ფასდაკლებული ფასი არასწორია: ${cells.salePrice}`);
    }
    if (regular !== null && (cells.price !== undefined || cells.salePrice !== undefined)) {
      if (sale !== null && sale >= regular) errors.push("ფასდაკლებული ფასი ჩვეულებრივ ფასზე ნაკლები უნდა იყოს");
      values.price = sale ?? regular;
      values.oldPrice = sale !== null ? regular : null;
    }
    if (regular === 0) warnings.push("ფასი 0 ₾-ია");

    if (cells.stockQty === CLEAR) values.stockQty = null;
    else if (cells.stockQty !== undefined) {
      const n = Number(cells.stockQty);
      if (!Number.isInteger(n) || n < 0 || n > 1_000_000) errors.push(`რაოდენობა არასწორია: ${cells.stockQty}`);
      else values.stockQty = n;
    }

    if (cells.specs === CLEAR) values.specs = [];
    else if (cells.specs !== undefined) {
      const specs = parseSpecs(cells.specs);
      if (!specs) errors.push("მახასიათებლები უნდა იყოს ფორმატით „ტიპი: 2-in-1; ფერი: შავი“");
      else values.specs = specs;
    }

    if (cells.colorHex === CLEAR) values.colorHex = null;
    else if (cells.colorHex !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(cells.colorHex)) errors.push("ფერის კოდი უნდა იყოს ფორმატით #RRGGBB");
      else values.colorHex = cells.colorHex;
    }

    if (cells.shippingClass === CLEAR) values.shippingClassId = null;
    else if (cells.shippingClass !== undefined) {
      const id = classToId.get(cells.shippingClass.toLowerCase());
      if (id === undefined) errors.push(`ლოჯისტიკური კლასი „${cells.shippingClass}“ ვერ მოიძებნა`);
      else values.shippingClassId = id;
    }

    if (cells.images === CLEAR) values.images = [];
    else if (cells.images !== undefined) {
      const images = cells.images.split(/[\s,]+/).filter(Boolean);
      if (images.length > 12) errors.push("მაქსიმუმ 12 სურათი");
      const bad = images.find((u) => !validImage(u));
      if (bad) errors.push(`სურათის ბმული არასწორია: ${bad}`);
      values.images = images;
    }

    if (cells.sceneImage === CLEAR) values.sceneImage = null;
    else if (cells.sceneImage !== undefined) {
      if (!validImage(cells.sceneImage)) errors.push(`ინტერიერის სურათის ბმული არასწორია: ${cells.sceneImage}`);
      values.sceneImage = cells.sceneImage;
    }

    plan.warnings.push(...warnings.map((message) => ({ row, message })));
    if (errors.length) {
      plan.errors.push(...errors.map((message) => ({ row, message })));
      continue;
    }

    if (current) {
      usedIds.add(current.id);
      const changed = Object.entries(values).filter(([k, v]) => !isSame(k, current![k as keyof Product], v));
      const name = values.name ?? current.name;
      const skuOut = values.sku ?? current.sku;
      if (!changed.length) plan.items.push({ action: "same", row, id: current.id, name, sku: skuOut, changes: [] });
      else
        plan.items.push({
          action: "update",
          row,
          id: current.id,
          name,
          sku: skuOut,
          changes: changed.map(([k]) => CHANGE_LABELS[k] ?? k),
          values: Object.fromEntries(changed) as ProductValues,
        });
    } else {
      const name = values.name!;
      const root = slugify(name) || "item";
      let slug = root;
      for (let n = 2; slugs.has(slug); n++) slug = `${root}-${n}`;
      slugs.add(slug);
      const hasImages = (values.images?.length ?? 0) > 0;
      if (values.published === undefined) {
        values.published = hasImages;
        if (!hasImages) plan.warnings.push({ row, message: `„${name}“ დაემატება დამალული, რადგან სურათი არ აქვს` });
      }
      plan.items.push({ action: "create", row, name, sku, changes: [], values: { ...values, name, slug } });
    }
  }
  return plan;
}
