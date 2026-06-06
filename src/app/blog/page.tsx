import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { eq, desc, and, lte, count } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const revalidate = 300;
const PAGE_SIZE = 18; // 카드형 3×N = 18이 자연스럽다

export const metadata: Metadata = {
  title: "가이드 & 블로그 | 캠핑고고",
  description:
    "공공·저렴·차박 야영지를 찾는 실전 가이드, 시즌 추천, 합법성 정보를 출처와 함께 정리합니다.",
  alternates: {
    canonical: `${process.env.SITE_URL ?? "https://campgogo.kr"}/blog`,
    types: { "application/rss+xml": "/feed.xml" },
  },
};

const CATEGORY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  "차박 가이드":      { bg: "var(--color-forest-100)", color: "var(--color-forest-700)", border: "var(--color-forest-200)" },
  "시즌 추천":        { bg: "var(--color-sunset-100)", color: "var(--color-sunset-700)", border: "var(--color-sunset-200)" },
  "데이터·정책":      { bg: "var(--color-sky-100)",    color: "var(--color-sky-700)",    border: "var(--color-sky-200)"    },
  "데이터 · 정책":    { bg: "var(--color-sky-100)",    color: "var(--color-sky-700)",    border: "var(--color-sky-200)"    },
  "공공 야영지":      { bg: "var(--color-soil-100)",   color: "var(--color-soil-700)",   border: "var(--color-soil-200)"   },
  "캠핑 요리·식단":   { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  "텐트·타프·침낭":   { bg: "#EDE9FE", color: "#5B21B6", border: "#DDD6FE" },
  "가족·어린이 캠핑": { bg: "#FCE7F3", color: "#9D174D", border: "#FBCFE8" },
  "반려동물 캠핑":    { bg: "#D1FAE5", color: "#065F46", border: "#A7F3D0" },
  "글램핑·카라반":    { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
  "백패킹·트레킹":    { bg: "#E0F2FE", color: "#075985", border: "#BAE6FD" },
  "캠핑 장비":        { bg: "#F3F4F6", color: "#374151", border: "#D1D5DB" },
  "캠핑 준비·장비":   { bg: "#F3F4F6", color: "#374151", border: "#D1D5DB" },
  "캠핑 안전·의료":   { bg: "#FEF2F2", color: "#7F1D1D", border: "#FECACA" },
  "캠핑 문화·환경":   { bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0" },
};
const DEFAULT_CAT = CATEGORY_COLORS["차박 가이드"];

const THUMB_GRADIENT: Record<string, string> = {
  forest: "linear-gradient(135deg, var(--color-forest-600) 0%, var(--color-forest-800) 100%)",
  sunset: "linear-gradient(135deg, var(--color-sunset-500) 0%, var(--color-sunset-700) 100%)",
  sky:    "linear-gradient(135deg, var(--color-sky-500) 0%, var(--color-sky-700) 100%)",
  soil:   "linear-gradient(135deg, var(--color-soil-500) 0%, var(--color-soil-700) 100%)",
};
const CAT_THUMB: Record<string, string> = {
  "차박 가이드": "forest", "시즌 추천": "sunset",
  "데이터 · 정책": "sky", "데이터·정책": "sky", "공공 야영지": "soil",
};
const PERSONA_AVATAR: Record<string, string> = {
  saver: "🏕️", traveler: "🗺️", analyst: "📊",
};
const PERSONA_NAME: Record<string, string> = {
  saver: "박절약", traveler: "정여행", analyst: "김데이터",
};

const CATEGORIES = [
  "전체", "차박 가이드", "시즌 추천", "데이터·정책", "공공 야영지",
  "캠핑 요리·식단", "텐트·타프·침낭", "가족·어린이 캠핑",
  "반려동물 캠핑", "글램핑·카라반", "백패킹·트레킹", "캠핑 장비",
];

type Post = {
  href: string; title: string; excerpt?: string; category: string;
  date: string; readMin: number; persona?: string; thumb: string;
};

const SEED_POSTS: Post[] = [
  { href: "/blog/find-hidden-spots-with-public-data", title: "예약 앱에 안 나오는 차박 명소, 어떻게 찾을까", excerpt: "data.go.kr의 야영장 데이터셋과 지자체 공지를 교차 확인하면, 앱에는 없는 한적한 노지를 찾을 수 있습니다.", category: "차박 가이드", date: "2026.06.01", readMin: 9, persona: "analyst", thumb: "forest" },
  { href: "/blog/june-budget-spots-before-rain", title: "2026년 6월, 장마 전 마지막 주말 가성비 노지 12곳", excerpt: "장마가 오기 전 6월 주말, 예산 부담 없이 다녀올 수 있는 노지·공공 야영지 12곳.", category: "시즌 추천", date: "2026.05.30", readMin: 7, persona: "traveler", thumb: "sunset" },
  { href: "/blog/chabak-legality-2025-cases", title: "차박 단속, 어디서 왜 — 2025년 사례로 보는 합법성 판단법", excerpt: "2025년 전국 단속 사례를 분석해 합법·불법을 가르는 기준 3가지를 정리했습니다.", category: "데이터 · 정책", date: "2026.05.27", readMin: 11, persona: "analyst", thumb: "sky" },
  { href: "/blog/chabak-first-night-checklist", title: "초보 차박 첫날 밤, 반드시 챙겨야 할 7가지", excerpt: "화기 금지 구역 확인부터 일출 전 정리까지, 단속을 피하고 자연을 지키는 기본기.", category: "차박 가이드", date: "2026.05.24", readMin: 6, persona: "saver", thumb: "forest" },
  { href: "/blog/car-setup-by-type", title: "SUV·경차별 차박 셋업 — 내 차에 맞는 평탄화", excerpt: "차종별 적재 공간과 평탄화 매트 조합. 무리한 장비 없이 하룻밤 편하게.", category: "차박 가이드", date: "2026.05.20", readMin: 8, persona: "saver", thumb: "forest" },
  { href: "/blog/june-valley-free-sites", title: "6월 계곡 노지 베스트 — 물놀이 가능한 무료 사이트", excerpt: "초여름 수온과 그늘을 함께 고려한 지역별 추천.", category: "시즌 추천", date: "2026.05.29", readMin: 7, persona: "traveler", thumb: "sunset" },
];

const getBlogPageData = unstable_cache(
  async (offset: number) => {
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(blogPosts)
      .where(and(eq(blogPosts.status, "published"), lte(blogPosts.publishedAt, new Date())));

    const rows = await db.select({
      slug: blogPosts.slug, title: blogPosts.title,
      metaDescription: blogPosts.metaDescription, category: blogPosts.category,
      datePublished: blogPosts.datePublished, wordCount: blogPosts.wordCount,
      persona: blogPosts.persona,
    }).from(blogPosts)
      .where(and(eq(blogPosts.status, "published"), lte(blogPosts.publishedAt, new Date())))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    return { total, rows };
  },
  ["blog-page-data"],
  { revalidate: 300 }
);

function CategoryBadge({ category }: { category: string }) {
  const c = CATEGORY_COLORS[category] ?? DEFAULT_CAT;
  return (
    <span style={{
      fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: "999px",
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      whiteSpace: "nowrap",
    }}>{category}</span>
  );
}

function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const bg = THUMB_GRADIENT[post.thumb] ?? THUMB_GRADIENT.forest;
  const avatar = post.persona ? PERSONA_AVATAR[post.persona] : null;
  const authorName = post.persona ? PERSONA_NAME[post.persona] : "편집팀";

  if (featured) {
    return (
      <Link href={post.href} className="blog-card blog-card-featured">
        {/* Thumb */}
        <div style={{ height: "260px", background: bg, position: "relative", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.55) 0%, transparent 55%)" }} />
          <div style={{ position: "absolute", top: "16px", left: "16px" }}>
            <CategoryBadge category={post.category} />
          </div>
          <div style={{ position: "absolute", bottom: "20px", left: "20px", right: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "clamp(17px,3vw,22px)", fontWeight: 800, lineHeight: 1.35, color: "#fff", letterSpacing: "-0.02em" }}>
              {post.title}
            </h2>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding: "18px 20px 20px" }}>
          {post.excerpt && (
            <p style={{ margin: "0 0 14px", fontSize: "14px", lineHeight: 1.75, color: "var(--color-gray-600)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {post.excerpt}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--color-gray-500)" }}>
              {avatar && <span aria-hidden="true" style={{ fontSize: "13px" }}>{avatar}</span>}
              <span style={{ fontWeight: 600 }}>{authorName}</span>
            </span>
            <span style={{ fontSize: "12px", color: "var(--color-gray-400)" }}>{post.date} · {post.readMin}분</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={post.href} className="blog-card">
      {/* Thumb */}
      <div style={{ height: "148px", background: bg, position: "relative", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: "10px", left: "10px" }}>
          <CategoryBadge category={post.category} />
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3 style={{ margin: "0 0 7px", fontSize: "15px", fontWeight: 700, lineHeight: 1.45, letterSpacing: "-0.01em", color: "var(--color-gray-900)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p style={{ margin: "0 0 auto", fontSize: "13px", lineHeight: 1.65, color: "var(--color-gray-500)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {post.excerpt}
          </p>
        )}
        <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--color-gray-100)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", color: "var(--color-gray-500)" }}>
            {avatar && <span aria-hidden="true">{avatar}</span>}
            <span style={{ fontWeight: 600 }}>{authorName}</span>
          </span>
          <span style={{ fontSize: "11.5px", color: "var(--color-gray-400)" }}>{post.date}</span>
        </div>
      </div>
    </Link>
  );
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  let dbPosts: Post[] = [];
  let totalCount = 0;
  try {
    const { total, rows } = await getBlogPageData(offset);
    totalCount = total;

    dbPosts = rows.map((r) => ({
      href: `/blog/${r.slug}`,
      title: r.title,
      excerpt: r.metaDescription ?? undefined,
      category: r.category,
      date: r.datePublished?.replace(/-/g, ".") ?? "",
      readMin: r.wordCount ? Math.max(1, Math.ceil(r.wordCount / 200)) : 5,
      persona: r.persona ?? undefined,
      thumb: CAT_THUMB[r.category] ?? "forest",
    }));
  } catch { /* DB 없을 시 시드 사용 */ }

  const posts = dbPosts.length > 0 ? dbPosts : SEED_POSTS;
  const totalPages = Math.max(1, Math.ceil((totalCount || posts.length) / PAGE_SIZE));
  const [featured, ...rest] = posts;

  return (
    <>
      <SiteHeader activeNav="/blog" />
      <main className="flex-1">

        {/* ── Hero ── */}
        <div style={{ background: "var(--color-forest-800)", color: "#fff", padding: "44px 0 32px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-forest-300)", marginBottom: "10px" }}>
              캠핑고고 가이드 &amp; 블로그
            </p>
            <h1 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25, margin: "0 0 10px" }}>
              캠핑·차박·공공 야영지<br />사실 기반 가이드
            </h1>
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--color-forest-200)", maxWidth: "460px", margin: "0 0 20px" }}>
              공공데이터와 법령을 바탕으로, 후기보다 확인 가능한 정보에 집중합니다{totalCount > 0 ? ` · ${totalCount}편+` : ""}.
            </p>
            {/* Category tabs */}
            <div className="blog-cat-scroll">
              {CATEGORIES.map((c) => (
                <Link key={c}
                  href={c === "전체" ? "/blog" : `/blog/category/${encodeURIComponent(c)}`}
                  className="blog-cat-pill"
                >
                  {c}
                </Link>
              ))}
              <a href="/feed.xml" target="_blank" rel="noopener noreferrer" className="blog-cat-pill blog-cat-rss">
                RSS
              </a>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "36px 20px 72px" }}>

          {/* ── Featured ── */}
          {featured && (
            <section aria-label="주목 글" style={{ marginBottom: "40px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-forest-600)", marginBottom: "12px" }}>
                주목 글
              </p>
              <div className="blog-featured-grid">
                <PostCard post={featured} featured />
                {rest.slice(0, 2).map((p, i) => <PostCard key={i} post={p} />)}
              </div>
            </section>
          )}

          {/* ── All posts grid ── */}
          {rest.length > 2 && (
            <section aria-label="전체 글">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--color-gray-200)" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-gray-400)" }}>
                  전체 {totalCount > 0 ? `${totalCount}편` : ""}
                </span>
                <div style={{ flex: 1, height: "1px", background: "var(--color-gray-200)" }} />
              </div>
              <div className="blog-grid">
                {rest.slice(currentPage === 1 ? 2 : 0).map((p, i) => (
                  <PostCard key={i} post={p} />
                ))}
              </div>
            </section>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <nav aria-label="페이지 탐색" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginTop: "48px", flexWrap: "wrap" }}>
              {currentPage > 1 && (
                <Link href={currentPage === 2 ? "/blog" : `/blog?page=${currentPage - 1}`}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--color-gray-300)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-gray-700)", textDecoration: "none", background: "#fff" }}>
                  ← 이전
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <Link key={p} href={p === 1 ? "/blog" : `/blog?page=${p}`}
                    aria-current={p === currentPage ? "page" : undefined}
                    style={{ padding: "8px 13px", borderRadius: "8px", border: "1px solid", fontSize: "13.5px", fontWeight: 600, textDecoration: "none",
                      borderColor: p === currentPage ? "var(--color-forest-600)" : "var(--color-gray-300)",
                      background: p === currentPage ? "var(--color-forest-600)" : "#fff",
                      color: p === currentPage ? "#fff" : "var(--color-gray-700)" }}>
                    {p}
                  </Link>
                );
              })}
              {currentPage < totalPages && (
                <Link href={`/blog?page=${currentPage + 1}`}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--color-gray-300)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-gray-700)", textDecoration: "none", background: "#fff" }}>
                  다음 →
                </Link>
              )}
            </nav>
          )}

          {/* ── CTA ── */}
          <div style={{ marginTop: "56px", padding: "28px 24px", background: "var(--color-forest-800)", borderRadius: "var(--radius-xl)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "#fff" }}>내 조건에 맞는 야영지를 바로 찾고 싶다면?</p>
              <p style={{ margin: 0, fontSize: "13.5px", color: "var(--color-forest-200)" }}>테마·예산·출발지 설정으로 맞춤 추천</p>
            </div>
            <Link href="/match" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "11px 22px", borderRadius: "var(--radius-md)", background: "var(--color-sunset-500)", color: "#fff", fontWeight: 700, fontSize: "14px", textDecoration: "none", whiteSpace: "nowrap" }}>
              야영지 매칭 →
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
