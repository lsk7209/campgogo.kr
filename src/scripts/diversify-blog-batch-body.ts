import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const DRAFTS_DIR = join(process.cwd(), "blog-drafts");
const FIRST_ORDER = 286;
const LAST_ORDER = 385;

type Link = { text?: string; href?: string; name?: string; url?: string };
type Draft = {
  slug: string;
  bodyMarkdown: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  internalLinks: Link[];
  externalSources: Link[];
  pattern: string;
  cta: string;
  wordCount: number;
};

function paragraphParts(body: string): string[] {
  return body.split(/\n\s*\n/);
}

function readableParagraph(value: string): string {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function shouldDiversify(originalPart: string, readable: string): boolean {
  if (originalPart.includes("tip-box") || originalPart.includes("warning-box")) {
    return readable.includes("이처럼 실제 이동") || readable.includes("이 항목이 불확실");
  }
  if (originalPart.includes("notice-box")) {
    return readable.includes("이처럼 실제 이동") || readable.includes("이 항목이 불확실");
  }
  if (originalPart.includes("|---|")) return false;
  if (readable.startsWith("- 목적:") || readable.startsWith("- 반드시 필요한 조건")) return false;
  if (
    readable.includes("이 기준을 실제로 쓰려면") ||
    readable.includes("이 예시는 단순한 경험담") ||
    readable.includes("주의할 점은 불안을")
  ) {
    return true;
  }
  return [
    "- [",
    "내부링크는 문맥",
    "CTA도 모든 글에서",
    "현장에서는 계획표",
    "차별화 포인트는",
    "예약 화면에서 운영자에게",
    "마지막으로 기록을",
    "루트형 글은",
    "결정형 글은",
    "체크리스트형 글은",
    "위험형 글은",
    "비용형 글은",
    "접근성 글은",
    "접근성은",
    "계절형 주제는",
    "데이터형 글은",
    "이 기준을 실제로 쓰려면",
    "이 예시는 단순한 경험담",
    "주의할 점은 불안을",
  ].some((prefix) => readable.startsWith(prefix));
}

function wordCount(body: string): number {
  return body.split(/\s+/).filter(Boolean).length;
}

function style(index: number, a: string, b: string, c: string, d: string): string {
  switch (index % 36) {
    case 0: return `${a}. ${b}. ${c}. ${d}.`;
    case 1: return `${a}. ${b}. ${c}. ${d}`;
    case 2: return `${a}. 먼저 ${b}. 이어서 ${c}. 마지막으로 ${d}.`;
    case 3: return `${a}. ${b}. 다만 ${c}. ${d}.`;
    case 4: return `${a}. ${b}. 이때 ${c}. ${d}.`;
    case 5: return `${a}: ${b}. ${c}. ${d}.`;
    case 6: return `${a}. 한 번 더 줄이면 이렇다. ${b}. ${c}. ${d}.`;
    case 7: return `${a}, ${b}. ${c}. ${d}.`;
    case 8: return `${a}. 질문은 간단하다. ${b}. ${c}. ${d}.`;
    case 9: return `${a}. ${b}. 반대로 ${c}. 그러면 ${d}.`;
    case 10: return `${a} - ${b}. ${c}; ${d}.`;
    case 11: return `${a}. ${b}. ${c}. ${d}라고 보면 된다.`;
    case 12: return `${a}. 첫 확인은 따로 둔다. ${b}. 그다음 ${c}. 끝은 ${d}.`;
    case 13: return `${a}; ${b}; ${c}. ${d}.`;
    case 14: return `${a}. ${b}. ${c}. 그래서 ${d}.`;
    case 15: return `${a}. ${b}. ${c}. 그래서 ${d}.`;
    case 16: return `${a}. ${b}. 이 글에서는 기준을 좁힌다. ${c}. ${d}.`;
    case 17: return `${a}. ${b}. 질문으로 바꾸면 더 선명해진다. ${c}. ${d}.`;
    case 18: return `${a}. ${b}. ${c}; 단, ${d}.`;
    case 19: return `${a}: ${b}; ${c}; ${d}.`;
    case 20: return `${a}. ${b}. 대신 ${c}. 그 기준이 ${d}.`;
    case 21: return `${a}. ${b}. 현장에서는 ${c}. ${d}.`;
    case 22: return `${a}; ${b}. 확인 질문은 하나다. ${c}. ${d}.`;
    case 23: return `${a}. ${b}. ${c}. 체크가 끝나면 ${d}.`;
    case 24: return `${a}. ${b}. ${c}; ${d} 순서다.`;
    case 25: return `${a}. ${b}를 먼저 적고 ${c}. ${d}.`;
    case 26: return `${a}. ${b}. ${c}까지 보이면 ${d}.`;
    case 27: return `${a}; ${b}. ${c}. 결론은 ${d}.`;
    case 28: return `${a}. ${b}. ${c}; ${d}.`;
    case 29: return `${a}. ${b}. 비교 기준은 분명하다. ${c}. ${d}.`;
    case 30: return `${a}(${b}). ${c}. ${d}.`;
    case 31: return `${a}. ${b} - ${c}. ${d}.`;
    case 32: return `${a}. ${b}. ${c}: ${d}.`;
    case 33: return `${a}; ${b}. ${c}를 확인한 뒤 ${d}.`;
    case 34: return `${a}. ${b}. ${c}가 흔들리면 ${d}.`;
    default: return `${a}. ${b}; ${c}. 다음 행동은 ${d}.`;
  }
}

function linkText(link: Link): string {
  if (link.href) return `[${link.text ?? link.href}](${link.href})`;
  if (link.url) return `[${link.name ?? link.url}](${link.url})`;
  return link.text ?? link.name ?? "";
}

function replacement(draft: Draft, draftIndex: number, paragraphIndex: number, originalPart: string, original: string): string {
  const secondary = draft.secondaryKeywords[paragraphIndex % draft.secondaryKeywords.length] ?? draft.primaryKeyword;
  const other = draft.secondaryKeywords[(paragraphIndex + 1) % draft.secondaryKeywords.length] ?? secondary;
  const s = (offset: number, a: string, b: string, c: string, e: string) => style(draftIndex + paragraphIndex + offset, a, b, c, e);

  if (originalPart.includes("tip-box")) {
    const label = original.includes("확인 순서") ? "확인 순서" : "현장 메모";
    const body = s(13, `${draft.primaryKeyword} 메모는 감상보다 다음 예약에 쓸 조건이어야 한다`, `${secondary}는 이동, 시설, 날씨 중 어디에 영향을 주는지 적는다`, `${other}가 불편했다면 사진보다 시간과 거리를 남긴다`, `이 기록이 다음 선택의 필터가 된다`);
    return `<div class="tip-box"><strong>${label}</strong><br />${body}</div>`;
  }

  if (originalPart.includes("notice-box")) {
    const label = original.includes("확인 순서") ? "확인 순서" : "핵심 판단";
    const body = s(15, `${draft.primaryKeyword}의 빠른 판단은 한 문장으로 끝나지 않는다`, `${secondary}를 실제 이동, 시설, 날씨 중 어디에 둘지 먼저 정한다`, `${other}는 좋고 나쁨보다 확인 가능한 조건으로 바꾼다`, `그 기준을 예약 전 메모에 남기면 선택이 흔들리지 않는다`);
    return `<div class="notice-box"><strong>${label}</strong><br />${body}</div>`;
  }

  if (originalPart.includes("warning-box")) {
    const label = original.includes("멈춰야 할 신호") ? "멈춰야 할 신호" : "주의할 점";
    const body = s(14, `${draft.primaryKeyword}에서 경고 문구는 불안을 키우는 장식이 아니다`, `${secondary}가 불확실하면 예약 유지보다 대안 확보를 먼저 본다`, `${other} 문제가 현장에서 확인되면 체류 시간을 줄인다`, `안전 기준은 후기보다 당일 공지와 현장 통제를 우선한다`);
    return `<div class="warning-box"><strong>${label}</strong><br />${body}</div>`;
  }

  if (original.startsWith("- [")) {
    const first = draft.externalSources[0] ? linkText(draft.externalSources[0]) : "공식 출처";
    const second = draft.externalSources[1] ? linkText(draft.externalSources[1]) : "현장 공지";
    return s(1, `${draft.primaryKeyword} 근거는 링크 수보다 역할 구분이 중요하다`, `${first}에서는 시설과 운영 정보를 확인한다`, `${second}에서는 날씨, 안전, 예약 변수를 다시 본다`, `${secondary} 판단은 출발 전 최신 공지로 마무리한다`);
  }

  if (original.startsWith("내부링크는")) {
    const first = draft.internalLinks[0] ? linkText(draft.internalLinks[0]) : "/match";
    const second = draft.internalLinks[1] ? linkText(draft.internalLinks[1]) : "/blog";
    return s(2, `${draft.primaryKeyword} 글의 내부링크는 독자를 흩뜨리지 않아야 한다`, `${first}는 조건을 좁히는 길로 둔다`, `${second}는 ${secondary}와 이어지는 탐색 경로로 쓴다`, `두 링크의 역할이 달라야 클릭 이유가 분명해진다`);
  }

  if (original.includes("CTA도 모든 글에서")) {
    return s(3, `${draft.primaryKeyword}의 마지막 문장은 판매 문구보다 다음 행동이어야 한다`, `${secondary}를 확인한 독자는 바로 후보를 줄이고 싶어 한다`, `그래서 CTA는 넓은 권유보다 한 단계 좁은 행동을 제시한다`, draft.cta);
  }

  if (original.includes("현장에서는 계획표")) {
    return s(4, `${draft.primaryKeyword} 현장 운영은 계획표보다 우선순위가 중요하다`, `도착 직후에는 ${secondary}에 영향을 주는 자리와 이동선을 먼저 본다`, `식사와 휴식은 짐 정리가 끝난 뒤가 아니라 안전 동선이 잡힌 뒤 시작한다`, `철수 전에는 젖은 장비, 남은 음식, 다음 날 이동 시간을 따로 묶어 둔다`);
  }

  if (original.includes("차별화 포인트는")) {
    return s(5, `${draft.primaryKeyword} 글이 얇아 보이지 않으려면 출처와 후기를 섞어 쓰지 않는다`, `${secondary} 장점만 쓰기보다 포기해야 할 조건도 보여준다`, `독자가 바로 확인할 링크와 질문을 남긴다`, `${other}까지 연결되면 추천 목록이 아니라 판단 도구가 된다`);
  }

  if (original.includes("예약 화면에서 운영자에게")) {
    return s(6, `${draft.primaryKeyword} 예약 전 질문은 짧고 측정 가능해야 한다`, `${secondary}가 걱정된다면 가능 여부보다 거리, 시간, 제한 조건을 묻는다`, `운영자가 답하기 쉬운 질문일수록 현장 오해가 줄어든다`, `${other} 관련 답변은 예약 메모에 남겨 다음 선택에도 활용한다`);
  }

  if (original.includes("마지막으로 기록을")) {
    return s(7, `${draft.primaryKeyword} 후기는 만족도보다 재사용 가능한 기록이 더 값지다`, `${secondary}가 좋았는지 나빴는지보다 왜 그렇게 느꼈는지 적는다`, `소음, 진입로, 화장실, 그늘, 바람처럼 작은 항목이 다음 예약의 필터가 된다`, `${other} 조건은 동행자와 계절이 바뀌면 다시 조정한다`);
  }

  if (original.includes("이 글에서는 아래 출처")) {
    return s(8, `${draft.pattern} 유형의 ${draft.primaryKeyword} 글은 출처를 장식처럼 붙이면 힘이 약하다`, `${secondary} 판단에 직접 쓰는 정보만 남긴다`, `예약 가능 여부와 현장 공지는 출발 직전에 다시 확인한다`, `${other}가 바뀌면 결론도 함께 바뀔 수 있다`);
  }

  if (original.includes("이 기준을 실제로 쓰려면")) {
    return s(9, `${draft.primaryKeyword} 기준은 문장으로 읽고 끝내면 효과가 작다`, `${secondary}를 숫자, 거리, 시간, 금지 조건 중 하나로 바꿔야 한다`, `좋다거나 가깝다는 표현은 현장에서 서로 다르게 해석된다`, `${other}까지 질문으로 바꾸면 예약 전 판단이 빨라진다`);
  }

  if (original.includes("이 예시는 단순한 경험담")) {
    return s(10, `${draft.primaryKeyword}의 사례는 추억담이 아니라 선택 기준을 쪼개는 재료다`, `${secondary}에서 불편이 생기면 원인을 장소, 시간, 장비, 동행 조건으로 나눈다`, `그렇게 적어야 다음 예약에서 같은 실수를 줄인다`, `${other}는 제외 조건으로 남겨두면 더 유용하다`);
  }

  if (original.includes("주의할 점은 불안을")) {
    return s(11, `${draft.primaryKeyword}의 주의점은 겁을 주려는 문장이 아니다`, `${secondary}가 불확실할 때 대안을 남기기 위한 기준이다`, `날씨, 공지, 현장 통제는 후기보다 먼저 확인한다`, `${other} 문제가 보이면 일정 축소나 후보 변경을 받아들인다`);
  }

  return s(12, `${draft.primaryKeyword} 문단은 ${draft.searchIntent}에 직접 답해야 한다`, `${secondary}를 제목에만 두지 않고 판단 기준으로 연결한다`, `${other}는 독자가 현장에서 확인할 수 있는 질문으로 바꾼다`, `불필요한 일반론은 줄이고 다음 행동을 남긴다`);
}

async function main() {
  const files = (await readdir(DRAFTS_DIR))
    .filter((file) => /^\d{3}-.+\.json$/.test(file))
    .filter((file) => {
      const order = Number(file.slice(0, 3));
      return order >= FIRST_ORDER && order <= LAST_ORDER;
    })
    .sort();

  const drafts = await Promise.all(files.map(async (file) => JSON.parse(await readFile(join(DRAFTS_DIR, file), "utf-8")) as Draft));

  let changed = 0;
  for (const [draftIndex, draft] of drafts.entries()) {
    const parts = paragraphParts(draft.bodyMarkdown);
    const next = parts.map((part, paragraphIndex) => {
      const readable = readableParagraph(part);
      if (readable.length <= 80) return part;
      if (!shouldDiversify(part, readable)) return part;
      changed++;
      return replacement(draft, draftIndex, paragraphIndex, part, readable);
    });
    draft.bodyMarkdown = next.join("\n\n");
    draft.wordCount = wordCount(draft.bodyMarkdown);
    await writeFile(join(DRAFTS_DIR, files[draftIndex]), `${JSON.stringify(draft, null, 2)}\n`, "utf-8");
  }

  console.log(`diversified ${changed} repeated paragraphs across ${drafts.length} drafts`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
