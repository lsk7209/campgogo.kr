interface AffiliateDisclosureProps {
  partnerName?: string;
}

export function AffiliateDisclosure({ partnerName }: AffiliateDisclosureProps) {
  return (
    <div
      style={{
        background: "var(--color-forest-50)",
        border: "1px solid var(--color-forest-200)",
        borderRadius: "var(--radius-md)",
        padding: "12px 16px",
        fontSize: "13px",
        color: "var(--color-forest-700)",
        lineHeight: 1.6,
        marginBottom: "16px",
      }}
      role="note"
      aria-label="제휴 링크 안내"
    >
      <strong style={{ fontWeight: 600 }}>📌 제휴 링크 안내:</strong>{" "}
      이 글에는 제휴 링크가 포함되어 있습니다.
      {partnerName ? (
        <> 독자가 <strong>{partnerName}</strong>의 링크를 통해 구매하시면 추가 비용 없이 소정의 수수료가 지급될 수 있습니다.</>
      ) : (
        <> 해당 링크를 통한 구매 시 추가 비용 없이 소정의 수수료가 지급될 수 있습니다.</>
      )}{" "}
      이는 콘텐츠의 공정성에 영향을 주지 않습니다.
    </div>
  );
}
