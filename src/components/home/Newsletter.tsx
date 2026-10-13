"use client";

import { useStore } from "@/context/StoreContext";
import { Icon } from "../Icon";

export function Newsletter() {
  const { showToast } = useStore();

  return (
    <section className="newsletter-band" id="about">
      <div className="story-panel">
        <img src="/images/washer-2.webp" alt="თანამედროვე სამრეცხაო ოთახი" loading="lazy" />
        <div className="story-shade"></div>
        <div className="story-copy">
          <h2>
            თქვენი სახლი.
            <br />
            ჩვენი ტექნიკა.
          </h2>
          <span className="eyebrow">EXPRESS MIX</span>
        </div>
      </div>
      <div className="newsletter-panel">
        <div className="newsletter-copy">
          <h2>გამოიწერე სიახლეები</h2>
          <p>
            შეიტყვე ახალი პროდუქტებისა
            <br />
            და განსაკუთრებული შეთავაზებების შესახებ.
          </p>
          {/* TODO: გამოწერის შენახვა (API / ელფოსტის სერვისი) */}
          <form
            className="newsletter-form"
            onSubmit={(e) => {
              e.preventDefault();
              e.currentTarget.reset();
              showToast("გმადლობთ! გამოწერა მიღებულია.");
            }}
          >
            <label className="sr-only" htmlFor="newsletterEmail">
              ელფოსტის მისამართი
            </label>
            <input id="newsletterEmail" type="email" required placeholder="თქვენი ელფოსტა" autoComplete="email" maxLength={180} />
            <button type="submit" aria-label="გამოწერა">
              <Icon name="arrow" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
