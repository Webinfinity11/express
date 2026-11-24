import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { categories, db, products, shippingClasses } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { requireAdmin } from "@/lib/auth";
import { PageTitle } from "@/components/admin/ui";
import { EntitySeoBox } from "@/components/admin/seo/EntitySeoBox";
import { computeAttrGroups, ATTR_AUTO_LIMIT } from "@/lib/filter-attrs";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function EditCategory({ params, searchParams }: PageProps<"/admin/categories/[id]">) {
  await requireAdmin();
  await ensureSchema();
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
  // ამ კატეგორიისა და მისი ქვეკატეგორიების პროდუქტებიდან გამოსული მახასიათებლები
  let attrOptions: { label: string; count: number; auto: boolean }[] = [];
  if (category) {
    const ids = new Set<number>([category.id]);
    for (let grew = true; grew; ) {
      grew = false;
      for (const c of all) if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) (ids.add(c.id), (grew = true));
    }
    const rows = await db.select({ categoryId: products.categoryId, specs: products.specs }).from(products);
    const groups = computeAttrGroups(rows.filter((r) => r.categoryId && ids.has(r.categoryId)).map((r) => r.specs.map((s) => [s.label, s.value] as [string, string])));
    attrOptions = groups.map((g, i) => ({ label: g.label, count: g.total, auto: i < ATTR_AUTO_LIMIT }));
  }
  return (
    <>
      <PageTitle>
        <Link href="/admin/categories" className="text-slate-400 font-normal">
          კატეგორიები /
        </Link>{" "}
        {category ? category.name : "ახალი კატეგორია"}
      </PageTitle>
      <CategoryForm category={category} all={all} defaultParent={parent} classes={classes} attrOptions={attrOptions} />
      {category && (
        <div className="mt-6 max-w-3xl">
          <EntitySeoBox kind="category" row={category} />
        </div>
      )}
    </>
  );
}

// ადმინი ყოველ ჯერზე შესვლას ამოწმებს — მყისიერი ნავიგაციის შემოწმება არ სჭირდება
export const instant = false;
