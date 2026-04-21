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

  const rows: Row[] = [
    { label: "Notification preferences", icon: "bell", href: "/settings/notifications" },
    { label: "Blocked users", icon: "x", href: "/settings/blocked" },
    { label: "Sign out", icon: "logout", onPress: () => void signOut(), destructive: true },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
          <Icon name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView>
        {rows.map((row) => (
          <Pressable
            key={row.label}
            onPress={() => (row.href ? router.push(row.href) : row.onPress?.())}
            style={({ pressed }) => [
              styles.row,
              { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Icon name={row.icon} size={20} color={row.destructive ? colors.danger : colors.text} />
            <Text
              style={{
                flex: 1,
                color: row.destructive ? colors.danger : colors.text,
                fontSize: 15,
                fontWeight: "500",
              }}
            >
              {row.label}
            </Text>
            {!row.destructive ? (
              <Icon name="chevron-right" size={20} color={colors.textFaint} />
            ) : null}
          </Pressable>
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
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
