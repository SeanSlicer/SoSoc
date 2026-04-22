import { useState } from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "~/lib/theme";

interface Props {
  url?: string | null;
  username?: string | null;
  size?: number;
}

/**
 * Always renders the initial-letter fallback underneath the avatar image.
 * The image fades in over the fallback once loaded — and if it errors, the
 * fallback stays visible so the avatar is never an empty grey circle.
 */
export function Avatar({ url, username, size = 40 }: Props) {
  const { colors } = useTheme();
  const [errored, setErrored] = useState(false);

  const initial = (username ?? "?").trim().charAt(0).toUpperCase() || "?";
  const showImage = !!url && !errored;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.bgSubtle,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Text
        style={{
          color: colors.textMuted,
          fontSize: size * 0.42,
          fontWeight: "700",
          letterSpacing: -0.5,
        }}
      >
        {initial}
      </Text>
      {showImage ? (
        <Image
          source={{ uri: url ?? undefined }}
          style={{ position: "absolute", top: 0, left: 0, width: size, height: size }}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          onError={() => setErrored(true)}
        />
      ) : null}
    </View>
  );
}
