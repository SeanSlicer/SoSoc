import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = new Set(["/", "/login", "/signup"]);
const AUTH_ROUTES = new Set(["/login", "/signup"]);
const VERIFY_ROUTE = "/verify-email";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("user-token")?.value;

  let isAuthenticated = false;
  let role: string | undefined;
  let emailVerified: boolean | undefined;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
      const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
      isAuthenticated = true;
      role = payload.role as string | undefined;
      emailVerified = payload.emailVerified as boolean | undefined;
    } catch {
      isAuthenticated = false;
    }
  }

  // Redirect authenticated users away from login/signup
  if (AUTH_ROUTES.has(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  // Redirect unauthenticated users to login
  if (!PUBLIC_ROUTES.has(pathname) && pathname !== VERIFY_ROUTE && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated users with an unverified email (explicit false — old tokens lacking the
  // field are undefined, which is not === false, so they pass through for backwards compat)
  if (isAuthenticated && emailVerified === false && pathname !== VERIFY_ROUTE) {
    return NextResponse.redirect(new URL(VERIFY_ROUTE, request.url));
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
