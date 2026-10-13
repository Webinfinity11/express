import Link from "next/link";
import { Icon } from "./Icon";
import { InfoButton } from "./InfoButton";
import { CONTACT } from "@/lib/contact";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <Link className="brand footer-brand" href="/" aria-label="Express Mix — მთავარი">
            <img src="/images/logo.webp" alt="Express Mix — Home & Kitchen" width={459} height={191} loading="lazy" />
          </Link>
          <div className="footer-links">
            <Link href="/about">ჩვენ შესახებ</Link>
            <InfoButton info="delivery">მიწოდება</InfoButton>
            <InfoButton info="payment">გადახდა</InfoButton>
            <Link href="/contact">კონტაქტი</Link>
          </div>
          {/* TODO: სოციალური ქსელების რეალური ბმულები */}
          <div className="socials">
            <InfoButton info="social" aria-label="Facebook">
              <span className="facebook-letter">f</span>
            </InfoButton>
            <InfoButton info="social" aria-label="Instagram">
              <Icon name="instagram" />
            </InfoButton>
            <InfoButton info="social" aria-label="YouTube">
              <Icon name="youtube" />
            </InfoButton>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Express Mix. ყველა უფლება დაცულია.</span>
          <span className="demo-disclaimer">
            {CONTACT.address} · <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
