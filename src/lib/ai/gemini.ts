// Gemini Flash 클라이언트 (REST API, 의존성 없음)

const GEMINI_MODEL = "gemini-2.0-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta";

export interface EnrichmentResult {
  title: string;
  metaDescription: string;
  commentary: string;
  uniquePoints: string[];
  faqs: { q: string; a: string }[];
  internalLinks: { href: string; label: string }[];
}

function buildInternalLinks(sido: string, gungu: string | null): { href: string; label: string }[] {
  const links = [
    { href: `/지역/${encodeURIComponent(sido)}`, label: `${sido} 야영지 목록` },
    { href: `/match`, label: "내 조건으로 야영지 찾기" },
    { href: `/blog`, label: "차박·캠핑 가이드" },
  ];
  if (gungu) {
    links.unshift({ href: `/지역/${encodeURIComponent(sido)}/${encodeURIComponent(gungu)}`, label: `${sido} ${gungu} 야영지` });
  }
  return links.slice(0, 3);
}

function buildPrompt(c: {
  name: string; sido: string; gungu: string | null; address: string | null;
  operator: string | null; isPublic: boolean | null; isFree: boolean | null;
  isCheap: boolean | null; isChabak: boolean | null; type: string | null;
  facilities: Record<string, boolean> | null; price1Night: number | null;
}): string {
  const facList = c.facilities
    ? Object.entries(c.facilities).filter(([, v]) => v).map(([k]) => k).join(", ") || "정보 없음"
    : "정보 없음";
  const priceStr = c.isFree ? "무료" : c.price1Night != null ? `${c.price1Night.toLocaleString("ko-KR")}원/박` : "가격 미상";
  const tags = [
    c.isPublic ? "공공야영장" : "민간야영장",
    c.isFree ? "무료" : c.isCheap ? "저렴" : "유료",
    c.isChabak ? "차박가능" : "",
  ].filter(Boolean).join(", ");

  return `당신은 한국 캠핑·차박 전문 에디터입니다. 아래 야영지 정보를 바탕으로 SEO 콘텐츠를 작성하세요.

야영지명: ${c.name}
위치: ${c.sido} ${c.gungu ?? ""} ${c.address ?? ""}
운영: ${c.operator ?? "정보없음"} (${tags})
시설: ${facList}
이용료: ${priceStr}
유형: ${c.type ?? "야영장"}

규칙:
- 과장·거짓 금지, 공공데이터 기반 사실만 기술
- 차박 허용 여부를 단정적으로 표현하지 말 것
- 의료·법률·투자 조언 절대 금지
- 한국어로 작성

아래 JSON만 반환 (마크다운 코드블록 없이):
{
  "title": "SEO 제목 (야영지명+지역+특징, 30-55자)",
  "metaDescription": "검색 결과 설명문 (80-150자, 클릭 유도)",
  "commentary": "편집팀 코멘트 (150-250자, 이 야영지의 특징과 추천 포인트)",
  "uniquePoints": ["특징1 (30자 이내)", "특징2", "특징3", "특징4"],
  "faqs": [
    {"q": "질문1 (실용적)", "a": "답변1 (간결, 사실 기반)"},
    {"q": "질문2", "a": "답변2"},
    {"q": "질문3", "a": "답변3"}
  ]
}`;
}

export async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `${BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message: string };
  };

  if (data.error) throw new Error(`Gemini error: ${data.error.message}`);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

export async function enrichCampsite(
  campsite: {
    id: string; name: string; sido: string; gungu: string | null;
    address: string | null; operator: string | null;
    isPublic: boolean | null; isFree: boolean | null;
    isCheap: boolean | null; isChabak: boolean | null;
    type: string | null; facilities: Record<string, boolean> | null;
    price1Night: number | null;
  },
  apiKey: string
): Promise<EnrichmentResult> {
  const prompt = buildPrompt(campsite);
  const raw = await callGemini(prompt, apiKey);

  let parsed: Partial<EnrichmentResult & { faqs: { q: string; a: string }[] }>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // JSON 파싱 실패 시 정규식으로 추출
    const jsonMatch = raw.match(/\{[\s\S]+\}/);
    if (!jsonMatch) throw new Error("Gemini 응답에서 JSON 추출 실패");
    parsed = JSON.parse(jsonMatch[0]);
  }

  return {
    title: parsed.title ?? `${campsite.name} — ${campsite.sido} 야영지`,
    metaDescription: parsed.metaDescription ?? `${campsite.sido} ${campsite.gungu ?? ""} ${campsite.name} 야영지 정보.`,
    commentary: parsed.commentary ?? "",
    uniquePoints: Array.isArray(parsed.uniquePoints) ? parsed.uniquePoints.slice(0, 5) : [],
    faqs: Array.isArray(parsed.faqs) ? parsed.faqs.slice(0, 5) : [],
    internalLinks: buildInternalLinks(campsite.sido, campsite.gungu),
  };
}

// ── 8게이트 품질검사 ──────────────────────────────────────
export interface QualityGate {
  name: string;
  passed: boolean;
  reason?: string;
}

const BLOCKED_PHRASES = ["전문의 상담", "법적 책임", "의학적 조언", "투자 권고", "100% 안전"];

export function runQualityGates(result: EnrichmentResult, isChabak: boolean | null): {
  gates: QualityGate[];
  score: number;
  passed: boolean;
} {
  const gates: QualityGate[] = [
    {
      name: "G1:uniquePoints",
      passed: result.uniquePoints.length >= 3,
      reason: `${result.uniquePoints.length}개 (최소 3개 필요)`,
    },
    {
      name: "G2:faqs",
      passed: result.faqs.length >= 2,
      reason: `${result.faqs.length}개 (최소 2개 필요)`,
    },
    {
      name: "G3:metaDescription",
      passed: result.metaDescription.length >= 60,
      reason: `${result.metaDescription.length}자 (최소 60자 필요)`,
    },
    {
      name: "G4:commentary",
      passed: result.commentary.length >= 100,
      reason: `${result.commentary.length}자 (최소 100자 필요)`,
    },
    {
      name: "G5:title",
      passed: result.title.length >= 15 && result.title.length <= 70,
      reason: `${result.title.length}자 (15-70자 필요)`,
    },
    {
      name: "G6:internalLinks",
      passed: result.internalLinks.length >= 2,
      reason: `${result.internalLinks.length}개 내부링크`,
    },
    {
      name: "G7:blockedPhrases",
      passed: !BLOCKED_PHRASES.some((p) =>
        result.commentary.includes(p) || result.faqs.some((f) => f.a.includes(p))
      ),
      reason: "금지 표현 검사",
    },
    {
      name: "G8:chabakCompliance",
      passed: !isChabak || !result.commentary.includes("차박 가능합니다"),
      reason: "차박 단정 표현 금지",
    },
  ];

  const passedCount = gates.filter((g) => g.passed).length;
  const score = Math.round((passedCount / gates.length) * 100);

  return { gates, score, passed: passedCount >= 6 };
}
