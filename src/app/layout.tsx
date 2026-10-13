import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ModalHost } from "@/components/ModalHost";
import { Navigation } from "@/components/Navigation";
import { SvgSprite } from "@/components/SvgSprite";
import { Toast } from "@/components/Toast";
import { StoreProvider } from "@/context/StoreContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Express Mix — ტექნიკა თქვენი სახლისთვის",
  description: "Express Mix — სახლისა და სამზარეულოს ტექნიკა. ხარისხიანი ბრენდები, საუკეთესო ფასები, კომფორტული შოპინგი.",
};

export const viewport: Viewport = { themeColor: "#141414" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  preload("/fonts/FiraGO-Bold.ttf", { as: "font", type: "font/ttf", crossOrigin: "" });
  return (
    <html lang="ka">
      <body>
        <StoreProvider>
          <SvgSprite />
          <a className="skip-link" href="#main">
            მთავარ შინაარსზე გადასვლა
          </a>
          <Header />
          <Navigation />
          {children}
          <Footer />
          <CartDrawer />
          <ModalHost />
          <Toast />
        </StoreProvider>
      </body>
    </html>
  );
}
