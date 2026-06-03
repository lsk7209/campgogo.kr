"use client";

import { useState } from "react";

const REPORT_TYPES = [
  { value: "price", label: "정보 오류 (가격·시설·위치)" },
  { value: "new", label: "새 야영지 제보" },
  { value: "legality", label: "차박 합법성 업데이트" },
  { value: "other", label: "기타 문의" },
];

export function ContactForm() {
  const [type, setType] = useState("price");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: type, content, reporterEmail: email }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className="rounded-lg p-5 text-[15px]"
        style={{ background: "var(--color-forest-50)", color: "var(--color-forest-700)" }}
      >
        ✓ 제보해주셔서 감사합니다. 편집팀이 검토 후 반영합니다.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
      <div>
        <label
          className="block text-[13.5px] font-semibold mb-1.5"
          style={{ color: "var(--color-gray-700)" }}
        >
          제보 유형
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full text-[15px] px-4 py-2.5 rounded-lg border"
          style={{
            borderColor: "var(--color-gray-300)",
            color: "var(--color-gray-800)",
            background: "#fff",
            fontFamily: "var(--font-ko)",
          }}
        >
          {REPORT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="block text-[13.5px] font-semibold mb-1.5"
          style={{ color: "var(--color-gray-700)" }}
        >
          내용 <span style={{ color: "var(--color-sunset-600)" }}>*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={5}
          placeholder="야영지명, 변경된 정보, 출처(URL) 등을 가능한 구체적으로 적어주세요."
          className="w-full text-[15px] px-4 py-3 rounded-lg border resize-y"
          style={{
            borderColor: "var(--color-gray-300)",
            color: "var(--color-gray-800)",
            fontFamily: "var(--font-ko)",
            lineHeight: 1.7,
          }}
        />
      </div>

      <div>
        <label
          className="block text-[13.5px] font-semibold mb-1.5"
          style={{ color: "var(--color-gray-700)" }}
        >
          이메일 (선택 — 처리 결과 수신 시)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          className="w-full text-[15px] px-4 py-2.5 rounded-lg border"
          style={{
            borderColor: "var(--color-gray-300)",
            color: "var(--color-gray-800)",
            fontFamily: "var(--font-ko)",
          }}
        />
      </div>

      {status === "error" && (
        <p className="text-[13.5px]" style={{ color: "var(--color-sunset-700)" }}>
          오류가 발생했습니다. 다시 시도해 주세요.
        </p>
      )}

      <button
        type="submit"
        disabled={!content || status === "loading"}
        className="font-semibold text-[15px] px-6 py-3 rounded-lg text-white transition-colors disabled:opacity-50 self-start"
        style={{ background: "var(--color-forest-700)" }}
      >
        {status === "loading" ? "전송 중..." : "제보하기"}
      </button>
    </form>
  );
}
