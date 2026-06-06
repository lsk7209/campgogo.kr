export const runtime = "nodejs";
export const maxDuration = 30;

import { getGscAccessToken, hasGscCredentials } from "@/lib/gsc/auth";
import { siteUrl } from "@/lib/seo/site-url";

type GscSitemapStatus = {
  path?: string;
  lastSubmitted?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  errors?: number | string;
  warnings?: number | string;
};

const SITE_URL = siteUrl();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSuccessful(status: GscSitemapStatus) {
  const errors = Number(status.errors ?? 0);
  const warnings = Number(status.warnings ?? 0);
  return errors === 0 && warnings === 0 && !status.isPending;
}

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
    const sitemapEncoded = encodeURIComponent(sitemapUrl);

    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${siteEncoded}/sitemaps/${sitemapEncoded}`,
      { method: "PUT", headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      const body = await res.text();
      return Response.json({ ok: false, status: res.status, body }, { status: 500 });
    }

    let status: GscSitemapStatus | null = null;
    for (let attempt = 1; attempt <= 5; attempt++) {
      const statusRes = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${siteEncoded}/sitemaps/${sitemapEncoded}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!statusRes.ok) {
        const body = await statusRes.text();
        return Response.json({ ok: false, submitted: sitemapUrl, status: statusRes.status, body }, { status: 500 });
      }

      status = await statusRes.json() as GscSitemapStatus;
      if (isSuccessful(status)) break;
      if (attempt < 5) await sleep(5000);
    }

    return Response.json({
      ok: status ? isSuccessful(status) : false,
      submitted: sitemapUrl,
      status,
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
