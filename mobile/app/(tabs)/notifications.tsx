import { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { useAuth } from "~/lib/auth";
import { useRealtimeNotifications } from "~/lib/realtime/useRealtimeNotifications";
import { Avatar } from "~/components/Avatar";
import { Icon, type IconName } from "~/components/Icon";
import { timeAgo } from "~/lib/timeAgo";
import type { NotificationType } from "@prisma/client";

const TYPE_GLYPH: Record<NotificationType, IconName> = {
  NEW_LIKE: "heart-filled",
  NEW_COMMENT: "message-circle",
  NEW_FOLLOWER: "user",
  FOLLOW_REQUEST: "user",
  FOLLOW_REQUEST_ACCEPTED: "check",
  NEW_MESSAGE: "mail",
  FRIEND_REQUEST: "user",
};

const TYPE_COLOR: Partial<Record<NotificationType, string>> = {
  NEW_LIKE: "#ef4444",
  NEW_COMMENT: "#6366f1",
  NEW_FOLLOWER: "#10b981",
  FOLLOW_REQUEST_ACCEPTED: "#10b981",
  FOLLOW_REQUEST: "#f59e0b",
};

export default function Notifications() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const meQ = trpc.user.getMe.useQuery(undefined, { enabled: !user });
  const currentUserId = user?.id ?? meQ.data?.id ?? "";

  const utils = trpc.useUtils();
  const q = trpc.notification.getAll.useQuery();

  useRealtimeNotifications(currentUserId);

  const markAllReadMut = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      void utils.notification.getUnreadCount.invalidate();
      void utils.notification.getAll.invalidate();
    },
  });

  useEffect(() => {
    markAllReadMut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>Notifications</Text>
        <Pressable
          onPress={() => router.push("/settings/notifications")}
          hitSlop={10}
          style={{ padding: 6 }}
        >
          <Icon name="settings" size={20} color={colors.text} />
        </Pressable>
      </View>

      {q.isLoading ? (
        <View style={{ padding: 24 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={q.data ?? []}
          keyExtractor={(n) => n.id}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching}
              onRefresh={() => void q.refetch()}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                if (item.actor) router.push(`/profile/${item.actor.username}`);
              }}
              style={({ pressed }) => [
                styles.row,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: !item.isRead ? colors.accentBg : "transparent",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View>
                {item.actor ? (
                  <Avatar url={item.actor.photo} username={item.actor.username} size={44} />
                ) : (
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: colors.bgSubtle,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="bell" size={18} color={colors.textMuted} />
                  </View>
                )}
                <View
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: colors.bg,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Icon
                    name={TYPE_GLYPH[item.type]}
                    size={11}
                    color={TYPE_COLOR[item.type] ?? colors.textMuted}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 14 }}>{item.content}</Text>
                <Text style={{ color: colors.textFaint, fontSize: 11, marginTop: 2 }}>
                  {timeAgo(new Date(item.createdAt))}
                </Text>
              </View>
              {!item.isRead ? (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.accent,
                  }}
                />
              ) : null}
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={{ padding: 48, alignItems: "center" }}>
              <Icon name="bell" size={40} color={colors.textFaint} />
              <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>
                No notifications yet.
              </Text>
              <Text style={{ color: colors.textFaint, marginTop: 4, fontSize: 12, textAlign: "center" }}>
                When someone follows you, likes or comments on a post, it'll show up here.
              </Text>
            </View>
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
