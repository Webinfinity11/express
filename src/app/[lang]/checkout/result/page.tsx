import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { db, orders } from "@/db";
import { ensurePaymentSchema, syncBogOrder } from "@/lib/bog";
import { gel } from "@/lib/data";
import { Icon } from "@/components/Icon";
import { ClearCart } from "@/components/checkout/ClearCart";
import { getT, localePath, toLang, type Lang } from "@/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/checkout/result">): Promise<Metadata> {
  const t = getT(toLang((await params).lang));
  return { title: t("გადახდის შედეგი | Express Mix"), robots: { index: false } };
}

async function Result({ searchParams, lang }: { searchParams: PageProps<"/[lang]/checkout/result">["searchParams"]; lang: Lang }) {
  const t = getT(lang);
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
          <h2>{t("შეკვეთა ვერ მოიძებნა")}</h2>
          <p>{t("თუ თანხა ჩამოგეჭრათ, დაგვიკავშირდით და შეკვეთას გადავამოწმებთ.")}</p>
        </>
      ) : paid ? (
        <>
          <h2>{t("გმადლობთ! გადახდა წარმატებით შესრულდა")}</h2>
          <p>
            {t("შეკვეთის ნომერი:")} <strong>{order.number}</strong>
            <br />
            {t("გადახდილი თანხა:")} <strong>{gel(order.total)}</strong>
          </p>
          <p>
            {t("ოპერატორი მალე დაგიკავშირდებათ ნომერზე")} <strong>{order.phone}</strong> {t("მიწოდების დეტალების დასაზუსტებლად.")}
          </p>
        </>
      ) : pending ? (
        <>
          <h2>{t("გადახდა მუშავდება")}</h2>
          <p>
            {t("შეკვეთის ნომერი:")} <strong>{order.number}</strong>. {t("ბანკის დადასტურებას ველოდებით — განაახლეთ გვერდი რამდენიმე წამში.")}
          </p>
        </>
      ) : (
        <>
          <h2>{t("გადახდა ვერ შესრულდა")}</h2>
          <p>
            {t("შეკვეთა")} <strong>{order.number}</strong> {t("არ არის გადახდილი. პროდუქცია კალათაში დაგრჩათ — შეგიძლიათ სცადოთ თავიდან.")}
          </p>
        </>
      )}
      <div className="empty-buttons">
        {order && !paid && !pending ? (
          <Link className="button primary" href={localePath(lang, "/checkout")}>
            {t("თავიდან ცდა")} <Icon name="arrow" />
          </Link>
        ) : (
          <Link className="button primary" href={localePath(lang, "/products")}>
            {t("შოპინგის გაგრძელება")} <Icon name="arrow" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function CheckoutResultPage({ params, searchParams }: PageProps<"/[lang]/checkout/result">) {
  const lang = toLang((await params).lang);
  const t = getT(lang);
  return (
    <main id="main" className="wrap internal-main cart-page">
      <Suspense
        fallback={
          <div className="cart-empty checkout-success">
            <h2>{t("გადახდის შემოწმება...")}</h2>
          </div>
        }
      >
        <Result searchParams={searchParams} lang={lang} />
      </Suspense>
    </main>
  );
}
