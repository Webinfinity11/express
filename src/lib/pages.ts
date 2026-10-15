import "server-only";
import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, pages } from "@/db";

/** გამოქვეყნებული გვერდები; ადმინში შენახვისას updateTag("pages") ანახლებს. */
export async function getPages() {
  "use cache";
  cacheLife("hours");
  cacheTag("pages");
  return db.select().from(pages).where(eq(pages.published, true)).orderBy(asc(pages.title));
}
