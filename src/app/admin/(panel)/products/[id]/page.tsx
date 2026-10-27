import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { brands, categories, db, productVariants, products, shippingClasses } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { PageTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { DuplicateButton } from "@/components/admin/DuplicateButton";
import { getAttrSuggestions } from "@/lib/attribute-suggestions";

export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "new";
  const [product] = isNew ? [null] : await db.select().from(products).where(eq(products.id, Number(id) || 0));
  if (!isNew && !product) notFound();
  const [cats, variants, brandRows, classes, suggestions] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, parentId: categories.parentId, shippingClassId: categories.shippingClassId })
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
    product
      ? db.select().from(productVariants).where(eq(productVariants.productId, product.id)).orderBy(asc(productVariants.sortOrder))
      : [],
    db.select({ name: brands.name }).from(brands).orderBy(asc(brands.name)),
    db.select().from(shippingClasses).orderBy(asc(shippingClasses.sortOrder)),
    getAttrSuggestions(),
  ]);

  return (
    <>
      <PageTitle
        actions={
          product && (
            <div className="flex items-center gap-4">
              <DuplicateButton id={product.id} />
              {product.published && (
                <a href={`/product/${product.slug}`} target="_blank" className="text-sm font-semibold text-[#ff5a00]">
                  საიტზე ნახვა ↗
                </a>
              )}
            </div>
          )
        }
      >
        <Link href="/admin/products" className="text-slate-400 font-normal">
          პროდუქცია /
        </Link>{" "}
        {product ? product.name : "ახალი პროდუქტი"}
      </PageTitle>
      <ProductForm product={product} variants={variants} categories={cats} brands={brandRows.map((b) => b.name)} classes={classes} suggestions={suggestions} />
    </>
  );
}

// ადმინი ყოველ ჯერზე შესვლას ამოწმებს — მყისიერი ნავიგაციის შემოწმება არ სჭირდება
export const instant = false;
