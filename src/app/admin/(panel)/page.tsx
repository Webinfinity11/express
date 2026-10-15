import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { categories, db, orders, products, promoCodes } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUS_LABELS } from "@/lib/admin-shared";
import { gel } from "@/lib/data";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";
import { AutoRefresh } from "@/components/admin/AutoRefresh";

export default async function Dashboard() {
  await requireAdmin();
  const [[stats], [cats], [promos], recent] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        published: sql<number>`count(*) filter (where ${products.published})::int`,
        newOrders: sql<number>`(select count(*) from orders where status = 'new')::int`,
        noImage: sql<number>`count(*) filter (where jsonb_array_length(${products.images}) = 0)::int`,
      })
      .from(products),
    db.select({ n: sql<number>`count(*)::int` }).from(categories),
    db.select({ n: sql<number>`count(*) filter (where ${promoCodes.active})::int` }).from(promoCodes),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
  ]);

  const tiles = [
    ["ახალი შეკვეთები", stats.newOrders, "/admin/orders?status=new"],
    ["აქტიური პროდუქტი", `${stats.published} / ${stats.total}`, "/admin/products"],
    ["კატეგორია", cats.n, "/admin/categories"],
    ["აქტიური პრომოკოდი", promos.n, "/admin/promos"],
  ] as const;

  return (
    <>
      <AutoRefresh />
      <PageTitle>მთავარი</PageTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {tiles.map(([label, value, href]) => (
          <Link key={label} href={href} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-orange-300">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
          </Link>
        ))}
      </div>
      {stats.noImage > 0 && (
        <p className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          {stats.noImage} პროდუქტს სურათი არ აქვს.
        </p>
      )}
      <Card title="ბოლო შეკვეთები" actions={<Link href="/admin/orders" className="text-sm font-semibold text-[#ff5a00]">ყველა →</Link>}>
        {recent.length === 0 ? (
          <p className="text-slate-500">შეკვეთები ჯერ არ არის.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded">
                <span className="font-semibold">{o.number}</span>
                <span className="flex-1 min-w-0 truncate">
                  {o.name} · {o.phone}
                </span>
                <StatusBadge status={o.status} label={ORDER_STATUS_LABELS[o.status]} />
                <span className="font-semibold w-24 text-right">{gel(o.total)}</span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

// ადმინი ყოველ ჯერზე შესვლას ამოწმებს — მყისიერი ნავიგაციის შემოწმება არ სჭირდება
export const instant = false;
