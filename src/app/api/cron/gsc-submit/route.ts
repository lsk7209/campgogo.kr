export const runtime = "nodejs";
export const maxDuration = 30;

import { getGscAccessToken, hasGscCredentials } from "@/lib/gsc/auth";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://campgogo.kr";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasGscCredentials()) {
    return Response.json({ error: "GSC 환경변수 미설정 (GSC_SERVICE_ACCOUNT_EMAIL / GSC_PRIVATE_KEY)" }, { status: 500 });
  }

  try {
    const accessToken = await getGscAccessToken();
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
