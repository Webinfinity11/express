import Link from "next/link";
import type { Content } from "@/lib/content-schema";
import { Icon } from "./Icon";
import { InfoButton } from "./InfoButton";

const legalLinks = [
  { label: "კონფიდენციალურობის პოლიტიკა", href: "/privacy-policy" },
  { label: "წესები და პირობები", href: "/terms" },
  { label: "დაბრუნების პოლიტიკა", href: "/returns-policy" },
];

export function Footer({ content }: { content: Content }) {
  const { site, footer } = content;
  // სოციალური ბმული თუ არ არის მითითებული, ღილაკი საინფორმაციო ფანჯარას ხსნის
  const social = (href: string, label: string, icon: React.ReactNode) =>
    href ? (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
        {icon}
      </a>
    ) : (
      <InfoButton info="social" aria-label={label}>
        {icon}
      </InfoButton>
    );

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <Link className="brand footer-brand" href="/" aria-label="Express Mix — მთავარი">
            <img src="/images/logo.webp" alt="Express Mix — Home & Kitchen" width={459} height={191} loading="lazy" />
          </Link>
          <div className="footer-links">
            {footer.links.map((l) => (
              <Link key={l.href + l.label} href={l.href}>
                {l.label}
              </Link>
            ))}
            <InfoButton info="delivery">მიწოდება</InfoButton>
            <InfoButton info="payment">გადახდა</InfoButton>
          </div>
          <div className="socials">
            {social(site.facebook, "Facebook", <span className="facebook-letter">f</span>)}
            {social(site.instagram, "Instagram", <Icon name="instagram" />)}
            {social(site.tiktok, "TikTok", <Icon name="tiktok" />)}
          </div>
        </div>
        <div className="footer-bottom">
          <nav className="footer-legal" aria-label="იურიდიული ინფორმაცია">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
          <span>{footer.copyright}</span>
          <span className="demo-disclaimer">
            {site.address} · <a href={site.phoneHref}>{site.phone}</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
