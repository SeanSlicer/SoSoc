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
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
          Messages
        </Text>
        <Pressable
          onPress={() => router.push("/messages/new")}
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
          <Icon name="plus" size={20} color={colors.text} strokeWidth={2.4} />
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
        <View style={{ padding: 32 }}>
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
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching}
              onRefresh={() => void q.refetch()}
              tintColor={colors.accent}
            />
          }
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
                <Icon name="mail" size={28} color={colors.textFaint} strokeWidth={1.8} />
              </View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
                {tab === "messages"
                  ? "No conversations yet"
                  : tab === "requests"
                    ? "No pending requests"
                    : "Nothing hidden"}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center" }}>
                {tab === "messages"
                  ? "Tap + to start a new chat."
                  : tab === "requests"
                    ? "Message requests from new people will land here."
                    : "Conversations you hide will appear here."}
              </Text>
            </View>
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
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 14,
        borderBottomWidth: 2.5,
        borderBottomColor: active ? colors.accent : "transparent",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          color: active ? colors.text : colors.textMuted,
          fontWeight: active ? "700" : "600",
          fontSize: 15,
        }}
      >
        {label}
      </Text>
      {badge && badge > 0 ? (
        <View
          style={{
            backgroundColor: active ? colors.accent : colors.bgSubtle,
            borderRadius: 10,
            paddingHorizontal: 7,
            minWidth: 20,
            height: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: active ? "#ffffff" : colors.textMuted,
              fontSize: 11,
              fontWeight: "800",
            }}
          >
            {badge}
          </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
