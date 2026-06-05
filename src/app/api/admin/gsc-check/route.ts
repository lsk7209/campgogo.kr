// GSC 사이트맵 상태 확인 및 일괄 제출
// 서비스 계정이 GSC 속성 소유자로 등록되어 있어야 합니다.
export const runtime = "nodejs";

import { getGscAccessToken, hasGscCredentials } from "@/lib/gsc/auth";

const SITE_URL = process.env.SITE_URL ?? "https://campgogo.kr";

const SITEMAPS = [
  `${SITE_URL}/sitemap.xml`,
  `${SITE_URL}/sitemap-static.xml`,
  `${SITE_URL}/sitemap-blog.xml`,
  `${SITE_URL}/sitemap-campsites.xml`,
];

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
    const encodedSite = encodeURIComponent(`${SITE_URL}/`);

    // 현재 제출된 사이트맵 목록 조회
    const listRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const listData = await listRes.json() as {
      sitemap?: { path: string; lastSubmitted: string; isPending: boolean; isSitemapsIndex: boolean; errors: number }[]
    };

    // 서브 사이트맵 포함 전체 제출
    const submitResults: { url: string; status: number }[] = [];
    for (const sm of SITEMAPS) {
      const res = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodeURIComponent(sm)}`,
        { method: "PUT", headers: { Authorization: `Bearer ${accessToken}` } }
      );
      submitResults.push({ url: sm, status: res.status });
    }

    return Response.json({
      ok: true,
      submitted: submitResults,
      existing: listData.sitemap ?? [],
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
