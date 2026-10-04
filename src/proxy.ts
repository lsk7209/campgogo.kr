import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 한국어 경로 -> 영문 내부 경로 매핑 (인덱스 페이지만)
const REWRITE_MAP: Record<string, string> = {
  "/지역": "/ko-jiyeok",
  "/테마": "/ko-tema",
  "/시즌": "/ko-sijeun",
  "/캠핑장": "/ko-campsite-index",
  "/지도": "/ko-jido",
};

// 봇이 검색·필터(쿼리파라미터) URL을 대량 크롤하면 SSR 및 Turso reads가
// 폭주하므로, 봇의 쿼리스트링 요청을 Edge에서 403 차단(DB 도달 전).
const BOT_UA =
  /bot|crawl|spider|slurp|Googlebot|bingbot|Bytespider|GPTBot|ClaudeBot|PerplexityBot|OAI-SearchBot|YandexBot|Baiduspider|DuckDuckBot|Yeti|Daumoa/i;

export function proxy(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  if (req.nextUrl.search && BOT_UA.test(ua)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let pathname: string;
  try {
    pathname = decodeURIComponent(req.nextUrl.pathname);
  } catch {
    return NextResponse.next();
  }

  const target = REWRITE_MAP[pathname];
  if (target) {
    const url = req.nextUrl.clone();
    url.pathname = target;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
