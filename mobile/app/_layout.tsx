import { useMemo, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "~/lib/auth";
import { trpc, createTrpcClient } from "~/lib/trpc";
import { useRealtimeAuth } from "~/lib/realtime/useRealtimeAuth";

function Providers({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  // `getToken` is stable — the tRPC client reads it on every request, so the
  // link picks up new tokens without needing a client swap.
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const queryClient = useMemo(() => new QueryClient(), []);
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
