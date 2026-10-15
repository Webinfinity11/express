import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactCards } from "@/components/ContactCards";
import { Icon } from "@/components/Icon";
import { InnerFooterBlocks } from "@/components/InnerFooterBlocks";
import { getContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getContent();
  return { title: "კონტაქტი — Express Mix", description: `Express Mix — ${site.address}, ტელ: ${site.phone}` };
}

export default async function ContactPage() {
  const { site, contact } = await getContent();
  return (
    <>
      <Breadcrumbs items={[{ label: "კონტაქტი" }]} />
      <main id="main" className="wrap internal-main">
        <div className="page-head">
          <span className="eyebrow small-eyebrow">{contact.eyebrow}</span>
          <h1>{contact.title}</h1>
          <p>{contact.text}</p>
        </div>

        <ContactCards site={site} contact={contact} />

        {site.mapQuery && (
          <section className="contact-map" aria-label="რუკა">
            <iframe
              title={`Express Mix — ${site.address}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(site.mapQuery)}&hl=ka&z=16&output=embed`}
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
              <Icon name="pin" /> Google Maps-ში გახსნა
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
