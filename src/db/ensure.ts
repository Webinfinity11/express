import "server-only";
import { sql } from "drizzle-orm";
import { db } from "./index";

/**
 * ახალი ველები, რომლებიც drizzle-kit push-ის გარეშე ემატება (ერთხელ, IF NOT EXISTS):
 * ონლაინ გადახდა (orders), ინგლისური თარგმანი (en jsonb) და SEO (seo jsonb, seo_redirects). არსებულ მონაცემებს არ ეხება.
 */
let ready: Promise<unknown> | null = null;
export function ensureSchema() {
  ready ??= (async () => {
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text, ADD COLUMN IF NOT EXISTS bog_order_id text`);
    for (const table of ["categories", "products", "product_variants", "pages"])
      await db.execute(sql.raw(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS en jsonb NOT NULL DEFAULT '{}'::jsonb`));
    await db.execute(sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS filters jsonb`);
    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url text`);
    await db.execute(sql`ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS specs jsonb NOT NULL DEFAULT '[]'::jsonb`);
    await db.execute(sql`ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb`);
    // SEO: ველები ჩანაწერებზე და გადამისამართებების ცხრილი
    for (const table of ["categories", "products", "pages"])
      await db.execute(sql.raw(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS seo jsonb NOT NULL DEFAULT '{}'::jsonb`));
    await db.execute(sql`CREATE TABLE IF NOT EXISTS seo_redirects (
      id serial PRIMARY KEY,
      source text NOT NULL,
      match_type text NOT NULL DEFAULT 'exact',
      target text NOT NULL DEFAULT '',
      code integer NOT NULL DEFAULT 301,
      active boolean NOT NULL DEFAULT true,
      hits integer NOT NULL DEFAULT 0,
      last_hit timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}
