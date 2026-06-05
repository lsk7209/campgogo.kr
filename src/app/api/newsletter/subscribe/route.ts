import { db } from "@/lib/db/client";
import { newsletterSubscribers } from "@/lib/db/schema";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    if (!body || typeof body !== "object") {
      return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    const { email, marketingConsent } = body as Record<string, unknown>;

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email) || email.length > 320) {
      return Response.json({ error: "유효한 이메일 주소가 필요합니다." }, { status: 400 });
    }
    if (!marketingConsent) {
      return Response.json({ error: "광고성 정보 수신 동의가 필요합니다." }, { status: 400 });
    }

    await db
      .insert(newsletterSubscribers)
      .values({
        email: email.toLowerCase().trim(),
        marketingConsent: true,
        consentedAt: new Date(),
        status: "subscribed",
      })
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: {
          marketingConsent: true,
          consentedAt: new Date(),
          status: "subscribed",
        },
      });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
