"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useStore } from "@/context/StoreContext";
import { useCatalog } from "@/context/CatalogContext";
import { CITIES, gel, type City } from "@/lib/data";
import { Link, useLang, useT } from "@/i18n/client";
import { PAYMENTS, validateOrder, type OrderErrors, type Payment } from "@/lib/order";

type Done = { id: string; total: number; phone: string; delivery: "courier" | "pickup" };

function Steps({ step }: { step: 2 | 3 }) {
  const t = useT();
  return (
    <div className="checkout-steps" aria-label={t("შეკვეთის ეტაპები")}>
      <span className="done">
        <b>
          <Icon name="check" />
        </b>{" "}
        {t("კალათა")}
      </span>
      <i></i>
      <span className={step === 2 ? "current" : "done"}>
        <b>{step === 2 ? "02" : <Icon name="check" />}</b> {t("გაფორმება")}
      </span>
      <i></i>
      <span className={step === 3 ? "current" : undefined}>
        <b>03</b> {t("დასრულება")}
      </span>
    </div>
  );
}

export function CheckoutView({ cardEnabled = false, flittEnabled = false }: { cardEnabled?: boolean; flittEnabled?: boolean }) {
  const store = useStore();
  const t = useT();
  const lang = useLang();
  const { cart, cartCount, totals: tot, delivery, city, coupon } = store;
  const { line, content } = useCatalog();
  const CONTACT = content.site;
  const entries = Object.entries(cart).flatMap(([id, q]) => {
    const l = line(id);
    return l ? [[id, q, l] as const] : [];
  });

  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", comment: "" });
  // განვადება არ გვაქვს: ონლაინ ბარათი, ან (თუ BOG გამორთულია) ოპერატორთან შეთანხმება
  const online: Payment[] = [...(cardEnabled ? (["card"] as const) : []), ...(flittEnabled ? (["flitt"] as const) : [])];
  const methods: Payment[] = online.length ? online : ["manual"];
  const [payment, setPayment] = useState<Payment>(methods[0]);
  const [errors, setErrors] = useState<OrderErrors>({});
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k as keyof OrderErrors]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const order = { ...form, delivery, city, payment, coupon, items: cart };
    const found = validateOrder(order, (key) => !!line(key));
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length) {
      document.querySelector<HTMLElement>(".checkout-field.has-error input")?.focus();
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...order, lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setServerError(data.error ? t(data.error) : t("შეკვეთა ვერ გაიგზავნა. გადაამოწმეთ მონაცემები."));
        return;
      }
      if (data.redirect) {
        // ბანკის გადახდის გვერდი — კალათა გადახდის დადასტურების შემდეგ სუფთავდება
        window.location.href = data.redirect;
        return;
      }
      setDone({ id: data.id, total: data.total, phone: form.phone, delivery });
      store.clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setServerError(t("კავშირის შეცდომა. სცადეთ თავიდან ან დაგვირეკეთ: {phone}", { phone: CONTACT.phone }));
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <main id="main" className="wrap internal-main cart-page">
        <div className="cart-page-heading">
          <div>
            <span className="eyebrow small-eyebrow">THANK YOU</span>
            <h1>{t("შეკვეთა მიღებულია")}</h1>
          </div>
          <Steps step={3} />
        </div>
        <div className="cart-empty checkout-success">
          <div className="empty-cart-art">
            <Icon name="check" />
          </div>
          <h2>{t("გმადლობთ! თქვენი შეკვეთა მიღებულია")}</h2>
          <p>
            {t("შეკვეთის ნომერი:")} <strong>{done.id}</strong>
            <br />
            {t("ჯამი:")} <strong>{gel(done.total)}</strong>
          </p>
          <p>
            {t("ოპერატორი მალე დაგიკავშირდებათ ნომერზე")} <strong>{done.phone}</strong> {t("შეკვეთის დასადასტურებლად")}
            {done.delivery === "pickup" ? `. ${t("თვითგატანა")}: ${CONTACT.address}.` : "."}
          </p>
          <div className="empty-buttons">
            <Link className="button primary" href="/products">
              {t("შოპინგის გაგრძელება")} <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!entries.length) {
    return (
      <main id="main" className="wrap internal-main cart-page">
        <div className="cart-empty">
          <div className="empty-cart-art">
            <Icon name="cart" />
          </div>
          <h2>{t("კალათა ცარიელია")}</h2>
          <p>{t("გაფორმებისთვის ჯერ დაამატეთ პროდუქტები კალათაში.")}</p>
          <div className="empty-buttons">
            <Link className="button primary" href="/products">
              {t("მაღაზიაში გადასვლა")} <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const field = (k: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement>, optional = false) => {
    const err = errors[k as keyof OrderErrors];
    return (
      <label className={`checkout-field${err ? " has-error" : ""}`}>
        <span>
          {label} {optional ? <em>({t("არასავალდებულო")})</em> : <em className="req">*</em>}
        </span>
        <input value={form[k]} onChange={set(k)} aria-invalid={!!err} {...props} />
        {err && <small className="field-error">{t(err)}</small>}
      </label>
    );
  };

  return (
    <main id="main" className="wrap internal-main cart-page">
      <div className="cart-page-heading">
        <div>
          <span className="eyebrow small-eyebrow">CHECKOUT</span>
          <h1>{t("შეკვეთის გაფორმება")}</h1>
          <p>{t("შეავსეთ მონაცემები და ოპერატორი დაგიკავშირდებათ შეკვეთის დასადასტურებლად.")}</p>
        </div>
        <Steps step={2} />
      </div>

      <form className="cart-layout" onSubmit={submit} noValidate>
        <div className="checkout-main">
          <section className="shipping-panel">
            <div className="shipping-title">
              <Icon name="user" />
              <h2>{t("საკონტაქტო ინფორმაცია")}</h2>
            </div>
            <div className="checkout-grid">
              {field("name", t("სახელი და გვარი"), { autoComplete: "name", maxLength: 120, placeholder: t("მაგ. გიორგი ბერიძე") })}
              {field("phone", t("ტელეფონი"), { type: "tel", autoComplete: "tel", inputMode: "tel", maxLength: 20, placeholder: "5XX XX XX XX" })}
              {field("email", t("ელფოსტა"), { type: "email", autoComplete: "email", maxLength: 180, placeholder: "name@example.com" }, true)}
            </div>
          </section>

          <section className="shipping-panel">
            <div className="shipping-title">
              <Icon name="box" />
              <h2>{t("მიღების მეთოდი")}</h2>
            </div>
            <div className="shipping-methods">
              <label className={`shipping-choice${delivery === "courier" ? " selected" : ""}`}>
                <input type="radio" name="delivery" checked={delivery === "courier"} onChange={() => store.setDelivery("courier")} />
                <span>
                  <strong>{t("კურიერით მიწოდება")}</strong>
                  <small>{t("მისამართზე მიტანა")}</small>
                </span>
                <Icon name="truck" />
              </label>
              <label className={`shipping-choice${delivery === "pickup" ? " selected" : ""}`}>
                <input type="radio" name="delivery" checked={delivery === "pickup"} onChange={() => store.setDelivery("pickup")} />
                <span>
                  <strong>{t("თვითგატანა")}</strong>
                  <small>{CONTACT.address} · {t("უფასო")}</small>
                </span>
                <Icon name="store" />
              </label>
            </div>
            {delivery === "courier" ? (
              <div className="checkout-grid">
                <label className="checkout-field">
                  <span>
                    {t("ქალაქი / რეგიონი")} <em className="req">*</em>
                  </span>
                  <select value={city} onChange={(e) => store.setCity(e.target.value as City)}>
                    {Object.entries(CITIES).map(([k, name]) => (
                      <option key={k} value={k}>
                        {t(name)}
                      </option>
                    ))}
                  </select>
                </label>
                {field("address", t("მისამართი"), { autoComplete: "street-address", maxLength: 300, placeholder: t("ქუჩა, სახლი, ბინა") })}
              </div>
            ) : (
              <p className="demo-caption checkout-pickup-note">
                <Icon name="pin" /> {t("თვითგატანის მისამართი:")} {CONTACT.address}
              </p>
            )}
          </section>

          <section className="shipping-panel">
            <div className="shipping-title">
              <Icon name="card" />
              <h2>{t("გადახდის მეთოდი")}</h2>
            </div>
            <div className="shipping-methods payment-methods">
              {methods.map((k) => (
                <label key={k} className={`shipping-choice${payment === k ? " selected" : ""}`}>
                  <input type="radio" name="payment" checked={payment === k} onChange={() => setPayment(k)} />
                  <span>
                    <strong>{t(PAYMENTS[k].title)}</strong>
                    <small>{t(PAYMENTS[k].text)}</small>
                  </span>
                  {PAYMENTS[k].logos && (
                    <span className="payment-logos">
                      {PAYMENTS[k].logos!.map((l) => (
                        <img key={l.src} className="payment-logo" src={l.src} alt={t(l.alt)} width={l.w} height={30} style={{ width: l.w }} />
                      ))}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </section>

          <section className="shipping-panel">
            <div className="shipping-title">
              <Icon name="info" />
              <h2>{t("კომენტარი")}</h2>
            </div>
            <label className="checkout-field">
              <span className="sr-only">{t("კომენტარი შეკვეთაზე")}</span>
              <textarea
                rows={3}
                maxLength={1000}
                value={form.comment}
                onChange={set("comment")}
                placeholder={t("მაგ. მიწოდების სასურველი დრო, სადარბაზოს კოდი...")}
              />
            </label>
          </section>

          <Link className="continue-link" href="/cart">
            <Icon name="arrow" /> {t("კალათაში დაბრუნება")}
          </Link>
        </div>

        <aside className="cart-summary-column">
          <section className="order-summary" aria-labelledby="summaryTitle">
            <div className="summary-title">
              <h2 id="summaryTitle">{t("თქვენი შეკვეთა ({n})", { n: cartCount })}</h2>
              <Icon name="box" />
            </div>
            <div className="checkout-items">
              {entries.map(([id, q, p]) => {
                return (
                  <div className="checkout-item" key={id}>
                    <Link href={p.href} className="checkout-item-image">
                      <img src={p.image} alt={p.name} />
                      <b>{q}</b>
                    </Link>
                    <span className="checkout-item-name">
                      {p.name}
                      {p.variantName && <small className="cart-item-variant">{p.variantName}</small>}
                    </span>
                    <strong>{gel(p.price * q * 100)}</strong>
                  </div>
                );
              })}
            </div>
            <div className="summary-line subtotal">
              <span>{t("ქვეჯამი")}</span>
              <strong>{gel(tot.sub)}</strong>
            </div>
            {tot.coupon > 0 && (
              <div className="summary-line discount">
                <span>{t("პრომოკოდი {code}", { code: coupon })}</span>
                <strong>−{gel(tot.coupon)}</strong>
              </div>
            )}
            <div className="summary-line">
              <span>{delivery === "pickup" ? t("თვითგატანა") : t("მიწოდება: {city}", { city: t(CITIES[city]) })}</span>
              <strong>{tot.shipping ? gel(tot.shipping) : t("უფასო")}</strong>
            </div>
            <div className="summary-total" aria-live="polite">
              <span>{t("სულ გადასახდელი")}</span>
              <strong>{gel(tot.total)}</strong>
            </div>
            {serverError && <p className="field-error checkout-server-error">{serverError}</p>}
            <button className="button primary full-width checkout-cta" type="submit" disabled={sending}>
              {sending ? t("იგზავნება...") : payment !== "manual" ? t("გადახდაზე გადასვლა") : t("შეკვეთის დადასტურება")} <Icon name="check" />
            </button>
            <div className="secure-note">
              <Icon name="lock" /> {t("თქვენი მონაცემები დაცულია")}
            </div>
          </section>
        </aside>
      </form>
    </main>
  );
}
