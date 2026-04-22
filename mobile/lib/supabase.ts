import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

let client: SupabaseClient | null = null;
let warned = false;

/**
 * Constructs the Supabase client lazily on first use. If env vars are missing
 * we log once and return null so callers no-op gracefully — module load never
 * crashes the rest of the app.
 */
function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!url || !anonKey) {
    if (!warned) {
      console.warn(
        "[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY not set. " +
          "Realtime is disabled until you add them to mobile/.env and reload Metro.",
      );
      warned = true;
    }
    return null;
  }
  client = createClient(url, anonKey, {
    auth: {
      storage: AsyncStorage,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return client;
}

/**
 * Safe wrapper used by realtime hooks. Methods are no-ops when Supabase isn't
 * configured, so screens that import realtime hooks still mount.
 */
export const supabase = {
  channel(name: string) {
    const c = getSupabase();
    if (!c) {
      return {
        on: () => ({ subscribe: () => ({}) }),
        subscribe: () => ({}),
      } as unknown as ReturnType<SupabaseClient["channel"]>;
    }
    return c.channel(name);
  },
  removeChannel(channel: unknown) {
    const c = getSupabase();
    if (!c) return Promise.resolve("ok" as const);
    return c.removeChannel(channel as never);
  },
  realtime: {
    setAuth(token: string | null) {
      const c = getSupabase();
      if (!c) return;
      c.realtime.setAuth(token);
    },
  },
};
