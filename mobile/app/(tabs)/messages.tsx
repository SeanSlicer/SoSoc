import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { useAuth } from "~/lib/auth";
import { useRealtimeConversations } from "~/lib/realtime/useRealtimeConversations";
import { ConversationRow, type ConversationLike } from "~/components/ConversationRow";
import { Icon } from "~/components/Icon";

type Tab = "messages" | "requests" | "hidden";

export default function Messages() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const meQ = trpc.user.getMe.useQuery(undefined, { enabled: !user });
  const currentUserId = user?.id ?? meQ.data?.id ?? "";
  const [tab, setTab] = useState<Tab>("messages");

  const activeQ = trpc.messages.getConversations.useQuery(undefined, { enabled: tab === "messages" });
  const requestsQ = trpc.messages.getRequests.useQuery(undefined, { enabled: tab === "requests" });
  const hiddenQ = trpc.messages.getHidden.useQuery(undefined, { enabled: tab === "hidden" });
  const requestCountQ = trpc.messages.getRequestCount.useQuery();

  // Realtime subscription on the messages table — refetches the active view
  // when anything changes so unread counts and previews stay live.
  useRealtimeConversations(currentUserId);

  const utils = trpc.useUtils();
  const acceptMut = trpc.messages.acceptRequest.useMutation({
    onSuccess: () => {
      void utils.messages.getRequests.invalidate();
      void utils.messages.getConversations.invalidate();
      void utils.messages.getRequestCount.invalidate();
    },
  });
  const declineMut = trpc.messages.declineRequest.useMutation({
    onSuccess: () => {
      void utils.messages.getRequests.invalidate();
      void utils.messages.getRequestCount.invalidate();
    },
  });
  const hideMut = trpc.messages.hideConversation.useMutation({
    onSuccess: () => {
      void utils.messages.getConversations.invalidate();
      void utils.messages.getHidden.invalidate();
    },
  });
  const unhideMut = trpc.messages.unhideConversation.useMutation({
    onSuccess: () => {
      void utils.messages.getHidden.invalidate();
      void utils.messages.getConversations.invalidate();
    },
  });

  const q = tab === "messages" ? activeQ : tab === "requests" ? requestsQ : hiddenQ;
  const data = (q.data ?? []) as ConversationLike[];

  const handleLongPress = (convo: ConversationLike) => {
    if (tab === "messages") {
      Alert.alert("Conversation", undefined, [
        { text: "Cancel", style: "cancel" },
        { text: "Hide", style: "destructive", onPress: () => hideMut.mutate({ conversationId: convo.id }) },
      ]);
    } else if (tab === "requests") {
      Alert.alert("Message request", undefined, [
        { text: "Cancel", style: "cancel" },
        { text: "Accept", onPress: () => acceptMut.mutate({ conversationId: convo.id }) },
        { text: "Decline", style: "destructive", onPress: () => declineMut.mutate({ conversationId: convo.id }) },
      ]);
    } else {
      Alert.alert("Hidden conversation", undefined, [
        { text: "Cancel", style: "cancel" },
        { text: "Restore", onPress: () => unhideMut.mutate({ conversationId: convo.id }) },
      ]);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>Messages</Text>
        <Pressable onPress={() => router.push("/messages/new")} hitSlop={10} style={{ padding: 6 }}>
          <Icon name="plus" size={22} color={colors.text} />
        </Pressable>
      </View>
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <TabPill label="Messages" active={tab === "messages"} onPress={() => setTab("messages")} />
        <TabPill
          label="Requests"
          active={tab === "requests"}
          badge={requestCountQ.data ?? 0}
          onPress={() => setTab("requests")}
        />
        <TabPill label="Hidden" active={tab === "hidden"} onPress={() => setTab("hidden")} />
      </View>

      {q.isLoading ? (
        <View style={{ padding: 24 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ConversationRow
              convo={item}
              currentUserId={currentUserId}
              onPress={() => router.push(`/messages/${item.id}`)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={colors.accent} />}
          ListEmptyComponent={
            <Text style={{ color: colors.textMuted, padding: 32, textAlign: "center" }}>
              {tab === "messages"
                ? "No messages yet."
                : tab === "requests"
                  ? "No pending requests."
                  : "No hidden conversations."}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

function TabPill({ label, active, badge, onPress }: { label: string; active: boolean; badge?: number; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderBottomWidth: 2,
        borderBottomColor: active ? colors.text : "transparent",
      }}
    >
      <Text style={{ color: active ? colors.text : colors.textMuted, fontWeight: active ? "700" : "500" }}>
        {label}
      </Text>
      {badge && badge > 0 ? (
        <View
          style={{
            backgroundColor: colors.accent,
            borderRadius: 9,
            paddingHorizontal: 6,
            minWidth: 18,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
