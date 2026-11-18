import { desc } from "drizzle-orm";
import { db, seoRedirects } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { requireAdmin } from "@/lib/auth";
import { PageTitle } from "@/components/admin/ui";
import { SeoTabs } from "@/components/admin/seo/SeoTabs";
import { RedirectsManager } from "@/components/admin/seo/RedirectsManager";

export default async function SeoRedirects() {
  await requireAdmin();
  await ensureSchema();
  const rows = await db.select().from(seoRedirects).orderBy(desc(seoRedirects.id));
  return (
    <>
      <PageTitle>SEO</PageTitle>
      <SeoTabs />
      <RedirectsManager rows={rows} />
    </>
  );
}

// ადმინი ყოველ ჯერზე შესვლას ამოწმებს — მყისიერი ნავიგაციის შემოწმება არ სჭირდება
export const instant = false;
