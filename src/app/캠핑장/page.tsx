import type { Metadata } from "next";
import { db } from "@/lib/db/client";
import { campsites } from "@/lib/db/schema";
import { desc, isNotNull } from "drizzle-orm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CampsiteCard } from "@/components/campsite/campsite-card";
import { buildBreadcrumbJsonLd, safeJsonLd } from "@/lib/seo/json-ld";
import type { ChabakTrust } from "@/lib/curation/chabak-trust";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.SITE_URL ?? "https://campgogo.kr";

export const metadata: Metadata = {
  title: "전국 야영지 찾기 | 캠핑고고",
  description:
    "공공·무료·차박 야영지 8,000곳+를 지역·테마·시즌·조건으로 찾아보세요. 예약 앱에 없는 야영지를 발굴합니다.",
  alternates: { canonical: `${SITE_URL}/캠핑장` },
  openGraph: {
    title: "전국 야영지 찾기 | 캠핑고고",
    description:
      "공공·무료·차박 야영지 8,000곳+를 지역·테마·시즌·조건으로 찾아보세요.",
    url: `${SITE_URL}/캠핑장`,
    siteName: "캠핑고고",
    locale: "ko_KR",
    type: "website",
  },
};

const EXPLORE_CARDS = [
  {
    href: "/지역",
    emoji: "📍",
    title: "지역별",
    desc: "내 주변 시도별 야영지 탐색",
    accent: "#3E7D5A",
  },
  {
    href: "/테마",
    emoji: "🎯",
    title: "테마별",
    desc: "차박·공공·무료·계곡 등 7가지 테마",
    accent: "#A98A5E",
  },
  {
    href: "/시즌",
    emoji: "🌿",
    title: "시즌별",
    desc: "봄·여름·가을·겨울 최적 야영지",
    accent: "#0284c7",
  },
  {
    href: "/match",
    emoji: "🔍",
    title: "조건 매칭",
    desc: "예산·거리·합법성 조건으로 맞춤 검색",
    accent: "#C05757",
  },
];

function parsePhotos(raw: unknown): { url: string }[] {
  if (Array.isArray(raw)) return raw as { url: string }[];
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? (p as { url: string }[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default async function CampsiteIndexPage() {
  let recent: (typeof campsites.$inferSelect)[] = [];
  try {
    recent = await db
      .select()
      .from(campsites)
      .where(isNotNull(campsites.lat))
      .orderBy(desc(campsites.fitScore))
      .limit(24);
  } catch {
    recent = [];
  }

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "캠핑고고", url: SITE_URL },
    { name: "전국 야영지 찾기", url: `${SITE_URL}/캠핑장` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }}
      />
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
              / 캠핑장
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
              전국 야영지 찾기
            </h1>
            <p
              style={{
                fontSize: "16px",
                color: "var(--color-forest-100)",
                margin: 0,
              }}
            >
              8,000곳+ 야영지를 지역·테마·시즌·조건으로 찾아보세요
            </p>
          </div>
        </div>

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "48px 24px 72px",
          }}
        >
          {/* 탐색 방법 */}
          <section style={{ marginBottom: "56px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--color-gray-900)",
                marginBottom: "20px",
                letterSpacing: "-0.01em",
              }}
            >
              원하는 방법으로 찾기
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              {EXPLORE_CARDS.map((card) => (
                <a
                  key={card.href}
                  href={card.href}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    padding: "24px 20px",
                    background: "#fff",
                    border: "1px solid var(--color-gray-200)",
                    borderRadius: "var(--radius-lg)",
                    textDecoration: "none",
                    color: "inherit",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    transition: "transform 120ms ease, box-shadow 120ms ease",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "48px",
                      height: "48px",
                      borderRadius: "var(--radius-md)",
                      background: `${card.accent}18`,
                      fontSize: "24px",
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    {card.emoji}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "var(--color-gray-900)",
                        marginBottom: "4px",
                      }}
                    >
                      {card.title}
                    </div>
                    <div
                      style={{
                        fontSize: "13.5px",
                        color: "var(--color-gray-500)",
                        lineHeight: 1.5,
                      }}
                    >
                      {card.desc}
                    </div>
                  </div>
                  <span
                    style={{
                      marginTop: "auto",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: card.accent,
                    }}
                  >
                    바로 가기 →
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* 적합도 높은 야영지 */}
          {recent.length > 0 && (
            <section>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "var(--color-gray-900)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  적합도 높은 야영지
                </h2>
                <div style={{ display: "flex", gap: "16px" }}>
                  <a href="/지역" style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-forest-600)", textDecoration: "none" }}>
                    지역별 전체 보기 →
                  </a>
                  <a href="/match" style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-gray-500)", textDecoration: "none" }}>
                    내 조건으로 찾기 →
                  </a>
                </div>
              </div>
              <div className="grid4">
                {recent.map((c) => {
                  const photos = parsePhotos(c.photos);
                  return (
                    <CampsiteCard
                      key={c.id}
                      id={c.id}
                      name={c.name}
                      sido={c.sido}
                      gungu={c.gungu}
                      price1Night={c.price1Night}
                      isPublic={c.isPublic}
                      isFree={c.isFree}
                      isCheap={c.isCheap}
                      isChabak={c.isChabak}
                      chabakTrustLevel={c.chabakTrustLevel as ChabakTrust}
                      fitScore={c.fitScore}
                      photos={photos.map((p) => p.url)}
                      href={`/캠핑장/${encodeURIComponent(c.sido)}/${encodeURIComponent(c.gungu ?? "기타")}/${c.id}`}
                    />
                  );
                })}
              </div>

              <p
                style={{
                  marginTop: "32px",
                  fontSize: "13px",
                  color: "var(--color-gray-400)",
                  lineHeight: 1.6,
                }}
              >
                데이터 출처: 한국관광공사 고캠핑 API · 전국야영장 표준데이터
                (공공누리 제1유형). 정보는 변경될 수 있으니 방문 전 최종 확인
                바랍니다.
              </p>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
