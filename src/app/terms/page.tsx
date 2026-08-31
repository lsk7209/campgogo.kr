import type { Metadata } from "next";
import Link from "next/link";
import { StaticPageLayout } from "@/components/static-page-layout";

export const metadata: Metadata = {
  title: "이용약관",
  description: "캠핑고고 서비스 이용약관.",
  alternates: { canonical: "https://campgogo.kr/terms" },
};

export default function TermsPage() {
  return (
    <StaticPageLayout
      title="이용약관"
      lastUpdated="2026년 6월 3일"
    >
      <div className="notice-box">
        법적 효력이 있는 최종 약관은 변호사 검토 후 갱신 예정입니다. (현재 버전: 초안)
      </div>

      <h2>제1조 목적</h2>
      <p>
        본 약관은 캠핑고고(이하 &quot;사이트&quot;)가 제공하는 야영지 정보 서비스의
        이용 조건과 절차에 관한 사항을 규정합니다.
      </p>

      <h2>제2조 서비스 내용</h2>
      <p>
        사이트는 공공·저렴·차박 야영지 정보, 가이드 콘텐츠, 매칭 도구를
        제공합니다. 실시간 예약, 후기 커뮤니티, 예약 대행은 제공하지 않습니다.
      </p>

      <h2>제3조 정보의 정확성</h2>
      <p>
        사이트의 모든 정보는 공공데이터 및 공개 자료를 기반으로 하며, 변경될
        수 있습니다. 방문·차박 전 반드시 관할 지자체 또는 관리 기관에 최종
        확인 바랍니다. 사이트는 정보의 정확성에 대해 법적 책임을 지지 않습니다.
      </p>

      <h2>제4조 차박 합법성 정보</h2>
      <p>
        차박 가능 여부는 4단계 신뢰도로 표기하며 사실 진술 형식으로만
        제공합니다. 이는 법적 판단이 아니며, 최종 판단은 이용자 본인의
        책임입니다.
      </p>

      <h2>제5조 지식재산권</h2>
      <p>
        사이트 내 콘텐츠(텍스트, 디자인, 코드)의 저작권은 캠핑고고에 있습니다.
        공공데이터를 가공한 정보는 원본 데이터의 라이선스 조건을 따릅니다.
        (<Link href="/data-license">데이터 라이선스</Link> 참고)
      </p>

      <h2>제6조 면책</h2>
      <p>
        사이트는 다음 사항에 대해 책임지지 않습니다: 야영지 현장 상황 변경,
        차박 단속·과태료, 시설 이용 중 발생한 사고, 제3자 사이트 링크를 통한
        손해.
      </p>

      <h2>제7조 약관 변경</h2>
      <p>
        약관 변경 시 이 페이지에 변경 내용과 시행일을 7일 전 공지합니다.
      </p>

      <h2>제8조 준거법</h2>
      <p>본 약관은 대한민국 법령에 따릅니다.</p>
    </StaticPageLayout>
  );
}
