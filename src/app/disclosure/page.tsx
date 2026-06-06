import type { Metadata } from "next";
import Link from "next/link";
import { StaticPageLayout } from "@/components/static-page-layout";

export const metadata: Metadata = {
  title: "광고·제휴 정책",
  description: "캠핑고고의 광고 및 제휴 링크 운영 방식과 독립성 보호 정책.",
};

export default function DisclosurePage() {
  return (
    <StaticPageLayout
      title="광고·제휴 정책"
      subtitle="캠핑고고가 수익을 내는 방식과 편집 독립성을 지키는 방법."
      lastUpdated="2026년 6월"
    >
      <div className="notice-box">
        캠핑고고는 일부 글에 제휴 링크를 포함할 수 있습니다. 제휴 링크가
        포함된 모든 글 <strong>상단에 명확히 표기</strong>하며, 이는 콘텐츠의
        독립성에 영향을 주지 않습니다.
      </div>

      <h2>제휴 링크</h2>
      <p>
        제휴 링크를 통해 구매·예약이 이루어질 경우 소정의 수수료를 받을 수
        있습니다. 이 수수료는 독자에게 추가 비용을 발생시키지 않습니다.
      </p>
      <p>
        제휴 관계는 콘텐츠의 사실 여부나 추천에 영향을 주지 않습니다. 제휴가
        없는 곳도 품질 기준을 충족하면 동일하게 소개합니다.
      </p>

      <h2>광고</h2>
      <p>
        현재 Google AdSense 등 제3자 광고 플랫폼을 통한 디스플레이 광고를
        게재할 수 있습니다. 광고는 편집 콘텐츠와 명확히 구분되어 표시됩니다.
      </p>

      <h2>스폰서 콘텐츠</h2>
      <p>
        스폰서십을 받아 작성된 콘텐츠는 &quot;스폰서 콘텐츠&quot; 또는 &quot;광고&quot; 라벨을
        상단에 표기합니다. 스폰서가 있더라도 사실과 다른 정보는 게재하지
        않습니다.
      </p>

      <h2>독립성 보호</h2>
      <ul>
        <li>제휴·광고 수익은 편집 결정에 영향을 주지 않습니다.</li>
        <li>부정적 정보도 사실이라면 그대로 표기합니다.</li>
        <li>광고주의 요청으로 콘텐츠를 수정하지 않습니다.</li>
        <li>
          차박 합법성, 안전 정보 등 사실 기반 정보는 제휴 여부와 무관하게
          동일하게 표기합니다.
        </li>
      </ul>

      <h2>문의</h2>
      <p>
        제휴 제안 또는 광고 문의는 <Link href="/contact">정보 제보 페이지</Link>를
        통해 연락 주세요.
      </p>
    </StaticPageLayout>
  );
}
