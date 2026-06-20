import { useMemo, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { QueryCache, QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { AuthProvider, useAuth } from "~/lib/auth";
import { trpc, createTrpcClient } from "~/lib/trpc";
import { useRealtimeAuth } from "~/lib/realtime/useRealtimeAuth";

function isUnauthorized(error: unknown): boolean {
  return error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED";
}

function Providers({ children }: { children: React.ReactNode }) {
  const { token, signOut } = useAuth();
  // `getToken` is stable — the tRPC client reads it on every request, so the
  // link picks up new tokens without needing a client swap.
  const tokenRef = useRef(token);
  tokenRef.current = token;

  // Read via ref (not a useMemo dep) so the query client isn't recreated — and
  // cached query state wiped — every time `signOut`'s identity changes.
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;

  const queryClient = useMemo(() => {
    // A stale/revoked token leaves the app permanently "signed in" (a token
    // exists in storage) while every query 401s forever with no way back to
    // the login screen. Sign out on the first UNAUTHORIZED so AuthProvider's
    // status flips to "signedOut" and the tabs layout redirects.
    const onError = (error: unknown) => {
      if (isUnauthorized(error)) void signOutRef.current({ revoke: false });
    };
    return new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
    });
  }, []);
  const trpcClient = useMemo(() => createTrpcClient(() => tokenRef.current), []);

  // Keep Supabase Realtime authenticated alongside tRPC
  useRealtimeAuth();

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <Providers>
            <StatusBar style="auto" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
              }}
            />
          </Providers>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
