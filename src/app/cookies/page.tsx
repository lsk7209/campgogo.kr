import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/static-page-layout";

export const metadata: Metadata = {
  title: "쿠키 정책",
  description: "캠핑고고가 사용하는 쿠키와 유사 기술의 종류 및 목적.",
  alternates: { canonical: "https://campgogo.kr/cookies" },
};

export default function CookiesPage() {
  return (
    <StaticPageLayout
      title="쿠키 정책"
      lastUpdated="2026년 6월"
    >
      <h2>쿠키란</h2>
      <p>
        쿠키는 웹사이트가 브라우저에 저장하는 작은 텍스트 파일입니다. 본
        사이트는 서비스 운영과 분석을 위해 쿠키 및 유사 기술(localStorage 등)을
        사용합니다.
      </p>

      <h2>사용하는 쿠키 종류</h2>
      <table>
        <thead>
          <tr>
            <th>종류</th>
            <th>목적</th>
            <th>동의 필요</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>필수 쿠키</td>
            <td>쿠키 동의 여부 저장, 서비스 기본 기능</td>
            <td>불필요 (서비스 운영 필수)</td>
          </tr>
          <tr>
            <td>분석 쿠키</td>
            <td>Google Analytics 4 — 방문자 통계, 페이지 분석</td>
            <td>동의 후 활성화</td>
          </tr>
          <tr>
            <td>광고 쿠키</td>
            <td>Google AdSense — 광고 최적화</td>
            <td>동의 후 활성화</td>
          </tr>
        </tbody>
      </table>

      <h2>동의 관리</h2>
      <p>
        첫 방문 시 하단 배너에서 쿠키 수락 또는 거부를 선택할 수 있습니다.
        분석·광고 쿠키는 동의한 경우에만 로드됩니다. 언제든지 아래에서 동의를
        철회할 수 있습니다.
      </p>
      <p>
        브라우저 설정에서도 쿠키를 차단하거나 삭제할 수 있습니다.
      </p>

      <h2>제3자 쿠키</h2>
      <p>
        Google Analytics, Google AdSense는 자체 개인정보 처리방침에 따라 데이터를
        처리합니다. 자세한 내용은 Google 개인정보 처리방침을 참고하세요.
      </p>

      <h2>문의</h2>
      <p>
        쿠키 관련 문의는 <a href="/contact">정보 제보 페이지</a>를 이용해 주세요.
      </p>
    </StaticPageLayout>
  );
}
