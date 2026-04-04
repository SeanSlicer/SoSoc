import { type NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "~/../lib/client/auth";
import { exitImpersonation, AUTH_COOKIE, ADMIN_COOKIE } from "~/lib/server/auth";

export async function POST(req: NextRequest) {
  try {
    const currentToken = req.cookies.get(AUTH_COOKIE)?.value;
    const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;

    if (!currentToken || !adminToken) {
      return NextResponse.json({ error: "No active impersonation session" }, { status: 400 });
    }

    // Verify the stored admin token is still valid
    try {
      const adminPayload = verifyAuth(adminToken);
      if (adminPayload.role !== "ADMIN") {
        return NextResponse.json({ error: "Invalid admin session" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Admin session expired" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    exitImpersonation(response.cookies, adminToken);
    return response;
  } catch (err) {
    console.error("[admin/impersonate/exit]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
