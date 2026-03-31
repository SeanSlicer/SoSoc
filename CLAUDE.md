# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
yarn dev          # Start dev server with Turbopack

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

# Database
yarn db:generate  # Generate Prisma migration (dev)
yarn db:migrate   # Deploy migrations
yarn db:push      # Push schema without migration
yarn db:studio    # Open Prisma Studio GUI
```

**Package manager:** Yarn (not npm)

## Architecture

This is a T3 Stack social media app (Next.js 15 App Router + tRPC + Prisma + PostgreSQL).

### Request Flow

1. React components call tRPC via `~/trpc/react.tsx` (client) or `~/trpc/server.ts` (server RSC)
2. Requests route through `/src/app/api/trpc/[trpc]/route.ts`
3. tRPC context (`src/server/api/trpc.ts`) injects `db` (Prisma client) and parses the `user-token` JWT cookie to populate `ctx.user`
4. Router procedures run in `src/server/api/routers/`
5. Database queries are in `prisma/queries/` (separate from routers)

### Key Conventions

- **Path alias:** `~/` maps to `./src/`
- **Auth:** JWT stored as HTTP-only cookie (`user-token`), verified in tRPC middleware. No NextAuth — custom bcrypt + JWT implementation.
- **Protected procedures:** Use `protectedProcedure` from `src/server/api/trpc.ts` (checks `ctx.user`). Public ones use `publicProcedure`.
- **Env validation:** All environment variables must be declared in `src/env.js` using `@t3-oss/env-nextjs`. Access them via `~/env.js`, never `process.env` directly.
- **DB access:** Only import `db` from `~/server/db` in server-side code. Files needing server-only enforcement use `import "server-only"`.

### Database Models (Prisma)

`User` → `Post` (one-to-many), `Like` (User ↔ Post composite), `Comment`, `Notification`, Follow (User self-referential many-to-many)

Post types: `PHOTO | CAPTION | VIDEO`. Notification types: `NEW_FOLLOWER | NEW_MESSAGE | FRIEND_REQUEST`.

### Adding a New Feature

1. Add Zod schema to `src/validation/` if new input validation is needed
2. Add database queries to `prisma/queries/<domain>/`
3. Create or extend a router in `src/server/api/routers/`
4. Register the router in `src/server/api/root.ts`
5. Build React components under `src/app/components/`

## Environment Variables

Required (defined in `src/env.js`):
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET_KEY` — secret for signing JWTs
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — seeding admin account
- `NEXT_PUBLIC_APP_URL` — public app URL (client-accessible)
- `NODE_ENV`

See `.env.example` for the database URL format. Use `start-database.sh` to spin up a local PostgreSQL instance.
