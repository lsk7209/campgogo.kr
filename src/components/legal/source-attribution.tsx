interface SourceAttributionProps {
  chabakSource?: string | null;
  chabakSourceDate?: string | null;
  isChabak?: boolean;
}

export function SourceAttribution({ chabakSource, chabakSourceDate, isChabak }: SourceAttributionProps) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--color-gray-50)", border: "1px solid var(--color-gray-200)", fontSize: "12.5px", lineHeight: "1.65", color: "var(--color-gray-500)" }}>
      <strong style={{ color: "var(--color-gray-700)" }}>데이터 출처</strong>:{" "}
      공공데이터포털 (data.go.kr) 공공누리 제1유형 · 한국관광공사 고캠핑 API.
      {isChabak && chabakSource && (
        <> 차박 정보 출처:{" "}
          <a href={chabakSource} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-forest-600)", textDecoration: "underline" }}>원문 보기</a>
          {chabakSourceDate && ` (${chabakSourceDate})`}.
        </>
      )}
      {" "}정보는 변경될 수 있으며, 방문 전 관할 지자체 또는 관리소에 최종 확인하세요.
    </div>
  );
}
