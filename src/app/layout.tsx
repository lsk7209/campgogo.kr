import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const GA4_ID = "G-1E6KZFZNS6";

export const metadata: Metadata = {
  title: {
    default: "캠핑고고 — 예약 앱이 못 보여주는 야영지",
    template: "%s | 캠핑고고",
  },
  description:
    "예약 앱이 못 보여주는 공공·저렴·차박 야영지 8,000곳+. 합법성 확인, 지역·테마·시즌별 탐색.",
  metadataBase: new URL("https://campgogo.kr"),
  verification: {
    google: "N12Qd6VwYpWpSnc1j6ennbIK4E5ptRq4JMN8KL8Yr4M",
    other: {
      "naver-site-verification": "b3fef5d11acaad96058bdede98e2dc745957c8e6",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="alternate" type="application/rss+xml" title="캠핑고고 블로그" href="/feed.xml" />
        {/* Preconnect */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* AdSense 자동광고 */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3050601904412736" crossOrigin="anonymous" />
        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_ID}', { anonymize_ip: true });
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
