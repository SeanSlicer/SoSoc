# Future Work & Technical Debt

Issues that are known, non-breaking, and not currently prioritised. Revisit when the app scales or security requirements tighten.

---

## Security

### JWT role revocation window
**Issue:** The user's role (`ADMIN` / `USER`) is embedded in the JWT at sign-in time. If a role changes (e.g. an admin is demoted, or an account is banned), the old token keeps working for up to 7 days — the token's full lifetime.

**Recommended fix:** Add a `passwordChangedAt` (or `tokenValidFrom`) column to `User`. In the tRPC `isAuthenticated` middleware, reject any token whose `iat` (issued-at) is earlier than that timestamp. Changing the password or revoking a user resets the field, immediately invalidating all existing tokens at zero infrastructure cost.

**Alternative (stricter):** Shorten the token to 1 hour and add a refresh-token flow. Higher security, higher complexity.

**Files to touch:** `prisma/schema.prisma`, `src/server/api/trpc.ts`, `src/lib/server/auth.ts`

---

### CSRF protection
**Issue:** Auth is via HTTP-only `SameSite=Lax` cookies, which provides basic CSRF protection for cross-site GET requests. However, cross-origin POSTs from the same site are not rejected at the token level.

**Recommended fix:** Set `SameSite=Strict` on auth cookies (breaks OAuth redirects but fine for password auth). Alternatively, validate an `Origin` header in the tRPC route handler.

---

### Rate limiting
**Issue:** No rate limiting on authentication endpoints or tRPC mutations. A bad actor could brute-force passwords or spam actions.

**Recommended fix:** Use `@upstash/ratelimit` (Redis-backed) on `/api/auth/login` and `/api/auth/signup`. Add per-user mutation rate limits for likes/follows if needed.

---

## Real-time Features

### ~~Polling → WebSockets / SSE for messages~~ ✅ Done
Replaced with Supabase Realtime (`postgres_changes` on `messages` table). NavSidebar owns the global subscription; MessageThread adds a per-conversation subscription for instant in-thread delivery. Requires `ALTER PUBLICATION supabase_realtime ADD TABLE messages;` in Supabase.

---

### ~~Notification polling → push~~ ✅ Done
Replaced with Supabase Realtime (`postgres_changes` on `notifications` table). Requires `ALTER PUBLICATION supabase_realtime ADD TABLE notifications;`.

---

### RLS on messages and notifications tables
**Issue:** Supabase Realtime broadcasts row data to all subscribers using the anon key. Without Row-Level Security (RLS), any connected client could receive message/notification payloads that belong to other users. The current implementation uses payloads only as cache invalidation triggers (data still fetches through auth-protected tRPC), but enabling RLS is the defense-in-depth fix.

**Recommended fix:**
```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only receive messages from conversations they belong to
CREATE POLICY "members can read messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_members.conversation_id = messages.conversation_id
        AND conversation_members.user_id = auth.uid()
    )
  );

-- Users can only receive their own notifications
CREATE POLICY "users can read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());
```
Note: This requires Supabase Auth integration (auth.uid()) or a custom JWT verification approach.

---

## Performance

### Full-text search
**Issue:** User search uses `ILIKE '%query%'` which is a full table scan on the `users` table. Fine at small scale, slow at thousands of users.

**Recommended fix:** Add a PostgreSQL `GIN` index with `pg_trgm` extension (`CREATE INDEX ON users USING GIN (username gin_trgm_ops)`), or migrate to a dedicated search service (Meilisearch, Algolia, or Supabase's `pg_trgm` integration).

---

### Image CDN / transforms
**Issue:** Images are served directly from Supabase Storage URLs without any CDN transforms. Profile photos are uploaded at up to 400px, but served as-is regardless of display context.

**Recommended fix:** Use Supabase's image transformation API (`?width=80&height=80&resize=cover`) when rendering small avatars. This reduces bandwidth significantly.

---

### Feed pagination with cursor on private filter
**Issue:** The "For You" feed filters private-account posts with a complex `OR` clause on every page load. At scale this may be slow.

**Recommended fix:** Add a `isPublic` denormalised boolean to `Post` at write time, rather than joining through `User` at read time.

---

## UX / Product

### Email verification
**Issue:** Users sign up with any email and it is never verified.

**Recommended fix:** Send a verification email on signup (use Resend or Supabase Auth emails). Block access to the app until verified, or at minimum show a warning banner.

---

### Password reset
**Issue:** There is no "forgot password" flow. Users who lose their password have no self-service recovery.

**Recommended fix:** Generate a short-lived signed token (JWT, 15 min expiry) emailed to the user. Token is verified by a `/api/auth/reset-password` route handler.

---

### Block / mute users
**Issue:** No way to block harassment or mute noisy accounts.

**Recommended fix:** Add `BlockedUser` model (blocker ↔ blocked). Filter blocked users from feed, search, and follow lists.

---

### Video hosting
**Issue:** Videos are stored in Supabase Storage and served as raw file URLs. This works at small scale but has no adaptive bitrate streaming, thumbnails, or transcoding.

**Recommended fix:** Migrate video to Mux or Cloudflare Stream. These services transcode to multiple resolutions automatically and serve via HLS. Keep the same `videoUrl` field — just point it at the CDN URL instead.

---

### Post edit history / audit trail
**Issue:** Post edits overwrite content with no record of what changed.

---

### Comment pagination
**Issue:** All comments on a post are fetched in a single query. A viral post could have thousands.

**Recommended fix:** Cursor-based pagination on `getComments`, same pattern as the feed.

---

### Conversation naming + management
**Issue:** Group conversations can be named at creation but cannot be renamed or have members removed after the fact.

---

## Infrastructure

### Connection pooling (PgBouncer)
**Issue:** `DATABASE_URL` uses a connection pooler already (Supabase's PgBouncer via `DIRECT_URL`), but Prisma's default pool size might be too high for the free tier.

**Recommended fix:** Set `connection_limit=1` on the `DATABASE_URL` when running on serverless (Vercel Edge / Lambda), since each function instance has its own pool.

---

### Environment secret rotation
**Issue:** `JWT_SECRET_KEY` is a long-lived static secret. If it leaks, all sessions are compromised indefinitely.

**Recommended fix:** Store in a secrets manager (Vercel Environment Variables are fine). Rotate periodically — after rotation, all existing sessions expire immediately (which is the desired behaviour here).
