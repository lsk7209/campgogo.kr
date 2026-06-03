import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/static-page-layout";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "캠핑고고의 개인정보 수집·이용·보관 방침.",
};

export default function PrivacyPage() {
  return (
    <StaticPageLayout
      title="개인정보처리방침"
      lastUpdated="2026년 6월 3일"
    >
      <div className="notice-box">
        본 방침은 「개인정보 보호법」에 따라 작성되었습니다. 법적 효력이 있는
        최종 문서는 변호사 검토 후 갱신 예정입니다. (현재 버전: 초안)
      </div>

      <h2>수집하는 개인정보</h2>
      <table>
        <thead>
          <tr>
            <th>항목</th>
            <th>수집 방법</th>
            <th>목적</th>
            <th>보유 기간</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>이메일 주소</td>
            <td>뉴스레터 구독 신청</td>
            <td>뉴스레터 발송</td>
            <td>구독 해지 후 즉시 삭제</td>
          </tr>
          <tr>
            <td>이메일, 제보 내용</td>
            <td>정보 제보 양식</td>
            <td>정보 확인·처리</td>
            <td>처리 완료 후 6개월</td>
          </tr>
          <tr>
            <td>방문 통계 (익명)</td>
            <td>Google Analytics 4 (동의 시)</td>
            <td>서비스 개선</td>
            <td>GA4 정책에 따름 (최대 14개월)</td>
          </tr>
        </tbody>
      </table>

      <h2>제3자 제공</h2>
      <p>
        수집된 개인정보는 법령에 의한 경우 외에 제3자에게 제공하지 않습니다.
        뉴스레터 발송을 위해 Resend(미국)에 이메일 주소를 위탁합니다.
      </p>

      <h2>정보주체의 권리</h2>
      <ul>
        <li>개인정보 열람·수정·삭제 요청</li>
        <li>처리 정지 요청</li>
        <li>뉴스레터 구독 해지 — 메일 하단 1-클릭 링크</li>
      </ul>
      <p>
        권리 행사는 <a href="/contact">정보 제보 페이지</a>를 통해 요청하세요.
        확인 후 5영업일 내 처리합니다.
      </p>

      <h2>개인정보 보호책임자</h2>
      <p>
        담당: 캠핑고고 편집팀
        <br />
        연락: <a href="/contact">정보 제보 페이지</a>
      </p>

      <h2>방침 변경</h2>
      <p>
        본 방침 변경 시 이 페이지에 변경 내용과 시행일을 사전 공지합니다.
      </p>
    </StaticPageLayout>
  );
}
