import Link from "next/link";
import { asc } from "drizzle-orm";
import { brands, db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Button, PageTitle } from "@/components/admin/ui";

export default async function BrandsAdmin() {
  await requireAdmin();
  const rows = await db.select().from(brands).orderBy(asc(brands.sortOrder), asc(brands.name));
  return (
    <>
      <PageTitle
        actions={
          <Link href="/admin/brands/new">
            <Button>+ ახალი ბრენდი</Button>
          </Link>
        }
      >
        ბრენდები <span className="text-slate-400 font-normal text-lg">({rows.length})</span>
      </PageTitle>
      <p className="text-slate-500 -mt-4 mb-5 text-sm">ლოგოები ჩანს მთავარი გვერდის ბრენდების ზოლში. ლოგოს გარეშე ბრენდი ტექსტად გამოჩნდება.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {rows.map((b) => (
          <Link
            key={b.id}
            href={`/admin/brands/${b.id}`}
            className={`bg-white rounded-xl border border-slate-200 p-4 hover:border-orange-300 grid gap-3 ${b.showInStrip ? "" : "opacity-50"}`}
          >
            <span className="h-14 grid place-items-center">
              {b.logo ? <img src={b.logo} alt="" className="max-h-12 max-w-full object-contain" /> : <b className="text-xl">{b.name}</b>}
            </span>
            <span className="text-sm font-semibold text-center">
              {b.name}
              {!b.showInStrip && <span className="block text-xs font-normal text-slate-500">დამალული</span>}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}

// ადმინი ყოველ ჯერზე შესვლას ამოწმებს — მყისიერი ნავიგაციის შემოწმება არ სჭირდება
export const instant = false;
