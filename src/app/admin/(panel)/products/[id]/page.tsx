import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { brands, categories, db, productVariants, products } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { PageTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "new";
  const [product] = isNew ? [null] : await db.select().from(products).where(eq(products.id, Number(id) || 0));
  if (!isNew && !product) notFound();
  const [cats, variants, brandRows] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, parentId: categories.parentId })
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
    product
      ? db.select().from(productVariants).where(eq(productVariants.productId, product.id)).orderBy(asc(productVariants.sortOrder))
      : [],
    db.select({ name: brands.name }).from(brands).orderBy(asc(brands.name)),
  ]);

  return (
    <>
      <PageTitle
        actions={
          product?.published && (
            <a href={`/product/${product.slug}`} target="_blank" className="text-sm font-semibold text-[#ff5a00]">
              საიტზე ნახვა ↗
            </a>
          )
        }
      >
        <Link href="/admin/products" className="text-slate-400 font-normal">
          პროდუქცია /
        </Link>{" "}
        {product ? product.name : "ახალი პროდუქტი"}
      </PageTitle>
      <ProductForm product={product} variants={variants} categories={cats} brands={brandRows.map((b) => b.name)} />
    </>
  );
}

// ადმინი ყოველ ჯერზე შესვლას ამოწმებს — მყისიერი ნავიგაციის შემოწმება არ სჭირდება
export const instant = false;
