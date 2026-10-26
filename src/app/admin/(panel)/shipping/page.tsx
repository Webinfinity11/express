import Link from "next/link";
import { asc, isNotNull, sql } from "drizzle-orm";
import { categories, db, products, shippingClasses } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { PageTitle } from "@/components/admin/ui";
import { ShippingClassesForm } from "@/components/admin/ShippingClassesForm";

export default async function ShippingAdmin() {
  await requireAdmin();
  const [classes, catUse, productUse] = await Promise.all([
    db.select().from(shippingClasses).orderBy(asc(shippingClasses.sortOrder), asc(shippingClasses.id)),
    db
      .select({ id: categories.shippingClassId, n: sql<number>`count(*)::int` })
      .from(categories)
      .where(isNotNull(categories.shippingClassId))
      .groupBy(categories.shippingClassId),
    db
      .select({ id: products.shippingClassId, n: sql<number>`count(*)::int` })
      .from(products)
      .where(isNotNull(products.shippingClassId))
      .groupBy(products.shippingClassId),
  ]);
  const usage: Record<number, { cats: number; products: number }> = {};
  for (const c of classes) usage[c.id] = { cats: 0, products: 0 };
  for (const r of catUse) if (r.id && usage[r.id]) usage[r.id].cats = r.n;
  for (const r of productUse) if (r.id && usage[r.id]) usage[r.id].products = r.n;

  return (
    <>
      <PageTitle>მიწოდება</PageTitle>
      <div className="mb-5 text-sm text-slate-600 grid gap-1 max-w-3xl">
        <p>
          კლასი ენიჭება <Link href="/admin/categories" className="font-semibold text-[#ff5a00]">კატეგორიას</Link> (ვრცელდება მის
          ქვეკატეგორიებზეც) ან ცალკე პროდუქტს. პროდუქტის კლასი ჭარბობს კატეგორიისას.
        </p>
        <p>
          მიწოდების ფასი = კლასის ფასი × რაოდენობა. ბათუმი და სხვა ქალაქები ითვლება რეგიონად. კლასის გარეშე ნივთებზე მოქმედებს{" "}
          <Link href="/admin/content/shipping" className="font-semibold text-[#ff5a00]">საერთო ტარიფი</Link>, იქვე მითითებული
          უფასო მიწოდების ზღვარიც.
        </p>
      </div>
      <ShippingClassesForm classes={classes} usage={usage} />
    </>
  );
}

// ადმინი ყოველ ჯერზე შესვლას ამოწმებს — მყისიერი ნავიგაციის შემოწმება არ სჭირდება
export const instant = false;
