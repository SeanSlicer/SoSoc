import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "~api/root";
import { apiUrl } from "./api";

export const trpc = createTRPCReact<AppRouter>();

/**
 * Build a tRPC client bound to the current auth token. Call this from
 * `_layout.tsx` via `useMemo([token])` so a new client is created whenever the
 * token changes — React Query invalidates cached queries on client swap.
 */
export function createTrpcClient(getToken: () => string | null) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        // Using httpBatchLink rather than httpBatchStreamLink — React Native's
        // fetch does not fully support streaming response bodies.
        url: apiUrl("/api/trpc"),
        transformer: superjson,
        headers() {
          const token = getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
