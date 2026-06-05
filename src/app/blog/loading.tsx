export default function BlogLoading() {
  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ height: "32px", width: "200px", background: "var(--color-gray-200)", borderRadius: "6px", marginBottom: "32px", animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--color-gray-200)" }}>
            <div style={{ height: "160px", background: "var(--color-gray-200)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ height: "16px", background: "var(--color-gray-200)", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} />
              <div style={{ height: "14px", width: "60%", background: "var(--color-gray-200)", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  );
}
