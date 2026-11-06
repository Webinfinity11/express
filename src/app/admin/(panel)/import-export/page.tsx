import { sql } from "drizzle-orm";
import { db, products } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { PageTitle } from "@/components/admin/ui";
import { ImportExportPanel } from "@/components/admin/ImportExportPanel";
import { PhotoUploadPanel } from "@/components/admin/PhotoUploadPanel";

export default async function ImportExportAdmin() {
  await requireAdmin();
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(products);
  return (
    <>
      <PageTitle>იმპორტი / ექსპორტი</PageTitle>
      <ImportExportPanel total={total} />
      <div className="mt-5 max-w-5xl">
        <PhotoUploadPanel />
      </div>
    </>
  );
}

// ადმინი ყოველ ჯერზე შესვლას ამოწმებს — მყისიერი ნავიგაციის შემოწმება არ სჭირდება
export const instant = false;
