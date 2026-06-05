import { db } from "@/lib/db/client";
import { blogPosts } from "@/lib/db/schema";
import { and, eq, lte } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 60;

const SITE = "campgogo.kr";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "9c8b7a6e5f4d3c2b";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://campgogo.kr";
const BATCH_SIZE = 500; // IndexNow 권장 배치 크기

async function submitBatch(urls: string[]): Promise<{ ok: boolean; status?: number }> {
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: SITE,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });
  return { ok: res.ok, status: res.status };
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  const adminToken = process.env.ADMIN_API_TOKEN ?? "";
  const isAuth =
    authHeader === `Bearer ${adminToken}` || token === adminToken;

  if (!adminToken || !isAuth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const livePosts = await db
      .select({ slug: blogPosts.slug, datePublished: blogPosts.datePublished })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.status, "published"),
          lte(blogPosts.publishedAt, now)
        )
      );

    if (livePosts.length === 0) {
      return Response.json({ submitted: 0, message: "공개 글 없음" });
    }

    const urls = livePosts.map((p) => `${SITE_URL}/blog/${p.slug}`);

    // 배치 단위로 제출
    const results: { batch: number; ok: boolean; status?: number }[] = [];
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      const result = await submitBatch(batch);
      results.push({ batch: Math.floor(i / BATCH_SIZE) + 1, ...result });
    }

    const allOk = results.every((r) => r.ok);

    return Response.json({
      submitted: livePosts.length,
      batches: results.length,
      allOk,
      results,
      sampleUrls: urls.slice(0, 5),
    });
  } catch (err) {
    console.error("blog-indexnow error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
