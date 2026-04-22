import "server-only";
import { NextResponse } from "next/server";
import { env } from "~/env";

/**
 * CORS helper for endpoints called by the mobile app (and any other cross-origin
 * client). The web app hits the same Next.js server and does not need CORS.
 *
 * Origins are configured via the `CORS_ALLOWED_ORIGINS` env var — a
 * comma-separated allow-list. In development we also allow common Expo origins
 * (`http://localhost:8081` and `exp://*` for physical-device dev clients) so
 * `expo start` works without extra config.
 */

const DEV_ORIGIN_PATTERNS: RegExp[] = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/10(\.\d{1,3}){3}(:\d+)?$/,
  /^https?:\/\/192\.168(\.\d{1,3}){2}(:\d+)?$/,
  /^exp:\/\/.+$/,
];

function parseAllowlist(): string[] {
  const raw = env.CORS_ALLOWED_ORIGINS;
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function resolveAllowedOrigin(origin: string | null): string | null {
  if (!origin) return null;

  const allowlist = parseAllowlist();
  if (allowlist.includes(origin)) return origin;

  if (env.NODE_ENV === "development" && DEV_ORIGIN_PATTERNS.some((re) => re.test(origin))) {
    return origin;
  }

  return null;
}

/**
 * Merge CORS headers into a Headers instance. Safe to call on any response —
 * no-op when the origin isn't allow-listed.
 */
export function applyCorsHeaders(headers: Headers, origin: string | null) {
  const allowed = resolveAllowedOrigin(origin);
  if (!allowed) return;
  headers.set("Access-Control-Allow-Origin", allowed);
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
}

/** Standard 204 preflight response for OPTIONS requests. */
export function corsPreflight(origin: string | null): NextResponse {
  const res = new NextResponse(null, { status: 204 });
  applyCorsHeaders(res.headers, origin);
  return res;
}
