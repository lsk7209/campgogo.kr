import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq, and, ne, desc, lte } from "drizzle-orm";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuthorLabel } from "@/components/legal/author-label";
import { AffiliateDisclosure } from "@/components/legal/affiliate-disclosure";
import { BlogAd } from "@/components/blog/blog-ad";
import { buildBlogMeta } from "@/lib/seo/meta";
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildFAQJsonLd, safeJsonLd } from "@/lib/seo/json-ld";
import { TocSidebar } from "@/components/blog/toc-sidebar";
import type { TocItem } from "@/components/blog/toc-sidebar";

export const revalidate = 604800;
export const dynamicParams = true; // DB에 추가된 새 글 바로 접근 가능

const getPublishedBlogSlugs = unstable_cache(
  async () => db.select({ slug: blogPosts.slug })
    .from(blogPosts)
    .where(and(eq(blogPosts.status, "published"), lte(blogPosts.publishedAt, new Date())))
    .limit(200),
  ["published-blog-slugs"],
  { revalidate: 300 }
);

const getBlogPostBySlug = unstable_cache(
  async (slug: string) => db.select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published"), lte(blogPosts.publishedAt, new Date())))
    .get(),
  ["blog-post-by-slug"],
  { revalidate: 300 }
);

const getRelatedBlogPosts = unstable_cache(
  async (category: string, slug: string) => db.select({
    slug: blogPosts.slug, title: blogPosts.title,
    category: blogPosts.category, datePublished: blogPosts.datePublished,
    wordCount: blogPosts.wordCount,
  }).from(blogPosts)
    .where(and(eq(blogPosts.status, "published"), lte(blogPosts.publishedAt, new Date()), eq(blogPosts.category, category), ne(blogPosts.slug, slug)))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(3),
  ["related-blog-posts"],
  { revalidate: 300 }
);

export async function generateStaticParams() {
  try {
    const rows = await getPublishedBlogSlugs();
    return rows.map((r) => ({ slug: r.slug }));
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getBlogPostBySlug(slug);
    if (!post) return { title: "블로그 | 캠핑고고" };
    return buildBlogMeta({ title: post.title, slug: post.slug, metaDescription: post.metaDescription, datePublished: post.datePublished });
  } catch {
    return { title: "블로그 | 캠핑고고" };
  }
}

// ── TOC 추출 ─────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^가-힣a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-") || "section";
}

function extractToc(markdown: string): TocItem[] {
  const toc: TocItem[] = [];
  for (const line of markdown.split("\n")) {
    const h2 = line.match(/^## (.+)$/);
    const h3 = line.match(/^### (.+)$/);
    if (h2) toc.push({ id: slugify(h2[1]), text: h2[1], level: 2 });
    else if (h3) toc.push({ id: slugify(h3[1]), text: h3[1], level: 3 });
  }
  return toc;
}

// ── XSS 방어: <script>, javascript: URL, on* 이벤트 핸들러 제거 ─
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\bon\w+\s*=/gi, "data-removed=")
    .replace(/href\s*=\s*["']?\s*javascript:/gi, 'href="about:blank"');
}

// ── 마크다운 → HTML (heading ID 포함) ────────────────────
function renderMarkdownTables(md: string): string {
  return md.replace(/(^\|.+\|\n^\|[-:\s|]+\|\n(?:^\|.*\|\n?)*)/gm, (block) => {
    const lines = block.trim().split("\n");
    if (lines.length < 3) return block;
    const parse = (line: string) => line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
    const headers = parse(lines[0]);
    const rows = lines.slice(2).map(parse).filter((row) => row.length === headers.length);
    if (rows.length === 0) return block;
    const thead = `<thead><tr>${headers.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>`;
    return `<table>${thead}${tbody}</table>`;
  });
}

function markdownToHtml(md: string): string {
  let html = renderMarkdownTables(md);

  // Headings with id
  html = html.replace(/^### (.+)$/gm, (_, t) => `<h3 id="${slugify(t)}">${t}</h3>`);
  html = html.replace(/^## (.+)$/gm, (_, t) => `<h2 id="${slugify(t)}">${t}</h2>`);
  html = html.replace(/^# (.+)$/gm, (_, t) => `<h1 id="${slugify(t)}">${t}</h1>`);

  // Inline
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Ordered lists
  html = html.replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>");
  html = html.replace(/(<li>[\s\S]+?<\/li>)(\n(?=\d+\. ))/g, "$1");

  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, "<li>$1</li>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, (m) => `<ul>${m}</ul>`);

  // Blockquote
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // Paragraphs
  html = html.replace(/\n\n/g, "</p><p>");
  html = html.replace(/^(?!<[hup]|<\/|<block)(.+)$/gm, (m) => m.startsWith("<") ? m : `<p>${m}</p>`);
  html = html.replace(/<p><\/p>/g, "");
  html = html.replace(/<p>(<[hul])/g, "$1");
  html = html.replace(/(<\/[hul][^>]*>)<\/p>/g, "$1");

  return html;
}

// ── TOC 모바일 (접기) ─────────────────────────────────────
function TocMobile({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null;
  return (
    <details className="toc-mobile" style={{ marginBottom: "32px", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
      <summary style={{ padding: "12px 16px", fontSize: "13.5px", fontWeight: 700, color: "var(--color-forest-700)", cursor: "pointer", background: "var(--color-forest-50)", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>목차 보기 ({items.length}개 섹션)</span>
        <span style={{ fontSize: "12px", color: "var(--color-gray-400)" }}>▼</span>
      </summary>
      <div style={{ padding: "12px 16px", background: "#fff" }}>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
          {items.map((item) => (
            <li key={item.id} style={{ paddingLeft: item.level === 3 ? "16px" : "0" }}>
              <a href={`#${item.id}`} style={{ fontSize: "13.5px", color: "var(--color-forest-600)", textDecoration: "underline" }}>{item.text}</a>
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}

const PERSONA_NAME: Record<string, string> = {
  saver: "박절약 (페르소나)", traveler: "정여행 (페르소나)", analyst: "김데이터 (페르소나)",
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const faqs = (post.faqs as { q: string; a: string }[] | null) ?? [];
  const sources = (post.externalSources as { name: string; url: string }[] | null) ?? [];

  // 관련글: 같은 카테고리, 최신 3편
  let relatedPosts: { slug: string; title: string; category: string; datePublished: string | null; wordCount: number | null }[] = [];
  try {
    relatedPosts = await getRelatedBlogPosts(post.category, slug);
  } catch { /* ignore */ }
  const authorName = post.persona ? (PERSONA_NAME[post.persona] ?? "캠핑고고 편집팀") : "캠핑고고 편집팀";
  const BASE_URL = process.env.SITE_URL ?? "https://campgogo.kr";
  const url = `${BASE_URL}/blog/${post.slug}`;

  const toc = post.bodyMarkdown ? extractToc(post.bodyMarkdown) : [];

  const articleJsonLd = buildArticleJsonLd({ title: post.title, description: post.metaDescription ?? post.title, datePublished: post.datePublished ?? "", dateModified: post.dateModified ?? post.datePublished ?? "", url, authorName });
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "캠핑고고", url: "https://campgogo.kr" },
    { name: "블로그", url: "https://campgogo.kr/blog" },
    { name: post.title, url },
  ]);
  const faqSchema = faqs.length > 0 ? buildFAQJsonLd(faqs) : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }} />}
      <SiteHeader activeNav="/blog" />

      <main className="flex-1">
        {/* Hero */}
        <div style={{ background: "var(--color-forest-50)", borderBottom: "1px solid var(--color-gray-200)", padding: "44px 0 32px" }}>
          <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 24px" }}>
            <nav style={{ fontSize: "13px", color: "var(--color-gray-400)", marginBottom: "14px" }}>
              <Link href="/blog" style={{ color: "var(--color-forest-600)", textDecoration: "none" }}>블로그</Link>
              {" / "}
              <span style={{ color: "var(--color-gray-600)" }}>{post.category}</span>
            </nav>
            {post.hasAffiliateLinks && <AffiliateDisclosure />}
            <h1 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.3, color: "var(--color-forest-800)", margin: "0 0 18px", maxWidth: "720px" }}>
              {post.title}
            </h1>
            <AuthorLabel persona={post.persona} datePublished={post.datePublished} dateModified={post.dateModified} wordCount={post.wordCount} />
          </div>
        </div>

        {/* Content area: article + TOC sidebar */}
        <div className="blog-post-layout">

          {/* Article */}
          <article style={{ minWidth: 0 }}>
            {post.metaDescription && (
              <p style={{ fontSize: "16.5px", lineHeight: 1.85, color: "var(--color-gray-600)", marginBottom: "32px", padding: "18px 22px", background: "var(--color-forest-50)", borderRadius: "var(--radius-lg)", borderLeft: "4px solid var(--color-forest-400)" }}>
                {post.metaDescription}
              </p>
            )}

            {/* Mobile TOC */}
            <TocMobile items={toc} />

            {/* 인라인 광고 (요약 아래) */}
            <BlogAd />

            {post.bodyMarkdown ? (
              <div className="prose-campgogo" dangerouslySetInnerHTML={{ __html: sanitizeHtml(markdownToHtml(post.bodyMarkdown)) }} />
            ) : (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-gray-400)" }}>
                <p style={{ fontSize: "2rem", marginBottom: "12px" }}>✍️</p>
                <p>글 내용을 준비 중입니다.</p>
              </div>
            )}

            {/* FAQ */}
            {faqs.length > 0 && (
              <section style={{ marginTop: "48px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-forest-800)", marginBottom: "16px" }}>자주 묻는 질문</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {faqs.map((faq, i) => (
                    <details key={i} style={{ border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                      <summary style={{ padding: "14px 18px", fontSize: "15px", fontWeight: 600, color: "var(--color-gray-800)", cursor: "pointer", background: "var(--color-gray-50)", listStyle: "none", display: "flex", justifyContent: "space-between" }}>
                        Q. {faq.q} <span aria-hidden="true" style={{ color: "var(--color-gray-400)", flexShrink: 0 }}>▼</span>
                      </summary>
                      <div style={{ padding: "14px 18px", fontSize: "14.5px", lineHeight: 1.75, color: "var(--color-gray-600)", background: "#fff" }}>{faq.a}</div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Sources */}
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

            <div style={{ marginTop: "40px", padding: "14px 16px", background: "var(--color-gray-50)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-gray-500)", lineHeight: 1.7, borderLeft: "3px solid var(--color-gray-200)" }}>
              본 블로그의 정보는 작성 시점의 공공데이터·공지·법령을 기준으로 합니다. 방문·차박 전 반드시 관할 지자체 또는 관리 기관에 최종 확인 바랍니다.
            </div>

            {/* 관련 글 */}
            {relatedPosts.length > 0 && (
              <section style={{ marginTop: "48px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-gray-700)", marginBottom: "16px", letterSpacing: "-0.01em" }}>
                  같은 카테고리 글
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {relatedPosts.map((r) => (
                    <Link key={r.slug} href={`/blog/${r.slug}`} style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "14px 16px", background: "var(--color-gray-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-gray-200)", textDecoration: "none", transition: "background 120ms" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-gray-900)", lineHeight: 1.4 }}>{r.title}</span>
                      <span style={{ fontSize: "12px", color: "var(--color-gray-400)" }}>
                        {r.datePublished?.replace(/-/g, ".")} · {r.wordCount ? `${Math.max(1, Math.ceil(r.wordCount / 200))}분` : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 하단 인라인 광고 */}
            <BlogAd />

            <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid var(--color-gray-200)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <Link href="/blog" style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-forest-600)", textDecoration: "none" }}>
                ← 블로그 목록
              </Link>
              <Link href="/match" style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-gray-500)", textDecoration: "none" }}>
                야영지 찾기 →
              </Link>
            </div>
          </article>

          {/* Desktop TOC */}
          <aside className="toc-aside">
            <TocSidebar items={toc} />
          </aside>

        </div>
      </main>

      <SiteFooter />
    </>
  );
}
