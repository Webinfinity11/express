import type { Content } from "@/lib/content-schema";
import { Icon } from "./Icon";

export function ContactCards({ site, contact }: { site: Content["site"]; contact: Content["contact"] }) {
  return (
    <div className="contact-cards">
      <a className="contact-card" href={site.phoneHref}>
        <span className="contact-icon">
          <Icon name="phone" />
        </span>
        <span>
          <small>ტელეფონი</small>
          <strong>{site.phone}</strong>
          <p>{contact.phoneText}</p>
        </span>
      </a>
      <div className="contact-card">
        <span className="contact-icon">
          <Icon name="pin" />
        </span>
        <span>
          <small>მისამართი</small>
          <strong>{site.address}</strong>
          <p>{site.hours || contact.addressText}</p>
        </span>
      </div>
      <a className="contact-card" href={site.email ? `mailto:${site.email}` : site.phoneHref}>
        <span className="contact-icon">
          <Icon name="headphones" />
        </span>
        <span>
          <small>კონსულტაცია</small>
          <strong>{contact.consultTitle}</strong>
          <p>{site.email || contact.consultText}</p>
        </span>
      </a>
    </div>
  );
}
