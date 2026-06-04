// GSC 사이트맵 상태 확인 및 제출
// 서비스 계정(id-ai-179@cursorai-451704.iam.gserviceaccount.com)이
// Google Search Console 속성 소유자로 추가되어야 합니다.
export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://campgogo.kr";
const GSC_SERVICE_ACCOUNT_EMAIL = process.env.GSC_SERVICE_ACCOUNT_EMAIL ?? "";
const GSC_PRIVATE_KEY = (process.env.GSC_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: GSC_SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/webmasters",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })).toString("base64url");

  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(GSC_PRIVATE_KEY, "base64url");
  const jwt = `${header}.${payload}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await res.json() as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`GSC 토큰 오류: ${data.error}`);
  return data.access_token;
}

export async function GET(req: Request) {
  const token = req.headers.get("authorization");
  if (!token || token !== `Bearer ${process.env.ADMIN_API_TOKEN ?? ""}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!GSC_SERVICE_ACCOUNT_EMAIL || !GSC_PRIVATE_KEY) {
    return Response.json({ error: "GSC_SERVICE_ACCOUNT_EMAIL / GSC_PRIVATE_KEY 환경변수 미설정" }, { status: 500 });
  }

  try {
    const accessToken = await getAccessToken();
    const siteUrl = encodeURIComponent(SITE_URL + "/");

    // 사이트맵 목록 조회
    const listRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/sitemaps`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const listData = await listRes.json() as { sitemap?: { path: string; lastSubmitted: string; isPending: boolean; isSitemapsIndex: boolean; lastDownloaded: string; warnings: number; errors: number }[] };

    // 사이트맵 제출 (이미 있어도 refresh)
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
