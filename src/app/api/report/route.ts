import { db } from "@/lib/db/client";
import { userReports } from "@/lib/db/schema";

const VALID_REPORT_TYPES = ["wrong_info", "closed", "spam", "inappropriate", "other"] as const;
const MAX_CONTENT_LENGTH = 2000;

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    if (!body || typeof body !== "object") {
      return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    const { reportType, content, reporterEmail, campsiteId } = body as Record<string, unknown>;

    if (!content || typeof content !== "string" || content.trim().length < 5) {
      return Response.json({ error: "내용을 입력해 주세요." }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return Response.json({ error: `내용은 ${MAX_CONTENT_LENGTH}자 이하로 입력해 주세요.` }, { status: 400 });
    }

    const safeType =
      typeof reportType === "string" && (VALID_REPORT_TYPES as readonly string[]).includes(reportType)
        ? reportType
        : "other";

    const safeEmail =
      typeof reporterEmail === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail) && reporterEmail.length <= 254
        ? reporterEmail
        : null;

    const safeCampsiteId =
      typeof campsiteId === "string" && campsiteId.length <= 100
        ? campsiteId
        : null;

    await db.insert(userReports).values({
      reportType: safeType,
      content: content.trim(),
      reporterEmail: safeEmail,
      campsiteId: safeCampsiteId,
      status: "pending",
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Report API error:", err);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
