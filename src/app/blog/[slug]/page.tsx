import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuthorLabel } from "@/components/legal/author-label";
import { AffiliateDisclosure } from "@/components/legal/affiliate-disclosure";
import { buildBlogMeta } from "@/lib/seo/meta";
import { buildArticleJsonLd, buildBreadcrumbJsonLd, safeJsonLd } from "@/lib/seo/json-ld";

export const revalidate = 604800;

export async function generateStaticParams() {
  try {
    const rows = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .limit(200);
    return rows.map((r) => ({ slug: r.slug }));
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).get();
  if (!post) return { title: "블로그 | 캠핑고고" };
  return buildBlogMeta({ title: post.title, metaDescription: post.metaDescription, datePublished: post.datePublished });
}

const PERSONA_NAME: Record<string, string> = {
  saver: "박절약 (페르소나)",
  traveler: "정여행 (페르소나)",
  analyst: "김데이터 (페르소나)",
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).get();
  if (!post || post.status !== "published") notFound();

  const faqs = (post.faqs as { q: string; a: string }[] | null) ?? [];
  const sources = (post.externalSources as { name: string; url: string }[] | null) ?? [];
  const authorName = post.persona ? (PERSONA_NAME[post.persona] ?? "캠핑고고 편집팀") : "캠핑고고 편집팀";
  const url = `https://campgogo.kr/blog/${post.slug}`;

  const articleJsonLd = buildArticleJsonLd({
    title: post.title,
    description: post.metaDescription ?? post.title,
    datePublished: post.datePublished ?? "",
    dateModified: post.dateModified ?? post.datePublished ?? "",
    url,
    authorName,
  });

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "캠핑고고", url: "https://campgogo.kr" },
    { name: "블로그", url: "https://campgogo.kr/blog" },
    { name: post.title, url },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }} />
      <SiteHeader activeNav="/blog" />

      <main className="flex-1">
        {/* Hero */}
        <div style={{ background: "var(--color-forest-50)", borderBottom: "1px solid var(--color-gray-200)", padding: "48px 0 36px" }}>
          <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 24px" }}>
            <nav style={{ fontSize: "13px", color: "var(--color-gray-400)", marginBottom: "16px" }}>
              <a href="/blog" style={{ color: "var(--color-forest-600)", textDecoration: "none" }}>블로그</a>
              {" / "}
              <span style={{ color: "var(--color-gray-600)" }}>{post.category}</span>
            </nav>
            {post.hasAffiliateLinks && <AffiliateDisclosure />}
            <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25, color: "var(--color-forest-800)", margin: "0 0 20px" }}>
              {post.title}
            </h1>
            <AuthorLabel
              persona={post.persona}
              datePublished={post.datePublished}
              dateModified={post.dateModified}
            />
          </div>
        </div>

        {/* Body */}
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "40px 24px 64px" }}>
          {post.metaDescription && (
            <p style={{ fontSize: "17px", lineHeight: 1.8, color: "var(--color-gray-600)", marginBottom: "32px", padding: "20px 24px", background: "var(--color-forest-50)", borderRadius: "var(--radius-lg)", borderLeft: "4px solid var(--color-forest-300)" }}>
              {post.metaDescription}
            </p>
          )}

          {post.bodyMarkdown ? (
            <div className="prose-campgogo" dangerouslySetInnerHTML={{ __html: markdownToHtml(post.bodyMarkdown) }} />
          ) : (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-gray-400)" }}>
              <p style={{ fontSize: "2rem", marginBottom: "12px" }}>✍️</p>
              <p>글 내용을 준비 중입니다.</p>
            </div>
          )}

          {/* FAQ */}
          {faqs.length > 0 && (
            <section style={{ marginTop: "48px" }}>
              <h2 className="prose-campgogo" style={{ fontSize: "20px", marginBottom: "16px" }}>자주 묻는 질문</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {faqs.map((faq, i) => (
                  <details key={i} style={{ border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                    <summary style={{ padding: "14px 18px", fontSize: "15px", fontWeight: 600, color: "var(--color-gray-800)", cursor: "pointer", background: "var(--color-gray-50)", listStyle: "none", display: "flex", justifyContent: "space-between" }}>
                      Q. {faq.q} <span aria-hidden="true" style={{ color: "var(--color-gray-400)" }}>▼</span>
                    </summary>
                    <div style={{ padding: "14px 18px", fontSize: "14.5px", lineHeight: 1.75, color: "var(--color-gray-600)", background: "#fff" }}>{faq.a}</div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* 출처 */}
          {sources.length > 0 && (
            <section style={{ marginTop: "40px", padding: "16px 18px", background: "var(--color-gray-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-gray-200)" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-gray-600)", marginBottom: "10px", letterSpacing: "0.04em", textTransform: "uppercase" }}>참고 출처</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                {sources.map((s, i) => (
                  <li key={i} style={{ fontSize: "13.5px" }}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-forest-600)", textDecoration: "underline" }}>{s.name}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="disclaimer" style={{ marginTop: "40px" }}>
            본 블로그의 정보는 작성 시점의 공공데이터·공지·법령을 기준으로 합니다.
            방문·차박 전 반드시 관할 지자체 또는 관리 기관에 최종 확인 바랍니다.
          </div>

          <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--color-gray-200)", display: "flex", justifyContent: "center" }}>
            <a href="/blog" style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-forest-600)", textDecoration: "underline" }}>
              ← 블로그 목록으로
            </a>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

// 최소 마크다운 → HTML 변환 (의존성 없이)
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[h|u|p])(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "");
}
