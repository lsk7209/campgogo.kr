const DEFAULT_SITE_URL = "https://campgogo.kr";

export function normalizeSiteUrl(value = process.env.SITE_URL ?? DEFAULT_SITE_URL): string {
  const cleaned = value.replace(/\uFEFF/g, "").trim();
  return (cleaned || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function cleanSitemapLoc(value: string): string {
  return value.replace(/\uFEFF/g, "").trim();
}

export function siteUrl(path = ""): string {
  const base = normalizeSiteUrl();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
