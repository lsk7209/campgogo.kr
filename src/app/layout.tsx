import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CookieBanner } from "@/components/legal/cookie-banner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "캠핑고고 — 예약 앱이 못 보여주는 야영지",
    template: "%s | 캠핑고고",
  },
  description:
    "공공·저렴·차박 가능 야영지를 찾아주는 사이트. 예약 앱에 없는 한적한 노지·차박지를 정확한 정보와 합법성 확인과 함께.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
