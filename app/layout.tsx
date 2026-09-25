import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Toli Asistan | Toli Games Oyun Danışmanı",
  description:
    "Toli Asistan, yaşa ve ilgi alanına göre Toli Games zeka oyunları önerir; ürün özelliklerini resmi siteden yanıtlar.",
  icons: {
    icon: "/toli.jpeg",
    apple: "/toli.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        {children}
        <Script
          src="/widget.js"
          data-api="/api/chat"
          data-baslik="Toli Asistan"
          data-avatar="/toli.jpeg"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
