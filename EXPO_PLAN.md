# Expo Companion App — Implementation Plan

**Branch:** `feat/expo-app`
**Goal:** Add a React Native (Expo) app to this repo that consumes the existing tRPC API and mirrors the web app's core features — auth, feed, profiles, follows, messaging, notifications, uploads, realtime.

## Non-goals (explicit scope exclusions)

These are deferred to `FUTURE_WORK.md` under "Mobile app follow-ups":

- Admin console, impersonation, and rate-limit management UI (web-only)
- Email verification / password-reset flows (web currently handles these via route handlers that set cookies)
- Push notifications (APNs/FCM) — realtime works in-app, but OS-level push is a separate integration
- Release builds / EAS configuration / app store metadata
- Deep linking from push
- Offline write queue — reads are cached by React Query; writes require connectivity

## Architecture

### Repo layout
Keep the web app at the repo root. Add the Expo app under `mobile/` with its own `package.json` and `tsconfig.json`. No Yarn workspaces (not required — mobile imports the `AppRouter` type only, via a relative path in its tsconfig `paths`).

```
sosoc/
├── src/                 ← Next.js web app (unchanged)
├── prisma/              ← schema + queries (shared as source of truth via API)
├── mobile/              ← NEW: Expo app
│   ├── app/             ← Expo Router screens
│   ├── components/
│   ├── lib/
│   ├── package.json
│   └── tsconfig.json
├── EXPO_PLAN.md         ← this file
└── ...
```

### Auth
The web uses HTTP-only cookies. Mobile cannot use cookies reliably across the tRPC `httpBatchStreamLink`, so:

1. **Server change:** `createTRPCContext` in `src/server/api/trpc.ts` reads the JWT from either the `user-token` cookie *or* the `Authorization: Bearer <jwt>` header. Cookies still take precedence for the web client.
2. **New endpoints:** `/api/auth/mobile-login` and `/api/auth/mobile-signup` return `{ token: string, user: {...} }` in the response body instead of setting a cookie. They reuse the same `createAuthToken` helper, so tokens are interchangeable.
3. **Mobile storage:** JWT saved in `expo-secure-store`. Sent as `Authorization: Bearer` on every request.
4. **Logout:** Deletes the token from SecureStore and calls `/api/auth/mobile-logout` which bumps the user's `tokenValidFrom` (revokes on server side too).

### tRPC client
- Mobile uses `@trpc/client` + `@trpc/react-query` — same versions as the web.
- `httpBatchLink` (not `httpBatchStreamLink`, which uses streaming responses that React Native's `fetch` doesn't fully support).
- `AppRouter` type imported via a tsconfig `paths` mapping:
  ```jsonc
  "paths": { "~api/root": ["../src/server/api/root.ts"] }
  ```
  This is a type-only import — no runtime code is pulled from the web app.

### Realtime
- `@supabase/supabase-js` works in React Native with minimal setup (uses `ws`).
- Same `postgres_changes` subscriptions as the web (`messages`, `notifications` tables).
- Hooks in `mobile/lib/realtime/` mirror the web hooks in `src/hooks/`.

### Uploads
- Keep using the existing `/api/upload` route (server-side Supabase with service role key).
- Mobile uses `expo-image-picker` to select photos, then posts `multipart/form-data` with the Bearer token.

### CORS
- Expo dev server runs on a different origin (`http://localhost:8081` or the LAN IP). Web and mobile prod share a domain, so CORS is a dev-only concern.
- Add a lightweight CORS response helper for the tRPC route and auth routes, configured via `env.CORS_ALLOWED_ORIGINS` (comma-separated). Default allows `http://localhost:8081` and the LAN IP pattern in dev.

## Commit plan

Each bullet is one commit on `feat/expo-app`. Messages are lowercase imperative, no attribution.

**Phase 1 — Server prep**
1. `trpc: accept bearer token auth fallback` — read Authorization header in trpc.ts
2. `auth: add mobile-login and mobile-signup endpoints` — return JWT in body
3. `auth: add mobile-logout endpoint`
4. `api: add cors headers for trpc and mobile auth routes`
5. `env: add CORS_ALLOWED_ORIGINS`

**Phase 2 — Scaffold**
6. `mobile: scaffold expo app with expo router and typescript`
7. `mobile: add .gitignore, prettier config, tsconfig paths to web types`
8. `mobile: add core deps — trpc, react-query, supabase, secure-store, image-picker`

**Phase 3 — Auth plumbing**
9. `mobile: add auth context backed by secure-store`
10. `mobile: wire trpc client with bearer auth`
11. `mobile: add root providers — react-query, trpc, auth, theme`
12. `mobile: add login screen`
13. `mobile: add signup screen`
14. `mobile: add auth-gated layout — redirect to /login if no session`

**Phase 4 — Navigation shell**
15. `mobile: add bottom tab navigator — feed, search, notifications, messages, profile`

**Phase 5 — Feed**
16. `mobile: add post card with image carousel`
17. `mobile: add feed screen — infinite scroll, for-you/following tabs`
18. `mobile: add like button with optimistic update`
19. `mobile: add comments bottom sheet`

**Phase 6 — Compose**
20. `mobile: add create-post screen — text, image picker, upload to /api/upload`

**Phase 7 — Profile**
21. `mobile: add profile screen — view, follow, friends badge`
22. `mobile: add follow/unfollow/request buttons with privacy handling`
23. `mobile: add followers/following lists`
24. `mobile: add edit-profile screen with avatar and banner upload`
25. `mobile: add blocked users list`

**Phase 8 — Messages**
26. `mobile: add conversation list with main/requests/hidden tabs`
27. `mobile: add message thread with supabase realtime`
28. `mobile: add new-dm sheet from profile`
29. `mobile: add group creation flow`
30. `mobile: add hide/unhide/delete conversation actions`

**Phase 9 — Notifications**
31. `mobile: add notifications screen with realtime updates`
32. `mobile: add notification badge on tab bar`
33. `mobile: add notification preferences settings screen`

**Phase 10 — Polish**
34. `mobile: add theme toggle and dark-mode styles`
35. `mobile: add safe-area insets and keyboard avoiding`
36. `mobile: add pull-to-refresh to feed, messages, notifications`

**Phase 11 — Docs**
37. `docs: update CLAUDE.md with mobile/ layout`
38. `docs: update README.md with mobile setup instructions`
39. `docs: update FUTURE_WORK.md with mobile follow-ups`

## Realistic scope note

A single-session, fully-polished Expo build with 100% web parity is weeks of work. This plan delivers:

- ✅ Full server/client auth plumbing (production-ready)
- ✅ tRPC + React Query + Supabase Realtime wired end-to-end
- ✅ Uploads working against existing `/api/upload`
- ✅ Representative, functional screens for every feature domain (feed, profile, messages, notifications, compose)
- ✅ Navigation, theming, safe-area handling

Not shipped this pass (documented in FUTURE_WORK.md):
- Admin UI, email flows, push notifications, EAS/release config
- Pixel-perfect styling parity with the web
- Every edge-case screen (e.g. followers-of-followers lists, rate-limit UI)

## Verification after each phase

- `yarn typecheck` (web) — must still pass
- `yarn lint` (web) — no new errors
- `cd mobile && npm run typecheck` — mobile must pass
- Existing web tests (`yarn test`) — must still pass (server changes are additive)

## Post-merge

Updates to:
- **CLAUDE.md** — add "Mobile app" section describing `mobile/` structure, how auth differs, how to run
- **README.md** — add "Running the mobile app" section with Expo commands
- **FUTURE_WORK.md** — add "Mobile app follow-ups" section with the non-goals above
