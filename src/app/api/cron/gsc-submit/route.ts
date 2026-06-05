export const runtime = "nodejs";
export const maxDuration = 30;

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
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json() as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`GSC 토큰 오류: ${data.error}`);
  return data.access_token;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!GSC_SERVICE_ACCOUNT_EMAIL || !GSC_PRIVATE_KEY) {
    return Response.json({ error: "GSC 환경변수 미설정 (GSC_SERVICE_ACCOUNT_EMAIL / GSC_PRIVATE_KEY)" }, { status: 500 });
  }

  try {
    const accessToken = await getAccessToken();
    const siteEncoded = encodeURIComponent(`${SITE_URL}/`);
    const sitemapUrl = `${SITE_URL}/sitemap.xml`;

    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${siteEncoded}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
      { method: "PUT", headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      const body = await res.text();
      return Response.json({ ok: false, status: res.status, body }, { status: 500 });
    }

    return Response.json({ ok: true, submitted: sitemapUrl });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
