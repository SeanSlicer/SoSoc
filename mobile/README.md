# sosoc mobile

React Native (Expo) companion app for sosoc. Connects to the same backend and database as the web app.

## Setup

From the repo root:

```bash
# Install dependencies (one-time)
cd mobile
npm install

# Copy env template and fill in your values
cp .env.example .env
```

## Run

```bash
# Start the web backend first (from repo root)
yarn dev

# Then, in a second terminal:
cd mobile
npm start
```

Expo will print a QR code. Scan it with Expo Go (iOS/Android) on a device on the same LAN, or press `i` / `a` to launch a simulator.

## Configuration

The mobile app needs two environment values. Set them in `mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:3000
EXPO_PUBLIC_SUPABASE_URL=<same as web NEXT_PUBLIC_SUPABASE_URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<same as web NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY>
```

`EXPO_PUBLIC_API_URL` must be reachable from your physical device — `localhost` only works for the iOS Simulator. For a real phone, use your machine's LAN IP (e.g. `http://192.168.1.12:3000`).

You'll also need to allow that origin on the web backend. In the **web** app's `.env`:

```bash
CORS_ALLOWED_ORIGINS="http://localhost:8081,exp://192.168.1.12:8081"
```

(Dev-only. In production, web and mobile share the same domain and no CORS config is required.)

## Architecture

- **Navigation:** Expo Router (file-based, mirrors Next.js App Router patterns). Screens live in `app/`.
- **Data:** tRPC v11 client with React Query — the same `AppRouter` type the web uses. Type is imported via tsconfig `paths` from `../src/server/api/root.ts`; no runtime code crosses the boundary.
- **Auth:** JWT stored in `expo-secure-store`, sent as `Authorization: Bearer <token>` on every request. See `lib/auth.tsx` and `lib/trpc.ts`.
- **Realtime:** `@supabase/supabase-js` with the same `postgres_changes` subscriptions as the web app. See `lib/realtime/`.
- **Uploads:** `expo-image-picker` + `multipart/form-data` POST to the existing `/api/upload` route.

## Project layout

```
mobile/
├── app/                  ← Expo Router screens
│   ├── (auth)/           ← login, signup (no tab bar)
│   ├── (tabs)/           ← main app with bottom tab bar
│   ├── profile/[username].tsx
│   ├── messages/[id].tsx
│   └── _layout.tsx       ← root layout + providers
├── components/           ← shared UI
├── lib/
│   ├── auth.tsx          ← auth context (SecureStore-backed)
│   ├── trpc.ts           ← tRPC client + React Query setup
│   ├── api.ts            ← env-aware API base URL
│   ├── supabase.ts       ← Supabase client for realtime + uploads
│   └── realtime/         ← realtime subscription hooks
└── assets/               ← icons, splash
```
