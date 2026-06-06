import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { campsites } from "@/lib/db/schema";
import { eq, desc, lte, like, or, and } from "drizzle-orm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CampsiteCard } from "@/components/campsite/campsite-card";
import { buildBreadcrumbJsonLd, safeJsonLd } from "@/lib/seo/json-ld";
import type { ChabakTrust } from "@/lib/curation/chabak-trust";

export const revalidate = 86400;
export const dynamicParams = true;

const BASE_URL = process.env.SITE_URL ?? "https://campgogo.kr";

// ----------------------------------------------------------------
// 테마 정의
// ----------------------------------------------------------------
interface ThemeDef {
  label: string;
  description: string;
  heroDesc: string;
}

const THEME_MAP: Record<string, ThemeDef> = {
  차박: {
    label: "차박 야영지",
    description: "차 옆에 텐트를 치거나 차 안에서 하룻밤, 차박 가능한 야영지 모음입니다.",
    heroDesc: "차 옆에서 별빛 아래 하룻밤",
  },
  공공: {
    label: "공공 야영지",
    description: "지자체·국가기관이 운영하는 공공 야영지로 저렴하고 안전하게 이용할 수 있습니다.",
    heroDesc: "지자체·국가기관이 운영하는 믿을 수 있는 야영지",
  },
  무료: {
    label: "무료 야영지",
    description: "입장료·사용료가 없는 무료 야영지 모음입니다. 비용 없이 자연 속 캠핑을 즐기세요.",
    heroDesc: "돈 걱정 없이 즐기는 자연 속 캠핑",
  },
  가성비: {
    label: "가성비 야영지",
    description: "1박 3만 원 이하의 저렴한 야영지 모음입니다. 합리적인 가격으로 캠핑을 즐겨보세요.",
    heroDesc: "1박 3만 원 이하, 가격 대비 만족도 높은 캠핑",
  },
  계곡: {
    label: "계곡·물놀이 야영지",
    description: "수영장·물놀이 시설이 있거나 계곡 인근 야영지로 여름 물놀이 캠핑에 제격입니다.",
    heroDesc: "시원한 계곡과 물놀이를 함께 즐기는 야영지",
  },
  산: {
    label: "산·숲 야영지",
    description: "산악 지형 또는 울창한 숲 속에 자리 잡은 야영지로 삼림욕과 힐링 캠핑에 딱 맞습니다.",
    heroDesc: "깊은 산속 숲 향기 가득한 야영지",
  },
  해안: {
    label: "해안·바다 야영지",
    description: "바다 바로 앞 또는 해안가에 위치한 야영지로 파도 소리 들으며 캠핑할 수 있습니다.",
    heroDesc: "파도 소리와 함께하는 바닷가 캠핑",
  },
};

// ----------------------------------------------------------------
// generateMetadata
// ----------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ theme: string }>;
}): Promise<Metadata> {
  const { theme } = await params;
  const decoded = decodeURIComponent(theme);
  const def = THEME_MAP[decoded];
  if (!def) return { title: "테마 야영지 | 캠핑고고" };

  const count = await getCount(decoded);
  const title = `${def.label} ${count}곳 | 캠핑고고`;
  const url = `${BASE_URL}/테마/${encodeURIComponent(decoded)}`;

  return {
    title,
    description: def.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: def.description,
      url,
      siteName: "캠핑고고",
      locale: "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: def.description,
    },
  };
}

// ----------------------------------------------------------------
// DB helpers
// ----------------------------------------------------------------
async function getCount(theme: string): Promise<number> {
  const rows = await db
    .select({ id: campsites.id })
    .from(campsites)
    .where(buildWhere(theme));
  return rows.length;
}

function buildWhere(theme: string) {
  switch (theme) {
    case "차박":
      return eq(campsites.isChabak, true);
    case "공공":
      return eq(campsites.isPublic, true);
    case "무료":
      return eq(campsites.isFree, true);
    case "가성비":
      return and(
        eq(campsites.isFree, false),
        lte(campsites.price1Night, 30000)
      );
    case "계곡":
      return or(
        like(campsites.facilities as Parameters<typeof like>[0], "%pool%"),
        like(campsites.facilities as Parameters<typeof like>[0], "%water%"),
        like(campsites.facilities as Parameters<typeof like>[0], "%계곡%"),
        like(campsites.facilities as Parameters<typeof like>[0], "%물놀이%"),
        like(campsites.facilities as Parameters<typeof like>[0], "%수영%")
      );
    case "산":
      return or(
        like(campsites.type as Parameters<typeof like>[0], "%산%"),
        like(campsites.type as Parameters<typeof like>[0], "%숲%"),
        like(campsites.type as Parameters<typeof like>[0], "%forest%")
      );
    case "해안":
      return or(
        like(campsites.type as Parameters<typeof like>[0], "%해%"),
        like(campsites.type as Parameters<typeof like>[0], "%바다%"),
        like(campsites.type as Parameters<typeof like>[0], "%해안%"),
        like(campsites.type as Parameters<typeof like>[0], "%해수욕%")
      );
    default:
      return eq(campsites.isChabak, false);
  }
}

// ----------------------------------------------------------------
// Page component
// ----------------------------------------------------------------
export default async function ThemePage({
  params,
}: {
  params: Promise<{ theme: string }>;
}) {
  const { theme } = await params;
  const decoded = decodeURIComponent(theme);
  const def = THEME_MAP[decoded];

  if (!def) notFound();

  const rows = await db
    .select()
    .from(campsites)
    .where(buildWhere(decoded))
    .orderBy(desc(campsites.fitScore))
    .limit(80);

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "캠핑고고", url: BASE_URL },
    { name: "테마별 야영지", url: `${BASE_URL}/테마` },
    { name: def.label, url: `${BASE_URL}/테마/${encodeURIComponent(decoded)}` },
  ]);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: def.label,
    description: def.description,
    numberOfItems: rows.length,
    itemListElement: rows.slice(0, 20).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      url: `${BASE_URL}/캠핑장/${encodeURIComponent(c.sido)}/${encodeURIComponent(c.gungu ?? "기타")}/${c.id}`,
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
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemList) }}
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
            {/* Breadcrumb */}
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
              /{" "}
              <Link
                href="/테마"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                테마
              </Link>{" "}
              / {decoded}
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
              {def.label}
            </h1>
            <p style={{ fontSize: "16px", color: "var(--color-forest-100)", margin: "0 0 6px" }}>
              {def.heroDesc}
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-forest-200)",
                margin: 0,
              }}
            >
              총 {rows.length}곳
            </p>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "40px 24px 64px",
          }}
        >
          <p
            style={{
              fontSize: "15px",
              color: "var(--color-gray-600)",
              marginBottom: "32px",
              lineHeight: "1.7",
            }}
          >
            {def.description}
          </p>

          {rows.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "var(--color-gray-400)",
                padding: "64px 0",
                fontSize: "15px",
              }}
            >
              해당 테마의 야영지가 없습니다.
            </p>
          ) : (
            <div className="grid4">
              {rows.map((c) => {
                const photos =
                  (c.photos as { url: string }[] | string[] | null) ?? [];
                const photoUrls = photos.map((p) =>
                  typeof p === "string" ? p : (p as { url: string }).url
                );
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
                    photos={photoUrls}
                    href={`/캠핑장/${encodeURIComponent(c.sido)}/${encodeURIComponent(c.gungu ?? "기타")}/${c.id}`}
                  />
                );
              })}
            </div>
          )}

          <div
            className="disclaimer"
            style={{ marginTop: "40px" }}
          >
            데이터 출처: 한국관광공사 고캠핑 API · 전국야영장 표준데이터 (공공누리 제1유형).
            정보는 변경될 수 있으니 방문 전 최종 확인 바랍니다.
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
