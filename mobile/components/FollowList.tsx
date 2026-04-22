import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { Avatar } from "./Avatar";
import { ScreenHeader } from "./ScreenHeader";

interface Props {
  username: string;
  kind: "followers" | "following";
}

export function FollowList({ username, kind }: Props) {
  const { colors } = useTheme();
  const followersQ = trpc.user.getFollowers.useQuery({ username }, { enabled: kind === "followers" });
  const followingQ = trpc.user.getFollowing.useQuery({ username }, { enabled: kind === "following" });
  const q = kind === "followers" ? followersQ : followingQ;
  const hidden = q.data?.hidden ?? false;
  const list = q.data?.list ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScreenHeader title={kind === "followers" ? "Followers" : "Following"} />

      {q.isLoading ? (
        <View style={{ padding: 32 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : hidden ? (
        <View style={{ padding: 48, alignItems: "center" }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
            Hidden
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center" }}>
            This user has chosen to hide their follow lists.
          </Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/profile/${item.username}`)}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: pressed ? colors.bgHover : "transparent" },
              ]}
            >
              <Avatar url={item.photo} username={item.username} size={48} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
                  {item.displayName ?? item.username}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>@{item.username}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={{ padding: 48, alignItems: "center" }}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                {kind === "followers" ? "No followers yet." : "Not following anyone yet."}
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
  },
});
