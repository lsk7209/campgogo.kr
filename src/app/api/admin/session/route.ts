import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSession,
  isValidAdminToken,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function redirect(request: Request, pathname: string): NextResponse {
  return new NextResponse(null, {
    status: 303,
    headers: {
      "Cache-Control": "no-store",
      Location: new URL(pathname, request.url).toString(),
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const action = form.get("action");

  if (action === "logout") {
    const response = redirect(request, "/admin/login");
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: "",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/admin",
      maxAge: 0,
    });
    return response;
  }

  const candidate = form.get("token");
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (
    typeof candidate !== "string"
    || !adminToken
    || !isValidAdminToken(candidate, adminToken)
  ) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const response = redirect(request, "/admin/review");
  const sessionVersion = process.env.ADMIN_SESSION_VERSION ?? "v1";
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSession(adminToken, sessionVersion),
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/admin",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    priority: "high",
  });
  return response;
}
