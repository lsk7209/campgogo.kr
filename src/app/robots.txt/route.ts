export const dynamic = "force-static";

export function GET(): Response {
  const content = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "",
    "# AI 크롤러 허용 (GEO 전략)",
    "User-agent: GPTBot",
    "User-agent: ClaudeBot",
    "User-agent: anthropic-ai",
    "User-agent: PerplexityBot",
    "User-agent: OAI-SearchBot",
    "User-agent: Google-Extended",
    "User-agent: Yeti",
    "User-agent: Daumoa",
    "Allow: /",
    "",
    "# 비매너 크롤러 차단",
    "User-agent: Bytespider",
    "Disallow: /",
    "",
    "Sitemap: https://campgogo.kr/sitemap.xml",
  ].join("\n");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
