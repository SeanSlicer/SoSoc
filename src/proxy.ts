import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = new Set(["/", "/login", "/signup"]);
const AUTH_ROUTES = new Set(["/login", "/signup"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("user-token")?.value;

  let isAuthenticated = false;
  let role: string | undefined;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
      const { payload } = await jwtVerify(token, secret);
      isAuthenticated = true;
      role = payload.role as string | undefined;
    } catch {
      isAuthenticated = false;
    }
  }

  // Redirect authenticated users away from login/signup
  if (AUTH_ROUTES.has(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  // Redirect unauthenticated users to login
  if (!PUBLIC_ROUTES.has(pathname) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin routes require ADMIN role — non-admins go back to feed
  if (pathname.startsWith("/admin") && isAuthenticated && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
