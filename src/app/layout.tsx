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
    "공공·저렴·차박 가능 야영지를 찾아주는 사이트. 예약 앱에 없는 한적한 노지·차박지를 정확한 정보와 합법성 확인과 함께.",
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
