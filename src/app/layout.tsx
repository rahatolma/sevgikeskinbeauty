import type { Metadata } from "next";
import { Jost, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HideOnAdmin from "@/components/HideOnAdmin";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sevgi Keskin Beauty | Güzellik ve Estetik",
  description: "Cilt bakımı, bölgesel zayıflama, yüz masajları ve lazer epilasyon hizmetleriyle Sevgi Keskin Beauty, size özel yenilenme deneyimi sunar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${jost.variable} ${cormorant.variable}`}>
      <body>
        <HideOnAdmin><Header /></HideOnAdmin>
        {children}
        <HideOnAdmin><Footer /></HideOnAdmin>
      </body>
    </html>
  );
}
