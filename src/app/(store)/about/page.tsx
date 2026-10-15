import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactCards } from "@/components/ContactCards";
import { Icon } from "@/components/Icon";
import { InnerFooterBlocks } from "@/components/InnerFooterBlocks";
import { getContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "ჩვენ შესახებ — Express Mix",
  description: "Express Mix — სახლისა და სამზარეულოს ტექნიკის მაღაზია. ხარისხიანი ბრენდები, საუკეთესო ფასები, კომფორტული შოპინგი.",
};

const VALUE_ICONS = ["shield", "tag", "truck"];

export default async function AboutPage() {
  const { about, site, contact } = await getContent();
  return (
    <>
      <Breadcrumbs items={[{ label: "ჩვენ შესახებ" }]} />
      <main id="main" className="wrap internal-main">
        <section className="shop-hero">
          <div className="shop-hero-copy">
            <span className="eyebrow">{about.heroEyebrow}</span>
            <h1>
              {about.heroTitle}
              <br />
              <span>{about.heroAccent}</span>
            </h1>
            <p>{about.heroText}</p>
          </div>
          {about.heroImage && (
            <div className="shop-hero-photo">
              <img src={about.heroImage} alt="" fetchPriority="high" />
            </div>
          )}
        </section>

        <section className="about-intro">
          <div>
            <span className="eyebrow small-eyebrow">{about.introEyebrow}</span>
            <h2>
              {about.introTitle}
              <br />
              <span>{about.introAccent}</span>
            </h2>
            {about.paragraphs.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
            <Link className="button primary" href="/products">
              მაღაზიაში გადასვლა <Icon name="arrow" />
            </Link>
          </div>
          {about.introImage && (
            <div className="about-photo">
              <img src={about.introImage} alt="" loading="lazy" />
            </div>
          )}
        </section>

        <section className="perks about-values" aria-label="ჩვენი ღირებულებები">
          {about.values.slice(0, 3).map((v, i) => (
            <div className="perk" key={i}>
              <span className="perk-icon">
                <svg aria-hidden="true">
                  <use href={`#i-${VALUE_ICONS[i]}`} />
                </svg>
              </span>
              <span>
                <strong>{v.title}</strong>
                <small>{v.text}</small>
              </span>
            </div>
          ))}
        </section>

        <section className="section-block" aria-labelledby="aboutContactTitle">
          <h2 id="aboutContactTitle">{about.contactTitle}</h2>
          <ContactCards site={site} contact={contact} />
        </section>
      </main>
      <InnerFooterBlocks />
    </>
  );
}
