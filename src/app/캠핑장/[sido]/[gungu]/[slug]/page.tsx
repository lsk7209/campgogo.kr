import type { Metadata } from "next";
import Link from "next/link";
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
import { ReportButton } from "@/components/campsite/report-button";
import {
  buildBreadcrumbJsonLd,
  buildLocalBusinessJsonLd,
  buildFAQJsonLd,
  safeJsonLd,
} from "@/lib/seo/json-ld";
import { buildCampsiteMeta } from "@/lib/seo/meta";
import type { ChabakTrust } from "@/lib/curation/chabak-trust";

export const revalidate = 604800;
export const dynamicParams = true;

const BASE_URL = process.env.SITE_URL ?? "https://campgogo.kr";

// FAQ는 Gemini가 {q, a}로 반환
type Faq = { q: string; a: string } | { question: string; answer: string };

function normalizeFaq(raw: unknown): { q: string; a: string }[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Faq[]).map((f) => {
    if ("q" in f) return { q: f.q, a: f.a };
    return { q: (f as { question: string; answer: string }).question, a: (f as { question: string; answer: string }).answer };
  }).filter((f) => f.q && f.a);
}

function parseArr<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
}

function parseObj(raw: unknown): Record<string, boolean> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, boolean>;
  if (typeof raw === "string") { try { return JSON.parse(raw) ?? {}; } catch { return {}; } }
  return {};
}

const FAC_LABELS: Record<string, string> = {
  wifi: "Wi-Fi", electricity: "전기", shower: "샤워실", toilet: "화장실",
  sink: "세면대", bbq: "바비큐", campfire: "모닥불", pool: "수영장·물놀이",
  playground: "놀이터", laundry: "세탁기", pet: "반려동물 동반", store: "매점",
  parking: "주차", disabled: "장애인 편의", glamping: "글램핑",
};

async function getCampsite(slug: string) {
  return db.select().from(campsites).where(eq(campsites.id, slug)).get();
}

async function getPageRecord(campsiteId: string) {
  return db
    .select()
    .from(pages)
    .where(and(eq(pages.campsiteId, campsiteId), eq(pages.type, "campsite")))
    .get();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sido: string; gungu: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let campsite: Awaited<ReturnType<typeof getCampsite>>;
  try {
    campsite = await getCampsite(decodeURIComponent(slug));
  } catch {
    return { title: "캠핑장 정보" };
  }
  if (!campsite) notFound();

  const meta = buildCampsiteMeta(campsite);
  const page = await getPageRecord(campsite.id);

  if (page?.metaDescription) {
    meta.description = page.metaDescription;
    if (meta.openGraph) (meta.openGraph as Record<string, unknown>).description = page.metaDescription;
  }
  if (page?.title) {
    meta.title = page.title;
    if (meta.openGraph) (meta.openGraph as Record<string, unknown>).title = `${page.title} | 캠핑고고`;
    if (meta.twitter) (meta.twitter as Record<string, unknown>).title = `${page.title} | 캠핑고고`;
  }

  const canonical = `${BASE_URL}/캠핑장/${encodeURIComponent(campsite.sido)}/${encodeURIComponent(campsite.gungu ?? "기타")}/${campsite.id}`;
  meta.alternates = { canonical };
  return meta;
}

export default async function CampsitePage({
  params,
}: {
  params: Promise<{ sido: string; gungu: string; slug: string }>;
}) {
  const { slug } = await params;
  const campsite = await getCampsite(decodeURIComponent(slug));
  if (!campsite) notFound();

  const page = await getPageRecord(campsite.id);
  const chabakTrust = campsite.chabakTrustLevel as ChabakTrust;

  const faqs = normalizeFaq(page?.faqs);
  const uniquePoints = parseArr<string>(campsite.uniquePoints);
  const facilities = parseObj(campsite.facilities);
  const facilityLabels = Object.entries(facilities).filter(([, v]) => v).map(([k]) => FAC_LABELS[k] ?? k);
  const nearbySpots = parseArr<{ name: string; type?: string; distance?: number }>(campsite.nearbyTourSpots);
  const internalLinks = parseArr<{ href: string; label: string }>(page?.internalLinks);
  const photos = parseArr<{ url: string }>(campsite.photos);
  const heroPhoto = photos[0]?.url ?? null;

  const canonicalUrl = `${BASE_URL}/캠핑장/${encodeURIComponent(campsite.sido)}/${encodeURIComponent(campsite.gungu ?? "기타")}/${campsite.id}`;

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "캠핑고고", url: BASE_URL },
    { name: "전국 야영지", url: `${BASE_URL}/캠핑장` },
    { name: campsite.sido, url: `${BASE_URL}/지역/${encodeURIComponent(campsite.sido)}` },
    ...(campsite.gungu
      ? [{ name: campsite.gungu, url: `${BASE_URL}/지역/${encodeURIComponent(campsite.sido)}/${encodeURIComponent(campsite.gungu)}` }]
      : []),
    { name: campsite.name, url: canonicalUrl },
  ]);

  const placeJsonLd =
    campsite.lat && campsite.lng
      ? buildLocalBusinessJsonLd({
          name: campsite.name,
          description: page?.metaDescription ?? undefined,
          address: campsite.address ?? `${campsite.sido} ${campsite.gungu ?? ""}`,
          lat: campsite.lat,
          lng: campsite.lng,
          url: canonicalUrl,
          image: heroPhoto ?? undefined,
        })
      : null;

  const faqJsonLd = faqs.length >= 2 ? buildFAQJsonLd(faqs) : null;

  const heroGradient = campsite.isChabak
    ? "linear-gradient(135deg, var(--color-forest-800), #4A3520)"
    : "linear-gradient(135deg, var(--color-forest-800), var(--color-forest-600))";

  const heroStyle = heroPhoto
    ? {
        background: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%), url(${heroPhoto}) center/cover no-repeat`,
      }
    : { background: heroGradient };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }} />
      {placeJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(placeJsonLd) }} />
      )}
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />
      )}

      <SiteHeader />
      <main style={{ flex: 1 }}>
        {/* Hero */}
        <div style={{ ...heroStyle, color: "#fff", padding: "48px 0 40px", minHeight: heroPhoto ? "260px" : "auto", display: "flex", alignItems: "flex-end" }}>
          <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 24px", width: "100%" }}>
            <nav aria-label="위치" style={{ fontSize: "13px", color: "var(--color-forest-200)", marginBottom: "16px" }}>
              <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>캠핑고고</Link>
              {" / "}
              <Link href="/캠핑장" style={{ color: "inherit", textDecoration: "none" }}>전국 야영지</Link>
              {" / "}
              <Link href={`/지역/${encodeURIComponent(campsite.sido)}`} style={{ color: "inherit", textDecoration: "none" }}>{campsite.sido}</Link>
              {campsite.gungu && (
                <>
                  {" / "}
                  <Link href={`/지역/${encodeURIComponent(campsite.sido)}/${encodeURIComponent(campsite.gungu)}`} style={{ color: "inherit", textDecoration: "none" }}>{campsite.gungu}</Link>
                </>
              )}
            </nav>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "14px" }}>
              <div style={{ flex: 1, minWidth: "260px" }}>
                <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25, margin: "0 0 12px", color: "#fff" }}>
                  {campsite.name}
                </h1>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                  <ConditionBadges isPublic={campsite.isPublic} isFree={campsite.isFree} isCheap={campsite.isCheap} isChabak={campsite.isChabak} chabakTrustLevel={chabakTrust} />
                  {campsite.isChabak && <LegalitySignal isChabak={campsite.isChabak ?? false} chabakTrustLevel={chabakTrust} isPublic={campsite.isPublic ?? false} />}
                </div>
              </div>
              {campsite.price1Night != null && (
                <div style={{ flexShrink: 0, padding: "14px 20px", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "var(--color-forest-200)", marginBottom: "4px" }}>1박 기준</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff" }}>
                    {campsite.isFree ? "무료" : `${campsite.price1Night.toLocaleString("ko-KR")}원~`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "32px 24px 64px" }}>
          {/* 기본 정보 */}
          <section style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-800)", marginBottom: "16px" }}>기본 정보</h2>
            <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1px", background: "var(--color-gray-200)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              {[
                { label: "주소", value: campsite.address ?? `${campsite.sido} ${campsite.gungu ?? ""}` },
                { label: "이용 요금", value: campsite.isFree ? "무료" : campsite.price1Night != null ? `1박 ${campsite.price1Night.toLocaleString("ko-KR")}원~` : "가격 미정" },
                ...(campsite.operator ? [{ label: "운영기관", value: campsite.operator }] : []),
                ...(campsite.type ? [{ label: "야영장 유형", value: campsite.type }] : []),
                ...(campsite.contact ? [{ label: "문의", value: campsite.contact }] : []),
                ...(campsite.lat && campsite.lng ? [{ label: "좌표", value: `${campsite.lat.toFixed(5)}, ${campsite.lng.toFixed(5)}` }] : []),
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "14px 16px", background: i % 2 === 0 ? "#fff" : "var(--color-gray-50)" }}>
                  <dt style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em", color: "var(--color-gray-400)", textTransform: "uppercase" }}>{row.label}</dt>
                  <dd style={{ fontSize: "15px", lineHeight: "1.55", color: "var(--color-gray-800)", margin: 0 }}>{row.value}</dd>
                </div>
              ))}
            </dl>

            {/* 지도 링크 */}
            {campsite.lat && campsite.lng && (
              <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                <a
                  href={`https://map.kakao.com/link/map/${encodeURIComponent(campsite.name)},${campsite.lat},${campsite.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ padding: "8px 16px", borderRadius: "var(--radius-md)", background: "#FEE500", color: "#3C1E1E", fontSize: "13.5px", fontWeight: 700, textDecoration: "none" }}
                >
                  카카오맵
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${campsite.lat},${campsite.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ padding: "8px 16px", borderRadius: "var(--radius-md)", background: "var(--color-gray-100)", color: "var(--color-gray-700)", fontSize: "13.5px", fontWeight: 700, textDecoration: "none" }}
                >
                  Google 지도
                </a>
                {campsite.reservationUrl && (
                  <a
                    href={campsite.reservationUrl}
                    target="_blank" rel="noopener noreferrer"
                    style={{ padding: "8px 16px", borderRadius: "var(--radius-md)", background: "var(--color-forest-600)", color: "#fff", fontSize: "13.5px", fontWeight: 700, textDecoration: "none" }}
                  >
                    예약 / 공식 페이지 →
                  </a>
                )}
              </div>
            )}
          </section>

          {/* 시설 안내 */}
          {facilityLabels.length > 0 && (
            <section style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-800)", marginBottom: "14px" }}>시설 안내</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {facilityLabels.map((f, i) => (
                  <span key={i} style={{ padding: "5px 12px", borderRadius: "var(--radius-md)", background: "var(--color-forest-50)", border: "1px solid var(--color-forest-200)", fontSize: "13.5px", color: "var(--color-forest-700)", fontWeight: 600 }}>
                    {f}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 차박 가능 여부 */}
          {campsite.isChabak && (
            <section style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-800)", marginBottom: "14px" }}>차박 가능 여부</h2>
              <ChabakSafetyNotice chabakTrustLevel={chabakTrust} chabakSource={campsite.chabakSource} chabakSourceDate={campsite.chabakSourceDate} />
            </section>
          )}

          {/* 이 야영지의 특징 (uniquePoints) */}
          {uniquePoints.length > 0 && (
            <section style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-800)", marginBottom: "14px" }}>이 야영지의 특징</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {uniquePoints.map((pt, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 14px", borderRadius: "var(--radius-md)", background: "#fff", border: "1px solid var(--color-gray-100)", fontSize: "14.5px", color: "var(--color-gray-700)", lineHeight: 1.6 }}>
                    <span style={{ color: "var(--color-forest-500)", fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>✓</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 편집팀 코멘트 */}
          {page?.commentary && (
            <section style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-800)", marginBottom: "14px" }}>편집팀 코멘트</h2>
              <div style={{ fontSize: "15.5px", lineHeight: "1.8", color: "var(--color-gray-700)", padding: "20px 22px", background: "var(--color-forest-50)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-forest-100)", whiteSpace: "pre-wrap" }}>
                {page.commentary}
              </div>
            </section>
          )}

          {/* FAQ */}
          {faqs.length > 0 && (
            <section style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-800)", marginBottom: "14px" }}>자주 묻는 질문</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {faqs.map((faq, i) => (
                  <details key={i} style={{ border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                    <summary style={{ padding: "14px 18px", fontSize: "15px", fontWeight: 600, color: "var(--color-gray-800)", cursor: "pointer", background: "var(--color-gray-50)", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Q. {faq.q}</span>
                      <span aria-hidden="true" style={{ flexShrink: 0, fontSize: "14px", color: "var(--color-gray-400)" }}>▼</span>
                    </summary>
                    <div style={{ padding: "14px 18px", fontSize: "14.5px", lineHeight: "1.75", color: "var(--color-gray-600)", background: "#fff", borderTop: "1px solid var(--color-gray-100)" }}>
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* 주변 관광지 */}
          {nearbySpots.length > 0 && (
            <section style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-800)", marginBottom: "14px" }}>주변 관광지</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                {nearbySpots.map((spot, i) => (
                  <div key={i} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-sky-100)", border: "1px solid var(--color-sky-200)" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-sky-700)", marginBottom: "4px" }}>{spot.name}</div>
                    {(spot.type || spot.distance != null) && (
                      <div style={{ fontSize: "12.5px", color: "var(--color-gray-500)" }}>
                        {spot.type}{spot.type && spot.distance != null && " · "}{spot.distance != null && `약 ${spot.distance}km`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 관련 페이지 */}
          {internalLinks.length > 0 && (
            <section style={{ marginBottom: "40px", padding: "20px 22px", background: "var(--color-gray-50)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-gray-200)" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "12px" }}>관련 페이지</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                {internalLinks.map((link, i) => (
                  <li key={i}>
                    <a href={link.href} style={{ fontSize: "14px", color: "var(--color-forest-600)", textDecoration: "underline" }}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 같은 지역 더 보기 */}
          <div style={{ marginBottom: "32px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Link href={`/지역/${encodeURIComponent(campsite.sido)}`} style={{ padding: "9px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-forest-200)", background: "var(--color-forest-50)", color: "var(--color-forest-700)", fontSize: "13.5px", fontWeight: 600, textDecoration: "none" }}>
              {campsite.sido} 야영지 더 보기 →
            </Link>
            {campsite.gungu && (
              <Link href={`/지역/${encodeURIComponent(campsite.sido)}/${encodeURIComponent(campsite.gungu)}`} style={{ padding: "9px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-forest-200)", background: "var(--color-forest-50)", color: "var(--color-forest-700)", fontSize: "13.5px", fontWeight: 600, textDecoration: "none" }}>
                {campsite.sido} {campsite.gungu} 야영지 →
              </Link>
            )}
            <Link href="/match" style={{ padding: "9px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-gray-200)", background: "#fff", color: "var(--color-gray-700)", fontSize: "13.5px", fontWeight: 600, textDecoration: "none" }}>
              조건으로 야영지 찾기 →
            </Link>
          </div>

          {/* 저자 + 출처 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {page && (
              <AuthorLabel authorLabel={page.authorLabel} persona={page.persona} datePublished={page.datePublished} dateModified={page.dateModified} />
            )}
            <SourceAttribution chabakSource={campsite.chabakSource} chabakSourceDate={campsite.chabakSourceDate} isChabak={campsite.isChabak ?? false} />
            <ReportButton campsiteId={campsite.id} campsiteName={campsite.name} />
          </div>
        </div>
      </main>
      <SiteFooter showMonetization />
    </>
  );
}
