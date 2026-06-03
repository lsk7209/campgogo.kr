"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "cg-cookie-consent";

type Consent = "accepted" | "rejected" | null;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function loadGA4(gaId: string) {
  if (document.getElementById("ga4-script")) return;
  const script = document.createElement("script");
  script.id = "ga4-script";
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  script.async = true;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function (...args) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", gaId, { anonymize_ip: true });
}

export function CookieBanner() {
  const [consent, setConsent] = useState<Consent>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as Consent | null;
    if (stored === "accepted") {
      const gaId = process.env.NEXT_PUBLIC_GA4_ID;
      if (gaId) loadGA4(gaId);
    }
    if (!stored) {
      // 약간의 딜레이 후 표시 (레이아웃 시프트 방지)
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
    setConsent(stored);
  }, []);

  function handleAccept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setConsent("accepted");
    setVisible(false);
    const gaId = process.env.NEXT_PUBLIC_GA4_ID;
    if (gaId) loadGA4(gaId);
  }

  function handleReject() {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setConsent("rejected");
    setVisible(false);
  }

  if (!visible || consent !== null) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 sm:pb-6"
      role="dialog"
      aria-label="쿠키 동의"
      aria-live="polite"
    >
      <div
        className="max-w-[720px] mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl px-5 py-4 shadow-lg"
        style={{
          background: "var(--color-forest-800)",
          color: "var(--color-forest-100)",
          boxShadow: "0 8px 24px rgba(28,26,22,.25)",
        }}
      >
        <p className="flex-1 text-[13.5px] leading-[1.6]">
          본 사이트는 서비스 개선을 위해 방문 통계 쿠키(Google Analytics)를
          사용합니다.{" "}
          <a
            href="/cookies"
            className="underline"
            style={{ color: "var(--color-forest-200)" }}
          >
            쿠키 정책
          </a>
        </p>
        <div className="flex gap-2.5 flex-none">
          <button
            onClick={handleReject}
            className="text-[13px] font-semibold px-4 py-2 rounded-lg border transition-colors"
            style={{
              borderColor: "var(--color-forest-500)",
              color: "var(--color-forest-200)",
            }}
          >
            거부
          </button>
          <button
            onClick={handleAccept}
            className="text-[13px] font-semibold px-4 py-2 rounded-lg text-white transition-colors"
            style={{ background: "var(--color-sunset-600)" }}
          >
            수락
          </button>
        </div>
      </div>
    </div>
  );
}
