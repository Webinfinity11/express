import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactCards } from "@/components/ContactCards";
import { Icon } from "@/components/Icon";
import { InnerFooterBlocks } from "@/components/InnerFooterBlocks";
import { getContent } from "@/lib/content";
import { getT, toLang } from "@/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const lang = toLang((await params).lang);
  const t = getT(lang);
  const { site } = await getContent(lang);
  return {
    title: t("კონტაქტი | Express Mix"),
    description: t("Express Mix, {address}, ტელ: {phone}", { address: site.address, phone: site.phone }),
    alternates: { languages: { ka: "/contact", en: "/en/contact" } },
  };
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const lang = toLang((await params).lang);
  const t = getT(lang);
  const { site, contact } = await getContent(lang);
  return (
    <>
      <Breadcrumbs items={[{ label: t("კონტაქტი") }]} />
      <main id="main" className="wrap internal-main">
        <div className="page-head">
          <span className="eyebrow small-eyebrow">{contact.eyebrow}</span>
          <h1>{contact.title}</h1>
          <p>{contact.text}</p>
        </div>

        <ContactCards site={site} contact={contact} />

        <section className="contact-extra" aria-label={t("ელფოსტა და სოციალური ქსელები")}>
          <div className="contact-card">
            <span className="contact-icon">
              <Icon name="send" />
            </span>
            <span>
              <small>{t("ელფოსტა")}</small>
              {[site.email, site.salesEmail].filter(Boolean).map((e) => (
                <a key={e} className="contact-email" href={`mailto:${e}`}>
                  {e}
                </a>
              ))}
            </span>
          </div>
          <div className="contact-card">
            <span>
              <small>{t("სოციალური ქსელები")}</small>
              <span className="contact-socials">
                {site.facebook && (
                  <a href={site.facebook} target="_blank" rel="noopener noreferrer">
                    Facebook
                  </a>
                )}
                {site.instagram && (
                  <a href={site.instagram} target="_blank" rel="noopener noreferrer">
                    <Icon name="instagram" /> Instagram
                  </a>
                )}
                {site.tiktok && (
                  <a href={site.tiktok} target="_blank" rel="noopener noreferrer">
                    <Icon name="tiktok" /> TikTok
                  </a>
                )}
              </span>
            </span>
          </div>
        </section>

        {site.mapQuery && (
          <section className="contact-map" aria-label={t("რუკა")}>
            <iframe
              title={`Express Mix — ${site.address}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(site.mapQuery)}&hl=${lang}&z=16&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a
              className="button secondary contact-map-link"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="pin" /> {t("Google Maps-ში გახსნა")}
            </a>
          </section>
        )}

        <section className="contact-cta">
          <div>
            <h2>{contact.ctaTitle}</h2>
            <p>{contact.ctaText}</p>
          </div>
          <a className="button primary" href={site.phoneHref}>
            <Icon name="phone" /> {site.phone}
          </a>
        </section>
      </main>
      <InnerFooterBlocks />
    </>
  );
}
