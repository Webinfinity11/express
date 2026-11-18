import { eq } from "drizzle-orm";
import { db, settings } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { requireAdmin } from "@/lib/auth";
import { SEO_SETTINGS_KEY, mergeSeoSettings } from "@/lib/seo-shared";
import { PageTitle } from "@/components/admin/ui";
import { SeoTabs } from "@/components/admin/seo/SeoTabs";
import { SeoSettingsForm } from "@/components/admin/seo/SeoSettingsForm";

export default async function SeoSitemap() {
  await requireAdmin();
  await ensureSchema();
  const [row] = await db.select().from(settings).where(eq(settings.key, SEO_SETTINGS_KEY));
  return (
    <>
      <PageTitle>SEO</PageTitle>
      <SeoTabs />
      <SeoSettingsForm initial={mergeSeoSettings(row?.value)} section="sitemap" />
    </>
  );
}

// ადმინი ყოველ ჯერზე შესვლას ამოწმებს — მყისიერი ნავიგაციის შემოწმება არ სჭირდება
export const instant = false;
