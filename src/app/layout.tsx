import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const GA4_ID = "G-1E6KZFZNS6";

export const metadata: Metadata = {
  title: {
    default: "캠핑고고 — 예약 앱이 못 보여주는 야영지",
    template: "%s | 캠핑고고",
  },
  description:
    "예약 앱이 놓치기 쉬운 공공·저렴·차박 야영지 8,000곳+. 합법성 확인과 지역·테마·시즌별 탐색을 제공합니다.",
  metadataBase: new URL("https://campgogo.kr"),
  verification: {
    google: "N12Qd6VwYpWpSnc1j6ennbIK4E5ptRq4JMN8KL8Yr4M",
    other: {
      "naver-site-verification": "b3fef5d11acaad96058bdede98e2dc745957c8e6",
    },
  },
  openGraph: {
    title: "캠핑고고 — 예약 앱이 못 보여주는 야영지",
    description: "예약 앱이 놓치기 쉬운 공공·저렴·차박 야영지 8,000곳+. 합법성 확인과 지역·테마·시즌별 탐색.",
    url: "https://campgogo.kr",
    siteName: "캠핑고고",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "https://campgogo.kr/api/og", width: 1200, height: 630, alt: "캠핑고고" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "캠핑고고 — 예약 앱이 못 보여주는 야영지",
    description: "공공·저렴·차박 야영지 8,000곳+. 합법성 확인과 지역·테마·시즌별 탐색.",
    images: ["https://campgogo.kr/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* 다크모드 flash 방지: hydration 전에 class 복원 */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('cg-theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()` }} />
        <link rel="alternate" type="application/rss+xml" title="캠핑고고 블로그" href="/feed.xml" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        {/* Pretendard: <link>로 교체해 CSS @import 체인 제거 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css"
        />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        {/* AdSense — afterInteractive: LCP·TBT 보호 */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3050601904412736"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
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
      </body>
    </html>
  );
}
