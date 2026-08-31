import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { campsites } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { buildBreadcrumbJsonLd, safeJsonLd } from "@/lib/seo/json-ld";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "지역별 야영지",
  description:
    "전국 17개 시도별 공공·저렴·차박 야영지를 모아봤습니다. 내 지역 야영지를 지금 바로 찾아보세요.",
  alternates: { canonical: "https://campgogo.kr/지역" },
  openGraph: {
    title: "지역별 야영지 | 캠핑고고",
    description:
      "전국 17개 시도별 공공·저렴·차박 야영지를 모아봤습니다. 내 지역 야영지를 지금 바로 찾아보세요.",
    url: "https://campgogo.kr/지역",
    siteName: "캠핑고고",
    locale: "ko_KR",
    type: "website",
  },
};

interface SidoMeta {
  slug: string;
  label: string;
  emoji: string;
  accent: string;
}

const SIDO_META: SidoMeta[] = [
  { slug: "경기", label: "경기도", emoji: "🏙", accent: "#4A7FA5" },
  { slug: "강원", label: "강원도", emoji: "⛰", accent: "#3E7D5A" },
  { slug: "경북", label: "경상북도", emoji: "🌲", accent: "#557A54" },
  { slug: "경남", label: "경상남도", emoji: "🌊", accent: "#1B6CA8" },
  { slug: "충남", label: "충청남도", emoji: "🌾", accent: "#B08433" },
  { slug: "충북", label: "충청북도", emoji: "🏞", accent: "#5A8A7A" },
  { slug: "전남", label: "전라남도", emoji: "🏝", accent: "#2E86AB" },
  { slug: "전북", label: "전라북도", emoji: "🌿", accent: "#4E8B5F" },
  { slug: "인천", label: "인천광역시", emoji: "⛵", accent: "#3A6EA5" },
  { slug: "제주", label: "제주특별자치도", emoji: "🌺", accent: "#C05757" },
  { slug: "서울", label: "서울특별시", emoji: "🌆", accent: "#6A5ACD" },
  { slug: "부산", label: "부산광역시", emoji: "🌅", accent: "#E07B39" },
  { slug: "대구", label: "대구광역시", emoji: "🌇", accent: "#8B5E3C" },
  { slug: "광주", label: "광주광역시", emoji: "🌸", accent: "#C5706A" },
  { slug: "대전", label: "대전광역시", emoji: "🏛", accent: "#5C6BC0" },
  { slug: "울산", label: "울산광역시", emoji: "🏭", accent: "#607D8B" },
  { slug: "세종", label: "세종특별자치시", emoji: "🏗", accent: "#7B8B6F" },
];

export default async function RegionIndexPage() {
  // sido별 야영지 수 집계
  let countMap: Record<string, number> = {};
  try {
    const rows = await db
      .select({
        sido: campsites.sido,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(campsites)
      .groupBy(campsites.sido);
    for (const row of rows) {
      if (row.sido) countMap[row.sido] = Number(row.count);
    }
  } catch {
    countMap = {};
  }

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "캠핑고고", url: "https://campgogo.kr" },
    { name: "지역별 야영지", url: "https://campgogo.kr/지역" },
  ]);

  const totalCount = Object.values(countMap).reduce((s, n) => s + n, 0) || 8038;

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
              <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
                캠핑고고
              </Link>{" "}
              / 지역
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
              지역별 야영지
            </h1>
            <p
              style={{
                fontSize: "16px",
                color: "var(--color-forest-100)",
                margin: 0,
              }}
            >
              전국 {totalCount.toLocaleString("ko-KR")}곳+ 야영지를 시도별로
              찾아보세요
            </p>
          </div>
        </div>

        {/* Region grid */}
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
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            {SIDO_META.map((s) => {
              const count = countMap[s.slug] ?? 0;
              return (
                <a
                  key={s.slug}
                  href={`/지역/${encodeURIComponent(s.slug)}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "20px 18px",
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
                      width: "46px",
                      height: "46px",
                      borderRadius: "var(--radius-md)",
                      background: `${s.accent}18`,
                      fontSize: "22px",
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    {s.emoji}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "var(--color-gray-900)",
                        letterSpacing: "-0.01em",
                        marginBottom: "3px",
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: count > 0 ? s.accent : "var(--color-gray-400)",
                        fontWeight: 600,
                      }}
                    >
                      {count > 0
                        ? `야영지 ${count.toLocaleString("ko-KR")}곳`
                        : "정보 수집 중"}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "16px",
                      color: "var(--color-gray-400)",
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    →
                  </span>
                </a>
              );
            })}
          </div>

          <p
            style={{
              marginTop: "40px",
              fontSize: "13px",
              color: "var(--color-gray-400)",
              lineHeight: 1.6,
            }}
          >
            데이터 출처: 한국관광공사 고캠핑 API · 전국야영장 표준데이터
            (공공누리 제1유형). 정보는 변경될 수 있으니 방문 전 최종 확인
            바랍니다.
          </p>
        </div>
      </main>
      <SiteFooter showMonetization />
    </>
  );
}
