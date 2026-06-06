import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const DRAFTS_DIR = join(process.cwd(), "blog-drafts");
const TRACKING_FILE = join(DRAFTS_DIR, "batch-286-385-tracking.json");
const FIRST_ORDER = 286;
const LAST_ORDER = 385;

type Draft = {
  slug: string;
  title: string;
  subtitle?: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  metaTitle?: string;
  bodyMarkdown: string;
  qualityScore: number;
};

type TrackingRow = {
  slug: string;
  title: string;
  subtitle: string;
  main_keyword: string;
  expanded_keywords: string;
  meta_title: string;
};

const titlePatterns: Array<(primary: string, secondary: string, other: string) => string> = [
  (p, s) => `${p} 실전 기준 — ${s}까지 함께 보는 선택법`,
  (p, s) => `${s} 고민이라면 ${p}에서 먼저 확인할 것`,
  (p, s) => `${p} 체크리스트: ${s} 실패를 줄이는 순서`,
  (p, s) => `${p} 준비법 — ${s} 관점으로 다시 고르기`,
  (p, s) => `${s}까지 따지는 ${p} 예약 전 질문`,
  (p, s) => `${p} 판단 가이드 — ${s} 놓치지 않는 방법`,
  (p, s) => `${p} 일정 설계, ${s}부터 확인해야 하는 이유`,
  (p, s) => `${s} 기준으로 보는 ${p} 핵심 포인트`,
  (p, s) => `${p} 실패 방지 노트 — ${s} 현장 변수 읽기`,
  (p, s) => `${p} 비교법: ${s}와 실제 동선 함께 보기`,
  (p, s) => `${s} 검색자를 위한 ${p} 압축 가이드`,
  (p, s) => `${p} 선택 순서 — ${s} 때문에 바뀌는 조건`,
  (p, s) => `${p} 현장 체크 — ${s}를 숫자와 동선으로 보기`,
  (p, s) => `${s}까지 챙기는 ${p} 안전한 준비`,
  (p, s) => `${p} 추천보다 중요한 ${s} 판단 기준`,
  (p, s, o) => `${p} 입문자 가이드 — ${s}와 ${o} 균형 잡기`,
  (p, s) => `${p} 예약 전 점검 — ${s}에서 갈리는 만족도`,
  (p, s) => `${s} 중심으로 다시 짜는 ${p} 계획`,
  (p, s) => `${p} 현명하게 고르기 — ${s} 실수 피하는 법`,
  (p, s, o) => `${p} 한눈에 보기 — ${s}, ${o}까지 확인`,
];

const subtitlePatterns: Array<(primary: string, secondary: string, other: string) => string> = [
  (p, s) => `${p}와 ${s}를 예약 전 기준, 현장 동선, 철수 판단으로 나눠 정리`,
  (p, s) => `${p} 검색자가 ${s}를 실제 일정에 적용할 때 필요한 판단 기준`,
  (p, s) => `${p} 준비 과정에서 ${s}를 놓치지 않도록 체크 순서와 근거를 연결`,
  (p, s) => `${p}의 핵심 조건을 ${s} 관점에서 비교하고 현장 질문으로 바꾸는 법`,
  (p, s) => `${p}와 ${s}를 SEO, GEO, AEO 답변 구조에 맞춰 읽기 쉽게 정리`,
  (p, s) => `${p} 계획 전 ${s}를 확인해 예약 실패와 현장 불편을 줄이는 기준`,
  (p, s, o) => `${p}, ${s}, ${o}를 한 글 안에서 자연스럽게 연결한 실전 가이드`,
  (p, s) => `${p} 일정에서 ${s}가 중요한 이유와 바로 써먹는 체크리스트`,
  (p, s) => `${p} 선택을 ${s} 중심으로 좁히고 공식 출처로 다시 확인하는 방법`,
  (p, s) => `${p} 초보자도 ${s}를 기준으로 무리 없는 야영지를 고르는 순서`,
  (p, s, o) => `${p}의 판단 포인트를 ${s}, ${o}까지 확장해 구체적으로 설명`,
  (p, s) => `${p}에서 ${s}를 제목 장식이 아니라 실제 선택 기준으로 쓰는 법`,
  (p, s) => `${p} 검색 의도에 맞춰 ${s}의 장점, 위험, 대안을 함께 정리`,
  (p, s) => `${p}와 ${s}를 독자가 바로 비교할 수 있게 표와 질문 흐름으로 구성`,
  (p, s) => `${p} 예약 전 ${s} 확인이 필요한 사람을 위한 실전형 부제`,
  (p, s, o) => `${p} 계획에 필요한 ${s}, ${o} 기준을 과장 없이 정리`,
];

function pickSecondary(draft: Draft, index: number): [string, string] {
  const keywords = draft.secondaryKeywords.filter(Boolean);
  const secondary = keywords[index % keywords.length] ?? draft.primaryKeyword;
  const other = keywords[(index + 1) % keywords.length] ?? secondary;
  return [secondary, other];
}

function replaceLeadSubtitle(body: string, subtitle: string): string {
  if (body.startsWith("> ")) {
    return body.replace(/^> .*(\r?\n\r?\n)/, `> ${subtitle}$1`);
  }
  return `> ${subtitle}\n\n${body}`;
}

async function main() {
  const files = (await readdir(DRAFTS_DIR))
    .filter((file) => /^\d{3}-.+\.json$/.test(file))
    .filter((file) => {
      const order = Number(file.slice(0, 3));
      return order >= FIRST_ORDER && order <= LAST_ORDER;
    })
    .sort();

  if (files.length !== 100) {
    throw new Error(`Expected 100 draft files, got ${files.length}`);
  }

  const updates = new Map<string, { title: string; subtitle: string }>();

  for (const [index, file] of files.entries()) {
    const draftPath = join(DRAFTS_DIR, file);
    const draft = JSON.parse(await readFile(draftPath, "utf-8")) as Draft;
    const [secondary, other] = pickSecondary(draft, index);
    const title = titlePatterns[index % titlePatterns.length](draft.primaryKeyword, secondary, other);
    const subtitle = subtitlePatterns[(index * 3) % subtitlePatterns.length](draft.primaryKeyword, secondary, other);

    draft.title = title;
    draft.subtitle = subtitle;
    draft.metaTitle = title;
    draft.bodyMarkdown = replaceLeadSubtitle(draft.bodyMarkdown, subtitle);

    await writeFile(draftPath, `${JSON.stringify(draft, null, 2)}\n`, "utf-8");
    updates.set(draft.slug, { title, subtitle });
  }

  const tracking = JSON.parse(await readFile(TRACKING_FILE, "utf-8")) as TrackingRow[];
  for (const row of tracking) {
    const update = updates.get(row.slug);
    if (!update) continue;
    row.title = update.title;
    row.subtitle = update.subtitle;
    row.meta_title = update.title;
  }
  await writeFile(TRACKING_FILE, `${JSON.stringify(tracking, null, 2)}\n`, "utf-8");

  console.log(`refined ${updates.size} titles/subtitles`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
