import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { campsites } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CampsiteCard } from "@/components/campsite/campsite-card";
import { buildRegionMeta } from "@/lib/seo/meta";
import { buildBreadcrumbJsonLd, safeJsonLd } from "@/lib/seo/json-ld";
import type { ChabakTrust } from "@/lib/curation/chabak-trust";

// ISR: 요청 시 생성, 24시간 캐시
export const revalidate = 86400;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ sido: string }> }): Promise<Metadata> {
  const { sido } = await params;
  const decoded = decodeURIComponent(sido);
  const rows = await db.select({ id: campsites.id }).from(campsites).where(eq(campsites.sido, decoded));
  return buildRegionMeta(decoded, rows.length);
}

export default async function SidoPage({ params }: { params: Promise<{ sido: string }> }) {
  const { sido } = await params;
  const decoded = decodeURIComponent(sido);

  const rows = await db
    .select()
    .from(campsites)
    .where(eq(campsites.sido, decoded))
    .orderBy(desc(campsites.fitScore))
    .limit(100);

  if (rows.length === 0) notFound();

  // 시군구별 그룹
  const byGungu = rows.reduce<Record<string, typeof rows>>((acc, c) => {
    const g = c.gungu ?? "기타";
    (acc[g] ??= []).push(c);
    return acc;
  }, {});

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "캠핑고고", url: "https://campgogo.kr" },
    { name: decoded, url: `https://campgogo.kr/지역/${sido}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }} />
      <SiteHeader />
      <main className="flex-1">
        <div style={{ background: "linear-gradient(135deg, var(--color-forest-800), var(--color-forest-600))", color: "#fff", padding: "48px 0 40px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
            <nav style={{ fontSize: "13px", color: "var(--color-forest-200)", marginBottom: "14px" }}>
              <a href="/" style={{ color: "inherit", textDecoration: "none" }}>캠핑고고</a> / 지역
            </nav>
            <h1 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px", color: "#fff" }}>
              {decoded} 야영지
            </h1>
            <p style={{ fontSize: "16px", color: "var(--color-forest-100)" }}>
              공공·저렴·차박 야영지 {rows.length}곳
            </p>
          </div>
        </div>

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 64px" }}>
          {/* 시군구 퀵링크 */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "40px" }}>
            {Object.keys(byGungu).sort().map((gungu) => (
              <a
                key={gungu}
                href={`/지역/${sido}/${encodeURIComponent(gungu)}`}
                style={{
                  fontSize: "13.5px", fontWeight: 600, padding: "6px 14px",
                  borderRadius: "999px", border: "1px solid var(--color-gray-300)",
                  background: "#fff", color: "var(--color-gray-700)", textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {gungu} <span style={{ color: "var(--color-gray-400)", fontSize: "12px" }}>{byGungu[gungu].length}</span>
              </a>
            ))}
          </div>

          {/* 카드 그리드 */}
          <div className="grid4">
            {rows.map((c) => {
              const photos = (c.photos as { url: string }[] | null) ?? [];
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

          <div className="disclaimer" style={{ marginTop: "40px" }}>
            데이터 출처: 한국관광공사 고캠핑 API · 전국야영장 표준데이터 (공공누리 제1유형).
            정보는 변경될 수 있으니 방문 전 최종 확인 바랍니다.
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
