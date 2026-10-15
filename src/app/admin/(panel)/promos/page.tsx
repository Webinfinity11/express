import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, promoCodes } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/data";
import { Button, PageTitle } from "@/components/admin/ui";
import { PromoToggle } from "@/components/admin/Toggles";

const day = (d: Date | null) => (d ? d.toLocaleDateString("ka-GE", { timeZone: "Asia/Tbilisi" }) : "");

export default async function PromosAdmin() {
  await requireAdmin();
  const rows = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  const now = new Date();
  return (
    <>
      <PageTitle
        actions={
          <Link href="/admin/promos/new">
            <Button>+ ახალი პრომოკოდი</Button>
          </Link>
        }
      >
        პრომოკოდები <span className="text-slate-400 font-normal text-lg">({rows.length})</span>
      </PageTitle>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">კოდი</th>
              <th className="p-3">ფასდაკლება</th>
              <th className="p-3">პირობა</th>
              <th className="p-3">ვადა</th>
              <th className="p-3 text-center">გამოყენება</th>
              <th className="p-3 text-center">აქტიური</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((p) => {
              const expired = p.endsAt && p.endsAt < now;
              const used = p.maxUses != null && p.usedCount >= p.maxUses;
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <Link href={`/admin/promos/${p.id}`} className="font-bold font-mono text-[#ff5a00]">
                      {p.code}
                    </Link>
                    {(expired || used) && <span className="ml-2 text-xs text-red-600">{expired ? "ვადაგასული" : "ლიმიტი ამოწურულია"}</span>}
                  </td>
                  <td className="p-3 font-semibold">{p.kind === "percent" ? `${money(p.value)}%` : `${money(p.value)} ₾`}</td>
                  <td className="p-3 text-slate-600">{p.minTotal > 0 ? `${money(p.minTotal)} ₾-დან` : "—"}</td>
                  <td className="p-3 text-slate-600 whitespace-nowrap">{p.startsAt || p.endsAt ? `${day(p.startsAt)} – ${day(p.endsAt)}` : "უვადო"}</td>
                  <td className="p-3 text-center">
                    {p.usedCount}
                    {p.maxUses != null && ` / ${p.maxUses}`}
                  </td>
                  <td className="p-3 text-center">
                    <PromoToggle id={p.id} value={p.active} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  პრომოკოდები ჯერ არ არის
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
