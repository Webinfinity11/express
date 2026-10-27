import Link from "next/link";
import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { categories, db, productVariants, products } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/data";
import { Button, PageTitle, inputCls } from "@/components/admin/ui";
import { FlagToggle } from "@/components/admin/Toggles";
import { DuplicateButton } from "@/components/admin/DuplicateButton";

const PER_PAGE = 50;
const filters = { "": "ყველა", hidden: "დამალული", sale: "ფასდაკლებით", noimage: "სურათის გარეშე", out: "არ არის მარაგში", low: "მცირე მარაგი (≤5)" };

export default async function ProductsAdmin({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = (await searchParams) as Record<string, string | undefined>;
  const q = sp.q?.trim() ?? "";
  const cat = Number(sp.cat) || 0;
  const filter = (sp.filter ?? "") as keyof typeof filters;
  const page = Math.max(1, Number(sp.page) || 1);

  const cats = await db
    .select({ id: categories.id, name: categories.name, parentId: categories.parentId })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  const where: (SQL | undefined)[] = [];
  if (q) where.push(or(ilike(products.name, `%${q}%`), ilike(products.sku, `%${q}%`), ilike(products.brand, `%${q}%`)));
  if (cat) {
    // არჩეული კატეგორია ყველა ქვეკატეგორიით
    const ids = [cat];
    for (let i = 0; i < ids.length; i++) cats.filter((c) => c.parentId === ids[i]).forEach((c) => ids.push(c.id));
    where.push(inArray(products.categoryId, ids));
  }
  if (filter === "hidden") where.push(eq(products.published, false));
  if (filter === "sale") where.push(sql`${products.oldPrice} > ${products.price}`);
  if (filter === "noimage") where.push(sql`jsonb_array_length(${products.images}) = 0`);
  if (filter === "out") where.push(or(eq(products.inStock, false), eq(products.stockQty, 0)));
  if (filter === "low") where.push(sql`${products.stockQty} <= 5`);

  const cond = and(...where);
  const [rows, [{ total }], variantCounts] = await Promise.all([
    db
      .select()
      .from(products)
      .where(cond)
      .orderBy(desc(products.updatedAt), desc(products.id))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ total: sql<number>`count(*)::int` }).from(products).where(cond),
    db.select({ id: productVariants.productId, n: sql<number>`count(*)::int` }).from(productVariants).groupBy(productVariants.productId),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const link = (patch: Record<string, string | number>) => {
    const p = new URLSearchParams(
      Object.entries({ ...sp, ...patch }).filter(([, v]) => v !== "" && v !== undefined && v !== 0) as [string, string][],
    );
    return `/admin/products?${p}`;
  };
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const options: { id: number; label: string }[] = [];
  const walk = (pid: number | null, depth: number) =>
    cats
      .filter((c) => c.parentId === pid)
      .forEach((c) => {
        options.push({ id: c.id, label: `${"— ".repeat(depth)}${c.name}` });
        walk(c.id, depth + 1);
      });
  walk(null, 0);

  return (
    <>
      <PageTitle
        actions={
          <Link href="/admin/products/new">
            <Button>+ ახალი პროდუქტი</Button>
          </Link>
        }
      >
        პროდუქცია <span className="text-slate-400 font-normal text-lg">({total})</span>
      </PageTitle>

      <form className="flex flex-wrap gap-2 mb-3" action="/admin/products">
        <input name="q" defaultValue={q} placeholder="ძიება: სახელი, კოდი, ბრენდი" className={`${inputCls} flex-1 min-w-48`} />
        <select name="cat" defaultValue={cat || ""} className={`${inputCls} w-auto max-w-72`}>
          <option value="">ყველა კატეგორია</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        {filter && <input type="hidden" name="filter" value={filter} />}
        <Button variant="secondary">ძიება</Button>
      </form>
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(filters).map(([key, label]) => (
          <Link
            key={key}
            href={link({ filter: key, page: 1 })}
            className={`rounded-full px-3 py-1.5 text-sm border ${filter === key ? "bg-[#ff5a00] text-white border-[#ff5a00]" : "bg-white border-slate-300"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3 w-16"></th>
              <th className="p-3">დასახელება</th>
              <th className="p-3">კატეგორია</th>
              <th className="p-3 text-right">ფასი</th>
              <th className="p-3 text-center">მარაგში</th>
              <th className="p-3 text-center">პოპულარული</th>
              <th className="p-3 text-center">საიტზე</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((p) => {
              const variants = variantCounts.find((v) => v.id === p.id)?.n ?? 0;
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-2">
                    <div className="w-12 h-12 bg-slate-50 rounded overflow-hidden">
                      {p.images[0] && <img src={p.images[0]} alt="" className="w-full h-full object-contain" />}
                    </div>
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-[#ff5a00]">
                      {p.name}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {[p.brand, p.sku, variants ? `${variants} ვარიაცია` : ""].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">{p.categoryId ? catName.get(p.categoryId) : <span className="text-amber-600">—</span>}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <b>{money(p.price)} ₾</b>
                    {p.oldPrice && p.oldPrice > p.price && <s className="ml-1.5 text-slate-400">{money(p.oldPrice)}</s>}
                  </td>
                  <td className="p-3 text-center">
                    {p.stockQty != null ? (
                      <span className={`font-semibold ${p.stockQty === 0 ? "text-red-600" : p.stockQty <= 5 ? "text-amber-600" : "text-green-700"}`}>
                        {p.stockQty} ც.
                      </span>
                    ) : (
                      <FlagToggle id={p.id} flag="inStock" value={p.inStock} />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <FlagToggle id={p.id} flag="featured" value={p.featured} />
                  </td>
                  <td className="p-3 text-center">
                    <FlagToggle id={p.id} flag="published" value={p.published} />
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <DuplicateButton id={p.id} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  ვერაფერი მოიძებნა
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex gap-2 justify-center mt-5">
          {page > 1 && (
            <Link className="px-3 py-2 rounded-lg border bg-white" href={link({ page: page - 1 })}>
              ← წინა
            </Link>
          )}
          <span className="px-3 py-2">
            {page} / {pages}
          </span>
          {page < pages && (
            <Link className="px-3 py-2 rounded-lg border bg-white" href={link({ page: page + 1 })}>
              შემდეგი →
            </Link>
          )}
        </div>
      )}
    </>
  );
}

// ადმინი ყოველ ჯერზე შესვლას ამოწმებს — მყისიერი ნავიგაციის შემოწმება არ სჭირდება
export const instant = false;
