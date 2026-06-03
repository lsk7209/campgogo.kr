import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/static-page-layout";

export const metadata: Metadata = {
  title: "가상 저자 안내",
  description: "캠핑고고의 콘텐츠 톤·큐레이션 페르소나 안내. 이 페르소나는 실재 인물이 아닙니다.",
};

export default function AuthorsPage() {
  return (
    <StaticPageLayout
      title="가상 저자 안내"
      subtitle="본 사이트의 콘텐츠 톤·큐레이션 페르소나입니다. 실재 인물이 아닙니다."
    >
      <div className="notice-box">
        ⚠️ 본 페이지에 등장하는 페르소나는 <strong>가상의 편집 톤 가이드</strong>입니다.
        실재하는 인물이 아니며, 얼굴 사진·실명·자격증은 존재하지 않습니다.
        콘텐츠의 사실 확인 및 편집 책임은 캠핑고고 편집팀에 있습니다.
      </div>

      <h2>왜 페르소나를 사용하나요</h2>
      <p>
        같은 야영지도 30대 절약 캠퍼와 40대 솔로 차박러는 다른 정보를
        원합니다. 페르소나는 독자별 관심사에 맞는 톤으로 정보를 전달하기 위한
        편집 도구입니다. 각 글 하단에 어떤 페르소나 톤으로 작성됐는지 표기합니다.
      </p>

      <h2>페르소나 소개</h2>

      <h3>박절약 (saver) — 전체 글의 약 50%</h3>
      <p>
        <strong>톤:</strong> 실용·비교·"이 값에 이 시설"
        <br />
        <strong>관심 주제:</strong> 가성비 야영지, 무료·공공 비교, 이용료 절약
        <br />
        <strong>적용 콘텐츠:</strong> 야영지 비교, 가성비 테마, 절약 가이드
      </p>

      <h3>정여행 (traveler) — 전체 글의 약 30%</h3>
      <p>
        <strong>톤:</strong> 자유·미니멀·한적함
        <br />
        <strong>관심 주제:</strong> 차박, 노지, 솔로 야영, 덜 알려진 곳
        <br />
        <strong>적용 콘텐츠:</strong> 차박 가이드, 노지 추천, 시즌 큐레이션
      </p>

      <h3>김데이터 (analyst) — 전체 글의 약 20%</h3>
      <p>
        <strong>톤:</strong> 정보 밀도·출처·신뢰
        <br />
        <strong>관심 주제:</strong> 차박 합법성, 공공데이터 분석, 정책·조례
        <br />
        <strong>적용 콘텐츠:</strong> 데이터·정책 글, 합법성 가이드, 에버그린
      </p>

      <h2>자격 사칭 방지</h2>
      <p>
        어떤 페르소나도 의사·변호사·세무사·공인중개사 등 전문 자격을 사칭하지
        않습니다. 법적·의료적 판단이 필요한 내용은 전문가 상담을 권고합니다.
      </p>

      <h2>편집팀 연락</h2>
      <p>
        콘텐츠 오류 또는 사실 확인 요청은{" "}
        <a href="/contact">정보 제보 페이지</a>를 이용해 주세요.
      </p>
    </StaticPageLayout>
  );
}
