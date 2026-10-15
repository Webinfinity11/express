import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, promoCodes } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { PageTitle } from "@/components/admin/ui";
import { PromoForm } from "@/components/admin/PromoForm";

export default async function EditPromo({ params }: PageProps<"/admin/promos/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "new";
  const [promo] = isNew ? [null] : await db.select().from(promoCodes).where(eq(promoCodes.id, Number(id) || 0));
  if (!isNew && !promo) notFound();
  return (
    <>
      <PageTitle>
        <Link href="/admin/promos" className="text-slate-400 font-normal">
          პრომოკოდები /
        </Link>{" "}
        {promo ? promo.code : "ახალი პრომოკოდი"}
      </PageTitle>
      <PromoForm promo={promo} />
    </>
  );
}
