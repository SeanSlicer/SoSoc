import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";
import { ScreenHeader } from "~/components/ScreenHeader";

export default function Blocked() {
  const { colors } = useTheme();
  const utils = trpc.useUtils();
  const blockedQ = trpc.user.getBlockedUsers.useQuery();
  const unblockMut = trpc.user.unblock.useMutation({
    onSuccess: () => void utils.user.getBlockedUsers.invalidate(),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScreenHeader title="Blocked users" />

      {blockedQ.isLoading ? (
        <View style={{ padding: 32 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={blockedQ.data ?? []}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <Avatar url={item.photo} username={item.username} size={44} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
                  {item.displayName ?? item.username}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>@{item.username}</Text>
              </View>
              <Button
                title="Unblock"
                variant="secondary"
                onPress={() => unblockMut.mutate({ userId: item.id })}
                style={{ paddingVertical: 7, paddingHorizontal: 14 }}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={{ padding: 48, alignItems: "center" }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.bgSubtle,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Icon name="x" size={26} color={colors.textFaint} strokeWidth={2} />
              </View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
                No blocked users
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center" }}>
                People you block will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
