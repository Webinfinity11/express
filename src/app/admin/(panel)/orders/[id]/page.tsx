import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, orders } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { DELIVERY_LABELS, PAYMENT_LABELS } from "@/lib/admin-shared";
import { CITIES, gel } from "@/lib/data";
import { Card, PageTitle } from "@/components/admin/ui";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";

export default async function OrderDetail({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const [order] = await db.select().from(orders).where(eq(orders.id, Number((await params).id) || 0));
  if (!order) notFound();
  const info: [string, React.ReactNode][] = [
    ["სახელი", <b key="n">{order.name}</b>],
    [
      "ტელეფონი",
      <a key="p" href={`tel:+995${order.phone}`} className="font-semibold text-[#ff5a00]">
        {order.phone}
      </a>,
    ],
    ...(order.email ? ([["ელფოსტა", order.email]] as [string, string][]) : []),
    ["მიწოდება", `${DELIVERY_LABELS[order.delivery] ?? order.delivery}${order.delivery === "courier" ? ` · ${CITIES[order.city as keyof typeof CITIES] ?? order.city}` : ""}`],
    ...(order.address ? ([["მისამართი", order.address]] as [string, string][]) : []),
    ["გადახდა", PAYMENT_LABELS[order.payment] ?? order.payment],
    ...(order.comment ? ([["კომენტარი", order.comment]] as [string, string][]) : []),
    ["თარიღი", order.createdAt.toLocaleString("ka-GE", { timeZone: "Asia/Tbilisi" })],
  ];

  return (
    <>
      <PageTitle actions={<OrderStatusSelect id={order.id} status={order.status} />}>
        <Link href="/admin/orders" className="text-slate-400 font-normal">
          შეკვეთები /
        </Link>{" "}
        {order.number}
      </PageTitle>
      <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
        <Card title="პროდუქცია">
          <div className="divide-y divide-slate-100">
            {order.items.map((i) => (
              <div key={i.key} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <Link href={`/admin/products/${i.productId}`} className="font-semibold hover:text-[#ff5a00]">
                    {i.name}
                  </Link>
                  <div className="text-xs text-slate-500">{[i.variant, i.sku && `კოდი: ${i.sku}`].filter(Boolean).join(" · ")}</div>
                </div>
                <div className="text-right whitespace-nowrap">
                  {i.qty} × {gel(i.unit)}
                  <div className="font-semibold">{gel(i.total)}</div>
                </div>
              </div>
            ))}
          </div>
          <dl className="border-t border-slate-200 pt-3 mt-2 grid gap-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">პროდუქცია</dt>
              <dd>{gel(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-700">
                <dt>პრომოკოდი {order.promoCode}</dt>
                <dd>−{gel(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">მიწოდება</dt>
              <dd>{order.shipping ? gel(order.shipping) : "უფასო"}</dd>
            </div>
            <div className="flex justify-between text-lg pt-1">
              <dt>ჯამი</dt>
              <dd className="font-bold">{gel(order.total)}</dd>
            </div>
          </dl>
        </Card>
        <Card title="მომხმარებელი">
          <dl className="grid gap-3 text-sm">
            {info.map(([k, v]) => (
              <div key={k}>
                <dt className="text-slate-500">{k}</dt>
                <dd className="whitespace-pre-line">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}
