import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { and, asc, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { getGscAccessToken, hasGscCredentials } from "@/lib/gsc/auth";
import { siteUrl } from "@/lib/seo/site-url";

type SearchAnalyticsRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type GscResponse = {
  rows?: SearchAnalyticsRow[];
  responseAggregationType?: string;
};

type BlogMetric = {
  slug: string;
  url: string;
  title: string;
  publishedAt: string | null;
  wordCount: number | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number | null;
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  grade: "A" | "B" | "C" | "D";
  action: string;
};

const OUT_DIR = join(process.cwd(), "reports");
const BLOG_PATH = "/blog/";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseArgs() {
  const args = new Map<string, string>();
  for (const raw of process.argv.slice(2)) {
    const [key, value] = raw.replace(/^--/, "").split("=");
    args.set(key, value ?? "true");
  }
  const today = new Date();
  const end = args.get("end") ?? isoDate(today);
  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() - Number(args.get("days") ?? 28));
  const start = args.get("start") ?? isoDate(startDate);
  const limit = Number(args.get("limit") ?? 250);
  return { start, end, limit };
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function gradeMetric(metric: Omit<BlogMetric, "grade" | "action">): Pick<BlogMetric, "grade" | "action"> {
  if (metric.impressions === 0) {
    return { grade: "C", action: "색인/내부링크/키워드 난이도 점검: 노출이 없으므로 URL 검사와 내부링크 보강을 우선한다." };
  }
  if (metric.position !== null && metric.position >= 5 && metric.position <= 20) {
    return { grade: "A", action: "상위권 후보: 제목, 메타 설명, 도입부 답변, FAQ를 실제 노출 쿼리에 맞춰 2차 리라이트한다." };
  }
  if (metric.ctr < 0.015 && metric.impressions >= 20) {
    return { grade: "B", action: "CTR 개선 후보: 제목/부제/스니펫형 첫 문단을 더 구체적인 검색 의도 중심으로 바꾼다." };
  }
  return { grade: "D", action: "관찰 유지: 노출 추이를 더 쌓고 같은 클러스터 내부링크만 보강한다." };
}

async function fetchGscRows(accessToken: string, startDate: string, endDate: string, dimensionFilterGroups?: unknown[]) {
  const site = encodeURIComponent(`${siteUrl()}/`);
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ["page", "query"],
      rowLimit: 25000,
      ...(dimensionFilterGroups ? { dimensionFilterGroups } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`GSC searchAnalytics failed: ${res.status} ${await res.text()}`);
  }

  return await res.json() as GscResponse;
}

async function main() {
  if (!hasGscCredentials()) {
    throw new Error("GSC_SERVICE_ACCOUNT_EMAIL / GSC_PRIVATE_KEY is required");
  }

  const { start, end, limit } = parseArgs();
  const accessToken = await getGscAccessToken();
  const posts = await db.select({
    slug: blogPosts.slug,
    title: blogPosts.title,
    publishedAt: blogPosts.publishedAt,
    wordCount: blogPosts.wordCount,
  })
    .from(blogPosts)
    .where(and(eq(blogPosts.status, "published"), lte(blogPosts.publishedAt, new Date())))
    .orderBy(asc(blogPosts.publishedAt))
    .limit(limit);

  const response = await fetchGscRows(accessToken, start, end, [
    {
      filters: [
        {
          dimension: "page",
          operator: "contains",
          expression: `${siteUrl(BLOG_PATH)}`,
        },
      ],
    },
  ]);

  const byUrl = new Map<string, SearchAnalyticsRow[]>();
  for (const row of response.rows ?? []) {
    const [page] = row.keys ?? [];
    if (!page) continue;
    const rows = byUrl.get(page) ?? [];
    rows.push(row);
    byUrl.set(page, rows);
  }

  const metrics: BlogMetric[] = posts.map((post) => {
    const url = siteUrl(`/blog/${post.slug}`);
    const rows = byUrl.get(url) ?? [];
    const clicks = rows.reduce((sum, row) => sum + (row.clicks ?? 0), 0);
    const impressions = rows.reduce((sum, row) => sum + (row.impressions ?? 0), 0);
    const weightedPosition = rows.reduce((sum, row) => sum + (row.position ?? 0) * (row.impressions ?? 0), 0);
    const position = impressions > 0 ? weightedPosition / impressions : null;
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const topQueries = rows
      .map((row) => ({
        query: row.keys?.[1] ?? "",
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0,
      }))
      .filter((row) => row.query)
      .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks)
      .slice(0, 5);

    const base = {
      slug: post.slug,
      url,
      title: post.title,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      wordCount: post.wordCount,
      clicks,
      impressions,
      ctr: round(ctr, 4),
      position: position === null ? null : round(position, 2),
      topQueries,
    };
    return { ...base, ...gradeMetric(base) };
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    start,
    end,
    postCount: metrics.length,
    totals: {
      clicks: metrics.reduce((sum, row) => sum + row.clicks, 0),
      impressions: metrics.reduce((sum, row) => sum + row.impressions, 0),
    },
    grades: {
      A: metrics.filter((row) => row.grade === "A").length,
      B: metrics.filter((row) => row.grade === "B").length,
      C: metrics.filter((row) => row.grade === "C").length,
      D: metrics.filter((row) => row.grade === "D").length,
    },
  };

  const output = {
    summary,
    rewriteQueue: metrics
      .filter((row) => row.grade !== "D")
      .sort((a, b) => a.grade.localeCompare(b.grade) || b.impressions - a.impressions),
    metrics,
  };

  await mkdir(OUT_DIR, { recursive: true });
  const file = join(OUT_DIR, `gsc-blog-performance-${start}-${end}.json`);
  await writeFile(file, JSON.stringify(output, null, 2), "utf-8");

  console.log(JSON.stringify(summary, null, 2));
  console.log(`report=${file}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
