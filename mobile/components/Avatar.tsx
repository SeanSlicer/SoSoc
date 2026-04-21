import { View, Text } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "~/lib/theme";

interface Props {
  url?: string | null;
  username?: string | null;
  size?: number;
}

export function Avatar({ url, username, size = 40 }: Props) {
  const { colors } = useTheme();

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.bgSubtle,
        }}
        contentFit="cover"
        transition={120}
      />
    );
  }

  const initial = (username ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.bgSubtle,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: colors.textMuted, fontSize: size * 0.4, fontWeight: "600" }}>
        {initial}
      </Text>
    </View>
  );
}
