export async function fetchWithRetry(
  url: string | URL,
  options?: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 429) {
        const wait = Math.pow(2, attempt) * 1000;
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries - 1) await sleep(1000 * Math.pow(2, attempt));
    }
  }
  throw lastErr;
}

// data.go.kr 일부 API가 EUC-KR로 응답하는 경우 폴백 처리
export async function parseJsonWithEucKrFallback(res: Response): Promise<unknown> {
  const buf = await res.arrayBuffer();
  try {
    return JSON.parse(new TextDecoder("utf-8").decode(buf));
  } catch {
    return JSON.parse(new TextDecoder("euc-kr").decode(buf));
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[　]/g, " ")
    .replace(/[（）]/g, (c) => (c === "（" ? "(" : ")"));
}

// 시도명 표준화 (경기도 → 경기, 서울특별시 → 서울 등)
export function normalizeSido(sido: string): string {
  return sido
    .replace(/특별시|광역시|특별자치시|특별자치도/g, "")
    .replace(/도$/, "")
    .trim();
}
