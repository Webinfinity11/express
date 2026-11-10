import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { db, orders } from "@/db";
import { ensurePaymentSchema, syncBogOrder } from "@/lib/bog";
import { gel } from "@/lib/data";
import { Icon } from "@/components/Icon";
import { ClearCart } from "@/components/checkout/ClearCart";

export const metadata: Metadata = { title: "გადახდის შედეგი | Express Mix", robots: { index: false } };

async function Result({ searchParams }: { searchParams: PageProps<"/checkout/result">["searchParams"] }) {
  const raw = (await searchParams).order;
  const number = typeof raw === "string" ? raw.slice(0, 40) : "";
  await ensurePaymentSchema();
  let [order] = number ? await db.select().from(orders).where(eq(orders.number, number)) : [];

  // callback შეიძლება ჯერ არ მოსულიყო — სტატუსს ბანკში თავად ვამოწმებთ
  if (order?.bogOrderId && order.paymentStatus === "pending") {
    try {
      order = (await syncBogOrder(order.bogOrderId)) ?? order;
    } catch (e) {
      console.error("[bog] result sync failed", e);
    }
  }

  const status = order?.paymentStatus;
  const paid = status === "paid";
  const pending = status === "pending";

  return (
    <div className="cart-empty checkout-success">
      {paid && <ClearCart />}
      <div className="empty-cart-art">
        <Icon name={paid ? "check" : pending ? "info" : "cart"} />
      </div>
      {!order ? (
        <>
          <h2>შეკვეთა ვერ მოიძებნა</h2>
          <p>თუ თანხა ჩამოგეჭრათ, დაგვიკავშირდით და შეკვეთას გადავამოწმებთ.</p>
        </>
      ) : paid ? (
        <>
          <h2>გმადლობთ! გადახდა წარმატებით შესრულდა</h2>
          <p>
            შეკვეთის ნომერი: <strong>{order.number}</strong>
            <br />
            გადახდილი თანხა: <strong>{gel(order.total)}</strong>
          </p>
          <p>ოპერატორი მალე დაგიკავშირდებათ ნომერზე <strong>{order.phone}</strong> მიწოდების დეტალების დასაზუსტებლად.</p>
        </>
      ) : pending ? (
        <>
          <h2>გადახდა მუშავდება</h2>
          <p>
            შეკვეთის ნომერი: <strong>{order.number}</strong>. ბანკის დადასტურებას ველოდებით — განაახლეთ გვერდი რამდენიმე წამში.
          </p>
        </>
      ) : (
        <>
          <h2>გადახდა ვერ შესრულდა</h2>
          <p>
            შეკვეთა <strong>{order.number}</strong> არ არის გადახდილი. პროდუქცია კალათაში დაგრჩათ — შეგიძლიათ სცადოთ თავიდან.
          </p>
        </>
      )}
      <div className="empty-buttons">
        {order && !paid && !pending ? (
          <Link className="button primary" href="/checkout">
            თავიდან ცდა <Icon name="arrow" />
          </Link>
        ) : (
          <Link className="button primary" href="/products">
            შოპინგის გაგრძელება <Icon name="arrow" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function CheckoutResultPage({ searchParams }: PageProps<"/checkout/result">) {
  return (
    <main id="main" className="wrap internal-main cart-page">
      <Suspense
        fallback={
          <div className="cart-empty checkout-success">
            <h2>გადახდის შემოწმება...</h2>
          </div>
        }
      >
        <Result searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
