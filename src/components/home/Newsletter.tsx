"use client";

import { useCatalog } from "@/context/CatalogContext";
import { useStore } from "@/context/StoreContext";
import { useT } from "@/i18n/client";
import { Icon } from "../Icon";

export function Newsletter() {
  const { showToast } = useStore();
  const { home } = useCatalog().content;
  const t = useT();

  return (
    <section className="newsletter-band" id="about">
      <div className="story-panel">
        {home.storyImage && <img src={home.storyImage} alt="" loading="lazy" />}
        <div className="story-shade"></div>
        <div className="story-copy">
          <h2>
            {home.storyTitle}
            <br />
            {home.storyTitle2}
          </h2>
          <span className="eyebrow">EXPRESS MIX</span>
        </div>
      </div>
      <div className="newsletter-panel">
        <div className="newsletter-copy">
          <h2>{home.newsletterTitle}</h2>
          <p>{home.newsletterText}</p>
          {/* TODO: გამოწერის შენახვა (API / ელფოსტის სერვისი) */}
          <form
            className="newsletter-form"
            onSubmit={(e) => {
              e.preventDefault();
              e.currentTarget.reset();
              showToast(t("გმადლობთ! გამოწერა მიღებულია."));
            }}
          >
            <label className="sr-only" htmlFor="newsletterEmail">
              {t("ელფოსტის მისამართი")}
            </label>
            <input id="newsletterEmail" type="email" required placeholder={t("თქვენი ელფოსტა")} autoComplete="email" maxLength={180} />
            <button type="submit" aria-label={t("გამოწერა")}>
              <Icon name="arrow" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
