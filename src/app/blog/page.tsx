import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PostCard, type PostCardProps } from "@/components/blog/post-card";
import { FilterChips } from "@/components/blog/filter-chips";
import { NewsletterForm } from "@/components/blog/newsletter-form";

export const metadata: Metadata = {
  title: "가이드 & 블로그",
  description:
    "공공·저렴·차박 야영지를 찾는 데 필요한 실전 가이드, 시즌별 추천, 차박 합법성 정보를 출처와 함께. 과장 없이, 결정에 필요한 것만.",
};

/* ─── 시드 데이터 (DB 연동 전 정적) ─── */

const FEATURED_HERO: PostCardProps = {
  href: "/blog/find-hidden-spots-with-public-data",
  title: "예약 앱에 안 나오는 차박 명소, 어떻게 찾을까 — 공공데이터 200% 활용법",
  excerpt:
    "data.go.kr의 야영장 데이터셋과 지자체 공지를 교차 확인하면, 앱에는 없는 한적한 노지를 찾을 수 있습니다. 실제로 따라 할 수 있는 5단계 체크리스트로 정리했습니다.",
  category: "차박 가이드",
  date: "2026.06.01",
  readTime: "9분 읽기",
  author: "편집팀 · 페르소나 김데이터",
  thumb: "forest",
  variant: "hero",
};

const FEATURED_SIDES: PostCardProps[] = [
  {
    href: "/blog/june-budget-spots-before-rain",
    title: "2026년 6월, 장마 전 마지막 주말 가성비 노지 12곳",
    category: "시즌 추천",
    date: "2026.05.30",
    readTime: "7분",
    thumb: "sunset",
    variant: "side",
  },
  {
    href: "/blog/chabak-legality-2025-cases",
    title: "차박 단속, 어디서 왜 — 2025년 사례로 보는 합법성 판단법",
    category: "데이터 · 정책",
    date: "2026.05.27",
    readTime: "11분",
    thumb: "sky",
    variant: "side",
  },
];

const CHABAK_POSTS: PostCardProps[] = [
  {
    href: "/blog/chabak-first-night-checklist",
    title: "초보 차박 첫날 밤, 반드시 챙겨야 할 7가지",
    excerpt: "화기 금지 구역 확인부터 일출 전 정리까지, 단속을 피하고 자연을 지키는 기본기.",
    category: "차박 가이드",
    date: "2026.05.24",
    readTime: "6분",
    thumb: "forest",
  },
  {
    href: "/blog/car-setup-by-type",
    title: "SUV·경차별 차박 셋업 — 내 차에 맞는 평탄화",
    excerpt: "차종별 적재 공간과 평탄화 매트 조합. 무리한 장비 없이 하룻밤 편하게.",
    category: "차박 가이드",
    date: "2026.05.20",
    readTime: "8분",
    thumb: "forest",
  },
  {
    href: "/blog/how-to-verify-legal-chabak",
    title: "합법 차박지 구별법 — 공지·간판·관리소 3단 확인",
    excerpt: '"여기 차박 돼요?"를 현장에서 확인하는 가장 빠른 방법.',
    category: "차박 가이드",
    date: "2026.05.16",
    readTime: "5분",
    thumb: "forest",
  },
  {
    href: "/blog/winter-chabak-condensation-heating",
    title: "겨울 차박 결로·난방 — 안전하게 따뜻하게",
    excerpt: "일산화탄소 경보기는 선택이 아닌 필수. 동계 차박 생존 가이드.",
    category: "차박 가이드",
    date: "2026.05.12",
    readTime: "9분",
    thumb: "forest",
  },
];

const SEASON_POSTS: PostCardProps[] = [
  {
    href: "/blog/june-valley-free-sites",
    title: "6월 계곡 노지 베스트 — 물놀이 가능한 무료 사이트",
    excerpt: "초여름 수온과 그늘을 함께 고려한 지역별 추천.",
    category: "시즌 추천",
    date: "2026.05.29",
    readTime: "7분",
    thumb: "sunset",
  },
  {
    href: "/blog/rainy-season-safe-chabak",
    title: "장마철 차박, 피해야 할 곳과 괜찮은 곳",
    excerpt: "배수·지반·계곡 범람 위험을 기준으로 한 안전 판단.",
    category: "시즌 추천",
    date: "2026.05.25",
    readTime: "6분",
    thumb: "sunset",
  },
  {
    href: "/blog/summer-holiday-hidden-gems",
    title: "여름 황금연휴, 한적함을 지키는 비인기 명소",
    excerpt: "붐비는 캠핑장 대신 덜 알려진 공공 야영지로.",
    category: "시즌 추천",
    date: "2026.05.18",
    readTime: "8분",
    thumb: "sunset",
  },
  {
    href: "/blog/highland-cool-spots-summer",
    title: "해발 높은 곳으로 — 열대야 피하는 고지대 야영지",
    excerpt: "밤 기온 데이터로 고른 시원한 여름 사이트.",
    category: "시즌 추천",
    date: "2026.05.14",
    readTime: "7분",
    thumb: "sunset",
  },
];

const DATA_POSTS: PostCardProps[] = [
  {
    href: "/blog/public-campsite-distribution-data",
    title: "전국 공공 야영장은 몇 곳? — 데이터로 본 분포",
    excerpt: "시도별 야영장 수와 평균 이용료를 공공데이터로 집계.",
    category: "데이터 · 정책",
    date: "2026.05.22",
    readTime: "10분",
    thumb: "sky",
  },
  {
    href: "/blog/local-ordinance-changes-chabak",
    title: "차박 관련 지자체 조례, 어떻게 바뀌고 있나",
    excerpt: "최근 2년 조례·고시 변화를 출처와 함께 정리.",
    category: "데이터 · 정책",
    date: "2026.05.15",
    readTime: "12분",
    thumb: "sky",
  },
  {
    href: "/blog/national-park-vs-forest-recreation",
    title: "국립공원 vs 자연휴양림, 야영 규정 비교",
    excerpt: "두 제도의 허용 범위와 예약 방식 차이를 한 표로.",
    category: "데이터 · 정책",
    date: "2026.05.10",
    readTime: "9분",
    thumb: "sky",
  },
  {
    href: "/blog/open-data-sources-guide",
    title: "야영 데이터 출처 가이드 — 어디서 확인하나",
    excerpt: "공공누리 라이선스와 신뢰할 수 있는 1차 출처 목록.",
    category: "데이터 · 정책",
    date: "2026.05.05",
    readTime: "8분",
    thumb: "sky",
  },
];

/* ─── Page component ─── */

export default function BlogIndexPage() {
  return (
    <>
      <SiteHeader activeNav="/blog" />

      <main>
        {/* Hero */}
        <div className="max-w-[1200px] mx-auto px-6" style={{ padding: "48px 24px 36px" }}>
          <div
            className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.04em] uppercase mb-3.5"
            style={{ color: "var(--color-forest-600)" }}
          >
            <span
              className="inline-block w-[22px]"
              style={{ height: "1.5px", background: "var(--color-sunset-500)" }}
            />
            가이드 &amp; 블로그
          </div>
          <h1
            className="font-extrabold leading-[1.25] tracking-[-0.02em] mb-3.5"
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              color: "var(--color-forest-800)",
              textWrap: "balance",
            } as React.CSSProperties}
          >
            예약 앱이 인기 캠핑장으로 가득 찰 때,
            <br />
            우리는 덜 알려진 곳을 정리합니다
          </h1>
          <p
            className="text-[17px] leading-[1.75] max-w-[620px]"
            style={{ color: "var(--color-gray-600)" }}
          >
            공공·저렴·차박 야영지를 찾는 데 필요한 실전 가이드, 시즌별 추천,
            그리고 차박 합법성 같은 민감한 주제는 출처와 함께. 과장 없이, 결정에
            필요한 것만.
          </p>
        </div>

        <div className="max-w-[1200px] mx-auto px-6">
          {/* Filter chips */}
          <FilterChips />

          {/* Featured */}
          <div
            className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-[0.03em] mb-5"
            style={{ color: "var(--color-sunset-700)" }}
          >
            📌 이번 주 핀 고정 · 최신 3편
          </div>
          <div className="featured-grid">
            <div className="featured-hero">
              <PostCard {...FEATURED_HERO} />
            </div>
            {FEATURED_SIDES.map((post) => (
              <PostCard key={post.href} {...post} />
            ))}
          </div>

          {/* 차박 가이드 */}
          <PostSection title="차박 가이드" href="/blog/category/chabak" posts={CHABAK_POSTS} />

          {/* 시즌 추천 */}
          <PostSection title="시즌 추천" href="/blog/category/season" posts={SEASON_POSTS} />

          {/* Newsletter */}
          <div
            className="news-grid rounded-2xl my-2 mb-14"
            style={{
              background: "var(--color-forest-700)",
              padding: "40px 44px",
            }}
          >
            <div>
              <div
                className="text-[12px] font-bold tracking-[0.04em] uppercase mb-2.5"
                style={{ color: "var(--color-sunset-200)" }}
              >
                매주 목요일 · 무료
              </div>
              <h2
                className="text-[24px] font-bold leading-[1.4] tracking-[-0.01em] mb-2.5 text-white"
              >
                덜 알려진 가성비·차박 명소를 매주 큐레이션
              </h2>
              <p
                className="text-[14.5px] leading-[1.7]"
                style={{ color: "var(--color-forest-100)" }}
              >
                예약 앱이 인기 캠핑장으로 가득 찰 때, 우리는 공공·저렴·노지를 골라
                보냅니다. 광고가 아니라 큐레이션입니다.
              </p>
            </div>
            <NewsletterForm />
          </div>

          {/* 데이터 · 정책 */}
          <PostSection title="데이터 · 정책" href="/blog/category/data" posts={DATA_POSTS} />

          {/* Pagination */}
          <nav className="flex justify-center items-center gap-1.5 mt-2 mb-4" aria-label="페이지">
            <PagerItem disabled>← 이전</PagerItem>
            <PagerItem active>1</PagerItem>
            <PagerItem href="/blog?page=2">2</PagerItem>
            <PagerItem href="/blog?page=3">3</PagerItem>
            <PagerItem href="/blog?page=4">4</PagerItem>
            <span
              className="min-w-[40px] h-10 inline-flex items-center justify-center text-[14px]"
              style={{ color: "var(--color-gray-500)" }}
            >
              …
            </span>
            <PagerItem href="/blog?page=9">9</PagerItem>
            <PagerItem href="/blog?page=2">다음 →</PagerItem>
          </nav>

          {/* Disclaimer */}
          <div
            className="rounded-lg text-[13px] leading-[1.65] mb-2"
            style={{
              background: "var(--color-gray-50)",
              border: "1px solid var(--color-gray-200)",
              padding: "16px 18px",
              color: "var(--color-gray-600)",
            }}
          >
            본 블로그의 정보는 작성 시점의{" "}
            <strong style={{ color: "var(--color-gray-700)" }}>
              공공데이터·공지·법령
            </strong>
            을 기준으로 합니다. 정보는 변경될 수 있으며, 방문·차박 전 반드시 관할
            지자체 또는 관리 기관에 최종 확인 바랍니다. 일부 글에는 제휴 링크가
            포함될 수 있으며, 해당 글 상단에 별도 표기됩니다.
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

/* ─── Sub-components ─── */

function PostSection({
  title,
  href,
  posts,
}: {
  title: string;
  href: string;
  posts: PostCardProps[];
}) {
  return (
    <section className="mb-[52px]">
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <h2
          className="text-[23px] font-bold tracking-[-0.01em]"
          style={{ color: "var(--color-gray-900)" }}
        >
          {title}
        </h2>
        <Link
          href={href}
          className="text-[14px] font-semibold whitespace-nowrap no-underline hover:underline"
          style={{ color: "var(--color-forest-600)" }}
        >
          전체 보기 →
        </Link>
      </div>
      <div className="grid4">
        {posts.map((post) => (
          <PostCard key={post.href} {...post} />
        ))}
      </div>
    </section>
  );
}

function PagerItem({
  href,
  children,
  active,
  disabled,
}: {
  href?: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  const base =
    "min-w-[40px] h-10 inline-flex items-center justify-center font-semibold rounded-lg text-[14px] no-underline border border-transparent transition-colors";

  if (disabled) {
    return (
      <span
        className={base}
        style={{ color: "var(--color-gray-500)", cursor: "default" }}
      >
        {children}
      </span>
    );
  }

  if (active) {
    return (
      <span
        className={base}
        aria-current="page"
        style={{ background: "var(--color-forest-700)", color: "#fff" }}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href ?? "#"}
      className={base}
      style={{ color: "var(--color-gray-600)" }}
    >
      {children}
    </Link>
  );
}
