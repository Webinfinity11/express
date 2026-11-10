"use client";

import { useState } from "react";
import { useStore, type InfoKey } from "@/context/StoreContext";
import { useCatalog } from "@/context/CatalogContext";
import { CITIES, gel, productHref, type City } from "@/lib/data";
import { Link, useT } from "@/i18n/client";
import type { T } from "@/i18n";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";

const infoTitles = (t: T): Record<InfoKey, string> => ({
  account: t("თქვენი ანგარიში"),
  about: t("ტექნიკა თქვენი სახლისთვის"),
  delivery: t("მიწოდების პირობები"),
  warranty: t("პროდუქტის გარანტია"),
  payment: t("გადახდის მეთოდები"),
  contact: t("დაგვიკავშირდით"),
  social: t("Express Mix სოციალურ ქსელებში"),
  brands: t("ბრენდები"),
});

export function ModalHost() {
  const { modal, openModal } = useStore();
  const t = useT();
  const close = () => openModal(null);

  return (
    <Dialog open={modal !== null && modal !== "cart"} onClose={close} className="content-dialog em-dialog" labelledBy="infoTitle">
      <button className="icon-button modal-close" aria-label={t("დახურვა")} onClick={close}>
        <Icon name="close" />
      </button>
      <div className="modal-content">
        <span className="eyebrow">EXPRESS MIX</span>
        {modal === "favorites" && <Favorites close={close} />}
        {modal === "city" && <CityPicker key="city" close={close} />}
        {modal === "clear-cart" && <ClearCart close={close} />}
        {modal?.startsWith("info:") && <Info k={modal.slice(5) as InfoKey} close={close} />}
      </div>
    </Dialog>
  );
}

function Info({ k, close }: { k: InfoKey; close: () => void }) {
  const { content } = useCatalog();
  const { site, info } = content;
  const t = useT();
  const title = infoTitles(t)[k];
  const body =
    k === "contact"
      ? t("ტელეფონი: {phone}. მისამართი: {address}. დაგვიკავშირდით და ერთად შევარჩევთ თქვენთვის საუკეთესო ტექნიკას.", { phone: site.phone, address: site.address })
      : info[k];
  return (
    <>
      <h2 id="infoTitle">{title}</h2>
      <p>{body}</p>
      <button className="button primary compact" onClick={close}>
        {t("გასაგებია")} <Icon name="check" />
      </button>
    </>
  );
}

function Favorites({ close }: { close: () => void }) {
  const { favorites, addToCart, toggleFavorite } = useStore();
  const { products } = useCatalog();
  const t = useT();
  const items = products.filter((p) => favorites.includes(p.id));
  return (
    <>
      <h2 id="infoTitle">{t("თქვენი ფავორიტები")}</h2>
      {items.length ? (
        <div className="favorite-list">
          {items.map((p) => (
            <article className="favorite-row" key={p.id}>
              <Link href={productHref(p)} onClick={close}>
                <img src={p.image} alt={p.name} />
              </Link>
              <div>
                <h3>
                  <Link href={productHref(p)} onClick={close}>
                    {p.name}
                  </Link>
                </h3>
                <span className="price">{gel(p.price * 100)}</span>
              </div>
              <div className="favorite-row-actions">
                <button className="add-cart" aria-label={t("კალათაში დამატება")} onClick={() => addToCart(p.id)}>
                  <Icon name="cart" />
                </button>
                <button className="icon-button" aria-label={t("ფავორიტიდან წაშლა")} onClick={() => toggleFavorite(p.id)}>
                  <Icon name="close" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="heart" />
          <h3>{t("შეინახეთ სასურველი ნივთები")}</h3>
          <p>{t("პროდუქტის ბარათზე დააჭირეთ გულის ნიშანს.")}</p>
          <Link className="button primary compact" href="/products" onClick={close}>
            {t("მაღაზიაში გადასვლა")} <Icon name="arrow" />
          </Link>
        </div>
      )}
    </>
  );
}

function CityPicker({ close }: { close: () => void }) {
  const { city, setCity } = useStore();
  const [value, setValue] = useState<City>(city);
  const t = useT();
  return (
    <>
      <h2 id="infoTitle">{t("მიწოდების ადგილმდებარეობა")}</h2>
      <p>{t("აირჩიეთ ქალაქი მიწოდების ღირებულების სანახავად.")}</p>
      <label className="field-label" htmlFor="dialogCity">
        {t("ქალაქი / რეგიონი")}
      </label>
      <select id="dialogCity" value={value} onChange={(e) => setValue(e.target.value as City)}>
        {Object.entries(CITIES).map(([k, name]) => (
          <option key={k} value={k}>
            {t(name)}
          </option>
        ))}
      </select>
      <button
        className="button primary full-width"
        onClick={() => {
          setCity(value);
          close();
        }}
      >
        {t("არჩევანის შენახვა")} <Icon name="check" />
      </button>
    </>
  );
}

function ClearCart({ close }: { close: () => void }) {
  const { clearCart } = useStore();
  const t = useT();
  return (
    <>
      <h2 id="infoTitle">{t("კალათის გასუფთავება")}</h2>
      <p>{t("წაიშალოს კალათაში დამატებული ყველა პროდუქტი?")}</p>
      <div className="dialog-confirm-buttons">
        <button className="button secondary" onClick={close}>
          {t("გაუქმება")}
        </button>
        <button
          className="button primary"
          onClick={() => {
            clearCart();
            close();
          }}
        >
          {t("გასუფთავება")} <Icon name="trash" />
        </button>
      </div>
    </>
  );
}
