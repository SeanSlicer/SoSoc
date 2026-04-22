import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";

export default function Blocked() {
  const { colors } = useTheme();
  const utils = trpc.useUtils();
  const blockedQ = trpc.user.getBlockedUsers.useQuery();
  const unblockMut = trpc.user.unblock.useMutation({
    onSuccess: () => void utils.user.getBlockedUsers.invalidate(),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
          <Icon name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>Blocked users</Text>
        <View style={{ width: 36 }} />
      </View>

      {blockedQ.isLoading ? (
        <View style={{ padding: 24 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={blockedQ.data ?? []}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <Avatar url={item.photo} username={item.username} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>{item.username}</Text>
                {item.displayName ? (
                  <Text style={{ color: colors.textMuted }}>{item.displayName}</Text>
                ) : null}
              </View>
              <Button
                title="Unblock"
                variant="secondary"
                onPress={() => unblockMut.mutate({ userId: item.id })}
                style={{ paddingVertical: 6, paddingHorizontal: 12 }}
              />
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: colors.textMuted, padding: 32, textAlign: "center" }}>
              You haven't blocked anyone.
            </Text>
          }
        />
      )}
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
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
