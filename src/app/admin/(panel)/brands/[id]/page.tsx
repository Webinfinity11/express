import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { brands, db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { PageTitle } from "@/components/admin/ui";
import { BrandForm } from "@/components/admin/BrandForm";

export default async function EditBrand({ params }: PageProps<"/admin/brands/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "new";
  const [brand] = isNew ? [null] : await db.select().from(brands).where(eq(brands.id, Number(id) || 0));
  if (!isNew && !brand) notFound();
  return (
    <>
      <PageTitle>
        <Link href="/admin/brands" className="text-slate-400 font-normal">
          ბრენდები /
        </Link>{" "}
        {brand ? brand.name : "ახალი ბრენდი"}
      </PageTitle>
      <BrandForm brand={brand} />
    </>
  );
}

// ადმინი ყოველ ჯერზე შესვლას ამოწმებს — მყისიერი ნავიგაციის შემოწმება არ სჭირდება
export const instant = false;
