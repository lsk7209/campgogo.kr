"use client";

import { useState } from "react";

interface ReportButtonProps {
  campsiteId: string;
  campsiteName: string;
}

const REPORT_TYPES = [
  { value: "wrong_info", label: "정보가 틀렸어요" },
  { value: "closed", label: "폐업/운영 중단" },
  { value: "no_chabak", label: "차박 불가 (단속/금지)" },
  { value: "other", label: "기타" },
];

export function ReportButton({ campsiteId, campsiteName }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("wrong_info");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 5) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campsiteId, reportType: type, content, reporterEmail: email || undefined }),
      });
      if (res.ok) {
        setStatus("done");
        setTimeout(() => setOpen(false), 2500);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ fontSize: "13px", color: "var(--color-gray-400)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
      >
        정보 오류 신고
      </button>
    );
  }

  return (
    <div style={{ border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-lg)", padding: "20px", background: "var(--color-gray-50)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-gray-800)", margin: 0 }}>
          오류 신고: {campsiteName}
        </h3>
        <button onClick={() => setOpen(false)} aria-label="닫기" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "var(--color-gray-400)", lineHeight: 1 }}>×</button>
      </div>

      {status === "done" ? (
        <p style={{ fontSize: "14px", color: "var(--color-forest-700)", margin: 0 }}>신고가 접수되었습니다. 감사합니다.</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-gray-600)", display: "block", marginBottom: "6px" }}>신고 유형</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {REPORT_TYPES.map((rt) => (
                <label key={rt.value} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", cursor: "pointer" }}>
                  <input type="radio" name="reportType" value={rt.value} checked={type === rt.value} onChange={() => setType(rt.value)} />
                  {rt.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-gray-600)", display: "block", marginBottom: "6px" }}>내용 <span style={{ color: "#e02020" }}>*</span></label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="구체적인 오류 내용을 입력해 주세요."
              required
              rows={3}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-gray-300)", fontSize: "13.5px", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-gray-600)", display: "block", marginBottom: "6px" }}>이메일 (선택)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="답변이 필요하면 이메일을 남겨주세요."
              style={{ width: "100%", padding: "8px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-gray-300)", fontSize: "13.5px", boxSizing: "border-box" }}
            />
          </div>

          {status === "error" && (
            <p style={{ fontSize: "13px", color: "#e02020", margin: 0 }}>전송 실패. 잠시 후 다시 시도해 주세요.</p>
          )}

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setOpen(false)} style={{ padding: "7px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-gray-300)", background: "#fff", fontSize: "13px", cursor: "pointer" }}>취소</button>
            <button type="submit" disabled={status === "sending"} style={{ padding: "7px 14px", borderRadius: "var(--radius-md)", border: "none", background: "var(--color-forest-600)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: status === "sending" ? "not-allowed" : "pointer", opacity: status === "sending" ? 0.7 : 1 }}>
              {status === "sending" ? "전송 중..." : "신고하기"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
