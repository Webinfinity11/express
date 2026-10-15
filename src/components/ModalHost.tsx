"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore, type InfoKey } from "@/context/StoreContext";
import { useCatalog } from "@/context/CatalogContext";
import { CITIES, gel, productHref, type City } from "@/lib/data";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";

const INFO_TITLES: Record<InfoKey, string> = {
  account: "თქვენი ანგარიში",
  about: "ტექნიკა თქვენი სახლისთვის",
  delivery: "მიწოდების პირობები",
  warranty: "პროდუქტის გარანტია",
  payment: "გადახდის მეთოდები",
  contact: "დაგვიკავშირდით",
  social: "Express Mix სოციალურ ქსელებში",
  brands: "ბრენდები",
};

export function ModalHost() {
  const { modal, openModal } = useStore();
  const close = () => openModal(null);

  return (
    <Dialog open={modal !== null && modal !== "cart"} onClose={close} className="content-dialog em-dialog" labelledBy="infoTitle">
      <button className="icon-button modal-close" aria-label="დახურვა" onClick={close}>
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
  const title = INFO_TITLES[k];
  const body =
    k === "contact"
      ? `ტელეფონი: ${site.phone}. მისამართი: ${site.address}. დაგვიკავშირდით და ერთად შევარჩევთ თქვენთვის საუკეთესო ტექნიკას.`
      : info[k];
  return (
    <>
      <h2 id="infoTitle">{title}</h2>
      <p>{body}</p>
      <button className="button primary compact" onClick={close}>
        გასაგებია <Icon name="check" />
      </button>
    </>
  );
}

function Favorites({ close }: { close: () => void }) {
  const { favorites, addToCart, toggleFavorite } = useStore();
  const { products } = useCatalog();
  const items = products.filter((p) => favorites.includes(p.id));
  return (
    <>
      <h2 id="infoTitle">თქვენი ფავორიტები</h2>
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
                <button className="add-cart" aria-label="კალათაში დამატება" onClick={() => addToCart(p.id)}>
                  <Icon name="cart" />
                </button>
                <button className="icon-button" aria-label="ფავორიტიდან წაშლა" onClick={() => toggleFavorite(p.id)}>
                  <Icon name="close" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="heart" />
          <h3>შეინახეთ სასურველი ნივთები</h3>
          <p>პროდუქტის ბარათზე დააჭირეთ გულის ნიშანს.</p>
          <Link className="button primary compact" href="/products" onClick={close}>
            მაღაზიაში გადასვლა <Icon name="arrow" />
          </Link>
        </div>
      )}
    </>
  );
}

function CityPicker({ close }: { close: () => void }) {
  const { city, setCity } = useStore();
  const [value, setValue] = useState<City>(city);
  return (
    <>
      <h2 id="infoTitle">მიწოდების ადგილმდებარეობა</h2>
      <p>აირჩიეთ ქალაქი მიწოდების ღირებულების სანახავად.</p>
      <label className="field-label" htmlFor="dialogCity">
        ქალაქი / რეგიონი
      </label>
      <select id="dialogCity" value={value} onChange={(e) => setValue(e.target.value as City)}>
        {Object.entries(CITIES).map(([k, name]) => (
          <option key={k} value={k}>
            {name}
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
        არჩევანის შენახვა <Icon name="check" />
      </button>
    </>
  );
}

function ClearCart({ close }: { close: () => void }) {
  const { clearCart } = useStore();
  return (
    <>
      <h2 id="infoTitle">კალათის გასუფთავება</h2>
      <p>წაიშალოს კალათაში დამატებული ყველა პროდუქტი?</p>
      <div className="dialog-confirm-buttons">
        <button className="button secondary" onClick={close}>
          გაუქმება
        </button>
        <button
          className="button primary"
          onClick={() => {
            clearCart();
            close();
          }}
        >
          გასუფთავება <Icon name="trash" />
        </button>
      </div>
    </>
  );
}
