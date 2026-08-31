import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "campgogo_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length
    && timingSafeEqual(leftBuffer, rightBuffer);
}

type AdminSessionPayload = {
  expiresAt: number;
  nonce: string;
  version: string;
};

function sign(payload: string, adminToken: string): string {
  return createHmac("sha256", adminToken).update(payload).digest("base64url");
}

export function createAdminSession(
  adminToken: string,
  version: string,
  nowMs = Date.now(),
): string {
  const payload: AdminSessionPayload = {
    expiresAt: nowMs + ADMIN_SESSION_MAX_AGE_SECONDS * 1_000,
    nonce: randomBytes(16).toString("base64url"),
    version,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload, adminToken)}`;
}

function isValidAdminSession({
  adminToken,
  nowMs,
  session,
  version,
}: {
  adminToken: string;
  nowMs: number;
  session: string;
  version: string;
}): boolean {
  const [encodedPayload, signature, extra] = session.split(".");
  if (!encodedPayload || !signature || extra) return false;
  if (!safeEqual(signature, sign(encodedPayload, adminToken))) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<AdminSessionPayload>;
    return typeof payload.expiresAt === "number"
      && payload.expiresAt > nowMs
      && typeof payload.nonce === "string"
      && payload.nonce.length >= 16
      && payload.version === version;
  } catch {
    return false;
  }
}

export function isAdminAuthorized({
  adminToken,
  authorization,
  nowMs = Date.now(),
  session,
  version,
}: {
  adminToken: string | undefined;
  authorization: string | null;
  nowMs?: number;
  session: string | undefined;
  version: string;
}): boolean {
  if (!adminToken) return false;

  const bearerAuthorized = Boolean(
    authorization && safeEqual(authorization, `Bearer ${adminToken}`),
  );
  const sessionAuthorized = Boolean(
    session && isValidAdminSession({ adminToken, nowMs, session, version }),
  );
  return bearerAuthorized || sessionAuthorized;
}

export function isValidAdminToken(candidate: string, adminToken: string | undefined): boolean {
  return Boolean(adminToken && safeEqual(candidate, adminToken));
}
