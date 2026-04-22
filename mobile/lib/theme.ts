import { useColorScheme } from "react-native";

/**
 * Design tokens for sosoc mobile. Tuned for legibility (denser typography,
 * stronger contrast) and a friendly-but-modern feel — indigo primary with
 * warm coral for likes, teal for friend/positive states, amber for requests.
 */
const palette = {
  light: {
    bg: "#ffffff",
    bgMuted: "#fafafa",
    bgSubtle: "#f4f4f5",
    bgHover: "#f4f4f5",
    surface: "#ffffff",
    surfaceElevated: "#ffffff",
    border: "#e4e4e7",
    borderStrong: "#d4d4d8",
    text: "#09090b",
    textSecondary: "#27272a",
    textMuted: "#52525b",
    textFaint: "#a1a1aa",
    accent: "#6366f1",
    accentSolid: "#4f46e5",
    accentBg: "#eef2ff",
    accentText: "#3730a3",
    accentBorder: "#c7d2fe",
    like: "#f43f5e",
    likeBg: "#fff1f2",
    success: "#10b981",
    successBg: "#ecfdf5",
    warning: "#f59e0b",
    warningBg: "#fffbeb",
    danger: "#ef4444",
    dangerBg: "#fef2f2",
    overlay: "rgba(0,0,0,0.5)",
    shadow: "rgba(0,0,0,0.06)",
  },
  dark: {
    bg: "#0a0a0a",
    bgMuted: "#0f0f0f",
    bgSubtle: "#1f1f23",
    bgHover: "#27272a",
    surface: "#161618",
    surfaceElevated: "#1f1f23",
    border: "#27272a",
    borderStrong: "#3f3f46",
    text: "#fafafa",
    textSecondary: "#e4e4e7",
    textMuted: "#a1a1aa",
    textFaint: "#71717a",
    accent: "#818cf8",
    accentSolid: "#6366f1",
    accentBg: "#1e1b4b",
    accentText: "#c7d2fe",
    accentBorder: "#3730a3",
    like: "#fb7185",
    likeBg: "#3f1d24",
    success: "#34d399",
    successBg: "#022c22",
    warning: "#fbbf24",
    warningBg: "#3a2906",
    danger: "#f87171",
    dangerBg: "#3f1414",
    overlay: "rgba(0,0,0,0.7)",
    shadow: "rgba(0,0,0,0.4)",
  },
} as const;

export type ThemeColors = typeof palette.light;

export function useTheme(): { mode: "light" | "dark"; colors: ThemeColors } {
  const scheme = useColorScheme();
  const mode: "light" | "dark" = scheme === "dark" ? "dark" : "light";
  return { mode, colors: palette[mode] };
}
