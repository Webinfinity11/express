import "server-only";
import { eq } from "drizzle-orm";
import { db, promoCodes } from "@/db";
import type { Promo } from "@/lib/data";

/** აქტიური პრომოკოდი ან შეცდომის ტექსტი */
export async function findPromo(raw: string): Promise<{ promo: Promo } | { error: string }> {
  const code = raw.trim().toUpperCase().slice(0, 40);
  if (!code) return { error: "შეიყვანეთ პრომოკოდი." };
  const [row] = await db.select().from(promoCodes).where(eq(promoCodes.code, code));
  const now = new Date();
  if (!row || !row.active) return { error: "პრომოკოდი არ მოიძებნა." };
  if (row.startsAt && row.startsAt > now) return { error: "პრომოკოდი ჯერ არ არის აქტიური." };
  if (row.endsAt && row.endsAt < now) return { error: "პრომოკოდის ვადა ამოიწურა." };
  if (row.maxUses != null && row.usedCount >= row.maxUses) return { error: "პრომოკოდის ლიმიტი ამოიწურა." };
  return { promo: { code: row.code, kind: row.kind === "fixed" ? "fixed" : "percent", value: row.value, minTotal: row.minTotal } };
}
