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

</div>

---

## Features

- **Feed** — For You and Following tabs with infinite scroll
- **Posts** — Text posts and photo collections (up to 15 images per post)
- **Image lightbox** — Click any photo to view it full-screen; navigate with arrow keys
- **Likes & comments** — Real-time optimistic updates so the UI feels instant
- **Follows** — Follow and unfollow users; following feed filters to people you follow
- **Notifications** — Live bell badge with unread count; notifications for likes, comments, and new followers
- **Profiles** — Avatar upload, display name, bio, follower/following counts
- **Mobile-first** — Responsive layout with a bottom tab bar on mobile, sidebar on desktop
- **Custom auth** — JWT-based authentication with HTTP-only cookies (no third-party auth provider)
- **Secure uploads** — Images routed through a server-side endpoint (bypasses Supabase RLS safely); client-side resize and JPEG conversion before upload

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| API | [tRPC](https://trpc.io/) |
| Database ORM | [Prisma](https://prisma.io/) |
| Database | PostgreSQL (via [Supabase](https://supabase.com/)) |
| Storage | [Supabase Storage](https://supabase.com/storage) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Auth | Custom JWT + bcrypt |
| Language | TypeScript |
| Package Manager | Yarn |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn
- A [Supabase](https://supabase.com/) project with two storage buckets: `avatars` and `posts` (both set to **Public**)

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
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Direct PostgreSQL URL (same as above for most setups) |
| `JWT_SECRET_KEY` | Secret used to sign auth tokens — any long random string |
| `ADMIN_EMAIL` | Email for the seeded admin account |
| `ADMIN_PASSWORD` | Password for the seeded admin account |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — **Settings → API → secret key** (server-only, never commit) |

### 3. Set up the database

```bash
yarn db:push
```

### 4. Start the dev server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up for an account.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login & signup pages
│   ├── (main)/           # Protected app pages (feed, profile, notifications)
│   ├── api/              # Route handlers (auth, file uploads)
│   └── components/       # React components
├── lib/                  # Shared utilities (auth, storage, image resize)
├── server/
│   └── api/
│       ├── routers/      # tRPC routers (post, user, notification)
│       └── trpc.ts       # tRPC context & middleware
├── validation/           # Zod schemas
└── env.js                # Type-safe environment variable validation

prisma/
├── schema.prisma         # Database schema
└── queries/              # Database query functions
```

---

## Available Scripts

```bash
yarn dev           # Start dev server (Turbopack)
yarn build         # Production build
yarn preview       # Build + start production server
yarn lint          # ESLint
yarn lint:fix      # ESLint with auto-fix
yarn typecheck     # TypeScript type checking
yarn check         # Lint + typecheck together
yarn format:write  # Prettier auto-format
yarn db:push       # Push schema changes to DB (dev)
yarn db:generate   # Generate Prisma migration
yarn db:migrate    # Deploy migrations
yarn db:studio     # Open Prisma Studio GUI
```

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b my-feature`
3. Make your changes and commit
4. Open a pull request

Please open an issue first for significant changes so we can discuss the approach.
