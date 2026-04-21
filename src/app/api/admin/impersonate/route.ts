import { type NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "~/lib/server/jwt";
import { getUserForImpersonation } from "@queries/admin/users";
import { createImpersonationToken, startImpersonation, AUTH_COOKIE } from "~/lib/server/auth";

export async function POST(req: NextRequest) {
  try {
    const adminToken = req.cookies.get(AUTH_COOKIE)?.value;
    if (!adminToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let adminPayload: ReturnType<typeof verifyAuth>;
    try {
      adminPayload = verifyAuth(adminToken);
    } catch {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    if (adminPayload.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Prevent impersonating while already impersonating
    if (adminPayload.imp) {
      return NextResponse.json({ error: "Exit current impersonation first" }, { status: 400 });
    }

    const { userId } = await req.json() as { userId?: string };
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const target = await getUserForImpersonation(userId);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.id === adminPayload.sub) {
      return NextResponse.json({ error: "Cannot impersonate yourself" }, { status: 400 });
    }

    const impersonationToken = createImpersonationToken(target.id, target.role, adminPayload.sub);
    const response = NextResponse.json({ success: true });
    startImpersonation(response.cookies, adminToken, impersonationToken);
    return response;
  } catch (err) {
    console.error("[admin/impersonate]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
