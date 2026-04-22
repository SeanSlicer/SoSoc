import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "~/lib/auth";
import { useTheme } from "~/lib/theme";
import { Icon, type IconName } from "~/components/Icon";

interface Row {
  label: string;
  icon: IconName;
  href?: string;
  onPress?: () => void;
  destructive?: boolean;
}

export default function Settings() {
  const { colors } = useTheme();
  const { signOut } = useAuth();

  const sections: { title?: string; rows: Row[] }[] = [
    {
      rows: [
        { label: "Notification preferences", icon: "bell", href: "/settings/notifications" },
        { label: "Blocked users", icon: "x", href: "/settings/blocked" },
      ],
    },
    {
      rows: [{ label: "Sign out", icon: "logout", onPress: () => void signOut(), destructive: true }],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
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
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 17 }}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}>
        {sections.map((section, sIdx) => (
          <View key={sIdx} style={{ marginBottom: 24 }}>
            <View
              style={{
                marginHorizontal: 16,
                borderRadius: 14,
                overflow: "hidden",
                backgroundColor: colors.surface,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
              }}
            >
              {section.rows.map((row, rIdx) => (
                <Pressable
                  key={row.label}
                  onPress={() => (row.href ? router.push(row.href) : row.onPress?.())}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: pressed ? colors.bgHover : "transparent",
                      borderTopWidth: rIdx > 0 ? StyleSheet.hairlineWidth : 0,
                      borderTopColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: row.destructive ? colors.dangerBg : colors.bgSubtle,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      name={row.icon}
                      size={17}
                      color={row.destructive ? colors.danger : colors.text}
                      strokeWidth={2.2}
                    />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      color: row.destructive ? colors.danger : colors.text,
                      fontSize: 16,
                      fontWeight: "500",
                    }}
                  >
                    {row.label}
                  </Text>
                  {!row.destructive ? (
                    <Icon name="chevron-right" size={20} color={colors.textFaint} strokeWidth={2} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
