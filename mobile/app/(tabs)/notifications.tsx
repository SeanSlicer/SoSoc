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

export default function Notifications() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const meQ = trpc.user.getMe.useQuery(undefined, { enabled: !user });
  const currentUserId = user?.id ?? meQ.data?.id ?? "";

  const TYPE_COLOR: Partial<Record<NotificationType, string>> = {
    NEW_LIKE: colors.like,
    NEW_COMMENT: colors.accent,
    NEW_FOLLOWER: colors.success,
    FOLLOW_REQUEST_ACCEPTED: colors.success,
    FOLLOW_REQUEST: colors.warning,
    NEW_MESSAGE: colors.accent,
    FRIEND_REQUEST: colors.success,
  };

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
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
          Notifications
        </Text>
        <Pressable
          onPress={() => router.push("/settings/notifications")}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? colors.bgHover : colors.bgSubtle,
          })}
        >
          <Icon name="settings" size={18} color={colors.text} strokeWidth={2.2} />
        </Pressable>
      </View>

      {q.isLoading ? (
        <View style={{ padding: 32 }}>
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
                  backgroundColor: !item.isRead
                    ? colors.accentBg
                    : pressed
                      ? colors.bgHover
                      : "transparent",
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View>
                {item.actor ? (
                  <Avatar url={item.actor.photo} username={item.actor.username} size={48} />
                ) : (
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: colors.bgSubtle,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="bell" size={20} color={colors.textMuted} />
                  </View>
                )}
                <View
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: TYPE_COLOR[item.type] ?? colors.textMuted,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: colors.bg,
                  }}
                >
                  <Icon name={TYPE_GLYPH[item.type]} size={11} color="#ffffff" strokeWidth={2.5} />
                </View>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ color: colors.text, fontSize: 14, lineHeight: 19 }}>
                  {item.content}
                </Text>
                <Text style={{ color: colors.textFaint, fontSize: 12, fontWeight: "500" }}>
                  {timeAgo(new Date(item.createdAt))}
                </Text>
              </View>
              {!item.isRead ? (
                <View
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    backgroundColor: colors.accent,
                  }}
                />
              ) : null}
            </Pressable>
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
                <Icon name="bell" size={28} color={colors.textFaint} strokeWidth={1.8} />
              </View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
                You're all caught up
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center" }}>
                Likes, comments, and new followers will land here.
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
