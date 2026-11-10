import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { AdminEdit } from "@/components/AdminEdit";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ModalHost } from "@/components/ModalHost";
import { Navigation } from "@/components/Navigation";
import { SvgSprite } from "@/components/SvgSprite";
import { Toast } from "@/components/Toast";
import { CatalogProvider } from "@/context/CatalogContext";
import { StoreProvider } from "@/context/StoreContext";
import { getCatalog } from "@/lib/catalog";
import { getContent } from "@/lib/content";
import { LangProvider } from "@/i18n/client";
import { LANGS, getT, isLang } from "@/i18n";
import "../globals.css";

export const viewport: Viewport = { themeColor: "#141414" };

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const t = getT(isLang(lang) ? lang : "ka");
  return {
    title: t("Express Mix | ტექნიკა თქვენი სახლისთვის"),
    description: t("Express Mix: სახლისა და სამზარეულოს ტექნიკა. ხარისხიანი ბრენდები, საუკეთესო ფასები, კომფორტული შოპინგი."),
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
      <body>
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
              <AdminEdit />
            </StoreProvider>
          </CatalogProvider>
        </LangProvider>
      </body>
    </html>
  );
}
