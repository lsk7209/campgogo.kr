import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, and, lte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const rows = await db
      .selectDistinct({ category: blogPosts.category })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"));
    return rows.map((r) => ({ category: encodeURIComponent(r.category) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const decoded = decodeURIComponent(category);
  return {
    title: `${decoded} 블로그 | 캠핑고고`,
    description: `캠핑고고 블로그 ${decoded} 카테고리 — 공공·차박·가성비 야영지 관련 글 모음.`,
  };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return dateStr.replace(/-/g, ".");
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const decoded = decodeURIComponent(category);

  let posts: {
    id: string;
    slug: string;
    title: string;
    category: string;
    metaDescription: string | null;
    datePublished: string | null;
    persona: string | null;
  }[] = [];

  try {
    posts = await db
      .select({
        id: blogPosts.id,
        slug: blogPosts.slug,
        title: blogPosts.title,
        category: blogPosts.category,
        metaDescription: blogPosts.metaDescription,
        datePublished: blogPosts.datePublished,
        persona: blogPosts.persona,
      })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.category, decoded),
          eq(blogPosts.status, "published"),
          lte(blogPosts.publishedAt, new Date())
        )
      )
      .orderBy(desc(blogPosts.publishedAt))
      .limit(30);
  } catch {
    posts = [];
  }

  const CATEGORY_COLOR: Record<string, { bg: string; color: string; border: string }> = {
    "차박 가이드": {
      bg: "var(--color-forest-100)",
      color: "var(--color-forest-700)",
      border: "var(--color-forest-200)",
    },
    "시즌 추천": {
      bg: "var(--color-sunset-100)",
      color: "var(--color-sunset-700)",
      border: "var(--color-sunset-200)",
    },
    "데이터 · 정책": {
      bg: "#EFF6FF",
      color: "#1D4ED8",
      border: "#BFDBFE",
    },
  };
  const badge = CATEGORY_COLOR[decoded] ?? {
    bg: "var(--color-gray-100)",
    color: "var(--color-gray-600)",
    border: "var(--color-gray-200)",
  };

  return (
    <>
      <SiteHeader activeNav="/blog" />

      <main className="flex-1">
        {/* Hero */}
        <div
          style={{
            background: "var(--color-forest-50)",
            borderBottom: "1px solid var(--color-gray-200)",
            padding: "48px 0 36px",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
            <nav
              style={{
                fontSize: "13px",
                color: "var(--color-gray-400)",
                marginBottom: "16px",
              }}
            >
              <Link
                href="/blog"
                style={{ color: "var(--color-forest-600)", textDecoration: "none" }}
              >
                블로그
              </Link>
              {" / "}
              <span style={{ color: "var(--color-gray-600)" }}>{decoded}</span>
            </nav>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase" as const,
                color: "var(--color-forest-600)",
                marginBottom: "14px",
              }}
            >
              <span
                style={{
                  width: "22px",
                  height: "1.5px",
                  background: "var(--color-sunset-500)",
                  display: "inline-block",
                }}
              />
              카테고리
            </div>

            <h1
              style={{
                fontSize: "clamp(26px, 4vw, 38px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
                color: "var(--color-forest-800)",
                marginBottom: "12px",
              }}
            >
              {decoded}
            </h1>
            <p
              style={{
                fontSize: "15.5px",
                lineHeight: 1.7,
                color: "var(--color-gray-600)",
                maxWidth: "500px",
              }}
            >
              캠핑고고 블로그 중 <strong>{decoded}</strong> 카테고리 글 모음입니다.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 80px" }}>
          {posts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 24px",
                borderRadius: "var(--radius-xl)",
                background: "var(--color-gray-50)",
                border: "1px solid var(--color-gray-200)",
              }}
            >
              <p style={{ fontSize: "2.5rem", marginBottom: "14px" }}>✍️</p>
              <p
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "var(--color-gray-700)",
                  marginBottom: "8px",
                }}
              >
                이 카테고리의 글을 준비 중입니다
              </p>
              <p
                style={{ fontSize: "14px", color: "var(--color-gray-400)", marginBottom: "28px" }}
              >
                곧 양질의 콘텐츠로 찾아뵙겠습니다.
              </p>
              <Link
                href="/blog"
                style={{
                  display: "inline-block",
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "10px 22px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-forest-700)",
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                전체 블로그 보기
              </Link>
            </div>
          ) : (
            <>
              <p
                style={{
                  fontSize: "13.5px",
                  color: "var(--color-gray-400)",
                  marginBottom: "28px",
                }}
              >
                총 {posts.length}편
              </p>

              <div
                style={{
                  display: "grid",
                  gap: "20px",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                }}
              >
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      border: "1px solid var(--color-gray-200)",
                      borderRadius: "var(--radius-lg)",
                      padding: "20px 22px",
                      background: "#fff",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "box-shadow 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "var(--color-forest-300)";
                      (e.currentTarget as HTMLElement).style.boxShadow =
                        "0 2px 14px rgba(0,0,0,0.07)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "var(--color-gray-200)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    {/* Category badge */}
                    <div style={{ marginBottom: "12px" }}>
                      <span
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 600,
                          padding: "3px 9px",
                          borderRadius: "999px",
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {post.category}
                      </span>
                    </div>

                    <h2
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        lineHeight: 1.45,
                        color: "var(--color-forest-800)",
                        marginBottom: "10px",
                        flex: 1,
                        display: "-webkit-box",
                        overflow: "hidden",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      } as React.CSSProperties}
                    >
                      {post.title}
                    </h2>

                    {post.metaDescription && (
                      <p
                        style={{
                          fontSize: "13.5px",
                          lineHeight: 1.65,
                          color: "var(--color-gray-500)",
                          marginBottom: "14px",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        } as React.CSSProperties}
                      >
                        {post.metaDescription}
                      </p>
                    )}

                    {/* Footer row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "auto",
                        paddingTop: "12px",
                        borderTop: "1px solid var(--color-gray-100)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--color-gray-400)",
                        }}
                      >
                        {formatDate(post.datePublished)}
                      </span>
                      <span
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "var(--color-forest-600)",
                        }}
                      >
                        읽기 →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
