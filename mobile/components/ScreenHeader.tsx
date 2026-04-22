import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "~/lib/theme";
import { Icon } from "./Icon";

interface Props {
  title: string;
  /** Optional element rendered on the right (action button, etc.). */
  right?: React.ReactNode;
  /** Custom back handler — defaults to `router.back()`. Set null to hide. */
  onBack?: (() => void) | null;
}

export function ScreenHeader({ title, right, onBack }: Props) {
  const { colors } = useTheme();
  const handleBack = onBack === null ? null : (onBack ?? (() => router.back()));

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      {handleBack ? (
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? colors.bgHover : "transparent",
          })}
        >
          <Icon name="chevron-left" size={22} color={colors.text} strokeWidth={2.4} />
        </Pressable>
      ) : (
        <View style={{ width: 36 }} />
      )}
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          color: colors.text,
          fontWeight: "700",
          fontSize: 17,
          textAlign: "center",
          letterSpacing: -0.2,
        }}
      >
        {title}
      </Text>
      <View style={{ width: 36, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
