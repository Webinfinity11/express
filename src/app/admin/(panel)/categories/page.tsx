import Link from "next/link";
import { asc, sql } from "drizzle-orm";
import { categories, db, products, type CategoryRow } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Button, PageTitle } from "@/components/admin/ui";

export default async function CategoriesAdmin() {
  await requireAdmin();
  const [cats, counts] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db
      .select({ id: products.categoryId, n: sql<number>`count(*)::int` })
      .from(products)
      .groupBy(products.categoryId),
  ]);
  const count = (id: number) => counts.find((c) => c.id === id)?.n ?? 0;
  const childrenOf = (id: number | null) => cats.filter((c) => c.parentId === id);
  const levels = ["სექცია", "ჯგუფი", "ქვეკატეგორია"];

  const rows = (list: CategoryRow[], depth: number): React.ReactNode[] =>
    list.flatMap((c) => [
      <div key={c.id} className="flex items-center gap-3 py-2 pr-3 hover:bg-slate-50" style={{ paddingLeft: 12 + depth * 28 }}>
        <Link href={`/admin/categories/${c.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <span className="w-10 h-10 shrink-0 rounded bg-slate-50 overflow-hidden">
            {c.image && <img src={c.image} alt="" className="w-full h-full object-contain" />}
          </span>
          <span className={`truncate ${depth === 0 ? "font-bold" : ""}`}>{c.name}</span>
          {c.showOnHome && <span className="text-[11px] rounded-full bg-orange-100 text-[#c94700] px-2 py-0.5 whitespace-nowrap">მთავარზე</span>}
        </Link>
        <span className="text-xs text-slate-400 hidden sm:inline">{levels[depth] ?? ""}</span>
        <span className="text-sm text-slate-400 w-16 text-right">{count(c.id)} პროდ.</span>
        {depth < 2 && (
          <Link href={`/admin/categories/new?parent=${c.id}`} className="text-sm font-semibold text-[#ff5a00] whitespace-nowrap" title="ქვეკატეგორიის დამატება">
            + ქვე
          </Link>
        )}
      </div>,
      ...rows(childrenOf(c.id), depth + 1),
    ]);

  return (
    <>
      <PageTitle
        actions={
          <Link href="/admin/categories/new">
            <Button>+ ახალი სექცია</Button>
          </Link>
        }
      >
        კატეგორიები <span className="text-slate-400 font-normal text-lg">({cats.length})</span>
      </PageTitle>
      <p className="text-slate-500 -mt-4 mb-5 text-sm">
        სტრუქტურა: <b>სექცია</b> (მენიუს მარცხენა სვეტი) → <b>ჯგუფი</b> → <b>ქვეკატეგორია</b>. „მთავარზე“ მონიშნული კატეგორიები ჩანს მთავარი გვერდის
        ბადეში და მაღაზიის ზოლში — სურათით.
      </p>
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">{rows(childrenOf(null), 0)}</div>
    </>
  );
}
