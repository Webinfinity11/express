import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, orders } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/admin-shared";
import { gel } from "@/lib/data";
import { PageTitle, StatusBadge } from "@/components/admin/ui";
import { AutoRefresh } from "@/components/admin/AutoRefresh";

export default async function OrdersAdmin({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const status = (await searchParams).status;
  const valid = ORDER_STATUSES.find((s) => s === status);
  const rows = await db
    .select()
    .from(orders)
    .where(valid ? eq(orders.status, valid) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(200);

  return (
    <>
      <AutoRefresh />
      <PageTitle>შეკვეთები</PageTitle>
      <div className="flex flex-wrap gap-2 mb-4">
        {[undefined, ...ORDER_STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/orders?status=${s}` : "/admin/orders"}
            className={`rounded-full px-3 py-1.5 text-sm border ${valid === s ? "bg-[#ff5a00] text-white border-[#ff5a00]" : "bg-white border-slate-300"}`}
          >
            {s ? ORDER_STATUS_LABELS[s] : "ყველა"}
          </Link>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">ნომერი</th>
              <th className="p-3">თარიღი</th>
              <th className="p-3">მომხმარებელი</th>
              <th className="p-3">პროდუქტი</th>
              <th className="p-3 text-right">ჯამი</th>
              <th className="p-3">სტატუსი</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="p-3 font-semibold whitespace-nowrap">
                  <Link href={`/admin/orders/${o.id}`} className="text-[#ff5a00]">
                    {o.number}
                  </Link>
                </td>
                <td className="p-3 whitespace-nowrap text-slate-500">{o.createdAt.toLocaleString("ka-GE", { timeZone: "Asia/Tbilisi" })}</td>
                <td className="p-3">
                  <Link href={`/admin/orders/${o.id}`}>
                    <b>{o.name}</b>
                    <br />
                    <span className="text-slate-500">{o.phone}</span>
                  </Link>
                </td>
                <td className="p-3">{o.items.reduce((n, i) => n + i.qty, 0)} ც.</td>
                <td className="p-3 text-right font-semibold whitespace-nowrap">{gel(o.total)}</td>
                <td className="p-3">
                  <StatusBadge status={o.status} label={ORDER_STATUS_LABELS[o.status]} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  შეკვეთები არ არის
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ადმინი ყოველ ჯერზე შესვლას ამოწმებს — მყისიერი ნავიგაციის შემოწმება არ სჭირდება
export const instant = false;
