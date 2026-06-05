interface AuthorLabelProps {
  authorLabel?: string | null;
  persona?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  wordCount?: number | null;
}

const PERSONA_META: Record<string, { name: string; role: string; avatar: string }> = {
  saver:    { name: "박절약",  role: "가성비·무료 야영지 전문",  avatar: "🏕️" },
  traveler: { name: "정여행",  role: "전국 야영지 답사·시즌 추천", avatar: "🗺️" },
  analyst:  { name: "김데이터", role: "공공데이터·법령 분석",      avatar: "📊" },
};

export function AuthorLabel({ authorLabel, persona, datePublished, dateModified, wordCount }: AuthorLabelProps) {
  const pm = persona ? PERSONA_META[persona] : null;
  const displayName = authorLabel ?? (pm ? pm.name : "캠핑고고 편집팀");
  const role = pm?.role;
  const avatar = pm?.avatar ?? "✍️";
  const readMin = wordCount ? Math.max(1, Math.ceil(wordCount / 200)) : null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--color-gray-500)" }}>
      {/* Avatar + Name */}
      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <span
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "28px", height: "28px", borderRadius: "50%",
            background: "var(--color-forest-100)", fontSize: "15px",
          }}
          aria-hidden="true"
        >
          {avatar}
        </span>
        <span>
          <span style={{ fontWeight: 700, color: "var(--color-gray-700)" }}>{displayName}</span>
          {role && (
            <span style={{ marginLeft: "5px", fontSize: "11.5px", color: "var(--color-gray-400)" }}>
              · {role}
            </span>
          )}
        </span>
      </span>

      {/* Date */}
      {datePublished && (
        <>
          <span aria-hidden="true" style={{ color: "var(--color-gray-300)" }}>|</span>
          <time dateTime={datePublished} style={{ fontSize: "12.5px" }}>
            {datePublished.replace(/-/g, ".")}
          </time>
        </>
      )}
      {dateModified && dateModified !== datePublished && (
        <time dateTime={dateModified} style={{ fontSize: "11.5px", color: "var(--color-gray-400)" }}>
          (수정: {dateModified.replace(/-/g, ".")})
        </time>
      )}

      {/* Reading time */}
      {readMin && (
        <>
          <span aria-hidden="true" style={{ color: "var(--color-gray-300)" }}>|</span>
          <span style={{ fontSize: "12.5px" }}>약 {readMin}분 읽기</span>
        </>
      )}
    </div>
  );
}
