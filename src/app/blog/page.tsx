import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const revalidate = 3600; // 1시간 ISR

export const metadata: Metadata = {
  title: "가이드 & 블로그",
  description: "공공·저렴·차박 야영지를 찾는 데 필요한 실전 가이드, 시즌별 추천, 차박 합법성 정보를 출처와 함께. 과장 없이, 결정에 필요한 것만.",
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
};

const CATEGORY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  "차박 가이드": { bg: "var(--color-forest-100)", color: "var(--color-forest-700)", border: "var(--color-forest-200)" },
  "시즌 추천":   { bg: "var(--color-sunset-100)", color: "var(--color-sunset-700)", border: "var(--color-sunset-200)" },
  "데이터 · 정책": { bg: "var(--color-sky-100)",  color: "var(--color-sky-700)",    border: "var(--color-sky-200)"    },
  "공공 야영지":  { bg: "var(--color-soil-100)",  color: "var(--color-soil-700)",   border: "var(--color-soil-200)"  },
};

const THUMB_GRADIENT: Record<string, string> = {
  forest: "linear-gradient(135deg, var(--color-forest-600), var(--color-forest-800))",
  sunset: "linear-gradient(135deg, var(--color-sunset-500), var(--color-sunset-700))",
  sky:    "linear-gradient(135deg, var(--color-sky-500), var(--color-sky-700))",
  soil:   "linear-gradient(135deg, var(--color-soil-500), var(--color-soil-700))",
};

type Post = {
  href: string; title: string; excerpt?: string; category: string;
  date: string; readTime: string; author?: string; thumb: string; image?: string;
};

const SEED_POSTS: Post[] = [
  { href: "/blog/find-hidden-spots-with-public-data", title: "예약 앱에 안 나오는 차박 명소, 어떻게 찾을까 — 공공데이터 200% 활용법", excerpt: "data.go.kr의 야영장 데이터셋과 지자체 공지를 교차 확인하면, 앱에는 없는 한적한 노지를 찾을 수 있습니다. 실제로 따라 할 수 있는 5단계 체크리스트로 정리했습니다.", category: "차박 가이드", date: "2026.06.01", readTime: "9분", author: "김데이터", thumb: "forest" },
  { href: "/blog/june-budget-spots-before-rain", title: "2026년 6월, 장마 전 마지막 주말 가성비 노지 12곳", excerpt: "장마가 오기 전 6월 주말, 예산 부담 없이 다녀올 수 있는 노지·공공 야영지 12곳을 골랐습니다.", category: "시즌 추천", date: "2026.05.30", readTime: "7분", thumb: "sunset" },
  { href: "/blog/chabak-legality-2025-cases", title: "차박 단속, 어디서 왜 — 2025년 사례로 보는 합법성 판단법", excerpt: "2025년 전국 단속 사례를 분석해 합법·불법을 가르는 기준 3가지를 정리했습니다.", category: "데이터 · 정책", date: "2026.05.27", readTime: "11분", thumb: "sky" },
  { href: "/blog/chabak-first-night-checklist", title: "초보 차박 첫날 밤, 반드시 챙겨야 할 7가지", excerpt: "화기 금지 구역 확인부터 일출 전 정리까지, 단속을 피하고 자연을 지키는 기본기.", category: "차박 가이드", date: "2026.05.24", readTime: "6분", thumb: "forest" },
  { href: "/blog/car-setup-by-type", title: "SUV·경차별 차박 셋업 — 내 차에 맞는 평탄화", excerpt: "차종별 적재 공간과 평탄화 매트 조합. 무리한 장비 없이 하룻밤 편하게.", category: "차박 가이드", date: "2026.05.20", readTime: "8분", thumb: "forest" },
  { href: "/blog/june-valley-free-sites", title: "6월 계곡 노지 베스트 — 물놀이 가능한 무료 사이트", excerpt: "초여름 수온과 그늘을 함께 고려한 지역별 추천.", category: "시즌 추천", date: "2026.05.29", readTime: "7분", thumb: "sunset" },
  { href: "/blog/public-campsite-distribution-data", title: "전국 공공 야영장은 몇 곳? — 데이터로 본 분포", excerpt: "시도별 야영장 수와 평균 이용료를 공공데이터로 집계.", category: "데이터 · 정책", date: "2026.05.22", readTime: "10분", thumb: "sky" },
  { href: "/blog/how-to-verify-legal-chabak", title: "합법 차박지 구별법 — 공지·간판·관리소 3단 확인", excerpt: '"여기 차박 돼요?"를 현장에서 확인하는 가장 빠른 방법.', category: "차박 가이드", date: "2026.05.16", readTime: "5분", thumb: "forest" },
  { href: "/blog/rainy-season-safe-chabak", title: "장마철 차박, 피해야 할 곳과 괜찮은 곳", excerpt: "배수·지반·계곡 범람 위험을 기준으로 한 안전 판단.", category: "시즌 추천", date: "2026.05.25", readTime: "6분", thumb: "sunset" },
  { href: "/blog/winter-chabak-condensation-heating", title: "겨울 차박 결로·난방 — 안전하게 따뜻하게", excerpt: "일산화탄소 경보기는 선택이 아닌 필수. 동계 차박 생존 가이드.", category: "차박 가이드", date: "2026.05.12", readTime: "9분", thumb: "forest" },
  { href: "/blog/local-ordinance-changes-chabak", title: "차박 관련 지자체 조례, 어떻게 바뀌고 있나", excerpt: "최근 2년 조례·고시 변화를 출처와 함께 정리.", category: "데이터 · 정책", date: "2026.05.15", readTime: "12분", thumb: "sky" },
  { href: "/blog/highland-cool-spots-summer", title: "해발 높은 곳으로 — 열대야 피하는 고지대 야영지", excerpt: "밤 기온 데이터로 고른 시원한 여름 사이트.", category: "시즌 추천", date: "2026.05.14", readTime: "7분", thumb: "sunset" },
];

function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const cat = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS["차박 가이드"];
  const bg = THUMB_GRADIENT[post.thumb] ?? THUMB_GRADIENT.forest;
  const thumbH = featured ? "220px" : "168px";

  return (
    <Link href={post.href} style={{ display: "flex", flexDirection: "column", background: "#fff", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-lg)", overflow: "hidden", textDecoration: "none", color: "inherit", transition: "transform 120ms ease, box-shadow 120ms ease" }}
      className="blog-card">
      {/* Thumbnail */}
      <div style={{ height: thumbH, background: post.image ? undefined : bg, backgroundImage: post.image ? `url(${post.image})` : undefined, backgroundSize: "cover", backgroundPosition: "center", position: "relative", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: "12px", left: "12px", fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>{post.category}</span>
      </div>
      {/* Body */}
      <div style={{ padding: featured ? "20px 22px 22px" : "16px 18px 18px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        <h2 style={{ margin: 0, fontSize: featured ? "19px" : "15.5px", fontWeight: 700, lineHeight: 1.45, letterSpacing: "-0.01em", color: "var(--color-gray-900)", display: "-webkit-box", WebkitLineClamp: featured ? 2 : 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.title}</h2>
        {post.excerpt && (
          <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.7, color: "var(--color-gray-500)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.excerpt}</p>
        )}
        <div style={{ marginTop: "auto", paddingTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
          <span style={{ fontSize: "12px", color: "var(--color-gray-400)" }}>{post.date}</span>
          <span style={{ fontSize: "12px", color: "var(--color-gray-400)" }}>{post.readTime} 읽기</span>
        </div>
      </div>
    </Link>
  );
}

const CATEGORIES = ["전체", "차박 가이드", "시즌 추천", "데이터 · 정책"];

export default async function BlogPage() {
  let dbPosts: Post[] = [];
  try {
    const rows = await db.select({
      slug: blogPosts.slug, title: blogPosts.title, metaDescription: blogPosts.metaDescription,
      category: blogPosts.category, datePublished: blogPosts.datePublished,
      wordCount: blogPosts.wordCount,
    }).from(blogPosts).where(eq(blogPosts.status, "published")).orderBy(desc(blogPosts.publishedAt)).limit(60);

    const CAT_THUMB: Record<string, string> = {
      "차박 가이드": "forest", "시즌 추천": "sunset",
      "데이터 · 정책": "sky", "공공 야영지": "soil",
    };

    dbPosts = rows.map((r) => ({
      href: `/blog/${r.slug}`,
      title: r.title,
      excerpt: r.metaDescription ?? undefined,
      category: r.category,
      date: r.datePublished?.replace(/-/g, ".") ?? "",
      readTime: r.wordCount ? `${Math.ceil(r.wordCount / 200)}분` : "읽기",
      thumb: CAT_THUMB[r.category] ?? "forest",
    }));
  } catch { /* DB 없을 시 시드 사용 */ }

  const posts = dbPosts.length > 0 ? dbPosts : SEED_POSTS;
  const [featured, ...rest] = posts;

  return (
    <>
      <SiteHeader activeNav="/blog" />
      <main className="flex-1">

        {/* Page Header */}
        <div style={{ background: "var(--color-forest-800)", color: "#fff", padding: "52px 0 44px" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-forest-300)", marginBottom: "14px" }}>
              <span style={{ width: "20px", height: "1.5px", background: "var(--color-sunset-400)", display: "inline-block" }} />가이드 &amp; 블로그
            </div>
            <h1 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25, margin: "0 0 12px" }}>
              캠핑, 차박, 공공 야영지<br />결정에 필요한 것만
            </h1>
            <p style={{ fontSize: "15px", lineHeight: 1.75, color: "var(--color-forest-200)", maxWidth: "480px", margin: "0 0 24px" }}>
              공공데이터·법령·출처를 기반으로 씁니다. 후기 커뮤니티가 아닌, 사실 확인 중심 가이드.
            </p>
            {/* Category pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {CATEGORIES.map((c) => (
                <span key={c} style={{ fontSize: "13px", fontWeight: 600, padding: "5px 14px", borderRadius: "999px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "default" }}>{c}</span>
              ))}
              <a href="/feed.xml" target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", fontWeight: 600, padding: "5px 14px", borderRadius: "999px", background: "rgba(255,165,0,0.15)", border: "1px solid rgba(255,165,0,0.35)", color: "#FFB347", textDecoration: "none", marginLeft: "auto" }}>RSS</a>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px 64px" }}>

          {/* Featured post */}
          {featured && (
            <div style={{ marginBottom: "40px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-forest-600)", textTransform: "uppercase", marginBottom: "14px" }}>주목 글</div>
              <div className="blog-featured-grid">
                <PostCard post={featured} featured />
                {rest.slice(0, 2).map((p, i) => <PostCard key={i} post={p} />)}
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--color-gray-200)" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-gray-400)", letterSpacing: "0.06em", textTransform: "uppercase" }}>전체 글</span>
            <div style={{ flex: 1, height: "1px", background: "var(--color-gray-200)" }} />
          </div>

          {/* Card grid */}
          <div className="blog-grid">
            {rest.slice(2).map((p, i) => <PostCard key={i} post={p} />)}
          </div>

        </div>



      </main>
      <SiteFooter />
    </>
  );
}
