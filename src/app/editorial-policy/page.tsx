import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/static-page-layout";

export const metadata: Metadata = {
  title: "편집 정책",
  description: "캠핑고고의 콘텐츠 작성 원칙, 데이터 검증 방식, 오류 수정 정책.",
};

export default function EditorialPolicyPage() {
  return (
    <StaticPageLayout
      title="편집 정책"
      subtitle="캠핑고고가 정보를 다루는 방식."
      lastUpdated="2026년 6월"
    >
      <h2>기본 원칙</h2>
      <ul>
        <li>
          <strong>정직</strong> — 단정적 표현을 쓰지 않습니다. "공식 허가"가
          아닌 "○○군 공지에 따르면"처럼 출처와 함께 사실을 전달합니다.
        </li>
        <li>
          <strong>실용</strong> — 결정에 필요한 정보만. 과장·감성 자제.
        </li>
        <li>
          <strong>자연</strong> — 도시적 화려함보다 자연 톤. 캠핑장 광고 스타일 X.
        </li>
        <li>
          <strong>투명</strong> — 정보 출처와 작성일을 표기합니다.
        </li>
      </ul>

      <h2>데이터 검증</h2>
      <p>
        모든 야영지 정보는 한국관광공사 고캠핑 API, data.go.kr 표준데이터 등
        1차 공공데이터를 기준으로 합니다. 정보 변경 시 수동 업데이트하며,
        변경 날짜를 페이지에 표기합니다.
      </p>

      <h2>차박 합법성 표기 원칙</h2>
      <p>
        차박 가능 여부는 4단계 신뢰도로만 표기합니다. 단정적 "합법" 표현은
        사용하지 않습니다.
      </p>
      <table>
        <thead>
          <tr>
            <th>단계</th>
            <th>의미</th>
            <th>표기 방식</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>확인됨</td>
            <td>공식 공지·안내판에 허용 명시</td>
            <td>출처 URL + 날짜 포함</td>
          </tr>
          <tr>
            <td>추정됨</td>
            <td>공공 야영지 + 단속 기록 없음</td>
            <td>"추정됨 — 현장 확인 권고"</td>
          </tr>
          <tr>
            <td>제보됨</td>
            <td>사용자 제보 (검증됨)</td>
            <td>제보 날짜 포함</td>
          </tr>
          <tr>
            <td>단속 기록</td>
            <td>단속·금지 사례 확인됨</td>
            <td>경고 표시 + 출처</td>
          </tr>
        </tbody>
      </table>

      <h2>제휴·광고 분리</h2>
      <p>
        제휴 링크가 포함된 글은 상단에 제휴 표기 박스를 반드시 게재합니다.
        광고성 정보는 편집 콘텐츠와 명확히 구분합니다. 자세한 내용은{" "}
        <a href="/disclosure">광고·제휴 정책</a>을 참고하세요.
      </p>

      <h2>오류 수정</h2>
      <p>
        오류 발견 시 <a href="/contact">정보 제보</a>로 알려주세요.
        확인된 오류는 24시간 내 수정하고, 수정 내역을 해당 페이지 하단에
        기록합니다.
      </p>

      <h2>AI 활용 고지</h2>
      <p>
        일부 콘텐츠는 AI 보조를 통해 초안을 작성하고 편집팀이 검토·확인합니다.
        AI가 생성한 사실 주장은 반드시 공공데이터 또는 공식 출처로 검증합니다.
      </p>
    </StaticPageLayout>
  );
}
