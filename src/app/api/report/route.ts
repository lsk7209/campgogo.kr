import { db } from "@/lib/db/client";
import { userReports } from "@/lib/db/schema";

export async function POST(req: Request) {
  try {
    const { reportType, content, reporterEmail, campsiteId } = await req.json() as {
      reportType: string;
      content: string;
      reporterEmail?: string;
      campsiteId?: string;
    };

    if (!content || typeof content !== "string" || content.trim().length < 5) {
      return Response.json({ error: "내용을 입력해 주세요." }, { status: 400 });
    }

    await db.insert(userReports).values({
      reportType: reportType ?? "other",
      content: content.trim(),
      reporterEmail: reporterEmail || null,
      campsiteId: campsiteId || null,
      status: "pending",
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Report API error:", err);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
