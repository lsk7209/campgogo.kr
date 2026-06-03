import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pages, campsites } from "@/lib/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LegalitySignal } from "@/components/legal/legality-signal";
import { ChabakSafetyNotice } from "@/components/legal/chabak-safety-notice";
import { AuthorLabel } from "@/components/legal/author-label";
import { SourceAttribution } from "@/components/legal/source-attribution";
import { ConditionBadges } from "@/components/campsite/condition-badges";
import type { ChabakTrust } from "@/lib/curation/chabak-trust";

export const revalidate = 604800;

async function getPageWithCampsite(slug: string) {
  const result = await db
    .select()
    .from(pages)
    .innerJoin(campsites, eq(pages.campsiteId, campsites.id))
    .where(and(eq(pages.slug, slug), eq(pages.status, "published")))
    .limit(1);
  return result[0] ?? null;
}

// generateStaticParams 제거 — Windows 한국어 경로 정적 빌드 오류 방지
// Vercel 배포 환경에서는 ISR (dynamicParams=true)로 정상 동작

export async function generateMetadata({ params }: { params: Promise<{ sido: string; gungu: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const row = await getPageWithCampsite(decodeURIComponent(slug));
  if (!row) return { title: "캠핑장 정보 | 캠핑고고" };
  const { pages: page, campsites: c } = row;
  const title = page.title || (c.name + " 야영지 정보");
  const description = page.metaDescription ?? (c.sido + " " + (c.gungu ?? "") + " " + c.name + " 야영지.");
  return { title, description, openGraph: { title, description, type: "article" } };
}

export default async function CampsitePage({ params }: { params: Promise<{ sido: string; gungu: string; slug: string }> }) {
  const { slug } = await params;
  const row = await getPageWithCampsite(decodeURIComponent(slug));
  if (!row) notFound();
  const { pages: page, campsites: campsite } = row;
  const faqs = (page.faqs as { question: string; answer: string }[] | null) ?? [];
  const uniquePoints = (campsite.uniquePoints as string[] | null) ?? [];
  const facilities = (campsite.facilities as Record<string, boolean> | null) ?? {};
  const facilityLabels = Object.entries(facilities).filter(([, v]) => v).map(([k]) => k);
  const nearbySpots = (campsite.nearbyTourSpots as { name: string; type?: string; distance?: number }[] | null) ?? [];
  const internalLinks = (page.internalLinks as { href: string; label: string }[] | null) ?? [];
  const chabakTrust = campsite.chabakTrustLevel as ChabakTrust;

  const heroGradient = campsite.isChabak
    ? "linear-gradient(135deg, var(--color-forest-800), #4A3520)"
    : "linear-gradient(135deg, var(--color-forest-800), var(--color-forest-600))";

  return (
    <>
      <SiteHeader />
      <main style={{ flex: 1 }}>
        <div style={{ background: heroGradient, color: "#fff", padding: "48px 0 40px" }}>
          <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 24px" }}>
            <nav aria-label="위치" style={{ fontSize: "13px", color: "var(--color-forest-200)", marginBottom: "16px" }}>
              <a href="/" style={{ color: "inherit", textDecoration: "none" }}>캠핑고고</a>
              {" / "}
              <a href={"/캠핑장/" + encodeURIComponent(campsite.sido)} style={{ color: "inherit", textDecoration: "none" }}>{campsite.sido}</a>
            </nav>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "14px" }}>
              <div style={{ flex: 1, minWidth: "260px" }}>
                <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25, margin: "0 0 12px", color: "#fff" }}>{campsite.name}</h1>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                  <ConditionBadges isPublic={campsite.isPublic} isFree={campsite.isFree} isCheap={campsite.isCheap} isChabak={campsite.isChabak} chabakTrustLevel={chabakTrust} />
                  {campsite.isChabak && <LegalitySignal isChabak={campsite.isChabak ?? false} chabakTrustLevel={chabakTrust} isPublic={campsite.isPublic ?? false} />}
                </div>
              </div>
              {campsite.price1Night != null && (
                <div style={{ flexShrink: 0, padding: "14px 20px", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "var(--color-forest-200)", marginBottom: "4px" }}>1박 기준</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff" }}>{campsite.isFree ? "무료" : campsite.price1Night.toLocaleString("ko-KR") + "원~"}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "32px 24px 0" }}>
          <section style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-800)", marginBottom: "16px" }}>기본 정보</h2>
            <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1px", background: "var(--color-gray-200)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              {[
                { label: "주소", value: campsite.address ?? (campsite.sido + " " + (campsite.gungu ?? "")) },
                { label: "이용 요금", value: campsite.isFree ? "무료" : campsite.price1Night != null ? "1박 " + campsite.price1Night.toLocaleString("ko-KR") + "원~" : "가격 미정" },
                ...(campsite.operator ? [{ label: "운영기관", value: campsite.operator }] : []),
                ...(campsite.contact ? [{ label: "문의", value: campsite.contact }] : []),
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "14px 16px", background: i % 2 === 0 ? "#fff" : "var(--color-gray-50)" }}>
                  <dt style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em", color: "var(--color-gray-400)", textTransform: "uppercase" }}>{row.label}</dt>
                  <dd style={{ fontSize: "15px", lineHeight: "1.55", color: "var(--color-gray-800)", margin: 0 }}>{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {facilityLabels.length > 0 && (
            <section style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-800)", marginBottom: "14px" }}>시설 안내</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {facilityLabels.map((f, i) => <span key={i} style={{ padding: "5px 12px", borderRadius: "var(--radius-md)", background: "var(--color-gray-100)", border: "1px solid var(--color-gray-200)", fontSize: "13.5px", color: "var(--color-gray-700)" }}>{f}</span>)}
              </div>
            </section>
          )}

          {campsite.isChabak && (
            <section style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-800)", marginBottom: "14px" }}>차박 가능 여부</h2>
              <ChabakSafetyNotice chabakTrustLevel={chabakTrust} chabakSource={campsite.chabakSource} chabakSourceDate={campsite.chabakSourceDate} />
            </section>
          )}

          {page.commentary && (
            <section style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-800)", marginBottom: "14px" }}>편집팀 코멘트</h2>
              <div style={{ fontSize: "15.5px", lineHeight: "1.8", color: "var(--color-gray-700)", padding: "20px 22px", background: "var(--color-forest-50)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-forest-100)", whiteSpace: "pre-wrap" }}>{page.commentary}</div>
            </section>
          )}

          {faqs.length > 0 && (
            <section style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-800)", marginBottom: "14px" }}>자주 묻는 질문</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {faqs.map((faq, i) => (
                  <details key={i} style={{ border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                    <summary style={{ padding: "14px 18px", fontSize: "15px", fontWeight: 600, color: "var(--color-gray-800)", cursor: "pointer", background: "var(--color-gray-50)", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Q. {faq.question}</span><span aria-hidden="true" style={{ flexShrink: 0, fontSize: "14px", color: "var(--color-gray-400)" }}>▼</span>
                    </summary>
                    <div style={{ padding: "14px 18px", fontSize: "14.5px", lineHeight: "1.75", color: "var(--color-gray-600)", background: "#fff", borderTop: "1px solid var(--color-gray-100)" }}>{faq.answer}</div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {nearbySpots.length > 0 && (
            <section style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-800)", marginBottom: "14px" }}>주변 관광지</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                {nearbySpots.map((spot, i) => (
                  <div key={i} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-sky-100)", border: "1px solid var(--color-sky-200)" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-sky-700)", marginBottom: "4px" }}>{spot.name}</div>
                    {(spot.type || spot.distance != null) && <div style={{ fontSize: "12.5px", color: "var(--color-gray-500)" }}>{spot.type}{spot.type && spot.distance != null && " · "}{spot.distance != null && "약 " + spot.distance + "km"}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {internalLinks.length > 0 && (
            <section style={{ marginBottom: "40px", padding: "20px 22px", background: "var(--color-gray-50)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-gray-200)" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "12px" }}>관련 페이지</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                {internalLinks.map((link, i) => <li key={i}><a href={link.href} style={{ fontSize: "14px", color: "var(--color-forest-600)", textDecoration: "underline" }}>{link.label}</a></li>)}
              </ul>
            </section>
          )}

          <div style={{ marginBottom: "40px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <AuthorLabel authorLabel={page.authorLabel} persona={page.persona} datePublished={page.datePublished} dateModified={page.dateModified} />
            <SourceAttribution chabakSource={campsite.chabakSource} chabakSourceDate={campsite.chabakSourceDate} isChabak={campsite.isChabak ?? false} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}