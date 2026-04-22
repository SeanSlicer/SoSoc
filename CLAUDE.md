# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
yarn dev          # Start dev server (--webpack flag required — see note below)

# Build & Preview
yarn build
yarn preview      # Build + start production server

# Code Quality
yarn lint         # ESLint
yarn lint:fix     # ESLint with auto-fix
yarn typecheck    # TypeScript type checking
yarn check        # Lint + typecheck together
yarn format:write # Prettier auto-format
yarn format:check # Prettier check only
yarn test         # Vitest unit tests (watch mode)
yarn test:coverage # Vitest with coverage report

# Database
yarn db:generate  # Generate Prisma migration (dev)
yarn db:migrate   # Deploy migrations
yarn db:push      # Push schema without migration
yarn db:setup     # One-time Supabase setup (Realtime publication) — idempotent, safe to re-run
yarn db:studio    # Open Prisma Studio GUI
```

**Package manager:** Yarn (not npm)

> **Webpack flag:** Both `next dev` and `next build` use `--webpack` to prevent Turbopack from traversing native Node modules (`bcrypt`, `@mapbox/node-pre-gyp`) into the client bundle.

## Architecture

This is a T3 Stack social media app (Next.js 15 App Router + tRPC v11 + Prisma v6 + PostgreSQL + Tailwind v4 + TypeScript).

### Request Flow

1. React components call tRPC via `~/trpc/react.tsx` (client) or `~/trpc/server.ts` (server RSC)
2. Requests route through `/src/app/api/trpc/[trpc]/route.ts`
3. tRPC context (`src/server/api/trpc.ts`) injects `db` (Prisma client) and parses the `user-token` JWT cookie to populate `ctx.user`
4. Router procedures run in `src/server/api/routers/`
5. Database queries are in `prisma/queries/` (separate from routers)

### Key Conventions

- **Path aliases:** `~/` → `./src/`; `@queries/` → `./prisma/queries/`.
- **`src/lib/` layout:** split into `server/` (Node-only, marked `server-only`), `client/` (browser-only, marked `"use client"`), and `shared/` (platform-agnostic — safe to import from a future Expo app).
- **Auth:** JWT stored as HTTP-only cookie (`user-token`). Custom bcrypt + JWT (HS256) — no NextAuth.
  - Auth operations use dedicated Next.js route handlers (`/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`) that call `NextResponse.cookies.set()` — **not** tRPC, because `httpBatchStreamLink` streaming responses can't reliably send `Set-Cookie` headers.
  - JWT payload: `{ sub: userId, role: "ADMIN"|"USER", imp?: adminId }`
  - `verifyAuth()` is in `src/lib/server/jwt.ts`; the payload type lives in `src/lib/shared/jwt.ts` so it can be imported from Expo.
- **Protected procedures:** Use `protectedProcedure` (alias: `userProcedure`) from `src/server/api/trpc.ts`. Admin-only routes use `adminProcedure`.
- **Roles:** Stored in JWT — no DB query needed in middleware. Role changes take effect at next token issue (7-day expiry). Acceptable for single-admin apps.
- **Impersonation:** Admin can impersonate via `/api/admin/impersonate`. Real admin token saved as `admin-token` cookie; `user-token` replaced with short-lived (4h) impersonation token containing `{ imp: adminId }`. Exit via `/api/admin/impersonate/exit`.
- **Env validation:** All env vars declared in `src/env.js` using `@t3-oss/env-nextjs`. Access via `~/env.js`, never `process.env` directly.
- **DB access:** Only import `db` from `~/server/db` in server-side code.
- **Proxy / middleware:** `src/proxy.ts` (exports `proxy` function, not default middleware) — gates `/admin` routes by role, handles auth redirects.

### Database Models (Prisma)

- `User` — `isPrivate`, `hideFollowLists`, `bannerUrl`, self-referential many-to-many follow via `@relation(name: "Followers")`. Has 6 notification preference booleans (`notifyNewFollower`, `notifyNewLike`, `notifyNewComment`, `notifyFollowRequest`, `notifyFollowAccepted`, `notifyNewMessage`) — all default `true`.
- `Post` — types: `PHOTO | CAPTION | VIDEO`. `images[]` array (up to 15) for multi-photo, `videoUrl` for video posts.
- `FollowRequest` — pending follow requests for private accounts. `@@unique([requesterId, targetId])`.
- `Like` — `@@unique([userId, postId])`
- `Comment`
- `Notification` — types: `NEW_FOLLOWER | NEW_LIKE | NEW_COMMENT | FOLLOW_REQUEST | FOLLOW_REQUEST_ACCEPTED | NEW_MESSAGE | FRIEND_REQUEST`
- `Conversation` — DMs and group chats. `name` is null for DMs, set for groups.
- `ConversationMember` — join table with `lastReadAt` for unread tracking and `status: ConversationMemberStatus` (ACTIVE/REQUEST/HIDDEN). Composite PK `[userId, conversationId]`.
- `Message` — belongs to a Conversation. Has `content` (text) and/or `sharedPostId` (post share).
- `RateLimitConfig` — admin-configurable rate limit overrides keyed by action name (e.g. `"post.create"`). Cached in memory for 60 s.

### tRPC Routers

- `user` — profile, follow/unfollow, follow requests, search, privacy settings, banner, block/unblock, `getFollowStatus` (includes `friends` flag)
- `post` — feed (infinite), user posts, create/update/delete, like, comments
- `notification` — list, unread count, mark read, `getPrefs` / `updatePrefs` for notification preferences
- `messages` — conversations, DMs, group creation, send, mark read, unread count, `getRequests` / `acceptRequest` / `declineRequest` / `hideConversation` for message requests
- `admin` — user list, create user, `getRateLimits` / `setRateLimit` / `resetRateLimit` for rate limit config

### Storage

Provider-agnostic interface at `src/lib/storage/types.ts`. Buckets: `"avatars" | "posts" | "banners"`. Current implementation routes uploads through `/api/upload` (server-side Supabase with service role key). Swap the implementation in `src/lib/storage/index.ts` to change providers.

> You must create the `avatars`, `posts`, and `banners` buckets in Supabase dashboard.

### Private Accounts

- `isPrivate: true` on a User means followers must be approved via `FollowRequest`.
- `followUser()` in `prisma/queries/users/follows.ts` checks `isPrivate` and routes to `sendFollowRequest` if true.
- Switching to public (`isPrivate: false`) via `updateProfile` auto-accepts all pending follow requests.
- The "For You" feed (`feedType: "all"`) filters out private account posts unless the viewer follows them or owns the posts.
- `getUserPosts` enforces privacy — returns `{ posts: [], locked: true }` for private profiles the viewer doesn't follow.

### Friends System

- Friends are mutual follows — no separate model. User A and User B are friends when both `isFollowing(A, B)` and `isFollowing(B, A)` are true.
- `isFriends()` is in `prisma/queries/users/friends.ts`.
- `user.getFollowStatus` returns `{ following, requested, friends }`.
- Profile pages show a "Friends" pill badge when viewing a mutual follow.

### Direct Messaging & Message Requests

- Conversations are created via `messages.getOrCreateDM` (2-person) or `messages.createGroup`.
- `ConversationMember.status` controls visibility: `ACTIVE` (main tab), `REQUEST` (pending DM from non-friend), `HIDDEN` (declined or user-hidden).
- New DMs from non-friends set the recipient's status to `REQUEST`; existing conversations are never downgraded.
- `sendMessage` restores `HIDDEN` → `REQUEST` for the recipient when a new message arrives.
- Messages page has two tabs: Messages (ACTIVE) and Requests (REQUEST). Users can accept, decline, or hide conversations.
- Messages update via Supabase Realtime (`postgres_changes` on `messages` table) — no polling. `NavSidebar` owns the global subscription; `MessageThread` adds a per-conversation subscription.
- Post sharing: `PostCard` accepts an optional `onShare` prop. `FeedClient` passes `setSharingPostId` which opens `SharePostModal`.

### Notification Preferences

- Each user has 6 boolean preference columns on the `User` model, all defaulting to `true`.
- `createNotification()` checks the recipient's preference for the notification type and silently no-ops if it's disabled.
- Preferences are editable at `/settings/notifications` via toggle switches.
- tRPC: `notification.getPrefs` / `notification.updatePrefs`.

### Rate Limiting

- In-memory sliding window limiter in `src/lib/server/rateLimit.ts` (`checkRateLimit`).
- Admin-configurable overrides stored in the `RateLimitConfig` DB table, cached in memory for 60 seconds (`getRateLimitConfig`).
- Applied to: `post.create` (100/hr), `post.comment` (200/hr), `post.like` (500/hr), `message.send` (100/hr), `user.follow` (100/hr), `auth.signup` (5/hr per IP).
- Admin UI at `/admin` → Rate Limits tab to view and override limits. Reset button restores defaults.
- Rate-limited actions throw `TOO_MANY_REQUESTS` (HTTP 429).

### Dark Mode

**Dark mode must be considered on every UI change.** Never write a light-mode-only class without its `dark:` counterpart.

- Class-based dark mode via `@custom-variant dark` in `globals.css`. Apply `.dark` to `<html>` to enable.
- `ThemeProvider` (`src/app/components/theme/ThemeProvider.tsx`) manages the `dark` class and stores preference in `localStorage`. Three modes: `light`, `dark`, `system`.
- An inline `<script>` in `src/app/layout.tsx` runs before first paint to prevent flash of wrong theme.
- Theme toggle (Sun/Monitor/Moon) is in the **desktop sidebar only**. Mobile follows system preference automatically.

**Color mapping — always pair these:**
| Light | Dark |
|---|---|
| `bg-white` | `dark:bg-neutral-900` |
| `bg-neutral-50` | `dark:bg-neutral-950` |
| `bg-neutral-100` | `dark:bg-neutral-800` |
| `bg-white/80` (sticky headers) | `dark:bg-neutral-900/80` |
| `border-neutral-100` | `dark:border-neutral-800` |
| `border-neutral-200` | `dark:border-neutral-700` |
| `text-neutral-900` | `dark:text-neutral-100` |
| `text-neutral-800` | `dark:text-neutral-200` |
| `text-neutral-700` | `dark:text-neutral-300` |
| `text-neutral-600` | `dark:text-neutral-400` |
| `text-neutral-500` | `dark:text-neutral-400` |
| `text-neutral-400` | `dark:text-neutral-500` |
| `hover:bg-neutral-50` | `dark:hover:bg-neutral-800` |
| `hover:bg-neutral-100` | `dark:hover:bg-neutral-700` |
| `bg-indigo-50` | `dark:bg-indigo-950` |
| `bg-indigo-100` | `dark:bg-indigo-900` |
| `text-indigo-700` | `dark:text-indigo-300` |
| inputs: add | `dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100` |

### Mobile Layout

**Always consider mobile when building UI.** The app targets phones (430px width, iPhone 14 Pro Max) as a primary use case.

- Bottom tab bar is icon-only (no labels) so all 5 tabs fit at any phone width.
- `viewport-fit=cover` is set in `src/app/layout.tsx` enabling `env(safe-area-inset-bottom)`.
- Tab bar uses `style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}` for iPhone home indicator clearance.
- Admin nav item is desktop sidebar only — not in mobile tab bar.
- Main content uses `style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}` on mobile.
- Test every new UI feature at 430px width. Avoid fixed widths that don't flex. Prefer `w-full`, `min-w-0`, and `flex-1` over fixed sizes in list/feed layouts.
- Touch targets should be at least 44×44px (use `p-3` on icon buttons).
- Modals use `p-4` container padding on mobile so they don't fill edge-to-edge.

### Adding a New Feature

1. Add Zod schema to `src/validation/` if new input validation is needed
2. Add database queries to `prisma/queries/<domain>/`
3. Create or extend a router in `src/server/api/routers/`
4. Register the router in `src/server/api/root.ts`
5. Build React components under `src/app/components/`

## Environment Variables

Required (defined in `src/env.js`):
- `DATABASE_URL` — PostgreSQL connection string (pooled, via Supabase PgBouncer)
- `DIRECT_URL` — Direct PostgreSQL URL (used by Prisma migrations, bypasses pooler)
- `JWT_SECRET_KEY` — secret for signing JWTs
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — seeding admin account
- `NEXT_PUBLIC_APP_URL` — public app URL (client-accessible)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — server-side uploads
- `RESEND_API_KEY` — (optional) Resend API key for transactional email; if unset, email URLs are logged to the console instead
- `NODE_ENV`

See `.env.example` for the database URL format. Use `start-database.sh` to spin up a local PostgreSQL instance.

### Documentation

All exported functions in `prisma/queries/**/*.ts` and key `src/lib/server/*.ts` files have JSDoc comments. Format:
```ts
/**
 * One-line summary.
 *
 * @param paramName  Description
 * @returns          What it returns (omit for void)
 */
```

### Mobile app (`mobile/`)

A companion React Native app built with Expo Router lives under `mobile/`. It consumes the same tRPC API as the web app — no duplicated business logic.

**Running it:**
```bash
cd mobile
yarn install          # or npm install
yarn start            # Metro bundler — open in Expo Go, iOS simulator, or Android emulator
```

The web server must be running (`yarn dev` at repo root) and reachable from the device. Set `EXPO_PUBLIC_API_URL` in `mobile/.env` to the LAN IP of your dev machine (e.g. `http://192.168.1.20:3000`) — `localhost` only works in simulators, not on a physical device.

**Layout:**
```
mobile/
├── app/                     ← Expo Router (file-based) screens
│   ├── (auth)/              ← login, signup
│   ├── (tabs)/              ← feed, search, compose, notifications, messages, profile
│   ├── messages/[id].tsx    ← thread view
│   ├── profile/             ← edit, [username], followers, following
│   └── settings/            ← index, blocked, notifications
├── components/              ← shared RN components
│   ├── Avatar.tsx           ← initial-fallback overlaid by image; never shows blank
│   ├── Button.tsx           ← pill-shaped, primary/secondary/danger/ghost
│   ├── ConversationRow.tsx  ← messages list row with unread accent
│   ├── CommentsSheet.tsx    ← bottom-sheet modal (presentationStyle="pageSheet")
│   ├── FollowList.tsx       ← shared followers/following list view
│   ├── FormField.tsx        ← labeled text input
│   ├── Icon.tsx             ← lucide-react-native wrapper, name-prop API
│   ├── PostCard.tsx
│   ├── PostImageCarousel.tsx ← horizontal pager with index pill + dots
│   ├── ProfileView.tsx      ← used by both /(tabs)/profile and /profile/[username]
│   └── ScreenHeader.tsx     ← back-button + centered title; reuse on every sub-screen
├── lib/
│   ├── auth.tsx             ← AuthProvider (SecureStore-backed JWT)
│   ├── trpc.ts              ← tRPC client + React Query hooks
│   ├── supabase.ts          ← Supabase Realtime client
│   ├── realtime/            ← useRealtimeAuth, useRealtimeConversations, useRealtimeNotifications
│   ├── theme.ts             ← light/dark palette + useTheme()
│   └── upload.ts            ← multipart upload to /api/upload with Bearer
└── package.json             ← own deps, no workspace tie-in
```

**Key architectural notes:**
- **No Yarn workspaces.** Mobile imports only the `AppRouter` *type* via `tsconfig` paths (`~api/root` → `../src/server/api/root.ts`). Zero runtime dependency on the web code.
- **Auth over Bearer.** The web client uses HTTP-only cookies; mobile uses `Authorization: Bearer <jwt>`. `extractToken()` in `src/server/api/trpc.ts` reads both, cookie first. `getUserFromRequest()` in `src/lib/server/getCurrentUser.ts` does the same for route handlers (`/api/upload`, `/api/auth/realtime-token`).
- **Dedicated auth endpoints.** `/api/auth/mobile-login`, `/mobile-signup`, `/mobile-logout` return the JWT in the response body instead of setting a cookie. They reuse the same `createAuthToken` helper.
- **tRPC transport.** Uses `httpBatchLink`, not `httpBatchStreamLink` — RN's `fetch` doesn't fully support streaming responses.
- **CORS.** Web and mobile share a domain in prod, so CORS is dev-only. `src/lib/server/cors.ts` permits `localhost`, private-LAN IP patterns, and `exp://` by default, plus anything in `CORS_ALLOWED_ORIGINS`.
- **Realtime.** `@supabase/supabase-js` works in RN with minimal setup. `useRealtimeAuth` fetches short-lived Supabase JWTs from `/api/auth/realtime-token` and refreshes them 5 min before expiry. Per-conversation and global message/notification subscriptions mirror the web hooks in `src/hooks/`.
- **Uploads.** `expo-image-picker` → FormData with `{ uri, name, type }` shape (RN-specific) → `/api/upload` with Bearer header.
- **Dark mode.** Driven by the device's `useColorScheme()` — no manual toggle yet (see FUTURE_WORK.md). The full palette lives in `mobile/lib/theme.ts` as `palette: Record<"light" | "dark", ThemeColors>`.
- **Icons.** `lucide-react-native` wrapped by `mobile/components/Icon.tsx`, which exposes a `name` prop API (e.g. `<Icon name="bell" size={22} color={colors.text} />`). Available names are listed in the `IconName` union — add to both the union and the `ICONS` map when introducing a new one.
- **Avatars.** `mobile/components/Avatar.tsx` always renders the username initial as a fallback layer, then overlays the image on top. If `expo-image` errors or the URL is null, the initial stays visible — never a blank grey circle. Pass `url`, `username`, and `size`.
- **Sub-screen header.** Use `mobile/components/ScreenHeader.tsx` — it renders the back button (defaults to `router.back()`), a centered title, and an optional `right` action slot. Pass `onBack={null}` to suppress the back button.

**Design tokens & UI conventions:**
- **Spacing scale:** 4 / 8 / 12 / 14 / 16 / 22 / 24. Avoid stray odd numbers.
- **Typography:** screen titles 22pt / 800 weight / `letterSpacing: -0.5`; section headings 17pt / 700; body 14-15pt / 400-600; meta 12-13pt / 500. Always use `colors.text` / `colors.textMuted` / `colors.textFaint` — never raw hex.
- **Touch targets:** minimum 36×36 (icon buttons in headers); chips and rows ≥44pt tall. Wrap small icons in a `width: 36, height: 36, borderRadius: 18` Pressable that uses `colors.bgSubtle`/`bgHover` for press feedback.
- **Pressable feedback:** every tappable row should set `backgroundColor: pressed ? colors.bgHover : "transparent"` (lists) or `opacity: pressed ? 0.7 : 1` (cards). Don't leave taps with no visual confirmation.
- **Buttons:** pill-shaped (`borderRadius: 999`). `primary` = `colors.accent` solid; `secondary` = `colors.bgSubtle` with `colors.text`; `danger` = `colors.danger`; `ghost` = transparent with accent text.
- **Empty states:** centered 64×64 rounded-square icon (`colors.bgSubtle` background, `textFaint` icon), then a 16pt/600 title and a 14pt/textMuted subtitle.
- **Icons in lists:** use `strokeWidth: 1.9–2.4` for visual heft. Default Icon size: 22.
- **Accents:** `colors.like` (coral) for hearts, `colors.success` (teal) for friend/accepted states, `colors.warning` (amber) for pending requests, `colors.accent` (indigo) for primary actions.

**What's not in mobile yet** (see FUTURE_WORK.md → "Mobile app follow-ups"): admin UI, email verification/password reset flows, push notifications (APNs/FCM), EAS/app-store release config, deep linking, offline write queue, group-conversation creation UI, light/dark manual toggle, post share sheet, image lightbox, video posts, skeleton loaders, haptics.

## Known Technical Debt

See `FUTURE_WORK.md` for a full list. Top priorities:
- JWT role revocation window (no immediate invalidation on role/password change)
- Rate limiting is per-instance (not shared across replicas) — swap store for Redis for multi-instance deployments
- No email verification or password reset flow
