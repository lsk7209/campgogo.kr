import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { campsites } from "@/lib/db/schema";
import { desc, isNotNull } from "drizzle-orm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CampsiteCard } from "@/components/campsite/campsite-card";
import { buildBreadcrumbJsonLd, safeJsonLd } from "@/lib/seo/json-ld";
import type { ChabakTrust } from "@/lib/curation/chabak-trust";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "전국 야영지 찾기 | 캠핑고고",
  description:
    "공공·무료·차박 야영지 8,000곳+를 지역·테마·시즌·조건으로 찾아보세요. 예약 앱에 없는 야영지를 발굴합니다.",
  alternates: { canonical: "https://campgogo.kr/캠핑장" },
  openGraph: {
    title: "전국 야영지 찾기 | 캠핑고고",
    description:
      "공공·무료·차박 야영지 8,000곳+를 지역·테마·시즌·조건으로 찾아보세요.",
    url: "https://campgogo.kr/캠핑장",
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
      .limit(12);
  } catch {
    recent = [];
  }

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "캠핑고고", url: "https://campgogo.kr" },
    { name: "전국 야영지 찾기", url: "https://campgogo.kr/캠핑장" },
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
              <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
                캠핑고고
              </Link>{" "}
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
            <p
              style={{
                maxWidth: "820px",
                margin: "18px 0 0",
                fontSize: "15px",
                lineHeight: 1.8,
                color: "var(--color-forest-50)",
              }}
            >
              이 목록은 예약 버튼을 누르기 전에 공공 데이터 출처, 무료 여부, 차박 가능성, 계절 운영,
              현장 통제 가능성을 먼저 확인하도록 돕는 색인입니다. 같은 지역의 야영지도 관리 주체,
              예약 방식, 차량 진입, 화장실 거리, 취사 가능 여부, 반려동물 동반 규정이 다르므로
              목록에서 후보를 좁힌 뒤 공식 예약처와 현장 안내를 다시 확인하는 흐름을 권장합니다.
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
                marginBottom: "24px",
                padding: "20px",
                border: "1px solid var(--color-gray-200)",
                borderRadius: "var(--radius-lg)",
                background: "#fff",
                color: "var(--color-gray-700)",
                lineHeight: 1.8,
              }}
            >
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: "17px",
                  color: "var(--color-gray-900)",
                }}
              >
                캠핑장 목록을 읽는 기준
              </h3>
              <p style={{ margin: "0 0 10px" }}>
                캠핑장 목록은 위치와 기본 조건을 빠르게 비교하기 위한 색인입니다. 실제 이용 전에는
                예약 가능 여부, 이용 요금, 입퇴실 시간, 전기 사용 가능 여부, 장작 사용 제한,
                반려동물 동반, 우천 시 통제 여부를 공식 안내에서 다시 확인해야 합니다.
              </p>
              <p style={{ margin: 0 }}>
                무료 야영지나 노지 캠핑 후보는 특히 보수적으로 봐야 합니다. 무료로 알려진 장소라도
                계절 통제, 사유지 경계, 취사 금지, 야간 주차 제한, 쓰레기 반출 규정이 있을 수 있습니다.
                캠핑고고는 공공 데이터와 현장 확인 기준을 함께 보여 주지만 최종 방문 판단은 최신
                공지와 현장 표지판을 기준으로 해야 합니다.
              </p>
              <p style={{ margin: "10px 0 0" }}>
                가족 캠핑, 차박, 백패킹, 장박은 필요한 확인 항목이 다릅니다. 가족 캠핑은 화장실 거리,
                샤워장 온수, 매점 운영, 어린이 동선, 응급 상황 이동 시간을 먼저 봐야 하고, 차박은
                주차 가능 구역과 야간 체류 허용 여부를 별도로 확인해야 합니다. 백패킹 후보지는 거리와
                경사보다도 출입 제한, 기상 변화, 식수 확보, 쓰레기 회수 가능성이 중요합니다.
              </p>
              <p style={{ margin: "10px 0 0" }}>
                캠핑고고의 캠핑장 색인은 예약을 대신하거나 특정 장소 이용을 보장하지 않습니다. 목록에서
                마음에 드는 후보를 찾았다면 관리 기관 공지, 예약 페이지, 지자체 안내, 최근 방문 후기를
                함께 비교한 뒤 이동 계획을 세우는 것이 안전합니다. 특히 우천, 산불 조심 기간, 축제 기간,
                동절기에는 평소와 다른 통제 기준이 적용될 수 있으므로 출발 전 다시 확인해야 합니다.
              </p>
              <p style={{ margin: "10px 0 0" }}>
                아이나 반려동물과 함께 이동한다면 응급실 거리, 야간 조명, 소음 규정, 쓰레기 배출 위치도
                함께 확인해 실제 현장에서 생길 수 있는 불편을 줄이는 것이 좋습니다.
              </p>
            </div>
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
                <a
                  href="/match"
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-forest-600)",
                    textDecoration: "none",
                  }}
                >
                  내 조건으로 찾기 →
                </a>
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
