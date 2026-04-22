import { Text } from "react-native";

/**
 * Minimal icon component using monochrome Unicode glyphs. Keeps bundle size
 * down and avoids pulling in a vector-icon dependency. Not a replacement for
 * lucide long-term — see FUTURE_WORK.md "Mobile icon set".
 */
export type IconName =
  | "home"
  | "search"
  | "bell"
  | "mail"
  | "user"
  | "plus"
  | "heart"
  | "heart-filled"
  | "message-circle"
  | "share"
  | "image"
  | "camera"
  | "chevron-left"
  | "chevron-right"
  | "settings"
  | "logout"
  | "dots"
  | "check"
  | "x"
  | "send";

const GLYPHS: Record<IconName, string> = {
  home: "⌂",
  search: "⌕",
  bell: "🔔",
  mail: "✉",
  user: "👤",
  plus: "＋",
  heart: "♡",
  "heart-filled": "♥",
  "message-circle": "💬",
  share: "↗",
  image: "🖼",
  camera: "📷",
  "chevron-left": "‹",
  "chevron-right": "›",
  settings: "⚙",
  logout: "⎋",
  dots: "⋯",
  check: "✓",
  x: "✕",
  send: "➤",
};

export function Icon({
  name,
  size = 20,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Text style={{ fontSize: size, color, lineHeight: size + 2, includeFontPadding: false }}>
      {GLYPHS[name]}
    </Text>
  );
}
