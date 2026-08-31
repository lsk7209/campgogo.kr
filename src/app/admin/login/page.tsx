import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자 로그인",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", fontFamily: "sans-serif" }}>
      <form
        action="/api/admin/session"
        method="post"
        style={{ width: "min(100%, 360px)", display: "grid", gap: "16px" }}
      >
        <h1 style={{ margin: 0, fontSize: "24px" }}>관리자 로그인</h1>
        <label style={{ display: "grid", gap: "8px" }}>
          <span>관리자 토큰</span>
          <input
            type="password"
            name="token"
            required
            autoComplete="current-password"
            style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px" }}
          />
        </label>
        <button type="submit" style={{ padding: "10px 14px", borderRadius: "8px", cursor: "pointer" }}>
          로그인
        </button>
      </form>
    </main>
  );
}
