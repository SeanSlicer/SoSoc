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

---

## Mobile app follow-ups 📱

The Expo app under `mobile/` ships with full parity on the core social features (auth, feed, compose, profile, messages, notifications) but intentionally defers the items below. See `EXPO_PLAN.md` for the full scope rationale.

### Push notifications (APNs / FCM)
In-app realtime updates work (Supabase `postgres_changes`), but OS-level push notifications are a separate integration. Plan: `expo-notifications` + a `devices` table mapping user → push token, server hook in `createNotification()` to dispatch via Expo Push API.

### Email verification & password reset on mobile
Web handles these via route handlers that set cookies. Mobile needs either deep-link handoff (tap the email link → app opens → token exchanged for a session JWT) or dedicated mobile endpoints that return a JWT in the body like `/api/auth/mobile-login` does. The server plumbing (token generation, email templates) already exists.

### Admin UI on mobile
The admin console, user management, impersonation, and rate-limit management are web-only. No strong demand for these on mobile — keep deferred unless requested.

### Group conversation creation on mobile
The backend (`messages.createGroup`) works and mobile can *use* existing groups, but there's no UI to create one from the mobile app yet. Expect a multi-user picker screen plus a group-name field.

### Conversation management actions
Hide / unhide / delete work from the conversation list long-press, but per-thread settings (rename group, remove member, mute) are not wired. Thread view needs a header overflow menu.

### EAS / release builds / app store metadata
No `eas.json`, bundle identifiers are placeholders (`com.sosoc.app`), no adaptive icons, splash screens, or store listings. Plan: `eas build --platform all` once icons/screenshots exist and a developer account is provisioned.

### Deep linking
The app has `scheme: "sosoc"` declared but no URL handlers. Deep links from push notifications, shared post URLs, or magic-link auth all depend on this. Expo Router makes the routing side trivial — the work is route→screen mapping and a test matrix across cold-start / warm-start.

### Offline write queue
Reads are cached by React Query. Writes (likes, comments, messages, follows) fail silently on network loss. Plan: a simple retry queue keyed by mutation shape, persisted to SecureStore, flushed on reconnect.

### Pixel-perfect styling parity with web
Mobile screens are functional but not visually identical to the web app — spacing, typography, and shadow treatments differ. Low priority: users rarely see both at once, and RN's primitives don't map 1:1 to Tailwind. Better to iterate on mobile as its own design surface.

### CORS origin list for production-domain Expo builds
Dev allows `localhost` and private-LAN IPs automatically. Production builds hit the web API directly — fine when they share a domain, but TestFlight / internal-distribution builds from a custom dev-server URL may need an explicit entry in `CORS_ALLOWED_ORIGINS`.

### tRPC v11 type errors against React 19
After upgrading to Expo SDK 54 / React 19, `yarn typecheck` in `mobile/` reports false positives like *"Property 'useUtils' in your router collides with a built-in method"* against perfectly valid `trpc.someRouter.someProc.useQuery()` calls. The runtime is fine — Metro uses Babel, not tsc — and the app works end-to-end on device. Likely root cause: `@trpc/react-query` v11's type helpers don't yet narrow correctly against React 19's revised hook signatures. Watch for a tRPC patch release; if not soon, swap to a thinner client (vanilla `@trpc/client` + manual React Query keys) or pin React 18 types as a stopgap.

### Mobile tsconfig cross-package path resolution
`mobile/tsconfig.json` aliases `~/*` to `./mobile/*`, but the type-only import of `AppRouter` (`~api/root`) drags in `src/server/api/root.ts` which uses `~/*` to mean `./src/*`. `tsc` can't reconcile both. Runtime is unaffected (only the type-side import crosses). Options: split the AppRouter type into a tiny re-export file under `src/types/` that uses relative imports only, or generate a flat `.d.ts` of AppRouter via `tsc --emitDeclarationOnly` in `src/` and consume that.

### Light/dark mode toggle on mobile
Mobile follows the device's system color scheme via RN's `useColorScheme()`. There's no manual override — unlike the web app, which has Sun/Monitor/Moon toggle in the desktop sidebar. Add a "Theme" row in `mobile/app/settings/index.tsx` that lets users force light/dark/system independent of the device setting (persist via `expo-secure-store` like the auth token).

### Group conversation creation on mobile
The backend (`messages.createGroup`) works and mobile can *use* existing groups, but there's no UI to create one from the mobile app yet. Expect a multi-user picker screen plus a group-name field.

### Conversation management actions
Hide / unhide / delete work from the conversation list long-press, but per-thread settings (rename group, remove member, mute) are not wired. Thread view needs a header overflow menu.

### Post share sheet on mobile
`PostCard` accepts an optional `onShare` prop but no consumer wires it. Web has `SharePostModal` that picks a friend and forwards via `messages.send`. Need a mobile equivalent (probably reusing `messages/new.tsx` user search but routing to a "share" mode).

### Image lightbox / video posts on mobile
Tapping an image in `PostImageCarousel` does nothing. Web opens a full-screen lightbox with arrow-key navigation. RN equivalent: `expo-image` + a Modal with `react-native-gesture-handler` for swipe + pinch. Video posts (`type: "VIDEO"`) aren't rendered at all — needs `expo-av` integration.

### "Forgot password" / "Resend verification" links on mobile
Login screen is sign-in only — no flow to recover a forgotten password, and signup doesn't surface the "we sent you a verification email" follow-up. Plumbing depends on the mobile email-flow item above.

### Skeleton loaders / better loading states
Most lists fall back to a centered `ActivityIndicator`. Native-feeling apps use grey skeleton placeholders that match the final layout. Plan: a tiny `Skeleton` component with `react-native-reanimated` shimmer, applied to feed cards, conversation rows, profile headers.

### Haptic feedback
Tab switches, like button, send button, and pull-to-refresh would all benefit from `expo-haptics` impact triggers (light impact on tab change, medium on like, success on send). Doesn't exist anywhere yet.

### Avatar upload cropping / aspect quality
`expo-image-picker` with `allowsEditing: true` is used for avatar (1:1) and banner (3:1). Quality is 0.85, no client-side resize. Server accepts arbitrary sizes. Could add `expo-image-manipulator` to downscale very large avatars before upload (web does a 400px resize before POSTing).
