import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiUrl } from "./api";
import { AUTH_TOKEN_KEY, secureStorage } from "./secureStore";

export interface AuthUser {
  id: string;
  username: string;
  role: "USER" | "ADMIN";
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  status: "loading" | "signedIn" | "signedOut";
  signIn: (usernameOrEmail: string, password: string) => Promise<void>;
  signUp: (args: { username: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

interface MobileAuthResponse {
  token: string;
  user: AuthUser;
  error?: string;
}

async function postAuth(path: string, body: unknown): Promise<MobileAuthResponse> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<MobileAuthResponse>;
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : res.status === 401
          ? "Invalid username or password"
          : `Request failed (${res.status})`,
    );
  }
  if (!data.token || !data.user) throw new Error("Malformed auth response");
  return data as MobileAuthResponse;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");

  // Hydrate from secure storage on mount
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await secureStorage.get(AUTH_TOKEN_KEY);
      if (cancelled) return;
      if (saved) {
        setToken(saved);
        // User metadata is re-fetched via trpc.user.getMe after providers mount.
        setStatus("signedIn");
      } else {
        setStatus("signedOut");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (usernameOrEmail: string, password: string) => {
    const { token: t, user: u } = await postAuth("/api/auth/mobile-login", {
      usernameOrEmail,
      password,
    });
    await secureStorage.set(AUTH_TOKEN_KEY, t);
    setToken(t);
    setUser(u);
    setStatus("signedIn");
  }, []);

  const signUp = useCallback(async (args: { username: string; email: string; password: string }) => {
    const { token: t, user: u } = await postAuth("/api/auth/mobile-signup", args);
    await secureStorage.set(AUTH_TOKEN_KEY, t);
    setToken(t);
    setUser(u);
    setStatus("signedIn");
  }, []);

  const signOut = useCallback(async () => {
    const current = token;
    setToken(null);
    setUser(null);
    setStatus("signedOut");
    await secureStorage.remove(AUTH_TOKEN_KEY);
    if (current) {
      try {
        await fetch(apiUrl("/api/auth/mobile-logout"), {
          method: "POST",
          headers: { Authorization: `Bearer ${current}` },
        });
      } catch {
        // Server-side revoke is best-effort — local token is already gone
      }
    }
  }, [token]);

  const value = useMemo<AuthState>(
    () => ({ token, user, status, signIn, signUp, signOut }),
    [token, user, status, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

/** Convenience: current JWT for use as a Bearer token (null when signed out). */
export function useAuthToken(): string | null {
  return useAuth().token;
}
