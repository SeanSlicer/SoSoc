import Constants from "expo-constants";

/**
 * Base URL of the sosoc web backend. Prefers `EXPO_PUBLIC_API_URL`; falls back
 * to the `extra.apiUrl` value in `app.json` for bare projects without env
 * plumbing.
 */
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:3000";

export const apiUrl = (path: string) => `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
