import { Pressable, Text, ActivityIndicator, type ViewStyle } from "react-native";
import { useTheme } from "~/lib/theme";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
}

export function Button({ title, onPress, disabled, loading, variant = "primary", style }: Props) {
  const { colors } = useTheme();

  const bg =
    variant === "primary"
      ? colors.accent
      : variant === "danger"
        ? colors.danger
        : variant === "ghost"
          ? "transparent"
          : colors.bgSubtle;

  const textColor =
    variant === "primary" || variant === "danger"
      ? "#ffffff"
      : variant === "ghost"
        ? colors.accent
        : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          flexDirection: "row",
          gap: 8,
          minHeight: 38,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={textColor} size="small" /> : null}
      <Text style={{ color: textColor, fontWeight: "700", fontSize: 14, letterSpacing: -0.1 }}>
        {title}
      </Text>
    </Pressable>
  );
}
