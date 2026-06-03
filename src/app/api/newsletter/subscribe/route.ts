import { db } from "@/lib/db/client";
import { newsletterSubscribers } from "@/lib/db/schema";

export async function POST(req: Request) {
  try {
    const { email, marketingConsent } = await req.json() as {
      email: string;
      marketingConsent: boolean;
    };

    if (!email || typeof email !== "string") {
      return Response.json({ error: "유효한 이메일 주소가 필요합니다." }, { status: 400 });
    }
    if (!marketingConsent) {
      return Response.json({ error: "광고성 정보 수신 동의가 필요합니다." }, { status: 400 });
    }

    await db
      .insert(newsletterSubscribers)
      .values({
        email,
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
