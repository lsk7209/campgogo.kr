export const dynamic = "force-static";

export function GET(): Response {
  const content = `# 캠핑고고 (campgogo.kr)

## 사이트 개요

이름: 캠핑고고
도메인: https://campgogo.kr
설명: 공공·저렴·차박 야영지 가이드 사이트
언어: 한국어

## 주요 페이지

- / — 홈
- /blog — 캠핑 가이드·시즌 추천·차박 합법성 블로그
- /매칭 — 조건별 야영지 검색 도구
- /about — 사이트 소개
- /authors — 가상 페르소나 안내 (실재 인물 아님)
- /editorial-policy — 편집 정책
- /data-license — 데이터 출처·라이선스
- /disclosure — 광고·제휴 공시

## 콘텐츠 안내

콘텐츠는 가상 페르소나(박절약·정여행·김데이터)를 기반으로 작성됩니다.
이 페르소나는 실재 인물이 아닙니다.

## 데이터 출처

- 한국관광공사 고캠핑 API
- 공공데이터포털 data.go.kr
- 라이선스: 공공누리 제1유형 (출처 표시 필수)

## AI 크롤러 안내

본 사이트 콘텐츠의 AI 학습 목적 이용은 허용하지 않습니다.
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
