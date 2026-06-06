export const runtime = "nodejs";
export const maxDuration = 60;

import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { getGscAccessToken, hasGscCredentials } from "@/lib/gsc/auth";
import { siteUrl } from "@/lib/seo/site-url";

type InspectionResponse = {
  inspectionResult?: {
    inspectionResultLink?: string;
    indexStatusResult?: {
      verdict?: string;
      coverageState?: string;
      robotsTxtState?: string;
      indexingState?: string;
      pageFetchState?: string;
      googleCanonical?: string;
      userCanonical?: string;
      lastCrawlTime?: string;
    };
  };
};

type IndexMetric = {
  slug: string;
  url: string;
  title: string;
  publishedAt: string | null;
  verdict: string | null;
  coverageState: string | null;
  indexingState: string | null;
  pageFetchState: string | null;
  robotsTxtState: string | null;
  lastCrawlTime: string | null;
  googleCanonical: string | null;
  userCanonical: string | null;
  inspectionResultLink: string | null;
  action: string;
};

function actionFor(status: InspectionResponse["inspectionResult"]): string {
  const index = status?.indexStatusResult;
  if (!index) return "No inspection result: retry URL Inspection API check.";
  if (index.verdict === "PASS") return "Indexable: keep sitemap and internal links in place.";
  if (index.robotsTxtState === "DISALLOWED") return "Robots blocked: check robots.txt, noindex, and canonical settings.";
  if (index.pageFetchState && !["SUCCESSFUL", "PAGE_FETCH_STATE_UNSPECIFIED"].includes(index.pageFetchState)) {
    return "Fetch issue: check HTTP status, redirects, and server response.";
  }
  if (index.coverageState?.includes("알려지지 않은 URL") || index.coverageState?.includes("not known to Google")) {
    return "Discovery pending: sitemap submission and internal links are the next priority.";
  }
  return "Indexing candidate: verify sitemap submission, internal links, canonical, and noindex state.";
}

async function inspectUrl(accessToken: string, inspectionUrl: string) {
  const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inspectionUrl,
      siteUrl: `${siteUrl()}/`,
      languageCode: "ko-KR",
    }),
  });

  if (!res.ok) {
    throw new Error(`URL inspection failed for ${inspectionUrl}: ${res.status} ${await res.text()}`);
  }

  return await res.json() as InspectionResponse;
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
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") ?? 50)));

  try {
    const accessToken = await getGscAccessToken();
    const posts = await db.select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      publishedAt: blogPosts.publishedAt,
    })
      .from(blogPosts)
      .where(and(eq(blogPosts.status, "published"), lte(blogPosts.publishedAt, new Date())))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);

    const metrics: IndexMetric[] = [];
    for (const post of posts) {
      const postUrl = siteUrl(`/blog/${post.slug}`);
      const inspection = await inspectUrl(accessToken, postUrl);
      const result = inspection.inspectionResult;
      const index = result?.indexStatusResult;
      metrics.push({
        slug: post.slug,
        url: postUrl,
        title: post.title,
        publishedAt: post.publishedAt?.toISOString() ?? null,
        verdict: index?.verdict ?? null,
        coverageState: index?.coverageState ?? null,
        indexingState: index?.indexingState ?? null,
        pageFetchState: index?.pageFetchState ?? null,
        robotsTxtState: index?.robotsTxtState ?? null,
        lastCrawlTime: index?.lastCrawlTime ?? null,
        googleCanonical: index?.googleCanonical ?? null,
        userCanonical: index?.userCanonical ?? null,
        inspectionResultLink: result?.inspectionResultLink ?? null,
        action: actionFor(result),
      });
    }

    return Response.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      limit,
      inspected: metrics.length,
      summary: {
        pass: metrics.filter((row) => row.verdict === "PASS").length,
        fail: metrics.filter((row) => row.verdict && row.verdict !== "PASS").length,
        unknown: metrics.filter((row) => !row.verdict).length,
      },
      metrics,
    });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
