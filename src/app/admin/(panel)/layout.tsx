import { Suspense } from "react";
import { eq, sql } from "drizzle-orm";
import { db, orders } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

async function Nav() {
  await requireAdmin();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.status, "new"));
  return <AdminNav newOrders={n} />;
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:flex min-h-screen">
      <Suspense fallback={<aside className="md:w-60 md:min-h-screen bg-white border-r border-slate-200" />}>
        <Nav />
      </Suspense>
      <main className="flex-1 min-w-0 p-4 md:p-8 max-w-6xl">
        <Suspense fallback={<p className="text-slate-500">იტვირთება…</p>}>{children}</Suspense>
      </main>
    </div>
  );
}
