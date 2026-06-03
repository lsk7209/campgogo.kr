"use client";

import { useState } from "react";
import Link from "next/link";
import { runMatching, type CampsiteMatchData, type MatchInput, CITY_COORDS } from "@/lib/matching/client-matcher";

const THEME_OPTIONS = ["공공", "무료", "차박", "가성비", "계곡", "산", "해안"] as const;
const BUDGET_OPTIONS: { value: MatchInput["budget"]; label: string }[] = [
  { value: "free", label: "무료" },
  { value: "10000", label: "1만원 이하" },
  { value: "30000", label: "3만원 이하" },
  { value: "any", label: "상관없음" },
];
const RADIUS_OPTIONS = [30, 50, 100, 150, 200];
const CITY_LIST = Object.keys(CITY_COORDS);

function formatPrice(p: number | null) {
  if (p === null) return "가격 미정";
  if (p === 0) return "무료";
  return p.toLocaleString("ko-KR") + "원";
}

const CHABAK_BADGE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  confirmed: { label: "차박 합법 확인", bg: "var(--color-forest-100)", color: "var(--color-forest-700)", border: "var(--color-forest-200)" },
  estimated: { label: "차박 추정", bg: "#FFF8E7", color: "#7A5B00", border: "#E8C96A" },
  reported:  { label: "차박 제보", bg: "var(--color-sunset-100)", color: "var(--color-sunset-700)", border: "var(--color-sunset-200)" },
  incident:  { label: "단속 이력", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
};

function SkeletonCard() {
  return (
    <div style={{ border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "#fff" }}>
      <div style={{ height: 160, background: "var(--color-gray-100)" }} />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {[75, 50, 35].map((w, i) => (
          <div key={i} style={{ height: "14px", width: w + "%", background: "var(--color-gray-100)", borderRadius: "4px" }} />
        ))}
      </div>
    </div>
  );
}

function ResultCard({ c }: { c: CampsiteMatchData }) {
  const badge = c.chabakTrustLevel ? CHABAK_BADGE[c.chabakTrustLevel] : null;
  return (
    <Link href={"/캠핑장/" + c.slug} style={{ display: "block", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "#fff", textDecoration: "none", color: "inherit" }}>
      {c.photo ? (
        <div style={{ height: 160, backgroundImage: "url(" + c.photo + ")", backgroundSize: "cover", backgroundPosition: "center" }} aria-hidden="true" />
      ) : (
        <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-forest-50)", fontSize: "2.5rem" }} aria-hidden="true">⛺</div>
      )}
      <div style={{ padding: "14px 16px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, lineHeight: 1.4, marginBottom: "6px", color: "var(--color-forest-800)" }}>{c.name}</h3>
        <p style={{ fontSize: "13px", color: "var(--color-gray-500)", marginBottom: "10px" }}>{c.sido}{c.gungu ? " " + c.gungu : ""}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
          {badge && <span style={{ fontSize: "11.5px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", border: "1px solid " + badge.border, background: badge.bg, color: badge.color }}>{badge.label}</span>}
          <span style={{ fontSize: "11.5px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", background: "var(--color-sunset-100)", color: "var(--color-sunset-700)", border: "1px solid var(--color-sunset-200)" }}>적합도 {c.fitScore}</span>
        </div>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-forest-700)" }}>{formatPrice(c.price1Night)}</p>
      </div>
    </Link>
  );
}

export function MatchingTool() {
  const [themes, setThemes] = useState<string[]>([]);
  const [budget, setBudget] = useState<MatchInput["budget"]>("any");
  const [legality, setLegality] = useState<MatchInput["legalityFilter"]>("any");
  const [from, setFrom] = useState("");
  const [radius, setRadius] = useState(100);
  const [results, setResults] = useState<CampsiteMatchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTheme(t: string) {
    setThemes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  async function handleSearch() {
    setLoading(true); setError(null); setSearched(false);
    try {
      const data = await runMatching({ themes: themes.length > 0 ? themes : undefined, budget, legalityFilter: legality, from: from || undefined, radius: from ? radius : undefined });
      setResults(data); setSearched(true);
    } catch { setError("검색 중 오류가 발생했습니다."); }
    finally { setLoading(false); }
  }

  const chipStyle = (active: boolean): React.CSSProperties => ({
    fontSize: "13.5px", fontWeight: 600, padding: "7px 15px", borderRadius: "999px",
    border: "1px solid " + (active ? "var(--color-forest-700)" : "var(--color-gray-300)"),
    background: active ? "var(--color-forest-700)" : "#fff",
    color: active ? "#fff" : "var(--color-gray-700)", cursor: "pointer",
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px 64px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const, color: "var(--color-forest-600)", marginBottom: "14px" }}>
        <span style={{ width: "22px", height: "1.5px", background: "var(--color-sunset-500)", display: "inline-block" }} />
        조건 매칭
      </div>
      <h1 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25, color: "var(--color-forest-800)", marginBottom: "10px" }}>내 조건으로 야영지 찾기</h1>
      <p style={{ fontSize: "16px", lineHeight: 1.75, color: "var(--color-gray-600)", marginBottom: "40px", maxWidth: "560px" }}>테마·예산·차박 합법성·출발지로 조건을 고르면 적합한 야영지를 즉시 보여드립니다.</p>

      <div style={{ background: "var(--color-gray-50)", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-xl)", padding: "24px", marginBottom: "40px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "12px" }}>테마 (복수 선택)</legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {THEME_OPTIONS.map((t) => <button key={t} type="button" onClick={() => toggleTheme(t)} style={chipStyle(themes.includes(t))}>{t}</button>)}
            </div>
          </fieldset>
          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "12px" }}>예산 (1박 기준)</legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {BUDGET_OPTIONS.map((opt) => (
                <label key={String(opt.value)} style={{ ...chipStyle(budget === opt.value) }}>
                  <input type="radio" name="budget" value={String(opt.value)} checked={budget === opt.value} onChange={() => setBudget(opt.value)} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "12px" }}>차박 합법성</legend>
            <div style={{ display: "inline-flex", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              {(["confirmed_only", "any"] as const).map((v, i) => (
                <button key={v} type="button" onClick={() => setLegality(v)}
                  style={{ fontSize: "13.5px", fontWeight: 600, padding: "7px 16px", borderLeft: i > 0 ? "1px solid var(--color-gray-300)" : undefined, background: legality === v ? "var(--color-forest-700)" : "#fff", color: legality === v ? "#fff" : "var(--color-gray-600)", cursor: "pointer", border: "none" }}>
                  {v === "confirmed_only" ? "확인됨만" : "상관없음"}
                </button>
              ))}
            </div>
          </fieldset>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "16px" }}>
            <div>
              <label htmlFor="from-city" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "8px" }}>출발지</label>
              <select id="from-city" value={from} onChange={(e) => setFrom(e.target.value)} style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-gray-300)", background: "#fff", minWidth: "130px" }}>
                <option value="">선택 안 함</option>
                {CITY_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {from && (
              <div>
                <label htmlFor="radius" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "8px" }}>반경</label>
                <select id="radius" value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-gray-300)", background: "#fff", minWidth: "110px" }}>
                  {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r}km 이내</option>)}
                </select>
              </div>
            )}
            <button type="button" onClick={handleSearch} disabled={loading} style={{ fontSize: "14.5px", fontWeight: 700, padding: "10px 24px", borderRadius: "var(--radius-md)", background: "var(--color-forest-700)", color: "#fff", border: "none", cursor: "pointer", marginLeft: "auto", opacity: loading ? 0.6 : 1 }}>
              {loading ? "검색 중…" : "야영지 찾기"}
            </button>
          </div>
        </div>
      </div>

      {error && <p style={{ fontSize: "14px", padding: "12px 16px", borderRadius: "var(--radius-md)", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", marginBottom: "24px" }}>{error}</p>}
      {loading && <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>{[0,1,2].map((i) => <SkeletonCard key={i} />)}</div>}
      {!loading && searched && (
        <>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-forest-800)" }}>검색 결과 <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-gray-500)", marginLeft: "6px" }}>{results.length}곳</span></h2>
          </div>
          {results.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 24px", borderRadius: "var(--radius-xl)", background: "var(--color-gray-50)", border: "1px solid var(--color-gray-200)", color: "var(--color-gray-500)" }}>
              <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🏕️</p>
              <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>조건에 맞는 야영지가 없습니다</p>
              <p style={{ fontSize: "14px" }}>조건을 조금 넓혀보시거나, 테마·예산 필터를 조정해 보세요.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {results.map((c) => <ResultCard key={c.id} c={c} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
