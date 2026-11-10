import "server-only";
import { sql } from "drizzle-orm";
import { db } from "./index";

/**
 * ახალი ველები, რომლებიც drizzle-kit push-ის გარეშე ემატება (ერთხელ, IF NOT EXISTS):
 * ონლაინ გადახდა (orders) და ინგლისური თარგმანი (en jsonb). არსებულ მონაცემებს არ ეხება.
 */
let ready: Promise<unknown> | null = null;
export function ensureSchema() {
  ready ??= (async () => {
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text, ADD COLUMN IF NOT EXISTS bog_order_id text`);
    for (const table of ["categories", "products", "product_variants", "pages"])
      await db.execute(sql.raw(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS en jsonb NOT NULL DEFAULT '{}'::jsonb`));
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}
