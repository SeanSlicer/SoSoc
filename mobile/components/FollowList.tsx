import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
          <Icon name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>
          {kind === "followers" ? "Followers" : "Following"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {q.isLoading ? (
        <View style={{ padding: 24 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : hidden ? (
        <Text style={{ color: colors.textMuted, padding: 32, textAlign: "center" }}>
          This user has hidden their follow lists.
        </Text>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/profile/${item.username}`)}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Avatar url={item.photo} username={item.username} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>{item.username}</Text>
                {item.displayName ? (
                  <Text style={{ color: colors.textMuted }}>{item.displayName}</Text>
                ) : null}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={{ color: colors.textMuted, padding: 32, textAlign: "center" }}>
              {kind === "followers" ? "No followers yet." : "Not following anyone yet."}
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
