import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactCards } from "@/components/ContactCards";
import { Icon } from "@/components/Icon";
import { InnerFooterBlocks } from "@/components/InnerFooterBlocks";

export const metadata: Metadata = {
  title: "ჩვენ შესახებ — Express Mix",
  description: "Express Mix — სახლისა და სამზარეულოს ტექნიკის მაღაზია. ხარისხიანი ბრენდები, საუკეთესო ფასები, კომფორტული შოპინგი.",
};

const VALUES = [
  { icon: "shield", title: "ხარისხიანი ბრენდები", text: "მხოლოდ სანდო მწარმოებლების ტექნიკა" },
  { icon: "tag", title: "საუკეთესო ფასები", text: "მუდმივი აქციები და სპეციალური შეთავაზებები" },
  { icon: "truck", title: "კომფორტული შოპინგი", text: "მარტივი შეკვეთა და სწრაფი მიწოდება" },
];

export default function AboutPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "ჩვენ შესახებ" }]} />
      <main id="main" className="wrap internal-main">
        <section className="shop-hero">
          <div className="shop-hero-copy">
            <span className="eyebrow">ABOUT EXPRESS MIX</span>
            <h1>
              ტექნიკა თქვენი
              <br />
              <span>სახლისთვის.</span>
            </h1>
            <p>თქვენი სახლი. ჩვენი ტექნიკა.</p>
          </div>
          <div className="shop-hero-photo">
            <img src="/images/washer-2.webp" alt="სარეცხი მანქანა თანამედროვე ინტერიერში" fetchPriority="high" />
          </div>
        </section>

        <section className="about-intro">
          <div>
            <span className="eyebrow small-eyebrow">WHO WE ARE</span>
            <h2>
              Express Mix —
              <br />
              <span>სახლისა და სამზარეულოს ტექნიკა</span>
            </h2>
            <p>
              Express Mix არის საყოფაცხოვრებო ტექნიკის მაღაზია, სადაც ერთ სივრცეში თავს იყრის ყველაფერი, რაც თქვენს სახლს
              უფრო კომფორტულს ხდის — მაცივრები, სარეცხი მანქანები, ღუმელები, მტვერსასრუტები და სამზარეულოს წვრილი ტექნიკა.
            </p>
            <p>
              ჩვენი მიზანია, ტექნიკის შეძენა იყოს მარტივი და სასიამოვნო: შეარჩიეთ პროდუქტი კატეგორიების მიხედვით, შეადარეთ
              ფასები და მიიღეთ კონსულტაცია ჩვენი გუნდისგან.
            </p>
            <Link className="button primary" href="/products">
              მაღაზიაში გადასვლა <Icon name="arrow" />
            </Link>
          </div>
          <div className="about-photo">
            <img src="/images/promo-kitchen.webp" alt="სამზარეულოს ტექნიკა" loading="lazy" />
          </div>
        </section>

        <section className="perks about-values" aria-label="ჩვენი ღირებულებები">
          {VALUES.map((v) => (
            <div className="perk" key={v.title}>
              <span className="perk-icon">
                <svg aria-hidden="true">
                  <use href={`#i-${v.icon}`} />
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
          <h2 id="aboutContactTitle">საკონტაქტო ინფორმაცია</h2>
          <ContactCards />
        </section>
      </main>
      <InnerFooterBlocks />
    </>
  );
}
