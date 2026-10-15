import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Express Mix — ტექნიკა თქვენი სახლისთვის",
  description: "Express Mix — სახლისა და სამზარეულოს ტექნიკა. ხარისხიანი ბრენდები, საუკეთესო ფასები, კომფორტული შოპინგი.",
};

export const viewport: Viewport = { themeColor: "#141414" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ka">
      <body>{children}</body>
    </html>
  );
}
