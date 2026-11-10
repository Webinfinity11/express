/**
 * ინგლისური ლექსიკონი: ქართული ტექსტი → ინგლისური.
 * თითოეული ფაილი თავის ნაწილს ფარავს; გასაღები ზუსტად უნდა ემთხვეოდეს t("...")-ში დაწერილ ქართულს.
 */
import { common } from "./common";
import { layout } from "./layout";
import { shop } from "./shop";
import { product } from "./product";
import { cart } from "./cart";
import { pages } from "./pages";
import { content } from "./content";

export const en: Record<string, string> = { ...common, ...layout, ...shop, ...product, ...cart, ...pages, ...content };
