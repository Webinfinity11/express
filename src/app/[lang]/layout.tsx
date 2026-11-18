import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { AdminEdit } from "@/components/AdminEdit";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ImageWatermark } from "@/components/ImageWatermark";
import { ModalHost } from "@/components/ModalHost";
import { Navigation } from "@/components/Navigation";
import { SvgSprite } from "@/components/SvgSprite";
import { Toast } from "@/components/Toast";
import { CatalogProvider } from "@/context/CatalogContext";
import { StoreProvider } from "@/context/StoreContext";
import { getCatalog } from "@/lib/catalog";
import { getContent } from "@/lib/content";
import { getSeoSettings, resolveSeo } from "@/lib/seo";
import { LangProvider } from "@/i18n/client";
import { LANGS, getT, isLang } from "@/i18n";
import "../globals.css";

export const viewport: Viewport = { themeColor: "#141414" };

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang: l } = await params;
  const lang = isLang(l) ? l : "ka";
  const s = await getSeoSettings();
  const { title, description } = resolveSeo(s, { lang, type: "home" });
  const v = s.verification;
  const other: Record<string, string> = {};
  if (v.bing) other["msvalidate.01"] = v.bing;
  return {
    metadataBase: new URL(s.siteUrl || "https://emix.ge"),
    title,
    description,
    applicationName: s.siteName,
    openGraph: { siteName: s.siteName, locale: lang === "en" ? "en_US" : "ka_GE", images: s.defaultOgImage ? [{ url: s.defaultOgImage }] : undefined },
    verification: { google: v.google || undefined, yandex: v.yandex || undefined, other },
  };
}

export default async function StoreLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  preload("/fonts/FiraGO-Bold.ttf", { as: "font", type: "font/ttf", crossOrigin: "" });
  const [catalog, content] = await Promise.all([getCatalog(lang), getContent(lang)]);
  return (
    <html lang={lang}>
      {/* ბრაუზერის გაფართოებები (მაგ. ColorZilla) body-ს ატრიბუტებს ამატებენ */}
      <body suppressHydrationWarning>
        <LangProvider lang={lang}>
          <CatalogProvider catalog={catalog} content={content}>
            <StoreProvider>
              <SvgSprite />
              <a className="skip-link" href="#main">
                {t("მთავარ შინაარსზე გადასვლა")}
              </a>
              <Header />
              <Navigation />
              {children}
              <Footer content={content} lang={lang} />
              <CartDrawer />
              <ModalHost />
              <Toast />
              <ImageWatermark />
              <AdminEdit />
            </StoreProvider>
          </CatalogProvider>
        </LangProvider>
      </body>
    </html>
  );
}
