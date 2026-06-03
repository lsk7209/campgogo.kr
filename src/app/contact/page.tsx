import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/static-page-layout";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "정보 제보",
  description: "야영지 정보 오류 수정, 새 야영지 제보, 문의사항을 보내주세요.",
};

export default function ContactPage() {
  return (
    <StaticPageLayout
      title="정보 제보"
      subtitle="야영지 정보가 틀렸나요? 새로운 곳을 알고 있나요? 알려주세요."
    >
      <h2>제보 유형</h2>
      <ul>
        <li>
          <strong>정보 오류</strong> — 가격·시설·위치·영업 여부 변경
        </li>
        <li>
          <strong>새 야영지</strong> — 공공·저렴·노지·차박 가능한 곳 추가 요청
        </li>
        <li>
          <strong>차박 합법성</strong> — 단속 사례, 허용 공지 등 신뢰도 업데이트
        </li>
        <li>
          <strong>기타 문의</strong> — 제휴, 광고, 저작권 등
        </li>
      </ul>

      <div className="notice-box">
        제보하신 정보는 편집팀이 검토 후 반영합니다. 검토 결과는 회신하지
        않을 수 있습니다. 법적 자문, 예약 도움 등은 제공하지 않습니다.
      </div>

      <h2>제보하기</h2>
      <ContactForm />
    </StaticPageLayout>
  );
}
