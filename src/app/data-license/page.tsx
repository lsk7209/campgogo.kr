import type { Metadata } from "next";
import Link from "next/link";
import { StaticPageLayout } from "@/components/static-page-layout";

export const metadata: Metadata = {
  title: "데이터 라이선스",
  description: "캠핑고고가 사용하는 공공데이터의 출처와 라이선스 정보.",
};

export default function DataLicensePage() {
  return (
    <StaticPageLayout
      title="데이터 라이선스"
      subtitle="본 사이트에서 사용하는 공공데이터의 출처와 이용 조건."
      lastUpdated="2026년 6월"
    >
      <div className="notice-box">
        본 사이트는 공공누리 라이선스 데이터를 활용합니다. 각 데이터셋의
        라이선스 유형에 따라 출처를 표기하고 이용 조건을 준수합니다.
      </div>

      <h2>사용 데이터 목록</h2>
      <table>
        <thead>
          <tr>
            <th>데이터셋</th>
            <th>제공기관</th>
            <th>라이선스</th>
            <th>최종 확인일</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>고캠핑 야영장 정보</td>
            <td>한국관광공사</td>
            <td>공공누리 제1유형</td>
            <td>2026.06</td>
          </tr>
          <tr>
            <td>전국야영장 표준데이터</td>
            <td>data.go.kr</td>
            <td>공공누리 제1유형</td>
            <td>2026.06</td>
          </tr>
          <tr>
            <td>관광지 주변정보 (TourAPI)</td>
            <td>한국관광공사</td>
            <td>공공누리 제1유형</td>
            <td>2026.06</td>
          </tr>
          <tr>
            <td>기상청 단기예보</td>
            <td>기상청</td>
            <td>공공누리 제1유형</td>
            <td>2026.06</td>
          </tr>
          <tr>
            <td>공휴일 정보</td>
            <td>행정안전부</td>
            <td>공공누리 제1유형</td>
            <td>2026.06</td>
          </tr>
        </tbody>
      </table>

      <h2>공공누리 제1유형 이용 조건</h2>
      <ul>
        <li>출처 표시 의무</li>
        <li>상업적 이용 가능</li>
        <li>변경·가공 가능</li>
        <li>2차 저작물 동일 라이선스 적용 불필요</li>
      </ul>

      <h2>출처 표기 방식</h2>
      <p>
        각 야영지 페이지 하단에 해당 데이터의 출처와 라이선스 유형을 표기합니다.
        예: &quot;출처: 한국관광공사 고캠핑 (공공누리 제1유형)&quot;
      </p>

      <h2>데이터 오류 신고</h2>
      <p>
        공공데이터와 실제 현장 정보가 다를 경우{" "}
        <Link href="/contact">정보 제보</Link>를 통해 알려주세요. 확인 후 수정합니다.
      </p>
    </StaticPageLayout>
  );
}
