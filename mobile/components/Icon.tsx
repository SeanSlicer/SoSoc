import {
  Bell,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  Image as ImageIcon,
  type LucideIcon,
  LogOut,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  Share2,
  User,
  X,
} from "lucide-react-native";

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

const ICONS: Record<IconName, LucideIcon> = {
  home: Home,
  search: Search,
  bell: Bell,
  mail: Mail,
  user: User,
  plus: Plus,
  heart: Heart,
  "heart-filled": Heart,
  "message-circle": MessageCircle,
  share: Share2,
  image: ImageIcon,
  camera: Camera,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  settings: Settings,
  logout: LogOut,
  dots: MoreHorizontal,
  check: Check,
  x: X,
  send: Send,
};

export function Icon({
  name,
  size = 22,
  color,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const Component = ICONS[name];
  const filled = name === "heart-filled";
  return (
    <Component
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      fill={filled ? color : "none"}
    />
  );
}
