"use client";
import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";

/**
 * Browser-side Supabase client — uses the anon/publishable key, so RLS applies.
 * Used for Realtime subscriptions and any client-side auth flows.
 *
 * Server code must not import this; use a service-role client (see
 * `/api/upload/route.ts`) for server-side operations that bypass RLS.
 */
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
