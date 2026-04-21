/**
 * JWT payload shape — platform-agnostic.
 *
 * Lives in `shared/` (not `server/`) so a future Expo client can import the
 * type for decoding stored tokens (e.g. to read the role claim) without
 * pulling in Node-only dependencies like `jsonwebtoken`.
 */
export interface UserJwtPayload {
  /** User id (JWT `sub` claim). */
  sub: string;
  /** `"ADMIN" | "USER"` — stored in the token so middleware can skip a DB lookup. */
  role: string;
  /** Set only during an admin impersonation session — holds the real admin's user id. */
  imp?: string;
  /** Issued-at (seconds since epoch). */
  iat: number;
  /** Expiry (seconds since epoch). */
  exp: number;
}
