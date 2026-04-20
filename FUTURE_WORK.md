# Future Work & Technical Debt

Issues that are known, non-breaking, and not currently prioritised. Ranked from most to least urgent.

---

## 1. Image CDN / transforms 📈 Performance
**Issue:** Images are served directly from Supabase Storage URLs without any CDN transforms. Profile photos are uploaded at up to 400px, but served as-is regardless of display context.

**Recommended fix:** Use Supabase's image transformation API (`?width=80&height=80&resize=cover`) when rendering small avatars. This reduces bandwidth significantly.

---

## 2. Conversation naming + management 🛠 UX
**Issue:** Group conversations can be named at creation but cannot be renamed or have members removed after the fact.

---

## 3. Full-text search 📈 Performance
**Issue:** User search uses `ILIKE '%query%'` which is a full table scan on the `users` table. Fine at small scale, slow at thousands of users.

**Recommended fix:** Add a PostgreSQL `GIN` index with `pg_trgm` extension (`CREATE INDEX ON users USING GIN (username gin_trgm_ops)`), or migrate to a dedicated search service (Meilisearch, Algolia, or Supabase's `pg_trgm` integration).

---

## 4. Video hosting 📈 Performance
**Issue:** Videos are stored in Supabase Storage and served as raw file URLs. This works at small scale but has no adaptive bitrate streaming, thumbnails, or transcoding.

**Recommended fix:** Migrate video to Mux or Cloudflare Stream. These services transcode to multiple resolutions automatically and serve via HLS. Keep the same `videoUrl` field — just point it at the CDN URL instead.

---

## 5. Feed pagination with cursor on private filter 📈 Performance
**Issue:** The "For You" feed filters private-account posts with a complex `OR` clause on every page load. At scale this may be slow.

**Recommended fix:** Add a `isPublic` denormalised boolean to `Post` at write time, rather than joining through `User` at read time.

---

## 6. Environment secret rotation 🛠 Infrastructure
**Issue:** `JWT_SECRET_KEY` is a long-lived static secret. If it leaks, all sessions are compromised indefinitely.

**Recommended fix:** Store in a secrets manager (Vercel Environment Variables are fine). Rotate periodically — after rotation, all existing sessions expire immediately (which is the desired behaviour here).

---

## 7. Post edit history / audit trail 🛠 UX
**Issue:** Post edits overwrite content with no record of what changed.
