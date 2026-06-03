import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "테마별 야영지 | 캠핑고고",
  description:
    "차박, 공공, 무료, 가성비, 계곡, 산, 해안 등 7가지 테마별로 엄선한 야영지를 찾아보세요.",
  alternates: {
    canonical: "https://campgogo.kr/테마",
  },
  openGraph: {
    title: "테마별 야영지 | 캠핑고고",
    description:
      "차박, 공공, 무료, 가성비, 계곡, 산, 해안 등 7가지 테마별로 엄선한 야영지를 찾아보세요.",
    url: "https://campgogo.kr/테마",
    siteName: "캠핑고고",
    locale: "ko_KR",
    type: "website",
  },
};

interface ThemeCard {
  slug: string;
  label: string;
  description: string;
  emoji: string;
  accent: string;
}

const THEMES: ThemeCard[] = [
  {
    slug: "차박",
    label: "차박",
    description: "차 옆에서 별빛 아래 하룻밤. 차박 허용 야영지 모음",
    emoji: "🚗",
    accent: "#A98A5E",
  },
  {
    slug: "공공",
    label: "공공",
    description: "지자체·국가기관이 운영하는 믿을 수 있는 공공 야영지",
    emoji: "🏛",
    accent: "#4A7FA5",
  },
  {
    slug: "무료",
    label: "무료",
    description: "입장료·사용료 없이 즐기는 무료 야영지",
    emoji: "🎁",
    accent: "#3E7D5A",
  },
  {
    slug: "가성비",
    label: "가성비",
    description: "1박 3만 원 이하, 가격 대비 만족도 높은 야영지",
    emoji: "💰",
    accent: "#B08433",
  },
  {
    slug: "계곡",
    label: "계곡·물놀이",
    description: "수영장·계곡 물놀이를 함께 즐길 수 있는 야영지",
    emoji: "💧",
    accent: "#2E86AB",
  },
  {
    slug: "산",
    label: "산·숲",
    description: "깊은 산속 울창한 숲 속의 삼림욕 힐링 야영지",
    emoji: "⛰",
    accent: "#557A54",
  },
  {
    slug: "해안",
    label: "해안·바다",
    description: "파도 소리 들으며 즐기는 바닷가 해안 야영지",
    emoji: "🌊",
    accent: "#1B6CA8",
  },
];

export default function ThemeIndexPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <div
          style={{
            background:
              "linear-gradient(135deg, var(--color-forest-800), var(--color-forest-600))",
            color: "#fff",
            padding: "48px 0 40px",
          }}
        >
          <div
            style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}
          >
            <nav
              style={{
                fontSize: "13px",
                color: "var(--color-forest-200)",
                marginBottom: "14px",
              }}
            >
              <a href="/" style={{ color: "inherit", textDecoration: "none" }}>
                캠핑고고
              </a>{" "}
              / 테마
            </nav>
            <h1
              style={{
                fontSize: "clamp(26px, 4vw, 40px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                margin: "0 0 10px",
                color: "#fff",
              }}
            >
              테마별 야영지
            </h1>
            <p style={{ fontSize: "16px", color: "var(--color-forest-100)", margin: 0 }}>
              원하는 캠핑 스타일에 맞는 야영지를 테마별로 찾아보세요
            </p>
          </div>
        </div>

        {/* Theme grid */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "48px 24px 72px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {THEMES.map((t) => (
              <a
                key={t.slug}
                href={`/테마/${encodeURIComponent(t.slug)}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  padding: "28px 24px",
                  background: "#fff",
                  border: "1px solid var(--color-gray-200)",
                  borderRadius: "var(--radius-lg)",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "transform 120ms ease, box-shadow 120ms ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "52px",
                    height: "52px",
                    borderRadius: "var(--radius-md)",
                    background: `${t.accent}18`,
                    fontSize: "26px",
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  {t.emoji}
                </span>
                <div>
                  <h2
                    style={{
                      margin: "0 0 6px",
                      fontSize: "18px",
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      color: "var(--color-gray-900)",
                    }}
                  >
                    {t.label} 야영지
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "var(--color-gray-500)",
                      lineHeight: "1.6",
                    }}
                  >
                    {t.description}
                  </p>
                </div>
                <span
                  style={{
                    marginTop: "auto",
                    paddingTop: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: t.accent,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  야영지 보기 →
                </span>
              </a>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
