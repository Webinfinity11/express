import { preload } from "react-dom";
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
import "../globals.css";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  preload("/fonts/FiraGO-Bold.ttf", { as: "font", type: "font/ttf", crossOrigin: "" });
  const [catalog, content] = await Promise.all([getCatalog(), getContent()]);
  return (
    <CatalogProvider catalog={catalog} content={content}>
      <StoreProvider>
        <SvgSprite />
        <a className="skip-link" href="#main">
          მთავარ შინაარსზე გადასვლა
        </a>
        <Header />
        <Navigation />
        {children}
        <Footer content={content} />
        <CartDrawer />
        <ModalHost />
        <Toast />
      </StoreProvider>
    </CatalogProvider>
  );
}
