import { db } from "@/lib/db/client";
import { pages, campsites, aiBudget, userReports } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

type PageRow = {
  id: string;
  title: string;
  campsiteId: string | null;
  qualityScore: number | null;
  status: string;
  uniquePointsCount: number | null;
  datePublished: string | null;
  updatedAt: Date | null;
  campsiteName: string | null;
  sido: string | null;
};

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; filter?: string }>;
}) {
  const sp = await searchParams;

  // 토큰 체크 (쿼리 파라미터로)
  const isAuth = sp.token === (process.env.ADMIN_API_TOKEN ?? "");
  if (!isAuth) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <p style={{ color: "#999" }}>인증 필요: ?token=YOUR_ADMIN_API_TOKEN</p>
      </div>
    );
  }

  const filter = sp.filter ?? "quality_passed";

  // 품질 통과 페이지 목록
  const statusFilter = filter === "all" ? undefined : filter;
  const rows = (await db
    .select({
      id: pages.id,
      title: pages.title,
      campsiteId: pages.campsiteId,
      qualityScore: pages.qualityScore,
      status: pages.status,
      uniquePointsCount: pages.uniquePointsCount,
      datePublished: pages.datePublished,
      updatedAt: pages.updatedAt,
      campsiteName: campsites.name,
      sido: campsites.sido,
    })
    .from(pages)
    .leftJoin(campsites, eq(pages.campsiteId, campsites.id))
    .where(
      statusFilter
        ? eq(pages.status, statusFilter)
        : undefined
    )
    .orderBy(desc(pages.updatedAt))
    .limit(100)) as PageRow[];

  // 통계
  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    published: sql<number>`sum(case when status = 'published' then 1 else 0 end)`,
    qualityPassed: sql<number>`sum(case when status = 'quality_passed' then 1 else 0 end)`,
    draft: sql<number>`sum(case when status = 'draft' then 1 else 0 end)`,
  }).from(pages);

  // 오늘 AI 예산
  const today = new Date().toISOString().slice(0, 10);
  const budgetRow = await db.select().from(aiBudget).where(eq(aiBudget.date, today)).get();

  // 미처리 신고
  const pendingReports = await db.select({ id: userReports.id }).from(userReports)
    .where(eq(userReports.status, "pending")).limit(100);

  const FILTERS = [
    { label: "품질통과 대기", value: "quality_passed" },
    { label: "발행됨", value: "published" },
    { label: "드래프트", value: "draft" },
    { label: "전체", value: "all" },
  ];

  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px 64px", fontFamily: "var(--font-pretendard, sans-serif)" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "8px", color: "var(--color-gray-900)" }}>
          Admin — 품질 리뷰
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-gray-400)", marginBottom: "28px" }}>
          AI 보강 완료 페이지를 검토하고 발행 여부를 결정합니다. 발행은 <code>/api/cron/publish</code> cron이 자동 처리합니다.
        </p>

        {/* 통계 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "전체 페이지", value: Number(stats?.total ?? 0) },
            { label: "발행됨", value: Number(stats?.published ?? 0), accent: "var(--color-forest-600)" },
            { label: "품질통과 대기", value: Number(stats?.qualityPassed ?? 0), accent: "#B08433" },
            { label: "드래프트", value: Number(stats?.draft ?? 0), accent: "var(--color-gray-500)" },
            { label: "미처리 신고", value: pendingReports.length, accent: "#C05757" },
            {
              label: "오늘 AI 비용",
              value: `$${(budgetRow?.totalCostUsd ?? 0).toFixed(3)}`,
              suffix: ` / ${budgetRow?.callCount ?? 0}건`,
              accent: "#4A5A6A",
            },
          ].map((s, i) => (
            <div key={i} style={{ padding: "16px 18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-gray-200)", background: "#fff" }}>
              <div style={{ fontSize: "12px", color: "var(--color-gray-400)", fontWeight: 600, marginBottom: "6px" }}>{s.label}</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: s.accent ?? "var(--color-gray-800)" }}>
                {s.value}{("suffix" in s) && <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--color-gray-400)" }}>{s.suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* 필터 탭 */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <a
              key={f.value}
              href={`?token=${sp.token}&filter=${f.value}`}
              style={{
                padding: "6px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: 600,
                textDecoration: "none",
                background: filter === f.value ? "var(--color-forest-600)" : "var(--color-gray-100)",
                color: filter === f.value ? "#fff" : "var(--color-gray-700)",
                border: `1px solid ${filter === f.value ? "var(--color-forest-600)" : "var(--color-gray-200)"}`,
              }}
            >
              {f.label}
            </a>
          ))}
        </div>

        {/* 페이지 테이블 */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
            <thead>
              <tr style={{ background: "var(--color-gray-50)", borderBottom: "2px solid var(--color-gray-200)" }}>
                {["야영지명", "지역", "품질점수", "고유포인트", "상태", "업데이트", "링크"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "var(--color-gray-600)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const score = r.qualityScore ?? 0;
                const scoreColor = score >= 90 ? "var(--color-forest-600)" : score >= 70 ? "#B08433" : "#C05757";
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--color-gray-100)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--color-gray-800)", maxWidth: "220px" }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.campsiteName ?? r.title}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--color-gray-500)", whiteSpace: "nowrap" }}>{r.sido ?? ""}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: scoreColor }}>{score}점</td>
                    <td style={{ padding: "10px 12px", color: "var(--color-gray-500)" }}>{r.uniquePointsCount ?? 0}개</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "999px", fontSize: "11.5px", fontWeight: 700,
                        background: r.status === "published" ? "var(--color-forest-100)" : r.status === "quality_passed" ? "#FDF5D8" : "var(--color-gray-100)",
                        color: r.status === "published" ? "var(--color-forest-700)" : r.status === "quality_passed" ? "#7A5B00" : "var(--color-gray-500)",
                      }}>
                        {r.status === "published" ? "발행됨" : r.status === "quality_passed" ? "발행대기" : "드래프트"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--color-gray-400)", whiteSpace: "nowrap" }}>
                      {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {r.campsiteId && r.sido && (
                        <a
                          href={`/캠핑장/${encodeURIComponent(r.sido)}/${encodeURIComponent("기타")}/${r.campsiteId}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ color: "var(--color-forest-600)", textDecoration: "underline", fontSize: "12.5px" }}
                        >
                          보기 →
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--color-gray-400)" }}>
                    해당 상태의 페이지가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: "24px", fontSize: "12.5px", color: "var(--color-gray-400)" }}>
          발행은 매일 21:00 <code>cron/publish</code> 가 <strong>quality_passed</strong> 상태 페이지를 자동 발행합니다. 드래프트는 AI 보강 재실행 또는 수동 상태 변경이 필요합니다.
        </p>
      </main>
    </>
  );
}
