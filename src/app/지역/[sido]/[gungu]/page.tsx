import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { campsites } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CampsiteCard } from "@/components/campsite/campsite-card";
import { buildBreadcrumbJsonLd, safeJsonLd } from "@/lib/seo/json-ld";
import { buildRegionMeta } from "@/lib/seo/meta";
import type { ChabakTrust } from "@/lib/curation/chabak-trust";

// 요청 시 동적 렌더링 + 24시간 캐시
export const revalidate = 86400;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ sido: string; gungu: string }> }): Promise<Metadata> {
  const { sido, gungu } = await params;
  const s = decodeURIComponent(sido);
  const g = decodeURIComponent(gungu);
  const rows = await db.select({ id: campsites.id }).from(campsites)
    .where(and(eq(campsites.sido, s), eq(campsites.gungu, g)));
  return buildRegionMeta(s, rows.length, g);
}

export default async function GunguPage({ params }: { params: Promise<{ sido: string; gungu: string }> }) {
  const { sido, gungu } = await params;
  const s = decodeURIComponent(sido);
  const g = decodeURIComponent(gungu);

  const rows = await db
    .select()
    .from(campsites)
    .where(and(eq(campsites.sido, s), eq(campsites.gungu, g)))
    .orderBy(desc(campsites.fitScore))
    .limit(60);

  if (rows.length === 0) notFound();

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "캠핑고고", url: "https://campgogo.kr" },
    { name: s, url: `https://campgogo.kr/지역/${sido}` },
    { name: g, url: `https://campgogo.kr/지역/${sido}/${gungu}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }} />
      <SiteHeader />
      <main className="flex-1">
        <div style={{ background: "linear-gradient(135deg, var(--color-forest-800), var(--color-forest-600))", color: "#fff", padding: "48px 0 40px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
            <nav style={{ fontSize: "13px", color: "var(--color-forest-200)", marginBottom: "14px" }}>
              <a href="/" style={{ color: "inherit", textDecoration: "none" }}>캠핑고고</a>
              {" / "}
              <a href={`/지역/${sido}`} style={{ color: "inherit", textDecoration: "none" }}>{s}</a>
              {" / "}{g}
            </nav>
            <h1 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px", color: "#fff" }}>
              {s} {g} 야영지
            </h1>
            <p style={{ fontSize: "16px", color: "var(--color-forest-100)" }}>
              공공·저렴·차박 야영지 {rows.length}곳
            </p>
          </div>
        </div>

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 64px" }}>
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
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
