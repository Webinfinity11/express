import { CONTACT } from "@/lib/contact";
import { Icon } from "./Icon";

export function ContactCards() {
  return (
    <div className="contact-cards">
      <a className="contact-card" href={CONTACT.phoneHref}>
        <span className="contact-icon">
          <Icon name="phone" />
        </span>
        <span>
          <small>ტელეფონი</small>
          <strong>{CONTACT.phone}</strong>
          <p>დაგვირეკეთ და გიპასუხებთ ნებისმიერ კითხვაზე.</p>
        </span>
      </a>
      <div className="contact-card">
        <span className="contact-icon">
          <Icon name="pin" />
        </span>
        <span>
          <small>მისამართი</small>
          <strong>{CONTACT.address}</strong>
          <p>მობრძანდით და ნახეთ ტექნიკა ადგილზე.</p>
        </span>
      </div>
      <a className="contact-card" href={CONTACT.phoneHref}>
        <span className="contact-icon">
          <Icon name="headphones" />
        </span>
        <span>
          <small>კონსულტაცია</small>
          <strong>არჩევანში დაგეხმარებით</strong>
          <p>შეგირჩევთ ტექნიკას თქვენი სახლისა და ბიუჯეტის მიხედვით.</p>
        </span>
      </a>
    </div>
  );
}
