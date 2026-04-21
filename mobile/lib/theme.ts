import { useColorScheme } from "react-native";

/**
 * Design tokens mirroring the web Tailwind palette used in CLAUDE.md.
 * Each key maps to both light and dark hex values; call `useTheme()` to get
 * the active set.
 */
const palette = {
  light: {
    bg: "#ffffff",
    bgMuted: "#fafafa",
    bgSubtle: "#f5f5f5",
    bgHover: "#f5f5f5",
    border: "#e5e5e5",
    borderStrong: "#d4d4d4",
    text: "#171717",
    textSecondary: "#404040",
    textMuted: "#737373",
    textFaint: "#a3a3a3",
    accent: "#4f46e5",
    accentBg: "#eef2ff",
    accentText: "#4338ca",
    danger: "#dc2626",
    dangerBg: "#fef2f2",
    success: "#16a34a",
    overlay: "rgba(0,0,0,0.5)",
  },
  dark: {
    bg: "#171717",
    bgMuted: "#0a0a0a",
    bgSubtle: "#262626",
    bgHover: "#262626",
    border: "#262626",
    borderStrong: "#404040",
    text: "#f5f5f5",
    textSecondary: "#e5e5e5",
    textMuted: "#a3a3a3",
    textFaint: "#737373",
    accent: "#818cf8",
    accentBg: "#1e1b4b",
    accentText: "#c7d2fe",
    danger: "#f87171",
    dangerBg: "#450a0a",
    success: "#4ade80",
    overlay: "rgba(0,0,0,0.7)",
  },
} as const;

export type ThemeColors = typeof palette.light;

export function useTheme(): { mode: "light" | "dark"; colors: ThemeColors } {
  const scheme = useColorScheme();
  const mode: "light" | "dark" = scheme === "dark" ? "dark" : "light";
  return { mode, colors: palette[mode] };
}
