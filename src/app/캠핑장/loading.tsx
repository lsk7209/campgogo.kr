export default function CampsiteLoading() {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ height: "28px", width: "240px", background: "var(--color-gray-200)", borderRadius: "6px", marginBottom: "32px", animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px", marginBottom: "48px" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: "140px", borderRadius: "12px", background: "var(--color-gray-200)", animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--color-gray-200)" }}>
            <div style={{ height: "150px", background: "var(--color-gray-200)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ height: "16px", background: "var(--color-gray-200)", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} />
              <div style={{ height: "14px", width: "55%", background: "var(--color-gray-200)", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  );
}
