import { getT, localePath, type Lang } from "@/i18n";
import { Link } from "@/i18n/client";
import type { Content } from "@/lib/content-schema";
import { Icon } from "./Icon";
import { InfoButton } from "./InfoButton";

export function Footer({ content, lang }: { content: Content; lang: Lang }) {
  const t = getT(lang);
  const legalLinks = [
    { label: t("კონფიდენციალურობის პოლიტიკა"), href: "/privacy-policy" },
    { label: t("მიწოდების პირობები"), href: "/terms" },
    { label: t("დაბრუნების პოლიტიკა"), href: "/returns-policy" },
  ];
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
          <Link className="brand footer-brand" href={localePath(lang, "/")} aria-label={t("Express Mix — მთავარი")}>
            <img src="/images/logo.webp" alt="Express Mix — Home & Kitchen" width={459} height={191} loading="lazy" />
          </Link>
          <div className="footer-links">
            {footer.links.map((l) => (
              <Link key={l.href + l.label} href={localePath(lang, l.href)}>
                {l.label}
              </Link>
            ))}
            <Link href={localePath(lang, "/terms")}>{t("მიწოდება")}</Link>
            <InfoButton info="payment">{t("გადახდა")}</InfoButton>
          </div>
          <div className="socials">
            {social(site.facebook, "Facebook", <span className="facebook-letter">f</span>)}
            {social(site.instagram, "Instagram", <Icon name="instagram" />)}
            {social(site.tiktok, "TikTok", <Icon name="tiktok" />)}
          </div>
        </div>
        <div className="footer-bottom">
          <nav className="footer-legal" aria-label={t("იურიდიული ინფორმაცია")}>
            {legalLinks.map((l) => (
              <Link key={l.href} href={localePath(lang, l.href)}>
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
