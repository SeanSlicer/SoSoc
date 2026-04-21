/** Default rate limits applied when no DB override row exists for an action. */
export const DEFAULT_RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  "post.create":   { maxRequests: 100, windowMs: 60 * 60 * 1000 },
  "post.comment":  { maxRequests: 200, windowMs: 60 * 60 * 1000 },
  "message.send":  { maxRequests: 100, windowMs: 60 * 60 * 1000 },
  "user.follow":   { maxRequests: 100, windowMs: 60 * 60 * 1000 },
  "post.like":     { maxRequests: 500, windowMs: 60 * 60 * 1000 },
  "auth.signup":   { maxRequests: 5,   windowMs: 60 * 60 * 1000 },
};
