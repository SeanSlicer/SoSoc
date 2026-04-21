<div align="center">

# sosoc

**A fast, modern social media app built from scratch.**

Share photos, follow people you care about, and see what's happening — all in a clean, responsive interface.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![tRPC](https://img.shields.io/badge/tRPC-398CCB?style=flat-square&logo=trpc&logoColor=white)](https://trpc.io/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)

</div>

---

## Features

- **Feed** — For You and Following tabs with infinite scroll
- **Posts** — Text posts and photo collections (up to 15 images per post)
- **Image lightbox** — Click any photo to view it full-screen; navigate with arrow keys
- **Likes & comments** — Real-time optimistic updates so the UI feels instant
- **Follows** — Follow and unfollow users; private accounts with follow-request approval
- **Direct messages** — 1-on-1 and group chats with real-time delivery via Supabase Realtime; post sharing
- **Notifications** — Live bell badge with unread count; real-time push for likes, comments, follows, and messages
- **Profiles** — Avatar upload, banner image, display name, bio, follower/following counts
- **Auth** — Sign up, log in, forgot/reset password, email verification (via Resend)
- **Rate limiting** — Brute-force protection on all auth endpoints (in-memory sliding window)
- **Dark mode** — System, light, or dark; persisted to localStorage with no flash on load
- **Mobile-first** — Responsive layout with a bottom tab bar on mobile, sidebar on desktop
- **Admin** — User management dashboard with impersonation
- **Secure uploads** — Images routed through a server-side endpoint; client-side resize and JPEG conversion before upload
- **Mobile companion app** — React Native + Expo app under `mobile/` consuming the same tRPC API; Bearer-token auth via `expo-secure-store`; Supabase Realtime for messages and notifications

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| API | [tRPC](https://trpc.io/) |
| Database ORM | [Prisma](https://prisma.io/) |
| Database | PostgreSQL (via [Supabase](https://supabase.com/)) |
| Storage | [Supabase Storage](https://supabase.com/storage) |
| Real-time | [Supabase Realtime](https://supabase.com/realtime) |
| Email | [Resend](https://resend.com/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Auth | Custom JWT + bcrypt — no NextAuth |
| Testing | [Vitest](https://vitest.dev/) |
| Language | TypeScript |
| Package Manager | Yarn |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn
- A [Supabase](https://supabase.com/) project with three storage buckets: `avatars`, `posts`, and `banners` (all set to **Public**)

### 1. Clone and install

```bash
git clone https://github.com/SeanSlicer/sosoc.git
cd sosoc
yarn install
```

### 2. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Pooled PostgreSQL connection string |
| `DIRECT_URL` | Direct PostgreSQL URL (used by Prisma migrations, bypasses pooler) |
| `JWT_SECRET_KEY` | Secret used to sign auth tokens — any long random string |
| `ADMIN_EMAIL` | Email for the seeded admin account |
| `ADMIN_PASSWORD` | Password for the seeded admin account |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — **Settings → API → secret key** (server-only, never commit) |
| `RESEND_API_KEY` | *(Optional)* [Resend](https://resend.com/) API key for transactional email. If unset, email URLs are printed to the console so the full auth flow is still testable locally. |

### 3. Set up the database

```bash
yarn db:push    # sync schema to the database
yarn db:setup   # add tables to Supabase Realtime publication (run once)
```

### 4. Start the dev server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up for an account.

---

## Mobile app

A React Native companion app built with [Expo](https://expo.dev/) lives under `mobile/`. It consumes the same tRPC API — no duplicated business logic.

### Running it

```bash
cd mobile
yarn install
yarn start            # Metro bundler
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go on a physical device.

### Mobile environment

Create `mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000
EXPO_PUBLIC_SUPABASE_URL=<same as web>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<same as web>
```

Use the **LAN IP** of your dev machine, not `localhost` (which won't resolve from a physical device). The web dev server at `http://localhost:3000` must be running and reachable.

In development, add the Expo origin to the web app's `.env` so CORS allows it:

```
CORS_ALLOWED_ORIGINS=http://192.168.1.20:8081
```

(Localhost and private-LAN patterns are already allow-listed by default.)

### What's in mobile

- Auth (login / signup / logout) with JWT stored in `expo-secure-store`
- Feed (For You / Following, infinite scroll, optimistic likes, comments sheet)
- Compose (multi-photo picker, upload through `/api/upload`)
- Profile (view/edit, follows, follow requests, blocked users, friends badge)
- Messages (conversation list with main/requests/hidden tabs, thread view, new-DM search, Supabase Realtime updates)
- Notifications (list + unread badge with Realtime updates, preferences settings)
- Dark mode via the device's system setting

Not yet on mobile (deferred — see `FUTURE_WORK.md` → "Mobile app follow-ups"): admin console, email verification/password reset, push notifications, group-conversation creation, EAS release config.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, signup, forgot/reset password, email verification
│   ├── (main)/           # Protected app shell (feed, profile, messages, notifications)
│   ├── admin/            # Admin dashboard
│   ├── api/              # Route handlers (auth, uploads, admin)
│   └── components/       # React components organised by feature
├── hooks/                # Supabase Realtime hooks
├── lib/
│   └── server/           # Server-only utilities (auth, email, rate limiting, storage)
├── server/
│   └── api/
│       ├── routers/      # tRPC routers (user, post, messages, notification, admin)
│       └── trpc.ts       # tRPC context & middleware
├── validation/           # Zod schemas
├── __tests__/            # Unit tests
└── env.js                # Type-safe environment variable validation

prisma/
├── schema.prisma         # Database schema
└── queries/              # Database query functions organised by domain
```

---

## Available Scripts

```bash
yarn dev              # Start dev server
yarn build            # Production build
yarn preview          # Build + start production server

yarn test             # Run unit tests (watch mode)
yarn test --run       # Run unit tests once
yarn test:coverage    # Run tests with coverage report

yarn lint             # ESLint
yarn lint:fix         # ESLint with auto-fix
yarn typecheck        # TypeScript type checking
yarn check            # Lint + typecheck together
yarn format:write     # Prettier auto-format

yarn db:push          # Push schema changes to DB
yarn db:setup         # Idempotent Supabase Realtime publication setup
yarn db:generate      # Generate Prisma migration
yarn db:migrate       # Deploy migrations
yarn db:studio        # Open Prisma Studio GUI
```

---

## Testing

Unit tests are written with [Vitest](https://vitest.dev/) and cover pure business logic with no database or network dependencies.

```
Test Files  2 passed (2)
     Tests  18 passed (18)
  Duration  ~300ms
```

| File | What's tested |
|---|---|
| `src/__tests__/rateLimit.test.ts` | Sliding window algorithm, request expiry, independent keys, burst behaviour |
| `src/__tests__/validation.test.ts` | Sign-up and login Zod schemas: username rules, password strength, email format, whitespace trimming |

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b my-feature`
3. Make your changes and commit
4. Open a pull request

Please open an issue first for significant changes so we can discuss the approach.
