import { type NextRequest, NextResponse } from "next/server";
import { getUserByUsernameOrEmailAndPassword } from "~/../prisma/queries/auth/getUser";
import { createAuthToken, setAuthCookie } from "~/lib/server/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { usernameOrEmail?: string; password?: string };
    const { usernameOrEmail, password } = body;

    if (!usernameOrEmail || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const user = await getUserByUsernameOrEmailAndPassword(usernameOrEmail, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const token = createAuthToken(user.id);
    const response = NextResponse.json({ success: true });
    setAuthCookie(response.cookies, token);
    return response;
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
