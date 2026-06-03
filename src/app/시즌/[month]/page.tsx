import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { campsites } from "@/lib/db/schema";
import { eq, desc, or, sql } from "drizzle-orm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CampsiteCard } from "@/components/campsite/campsite-card";
import { buildBreadcrumbJsonLd, safeJsonLd } from "@/lib/seo/json-ld";
import type { ChabakTrust } from "@/lib/curation/chabak-trust";

export const revalidate = 86400;
export const dynamicParams = true; // Windows 정적 경로 문제로 ISR 방식 사용

type MonthNum = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

interface MonthInfo {
  korean: string;
  season: string;
  theme: "봄" | "여름" | "가을" | "겨울";
  heroGradient: string;
  description: string;
  advice: string;
  conditions: string[];
}

const MONTH_INFO: Record<MonthNum, MonthInfo> = {
  1: {
    korean: "1월",
    season: "한겨울",
    theme: "겨울",
    heroGradient: "linear-gradient(135deg, #374151, #1f2937)",
    description: "설경 속 고요한 캠핑",
    advice: "1월은 한 해에서 가장 추운 달입니다. 핫워터·전기 시설이 갖춰진 캠핑장을 선택하고, 방한 장비를 철저히 준비하세요.",
    conditions: ["핫워터 시설", "전기 공급", "방한 장비 필수", "결빙 구간 주의"],
  },
  2: {
    korean: "2월",
    season: "겨울 끝",
    theme: "겨울",
    heroGradient: "linear-gradient(135deg, #4b5563, #374151)",
    description: "봄을 기다리는 설원 캠핑",
    advice: "2월은 아직 겨울이지만 낮은 점점 길어집니다. 따뜻한 시설을 갖춘 캠핑장에서 이른 봄을 맞이해 보세요.",
    conditions: ["온수 시설 확인", "전기 공급 캠핑장", "두꺼운 침낭", "이른 일몰 대비"],
  },
  3: {
    korean: "3월",
    season: "초봄",
    theme: "봄",
    heroGradient: "linear-gradient(135deg, #4ade80, #16a34a)",
    description: "새싹 돋는 봄 캠핑의 시작",
    advice: "3월은 봄이 시작되지만 일교차가 큽니다. 낮에는 따뜻하나 밤에는 쌀쌀하니 보온 준비를 잊지 마세요.",
    conditions: ["일교차 대비", "봄꽃 명소", "바람 막이", "미세먼지 확인"],
  },
  4: {
    korean: "4월",
    season: "봄",
    theme: "봄",
    heroGradient: "linear-gradient(135deg, #86efac, #22c55e)",
    description: "벚꽃과 함께하는 봄 캠핑",
    advice: "4월은 야영의 최적기 중 하나입니다. 전국에 봄꽃이 피어나고 날씨가 쾌적해집니다. 주말은 예약이 일찍 마감되니 미리 준비하세요.",
    conditions: ["벚꽃·진달래 명소", "주말 사전 예약", "쾌적한 날씨", "황사 주의"],
  },
  5: {
    korean: "5월",
    season: "늦봄",
    theme: "봄",
    heroGradient: "linear-gradient(135deg, #34d399, #059669)",
    description: "신록이 물드는 최고의 캠핑 시즌",
    advice: "5월은 연중 가장 쾌적한 캠핑 시즌입니다. 자연휴양림과 공공야영장이 인기를 끌며, 가족 캠핑에도 최적입니다.",
    conditions: ["공공야영장 추천", "가족 캠핑 최적", "녹음 명소", "성수기 시작"],
  },
  6: {
    korean: "6월",
    season: "초여름",
    theme: "여름",
    heroGradient: "linear-gradient(135deg, #38bdf8, #0284c7)",
    description: "여름의 시작, 계곡과 바다로",
    advice: "6월은 장마 전 초여름입니다. 계곡 캠핑이 인기를 끌기 시작하며, 차박 여행도 활발해집니다. 갑작스러운 비에 대비하세요.",
    conditions: ["계곡 캠핑 추천", "차박 여행", "갑작스러운 비 대비", "모기 방충 준비"],
  },
  7: {
    korean: "7월",
    season: "한여름",
    theme: "여름",
    heroGradient: "linear-gradient(135deg, #0ea5e9, #0369a1)",
    description: "물놀이와 함께하는 한여름 캠핑",
    advice: "7월은 장마와 폭염이 겹치는 시기입니다. 수영장·계곡이 있는 야영지가 인기이며, 폭우와 산사태 위험 지역은 피하세요.",
    conditions: ["수영장·계곡 야영지", "폭우 대비", "그늘 확보", "산사태 위험 지역 회피"],
  },
  8: {
    korean: "8월",
    season: "성수기",
    theme: "여름",
    heroGradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
    description: "바다·계곡 캠핑 최성수기",
    advice: "8월은 여름 캠핑의 절정입니다. 해수욕장 인근 야영지와 계곡 캠핑이 가장 인기 있으며, 예약 없이는 자리를 구하기 어렵습니다.",
    conditions: ["해변·계곡 야영지", "예약 필수", "자외선 차단", "폭염 대비"],
  },
  9: {
    korean: "9월",
    season: "초가을",
    theme: "가을",
    heroGradient: "linear-gradient(135deg, #fb923c, #ea580c)",
    description: "선선한 바람, 가을 캠핑의 시작",
    advice: "9월은 무더위가 가시고 캠핑하기 좋은 계절이 돌아옵니다. 아직 낮에는 더울 수 있으니 그늘 있는 캠핑장을 선택하세요.",
    conditions: ["그늘 있는 캠핑장", "선선한 저녁", "코스모스 명소", "성수기 후반"],
  },
  10: {
    korean: "10월",
    season: "가을",
    theme: "가을",
    heroGradient: "linear-gradient(135deg, #f97316, #c2410c)",
    description: "단풍과 함께하는 가을 캠핑",
    advice: "10월은 단풍 절정기로 전국 명산과 계곡이 물듭니다. 밤에는 쌀쌀해지니 침낭과 방한 장비를 준비하세요.",
    conditions: ["단풍 명소", "야경 캠핑", "밤 기온 하강", "가을 별자리"],
  },
  11: {
    korean: "11월",
    season: "늦가을",
    theme: "가을",
    heroGradient: "linear-gradient(135deg, #d97706, #92400e)",
    description: "낙엽 카펫 위의 호젓한 캠핑",
    advice: "11월은 캠핑 비수기가 시작되어 한적한 캠핑을 즐길 수 있습니다. 아침 기온이 급격히 내려가니 보온에 신경 쓰세요.",
    conditions: ["한적한 비수기", "낙엽 단풍", "보온 장비 필수", "이른 일몰"],
  },
  12: {
    korean: "12월",
    season: "초겨울",
    theme: "겨울",
    heroGradient: "linear-gradient(135deg, #6b7280, #374151)",
    description: "눈 내리는 겨울 캠핑의 낭만",
    advice: "12월은 본격적인 겨울 캠핑 시즌입니다. 전기·온수 시설이 있는 야영지를 선택하고, 방한 장비를 철저히 챙기세요.",
    conditions: ["전기·온수 필수", "설경 캠핑", "동계 장비", "일찍 어두워짐"],
  },
};

function getSeason(month: MonthNum): "봄" | "여름" | "가을" | "겨울" {
  if (month >= 3 && month <= 5) return "봄";
  if (month >= 6 && month <= 8) return "여름";
  if (month >= 9 && month <= 11) return "가을";
  return "겨울";
}


export async function generateMetadata({
  params,
}: {
  params: Promise<{ month: string }>;
}): Promise<Metadata> {
  const { month } = await params;
  const num = parseInt(month, 10) as MonthNum;
  if (isNaN(num) || num < 1 || num > 12) return {};
  const info = MONTH_INFO[num];
  return {
    title: `${info.korean} 추천 야영지 | 캠핑고고`,
    description: `${info.korean}(${info.season}) 캠핑 추천 야영지 모음 — ${info.description}. 공공·차박·저렴 야영지를 한눈에.`,
    alternates: { canonical: `/시즌/${month}` },
  };
}

async function fetchMonthCampsites(month: MonthNum) {
  const season = getSeason(month);

  if (season === "여름") {
    // 여름: isPublic=true 또는 isChabak=true
    return db
      .select()
      .from(campsites)
      .where(or(eq(campsites.isPublic, true), eq(campsites.isChabak, true)))
      .orderBy(desc(campsites.fitScore))
      .limit(60);
  }

  if (season === "겨울") {
    // 겨울: 온수 또는 전기 시설 보유
    return db
      .select()
      .from(campsites)
      .where(
        or(
          sql`json_extract(${campsites.facilities}, '$.hotwater') = true`,
          sql`json_extract(${campsites.facilities}, '$.electric') = true`,
          sql`json_extract(${campsites.facilities}, '$.hotwater') = 1`,
          sql`json_extract(${campsites.facilities}, '$.electric') = 1`
        )
      )
      .orderBy(desc(campsites.fitScore))
      .limit(60);
  }

  // 봄·가을: fitScore 기준 정렬
  return db
    .select()
    .from(campsites)
    .orderBy(desc(campsites.fitScore))
    .limit(60);
}

export default async function MonthSeasonPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const num = parseInt(month, 10);
  if (isNaN(num) || num < 1 || num > 12) notFound();

  const monthNum = num as MonthNum;
  const info = MONTH_INFO[monthNum];
  const rows = await fetchMonthCampsites(monthNum);

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "캠핑고고", url: "https://campgogo.kr" },
    { name: "시즌별 야영지", url: "https://campgogo.kr/시즌" },
    { name: `${info.korean} 추천`, url: `https://campgogo.kr/시즌/${month}` },
  ]);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${info.korean} 추천 야영지`,
    description: info.description,
    numberOfItems: rows.length,
    itemListElement: rows.slice(0, 20).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      url: `https://campgogo.kr/캠핑장/${encodeURIComponent(c.sido)}/${encodeURIComponent(c.gungu ?? "기타")}/${c.id}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1">
        {/* 히어로 */}
        <div
          style={{
            background: info.heroGradient,
            color: "#fff",
            padding: "56px 0 48px",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 24px",
            }}
          >
            <nav
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.65)",
                marginBottom: "16px",
              }}
            >
              <a
                href="/"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                캠핑고고
              </a>
              {" / "}
              <a
                href="/시즌"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                시즌별
              </a>
              {" / "}
              {info.korean}
            </nav>
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.2)",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "12px",
                backdropFilter: "blur(6px)",
              }}
            >
              {info.season} · {info.theme}
            </div>
            <h1
              style={{
                fontSize: "clamp(28px, 4.5vw, 44px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                margin: "0 0 12px",
                color: "#fff",
              }}
            >
              {info.korean} 추천 야영지
            </h1>
            <p
              style={{
                fontSize: "17px",
                color: "rgba(255,255,255,0.85)",
                maxWidth: "540px",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {info.description}
            </p>
          </div>
        </div>

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "40px 24px 64px",
          }}
        >
          {/* 시즌 조언 */}
          <div
            style={{
              background: "var(--color-gray-50, #f9fafb)",
              border: "1px solid var(--color-gray-200)",
              borderRadius: "var(--radius-lg)",
              padding: "24px 28px",
              marginBottom: "36px",
            }}
          >
            <h2
              style={{
                margin: "0 0 10px",
                fontSize: "17px",
                fontWeight: 700,
                color: "var(--color-gray-900)",
              }}
            >
              {info.korean} 캠핑 포인트
            </h2>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "15px",
                color: "var(--color-gray-700)",
                lineHeight: 1.7,
              }}
            >
              {info.advice}
            </p>
            <div
              style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
            >
              {info.conditions.map((cond) => (
                <span
                  key={cond}
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    padding: "4px 12px",
                    borderRadius: "999px",
                    background: "var(--color-forest-50, #f0fdf4)",
                    color: "var(--color-forest-700)",
                    border: "1px solid var(--color-forest-200, #bbf7d0)",
                  }}
                >
                  {cond}
                </span>
              ))}
            </div>
          </div>

          {/* 결과 수 */}
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-gray-500)",
              marginBottom: "24px",
            }}
          >
            {info.korean} 추천 야영지 {rows.length}곳
          </p>

          {/* 카드 그리드 */}
          {rows.length > 0 ? (
            <div className="grid4">
              {rows.map((c) => {
                const photos =
                  (c.photos as { url: string }[] | null) ?? [];
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
          ) : (
            <p
              style={{
                textAlign: "center",
                color: "var(--color-gray-400)",
                padding: "60px 0",
                fontSize: "16px",
              }}
            >
              해당 조건의 야영지가 없습니다.
            </p>
          )}

          {/* 다른 달 링크 */}
          <div style={{ marginTop: "56px" }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--color-gray-900)",
                marginBottom: "20px",
              }}
            >
              다른 달 보기
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(80px, 1fr))",
                gap: "8px",
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <a
                  key={m}
                  href={`/시즌/${m}`}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "10px 8px",
                    borderRadius: "var(--radius-md)",
                    border:
                      m === monthNum
                        ? "2px solid var(--color-forest-600)"
                        : "1px solid var(--color-gray-200)",
                    background:
                      m === monthNum
                        ? "var(--color-forest-50, #f0fdf4)"
                        : "#fff",
                    color:
                      m === monthNum
                        ? "var(--color-forest-700)"
                        : "var(--color-gray-700)",
                    fontWeight: m === monthNum ? 700 : 500,
                    fontSize: "14px",
                    textDecoration: "none",
                  }}
                >
                  {MONTH_INFO[m as MonthNum].korean}
                </a>
              ))}
            </div>
          </div>

          <div
            className="disclaimer"
            style={{ marginTop: "40px" }}
          >
            데이터 출처: 한국관광공사 고캠핑 API · 전국야영장 표준데이터
            (공공누리 제1유형). 정보는 변경될 수 있으니 방문 전 최종 확인
            바랍니다.
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
