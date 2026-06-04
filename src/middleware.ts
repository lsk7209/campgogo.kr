import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 한국어 경로 → 영문 내부 경로 매핑 (인덱스 페이지만)
const REWRITE_MAP: Record<string, string> = {
  "/지역": "/ko-jiyeok",
  "/테마": "/ko-tema",
  "/시즌": "/ko-sijeun",
  "/캠핑장": "/ko-campsite-index",
  "/지도": "/ko-jido",
};

export function middleware(req: NextRequest) {
  // pathname은 퍼센트 인코딩된 상태일 수 있으므로 decode
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
  // 모든 경로에서 실행하되 API/정적 파일은 제외
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).+)",
  ],
};
