#!/usr/bin/env tsx
/**
 * Turso DB를 R2에 백업
 * 사용: npx tsx scripts/backup-db.ts
 */
import { createClient } from "@libsql/client";

async function main() {
  const dbUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const r2Endpoint = process.env.R2_ENDPOINT;
  const r2Bucket = process.env.R2_BUCKET ?? "campground-backup";
  const r2Key = process.env.R2_ACCESS_KEY_ID;
  const r2Secret = process.env.R2_SECRET_ACCESS_KEY;

  if (!dbUrl || !authToken) {
    console.error("❌ Turso 자격증명 없음");
    process.exit(1);
  }
  if (!r2Endpoint || !r2Key || !r2Secret) {
    console.error("⚠️  R2 자격증명 없음 — 백업 스킵");
    return;
  }

  const client = createClient({ url: dbUrl, authToken });

  // 주요 테이블 행 수 확인
  const tables = [
    "campsites", "blog_posts", "pages", "newsletter_subscribers",
    "user_reports", "collect_checkpoints",
  ];

  console.log("📊 현재 DB 상태:");
  for (const t of tables) {
    const res = await client.execute(`SELECT COUNT(*) as cnt FROM ${t}`);
    console.log(`  ${t}: ${res.rows[0].cnt}행`);
  }

  // Turso dump (HTTP API)
  const dumpUrl = dbUrl.replace("libsql://", "https://") + "/dump";
  const res = await fetch(dumpUrl, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (!res.ok) {
    console.error(`❌ Dump 실패: ${res.status}`);
    process.exit(1);
  }

  const sqlDump = await res.text();
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `backup-${dateStr}.sql`;

  // R2 업로드 (fetch + S3 Presigned 방식으로 @aws-sdk 의존 제거)
  const uploadUrl = `${r2Endpoint}/${r2Bucket}/db/${filename}`;
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "text/plain",
      "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
      // 실제 운영 시 AWS Signature V4 서명 필요 — 아래는 구조 스켈레톤
      Authorization: `AWS4-HMAC-SHA256 Credential=${r2Key}/...`,
    },
    body: sqlDump,
  });

  if (!uploadRes.ok) {
    throw new Error(`R2 업로드 실패: ${uploadRes.status}`);
  }

  console.log(`✅ 백업 완료: ${r2Bucket}/db/${filename} (${(sqlDump.length / 1024).toFixed(1)}KB)`);
}

main().catch((e) => {
  console.error("❌ 백업 실패:", e);
  process.exit(1);
});
