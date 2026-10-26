import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { categories, db, shippingClasses } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { PageTitle } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function EditCategory({ params, searchParams }: PageProps<"/admin/categories/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const parent = Number((await searchParams).parent) || null;
  const isNew = id === "new";
  const [category] = isNew ? [null] : await db.select().from(categories).where(eq(categories.id, Number(id) || 0));
  if (!isNew && !category) notFound();
  const [all, classes] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, parentId: categories.parentId, shippingClassId: categories.shippingClassId })
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select().from(shippingClasses).orderBy(asc(shippingClasses.sortOrder)),
  ]);
  return (
    <>
      <PageTitle>
        <Link href="/admin/categories" className="text-slate-400 font-normal">
          კატეგორიები /
        </Link>{" "}
        {category ? category.name : "ახალი კატეგორია"}
      </PageTitle>
      <CategoryForm category={category} all={all} defaultParent={parent} classes={classes} />
    </>
  );
}

// ადმინი ყოველ ჯერზე შესვლას ამოწმებს — მყისიერი ნავიგაციის შემოწმება არ სჭირდება
export const instant = false;
