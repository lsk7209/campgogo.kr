import type { Metadata } from "next";
import Link from "next/link";
import { StaticPageLayout } from "@/components/static-page-layout";

export const metadata: Metadata = {
  title: "소개",
  description: "캠핑고고는 예약 앱이 못 보여주는 공공·저렴·차박 야영지를 찾아주는 사이트입니다.",
  alternates: { canonical: "https://campgogo.kr/about" },
};

export default function AboutPage() {
  return (
    <StaticPageLayout
      title="캠핑고고 소개"
      subtitle="예약 앱이 못 보여주는 야영지를 찾아드립니다."
    >
      <h2>우리가 만드는 이유</h2>
      <p>
        캠핑 앱을 열면 인기 유료 캠핑장만 가득합니다. 무료·공공·노지·차박을
        원하는 사람들을 위한 공간은 없었습니다. 캠핑고고는 그 빈자리를
        채웁니다.
      </p>
      <p>
        우리는 후기 커뮤니티가 아닙니다. 실시간 예약 서비스도 아닙니다.
        <strong>정확한 정보와 합법성 확인</strong>에 집중하는 데이터 사이트입니다.
      </p>

      <h2>무엇을 다루나요</h2>
      <ul>
        <li>
          <strong>공공 야영지</strong> — 지자체·국가 운영, 저렴하거나 무료인 곳
        </li>
        <li>
          <strong>차박 가능지</strong> — 합법성 4단계 신뢰도와 출처를 함께 표기
        </li>
        <li>
          <strong>노지·무료 야영지</strong> — 예약 앱에 등록되지 않은 조용한 곳
        </li>
        <li>
          <strong>가이드 & 블로그</strong> — 결정에 필요한 실전 정보
        </li>
      </ul>

      <h2>데이터 출처</h2>
      <p>
        모든 야영지 정보는 한국관광공사 고캠핑, data.go.kr 전국야영장
        표준데이터 등 공공데이터를 1차 출처로 사용합니다. 라이선스는{" "}
        <Link href="/data-license">데이터 라이선스 페이지</Link>에서 확인하세요.
      </p>

      <h2>편집 원칙</h2>
      <p>
        정보는 사실 진술 형식으로만 제공합니다. &quot;공식 허가&quot;처럼 단정하는 표현은
        쓰지 않습니다. 변경될 수 있는 정보는 반드시 최종 확인을 권고합니다.
        자세한 원칙은 <Link href="/editorial-policy">편집 정책</Link>을 참고하세요.
      </p>

      <h2>가상 페르소나 안내</h2>
      <p>
        본 사이트의 콘텐츠는 편집팀이 작성하며, 일부 글의 톤·큐레이션은 가상
        페르소나(박절약·정여행·김데이터)를 기반으로 합니다. 이 페르소나는{" "}
        <strong>실재 인물이 아닙니다.</strong> 자세한 안내는{" "}
        <Link href="/authors">가상 저자 안내</Link>를 참고하세요.
      </p>

      <div className="notice-box">
        본 사이트의 정보는 공공데이터·공지·법령을 기준으로 작성됩니다. 방문 전
        반드시 관할 지자체 또는 관리 기관에 최종 확인 바랍니다.
      </div>
    </StaticPageLayout>
  );
}
