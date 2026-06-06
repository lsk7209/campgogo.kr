import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "시즌별 추천 야영지 | 캠핑고고",
  description:
    "봄·여름·가을·겨울 시즌별 캠핑 추천 야영지 모음. 1월부터 12월까지 월별 최적 야영지를 안내합니다.",
  alternates: { canonical: "https://campgogo.kr/시즌" },
};

type Season = "봄" | "여름" | "가을" | "겨울";

interface MonthCard {
  month: number;
  korean: string;
  season: Season;
  short: string;
  bg: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
}

const MONTHS: MonthCard[] = [
  { month: 1, korean: "1월", season: "겨울", short: "설경 속 고요한 캠핑", bg: "linear-gradient(135deg, #374151, #1f2937)", textColor: "#fff", badgeBg: "rgba(255,255,255,0.15)", badgeText: "#e5e7eb" },
  { month: 2, korean: "2월", season: "겨울", short: "봄을 기다리는 설원 캠핑", bg: "linear-gradient(135deg, #4b5563, #374151)", textColor: "#fff", badgeBg: "rgba(255,255,255,0.15)", badgeText: "#e5e7eb" },
  { month: 3, korean: "3월", season: "봄", short: "새싹 돋는 봄 캠핑의 시작", bg: "linear-gradient(135deg, #4ade80, #16a34a)", textColor: "#fff", badgeBg: "rgba(255,255,255,0.2)", badgeText: "#f0fdf4" },
  { month: 4, korean: "4월", season: "봄", short: "벚꽃과 함께하는 봄 캠핑", bg: "linear-gradient(135deg, #86efac, #22c55e)", textColor: "#14532d", badgeBg: "rgba(20,83,45,0.1)", badgeText: "#166534" },
  { month: 5, korean: "5월", season: "봄", short: "신록이 물드는 최고의 시즌", bg: "linear-gradient(135deg, #34d399, #059669)", textColor: "#fff", badgeBg: "rgba(255,255,255,0.2)", badgeText: "#f0fdf4" },
  { month: 6, korean: "6월", season: "여름", short: "여름의 시작, 계곡과 바다로", bg: "linear-gradient(135deg, #38bdf8, #0284c7)", textColor: "#fff", badgeBg: "rgba(255,255,255,0.2)", badgeText: "#e0f2fe" },
  { month: 7, korean: "7월", season: "여름", short: "물놀이와 함께하는 한여름", bg: "linear-gradient(135deg, #0ea5e9, #0369a1)", textColor: "#fff", badgeBg: "rgba(255,255,255,0.2)", badgeText: "#e0f2fe" },
  { month: 8, korean: "8월", season: "여름", short: "바다·계곡 캠핑 최성수기", bg: "linear-gradient(135deg, #06b6d4, #0891b2)", textColor: "#fff", badgeBg: "rgba(255,255,255,0.2)", badgeText: "#cffafe" },
  { month: 9, korean: "9월", season: "가을", short: "선선한 바람, 가을 캠핑 시작", bg: "linear-gradient(135deg, #fb923c, #ea580c)", textColor: "#fff", badgeBg: "rgba(255,255,255,0.2)", badgeText: "#fff7ed" },
  { month: 10, korean: "10월", season: "가을", short: "단풍과 함께하는 가을 캠핑", bg: "linear-gradient(135deg, #f97316, #c2410c)", textColor: "#fff", badgeBg: "rgba(255,255,255,0.2)", badgeText: "#fff7ed" },
  { month: 11, korean: "11월", season: "가을", short: "낙엽 카펫 위의 호젓한 캠핑", bg: "linear-gradient(135deg, #d97706, #92400e)", textColor: "#fff", badgeBg: "rgba(255,255,255,0.2)", badgeText: "#fef3c7" },
  { month: 12, korean: "12월", season: "겨울", short: "눈 내리는 겨울 캠핑의 낭만", bg: "linear-gradient(135deg, #6b7280, #374151)", textColor: "#fff", badgeBg: "rgba(255,255,255,0.15)", badgeText: "#e5e7eb" },
];

const SEASON_GROUPS: { season: Season; label: string; months: MonthCard[] }[] = [
  { season: "봄", label: "봄 (3~5월)", months: MONTHS.filter((m) => m.season === "봄") },
  { season: "여름", label: "여름 (6~8월)", months: MONTHS.filter((m) => m.season === "여름") },
  { season: "가을", label: "가을 (9~11월)", months: MONTHS.filter((m) => m.season === "가을") },
  { season: "겨울", label: "겨울 (12~2월)", months: MONTHS.filter((m) => m.season === "겨울") },
];

const SEASON_ACCENT: Record<Season, string> = {
  봄: "var(--color-forest-600)",
  여름: "#0284c7",
  가을: "#ea580c",
  겨울: "#6b7280",
};

export default function SeasonIndexPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div style={{ background: "linear-gradient(135deg, var(--color-forest-800), var(--color-forest-600))", color: "#fff", padding: "52px 0 44px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
            <nav style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", marginBottom: "14px" }}>
              <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>캠핑고고</Link>{" / 시즌별"}
            </nav>
            <h1 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px", color: "#fff" }}>
              시즌별 추천 야영지
            </h1>
            <p style={{ fontSize: "16px", color: "var(--color-forest-100, rgba(255,255,255,0.85))", maxWidth: "480px", lineHeight: 1.6, margin: 0 }}>
              봄·여름·가을·겨울, 계절마다 달라지는 최고의 야영지를 소개합니다.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px 72px" }}>
          {SEASON_GROUPS.map(({ season, label, months }, idx) => (
            <section key={idx} style={{ marginBottom: "56px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-gray-900)", marginBottom: "20px", paddingBottom: "10px", borderBottom: `3px solid ${SEASON_ACCENT[season]}`, display: "inline-block" }}>
                {label}
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
                {months.map((m) => (
                  <a key={m.month} href={`/${encodeURIComponent("시즌")}/${m.month}`}
                    style={{ display: "flex", flexDirection: "column", background: m.bg, borderRadius: "var(--radius-lg)", overflow: "hidden", textDecoration: "none", color: m.textColor, minHeight: "160px", padding: "24px", transition: "transform 120ms ease, box-shadow 120ms ease", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                    aria-label={`${m.korean} 추천 야영지`}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <span style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.03em" }}>{m.korean}</span>
                      <span style={{ fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", background: m.badgeBg, color: m.badgeText }}>{m.season}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, opacity: 0.9, flex: 1 }}>{m.short}</p>
                    <div style={{ marginTop: "16px", fontSize: "13px", fontWeight: 600, opacity: 0.75 }}>추천 야영지 보기 →</div>
                  </a>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-gray-900)", marginBottom: "16px" }}>월별 빠른 이동</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px" }}>
              {MONTHS.map((m) => (
                <a key={m.month} href={`/${encodeURIComponent("시즌")}/${m.month}`}
                  style={{ display: "block", textAlign: "center", padding: "12px 8px", borderRadius: "var(--radius-md)", background: m.bg, color: m.textColor, fontWeight: 700, fontSize: "14px", textDecoration: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
                >
                  {m.korean}
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
