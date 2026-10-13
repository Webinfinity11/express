import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactCards } from "@/components/ContactCards";
import { Icon } from "@/components/Icon";
import { InnerFooterBlocks } from "@/components/InnerFooterBlocks";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = {
  title: "კონტაქტი — Express Mix",
  description: `Express Mix — ${CONTACT.address}, ტელ: ${CONTACT.phone}`,
};

export default function ContactPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "კონტაქტი" }]} />
      <main id="main" className="wrap internal-main">
        <div className="page-head">
          <span className="eyebrow small-eyebrow">GET IN TOUCH</span>
          <h1>დაგვიკავშირდით</h1>
          <p>გაქვთ შეკითხვა ან გჭირდებათ დახმარება ტექნიკის არჩევაში? სიამოვნებით დაგეხმარებით.</p>
        </div>

        <ContactCards />

        <section className="contact-map" aria-label="რუკა">
          <iframe
            title={`Express Mix — ${CONTACT.address}`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(CONTACT.mapQuery)}&hl=ka&z=16&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <a
            className="button secondary contact-map-link"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.mapQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="pin" /> Google Maps-ში გახსნა
          </a>
        </section>

        <section className="contact-cta">
          <div>
            <h2>გჭირდებათ კონსულტაცია?</h2>
            <p>დაგვირეკეთ და ერთად შევარჩევთ თქვენთვის საუკეთესო ტექნიკას.</p>
          </div>
          <a className="button primary" href={CONTACT.phoneHref}>
            <Icon name="phone" /> {CONTACT.phone}
          </a>
        </section>
      </main>
      <InnerFooterBlocks />
    </>
  );
}
