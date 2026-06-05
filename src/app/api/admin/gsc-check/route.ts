// GSC 사이트맵 상태 확인 및 제출
// 서비스 계정(id-ai-179@cursorai-451704.iam.gserviceaccount.com)이
// Google Search Console 속성 소유자로 추가되어야 합니다.
export const runtime = "nodejs";

import { getGscAccessToken, hasGscCredentials } from "@/lib/gsc/auth";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://campgogo.kr";

export async function GET(req: Request) {
  const adminToken = process.env.ADMIN_API_TOKEN;
  const token = req.headers.get("authorization");
  if (!adminToken || !token || token !== `Bearer ${adminToken}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasGscCredentials()) {
    return Response.json({ error: "GSC_SERVICE_ACCOUNT_EMAIL / GSC_PRIVATE_KEY 환경변수 미설정" }, { status: 500 });
  }

  try {
    const accessToken = await getGscAccessToken();
    const siteUrl = encodeURIComponent(SITE_URL + "/");

    const listRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/sitemaps`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const listData = await listRes.json() as { sitemap?: { path: string; lastSubmitted: string; isPending: boolean; isSitemapsIndex: boolean; lastDownloaded: string; warnings: number; errors: number }[] };

    const sitemapPath = `${SITE_URL}/sitemap.xml`;
    await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/sitemaps/${encodeURIComponent(sitemapPath)}`,
      { method: "PUT", headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return Response.json({ ok: true, sitemaps: listData.sitemap ?? [], submitted: sitemapPath });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
