import { type NextRequest, NextResponse } from "next/server";
import { createUser } from "~/../prisma/queries/auth/signUp";
import { signUpSchema } from "~/validation/auth/auth";
import { createAuthToken, setAuthCookie } from "~/lib/server/auth";
import { TRPCError } from "@trpc/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { username, email, password } = parsed.data;
    const user = await createUser(username, email, password);

    const token = createAuthToken(user.id);
    const response = NextResponse.json({ success: true });
    setAuthCookie(response.cookies, token);
    return response;
  } catch (err) {
    if (err instanceof TRPCError && err.code === "CONFLICT") {
      return NextResponse.json({ error: "Username or email already taken" }, { status: 409 });
    }
    console.error("[auth/signup]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
