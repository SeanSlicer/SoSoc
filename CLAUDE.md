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

- **Path alias:** `~/` maps to `./src/`. Note: `lib/` is at the repo root and aliased as `~/../lib/`.
- **Auth:** JWT stored as HTTP-only cookie (`user-token`). Custom bcrypt + JWT (HS256) — no NextAuth.
  - Auth operations use dedicated Next.js route handlers (`/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`) that call `NextResponse.cookies.set()` — **not** tRPC, because `httpBatchStreamLink` streaming responses can't reliably send `Set-Cookie` headers.
  - JWT payload: `{ sub: userId, role: "ADMIN"|"USER", imp?: adminId }`
  - `verifyAuth()` is in `lib/client/auth.ts` (imported as `~/../lib/client/auth`)
- **Protected procedures:** Use `protectedProcedure` (alias: `userProcedure`) from `src/server/api/trpc.ts`. Admin-only routes use `adminProcedure`.
- **Roles:** Stored in JWT — no DB query needed in middleware. Role changes take effect at next token issue (7-day expiry). Acceptable for single-admin apps.
- **Impersonation:** Admin can impersonate via `/api/admin/impersonate`. Real admin token saved as `admin-token` cookie; `user-token` replaced with short-lived (4h) impersonation token containing `{ imp: adminId }`. Exit via `/api/admin/impersonate/exit`.
- **Env validation:** All env vars declared in `src/env.js` using `@t3-oss/env-nextjs`. Access via `~/env.js`, never `process.env` directly.
- **DB access:** Only import `db` from `~/server/db` in server-side code.
- **Proxy / middleware:** `src/proxy.ts` (exports `proxy` function, not default middleware) — gates `/admin` routes by role, handles auth redirects.

### Database Models (Prisma)

- `User` — `isPrivate`, `hideFollowLists`, `bannerUrl`, self-referential many-to-many follow via `@relation(name: "Followers")`
- `Post` — types: `PHOTO | CAPTION | VIDEO`. `images[]` array (up to 15) for multi-photo, `videoUrl` for video posts.
- `FollowRequest` — pending follow requests for private accounts. `@@unique([requesterId, targetId])`.
- `Like` — `@@unique([userId, postId])`
- `Comment`
- `Notification` — types: `NEW_FOLLOWER | NEW_LIKE | NEW_COMMENT | FOLLOW_REQUEST | FOLLOW_REQUEST_ACCEPTED | NEW_MESSAGE | FRIEND_REQUEST`
- `Conversation` — DMs and group chats. `name` is null for DMs, set for groups.
- `ConversationMember` — join table with `lastReadAt` for unread tracking. Composite PK `[userId, conversationId]`.
- `Message` — belongs to a Conversation. Has `content` (text) and/or `sharedPostId` (post share).

### tRPC Routers

- `user` — profile, follow/unfollow, follow requests, search, privacy settings, banner
- `post` — feed (infinite), user posts, create/update/delete, like, comments
- `notification` — list, unread count, mark read
- `messages` — conversations, DMs, group creation, send, mark read, unread count
- `admin` — user list, create user (admin-only)

### Storage

Provider-agnostic interface at `src/lib/storage/types.ts`. Buckets: `"avatars" | "posts" | "banners"`. Current implementation routes uploads through `/api/upload` (server-side Supabase with service role key). Swap the implementation in `src/lib/storage/index.ts` to change providers.

> You must create the `avatars`, `posts`, and `banners` buckets in Supabase dashboard.

### Private Accounts

- `isPrivate: true` on a User means followers must be approved via `FollowRequest`.
- `followUser()` in `prisma/queries/users/follows.ts` checks `isPrivate` and routes to `sendFollowRequest` if true.
- Switching to public (`isPrivate: false`) via `updateProfile` auto-accepts all pending follow requests.
- The "For You" feed (`feedType: "all"`) filters out private account posts unless the viewer follows them or owns the posts.
- `getUserPosts` enforces privacy — returns `{ posts: [], locked: true }` for private profiles the viewer doesn't follow.

### Direct Messaging

- Conversations are created via `messages.getOrCreateDM` (2-person) or `messages.createGroup`.
- Messages update via Supabase Realtime (`postgres_changes` on `messages` table) — no polling. `NavSidebar` owns the global subscription; `MessageThread` adds a per-conversation subscription.
- Post sharing: `PostCard` accepts an optional `onShare` prop. `FeedClient` passes `setSharingPostId` which opens `SharePostModal`.

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

## Known Technical Debt

See `FUTURE_WORK.md` for a full list. Top priorities:
- JWT role revocation window (no immediate invalidation on role/password change)
- No rate limiting on auth endpoints
- Message polling should be upgraded to Supabase Realtime
- No email verification or password reset flow
