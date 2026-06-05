import { z } from "zod";

const envSchema = z.object({
  // DB
  TURSO_DATABASE_URL: z.string().url(),
  TURSO_AUTH_TOKEN: z.string().min(1),

  // 공공 API
  GOCAMPING_API_KEY: z.string().min(1).optional(),
  DATAGOKR_API_KEY: z.string().min(1).optional(),
  TOURAPI_KEY: z.string().min(1).optional(),
  KMA_API_KEY: z.string().min(1).optional(),

  // 모니터링
  SENTRY_DSN: z.string().url().optional(),

  // 이메일
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM: z.string().email().optional(),
  NEWSLETTER_LIST_ID: z.string().optional(),

  // 스토리지 (R2 백업)
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().default("campground-backup"),
  R2_ENDPOINT: z.string().optional(),

  // 사이트
  NEXT_PUBLIC_GA4_ID: z.string().optional(),
  SITE_URL: z.string().url().default("http://localhost:3000"),
  SITE_NAME: z.string().default("캠핑고고"),

  // 관리
  ADMIN_API_TOKEN: z.string().optional(),
  EDITORIAL_REVIEW_EMAIL: z.string().email().optional(),
  GITHUB_ACTIONS_SLACK_WEBHOOK: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ 환경변수 검증 실패:", result.error.flatten().fieldErrors);
    if (process.env.NODE_ENV === "production") {
      throw new Error("필수 환경변수 누락");
    }
  }
  return result.data ?? ({} as Env);
}

export const env = parseEnv();
