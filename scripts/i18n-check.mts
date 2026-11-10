/**
 * თარგმანის შემოწმება: npx tsx scripts/i18n-check.mts [ფაილები/საქაღალდეები...]
 *  1) t("...")-ები, რომლებსაც ინგლისური თარგმანი აკლია src/i18n/en-ში
 *  2) --raw: სტრიქონები ქართული ტექსტით t()-ის გარეშე (კომენტარების გარდა) — სავარაუდოდ გამოტოვებული
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { en } from "../src/i18n/en/index";

const root = process.cwd();
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const showRaw = process.argv.includes("--raw");
const SKIP = /[\\/](admin|i18n)[\\/]|[\\/]lib[\\/](actions|product-sheet|attribute-suggestions|photo-match|auth)\b|content-schema|[\\/]db[\\/]|mail\.ts$|bog\.ts$/;

function walk(p: string, out: string[] = []) {
  if (statSync(p).isDirectory()) for (const f of readdirSync(p)) walk(join(p, f), out);
  else if (/\.(tsx?|mts)$/.test(p)) out.push(p);
  return out;
}

const files = (args.length ? args : ["src"]).flatMap((a) => walk(join(root, a))).filter((f) => args.length || !SKIP.test(f));
const GEO = /[Ⴀ-ჿ]/;
const T_CALL = /\bt\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g;
let missing = 0;
const raw: string[] = [];

for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(T_CALL)) {
    const s = m[2].replace(/\\(["'`\\])/g, "$1").replace(/\\n/g, "\n");
    if (m[1] === "`" && s.includes("${")) {
      console.log(`⚠ ${relative(root, f)}: t() with \${} — use {var} placeholders: ${s.slice(0, 60)}`);
      continue;
    }
    if (GEO.test(s) && !(s in en)) {
      missing++;
      console.log(`✗ ${relative(root, f)}: ${JSON.stringify(s)}`);
    }
  }
  if (showRaw) {
    src.split("\n").forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "").replace(/\{\s*\/\*.*?\*\/\s*\}/g, "");
      if (/^\s*(\*|\/\*)/.test(line)) return;
      const stripped = code.replace(T_CALL, "");
      if (GEO.test(stripped)) raw.push(`${relative(root, f)}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
}

if (showRaw && raw.length) console.log(`\nქართული ტექსტი t()-ის გარეშე (${raw.length}):\n` + raw.join("\n"));
console.log(`\n${missing ? `✗ ${missing} missing translation(s)` : "✓ all t() strings translated"}`);
process.exit(missing ? 1 : 0);
