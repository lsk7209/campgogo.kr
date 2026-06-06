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

export function proxy(req: NextRequest) {
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).+)"],
};
