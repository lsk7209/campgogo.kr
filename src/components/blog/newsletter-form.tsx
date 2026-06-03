"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, marketingConsent: consent }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-white text-base">
        ✓ 구독 완료! 매주 목요일에 만나요.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2.5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 주소"
          aria-label="이메일 주소"
          required
          className="flex-1 text-[15px] px-4 py-3 rounded-lg border"
          style={{
            fontFamily: "var(--font-ko)",
            borderColor: "var(--color-forest-500)",
            background: "rgba(255,255,255,.96)",
            color: "var(--color-gray-800)",
          }}
        />
        <button
          type="submit"
          disabled={!consent || status === "loading"}
          className="font-semibold px-5 py-3 rounded-lg text-white transition-colors disabled:opacity-50"
          style={{ background: "var(--color-sunset-600)" }}
        >
          {status === "loading" ? "..." : "구독"}
        </button>
      </div>
      <label
        className="flex gap-2.5 items-start text-[12.5px] leading-[1.55] cursor-pointer"
        style={{ color: "var(--color-forest-100)" }}
      >
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 w-4 h-4 flex-none"
          style={{ accentColor: "var(--color-sunset-500)" }}
        />
        <span>
          (선택) 광고성 정보 수신에 동의합니다. 제휴·이벤트 소식이 포함될 수
          있으며, 동의 일자는 자동 기록됩니다.
        </span>
      </label>
      <span
        className="text-[11.5px]"
        style={{ color: "var(--color-forest-200)" }}
      >
        구독은 무료이며, 모든 메일 하단의 1-클릭으로 언제든 해지할 수 있습니다.
      </span>
      {status === "error" && (
        <span className="text-red-300 text-xs">오류가 발생했습니다. 다시 시도해주세요.</span>
      )}
    </form>
  );
}
