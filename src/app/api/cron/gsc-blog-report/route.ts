export const runtime = "nodejs";
export const maxDuration = 30;

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

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
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

async function fetchSearchAnalytics(accessToken: string, startDate: string, endDate: string) {
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
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: "page",
              operator: "contains",
              expression: siteUrl("/blog/"),
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`GSC searchAnalytics failed: ${res.status} ${await res.text()}`);
  }

  return await res.json() as { rows?: SearchAnalyticsRow[] };
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasGscCredentials()) {
    return Response.json({ error: "GSC_SERVICE_ACCOUNT_EMAIL / GSC_PRIVATE_KEY is required" }, { status: 500 });
  }

  const url = new URL(req.url);
  const days = Math.max(7, Math.min(90, Number(url.searchParams.get("days") ?? 28)));
  const endDate = url.searchParams.get("end") ?? isoDate(new Date());
  const start = new Date(`${endDate}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - days);
  const startDate = url.searchParams.get("start") ?? isoDate(start);

  try {
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
      .limit(500);

    const gsc = await fetchSearchAnalytics(accessToken, startDate, endDate);
    const byUrl = new Map<string, SearchAnalyticsRow[]>();
    for (const row of gsc.rows ?? []) {
      const [page] = row.keys ?? [];
      if (!page) continue;
      const rows = byUrl.get(page) ?? [];
      rows.push(row);
      byUrl.set(page, rows);
    }

    const metrics: BlogMetric[] = posts.map((post) => {
      const postUrl = siteUrl(`/blog/${post.slug}`);
      const rows = byUrl.get(postUrl) ?? [];
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
          ctr: round(row.ctr ?? 0, 4),
          position: round(row.position ?? 0, 2),
        }))
        .filter((row) => row.query)
        .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks)
        .slice(0, 5);

      const base = {
        slug: post.slug,
        url: postUrl,
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
      startDate,
      endDate,
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

    return Response.json({
      ok: true,
      summary,
      rewriteQueue: metrics
        .filter((row) => row.grade !== "D")
        .sort((a, b) => a.grade.localeCompare(b.grade) || b.impressions - a.impressions)
        .slice(0, 50),
    });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
