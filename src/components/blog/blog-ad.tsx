"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window { adsbygoogle: unknown[] }
}

export function BlogAd({ slot = "auto" }: { slot?: string }) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {}
  }, []);

  return (
    <div style={{ margin: "36px 0", textAlign: "center", minHeight: "100px" }}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3050601904412736"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
