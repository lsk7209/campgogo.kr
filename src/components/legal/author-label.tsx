interface AuthorLabelProps {
  authorLabel?: string | null;
  persona?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
}

export function AuthorLabel({ authorLabel, persona, datePublished, dateModified }: AuthorLabelProps) {
  const displayAuthor = authorLabel ?? (persona ? `편집팀 · ${persona}` : "캠핑고고 편집팀");
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--color-gray-500)" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: 600, color: "var(--color-gray-600)" }}>
        <span aria-hidden="true">✍</span>
        {displayAuthor}
      </span>
      {datePublished && (
        <>
          <span aria-hidden="true" style={{ color: "var(--color-gray-300)" }}>·</span>
          <time dateTime={datePublished}>게시: {datePublished}</time>
        </>
      )}
      {dateModified && dateModified !== datePublished && (
        <>
          <span aria-hidden="true" style={{ color: "var(--color-gray-300)" }}>·</span>
          <time dateTime={dateModified}>최종 수정: {dateModified}</time>
        </>
      )}
    </div>
  );
}
