import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { campsites } from "@/lib/db/schema";
import { desc, isNotNull } from "drizzle-orm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CampsiteCard } from "@/components/campsite/campsite-card";
import type { ChabakTrust } from "@/lib/curation/chabak-trust";

export const revalidate = 3600;

function parsePhotos(raw: unknown): { url: string }[] {
  if (Array.isArray(raw)) return raw as { url: string }[];
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? (p as { url: string }[]) : [];
    } catch { return []; }
  }
  return [];
}

export const metadata: Metadata = {
  title: "캠핑고고 — 예약 앱이 못 보여주는 야영지",
  description: "공공·저렴·차박 가능 야영지를 찾아주는 사이트. 8,000곳+ 공공데이터 기반, 합법성 확인 포함.",
};

const SIDO_LINKS = [
  "경기", "강원", "경북", "경남", "충남", "충북", "전남", "전북", "인천", "제주",
  "서울", "부산", "대구", "광주", "대전", "울산"
];

export default async function HomePage() {
  let featured: (typeof campsites.$inferSelect)[] = [];
  let totalCount = 0;

  try {
    featured = await db.select().from(campsites)
      .where(isNotNull(campsites.lat))
      .orderBy(desc(campsites.fitScore))
      .limit(8);
    // 총 수는 matching-data.json 기준 (8038건 고정 표시)
    totalCount = 8038;
  } catch { featured = []; }

  return (
    <>
      <SiteHeader activeNav="/" />
      <main className="flex-1">
        {/* Hero */}
        <section style={{ background: "linear-gradient(135deg, var(--color-forest-800) 0%, var(--color-forest-600) 100%)", color: "#fff", padding: "80px 0 72px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--color-forest-200)", marginBottom: "20px" }}>
              <span style={{ width: "22px", height: "1.5px", background: "var(--color-sunset-400)", display: "inline-block" }} />
              캠핑고고
              <span style={{ width: "22px", height: "1.5px", background: "var(--color-sunset-400)", display: "inline-block" }} />
            </div>
            <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 20px", color: "#fff" }}>
              예약 앱이 놓치기 쉬운
              <br />야영지를 찾아드립니다
            </h1>
            <p style={{ fontSize: "18px", lineHeight: 1.75, color: "var(--color-forest-100)", marginBottom: "36px", maxWidth: "520px", margin: "0 auto 36px" }}>
              공공·저렴·차박 야영지{totalCount > 0 ? ` ${totalCount.toLocaleString("ko-KR")}곳+` : ""}. 후기 커뮤니티나 실시간 예약 서비스가 아니라,
              출처가 있는 정보와 합법성 확인에 집중합니다.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
              <Link href="/match" style={{ fontSize: "15px", fontWeight: 700, padding: "13px 28px", borderRadius: "var(--radius-md)", background: "var(--color-sunset-600)", color: "#fff", textDecoration: "none", transition: "background 120ms" }}>
                내 조건으로 찾기 →
              </Link>
              <Link href="/blog" style={{ fontSize: "15px", fontWeight: 600, padding: "13px 28px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.12)", color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(4px)" }}>
                가이드 & 블로그
              </Link>
            </div>
          </div>
        </section>

        {/* 지역별 브라우징 */}
        <section style={{ background: "var(--color-gray-50)", borderBottom: "1px solid var(--color-gray-200)", padding: "24px 0" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-gray-500)", marginRight: "4px" }}>지역별:</span>
              {SIDO_LINKS.map((sido) => (
                <Link key={sido} href={`/지역/${encodeURIComponent(sido)}`}
                  style={{ fontSize: "13.5px", fontWeight: 600, padding: "5px 12px", borderRadius: "999px", border: "1px solid var(--color-gray-300)", background: "#fff", color: "var(--color-gray-700)", textDecoration: "none" }}>
                  {sido}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 추천 야영지 */}
        {featured.length > 0 && (
          <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "52px 24px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "23px", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--color-gray-900)" }}>
                적합도 높은 야영지
              </h2>
              <Link href="/match" style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-forest-600)", textDecoration: "none" }}>
                전체 검색 →
              </Link>
            </div>
            <div className="grid4">
              {featured.map((c) => {
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
          </section>
        )}

        {/* 3가지 가치 */}
        <section style={{ background: "var(--color-forest-800)", color: "#fff", padding: "64px 24px" }}>
          <div style={{ maxWidth: "960px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "40px" }}>
            {[
              { icon: "🔍", title: "앱이 놓치기 쉬운 곳", desc: "인기 유료 글램핑이 아닌 공공·노지·차박 야영지에 집중합니다." },
              { icon: "⚖️", title: "합법성 확인", desc: "차박 허용 여부를 4단계 신뢰도로 출처와 함께 표기합니다." },
              { icon: "📊", title: "공공데이터 기반", desc: "한국관광공사·data.go.kr 공공데이터를 1차 출처로 사용합니다." },
            ].map((item) => (
              <div key={item.title} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>{item.icon}</div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "10px", color: "#fff" }}>{item.title}</h3>
                <p style={{ fontSize: "14.5px", lineHeight: 1.7, color: "var(--color-forest-200)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
