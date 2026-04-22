import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { useAuth } from "~/lib/auth";
import { useRealtimeThread } from "~/lib/realtime/useRealtimeConversations";
import { timeAgo } from "~/lib/timeAgo";
import { Avatar } from "~/components/Avatar";
import { Icon } from "~/components/Icon";

export default function Thread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id ?? "";
  const { colors } = useTheme();
  const { user } = useAuth();
  const meQ = trpc.user.getMe.useQuery(undefined, { enabled: !user });
  const currentUserId = user?.id ?? meQ.data?.id ?? "";

  const utils = trpc.useUtils();
  const listRef = useRef<FlatList>(null);
  const [text, setText] = useState("");

  const messagesQ = trpc.messages.getMessages.useQuery({ conversationId });
  const conversationsQ = trpc.messages.getConversations.useQuery();
  const requestsQ = trpc.messages.getRequests.useQuery();
  const convo =
    conversationsQ.data?.find((c) => c.id === conversationId) ??
    requestsQ.data?.find((c) => c.id === conversationId);

  useRealtimeThread(conversationId);

  const sendMut = trpc.messages.send.useMutation({
    onSuccess: () => {
      setText("");
      void utils.messages.getMessages.invalidate({ conversationId });
      void utils.messages.getConversations.invalidate();
    },
  });

  const markReadMut = trpc.messages.markRead.useMutation();

  useEffect(() => {
    if (!conversationId) return;
    markReadMut.mutate({ conversationId });
    void utils.messages.getTotalUnread.invalidate();
    void utils.messages.getConversations.invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messagesQ.data?.messages.length]);

  const others = (convo?.members ?? []).filter((m) => m.userId !== currentUserId).map((m) => m.user);
  const title =
    convo?.name ??
    others[0]?.displayName ??
    others[0]?.username ??
    "Conversation";

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sendMut.isPending) return;
    sendMut.mutate({ conversationId, content: trimmed });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
          <Icon name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        {others[0] ? (
          <Avatar url={others[0].photo} username={others[0].username} size={32} />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
            {title}
          </Text>
          {others.length === 1 ? (
            <Text style={{ color: colors.textFaint, fontSize: 12 }}>@{others[0]?.username}</Text>
          ) : others.length > 1 ? (
            <Text style={{ color: colors.textFaint, fontSize: 12 }}>{others.length + 1} members</Text>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {messagesQ.isLoading ? (
          <View style={{ padding: 24 }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messagesQ.data?.messages ?? []}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 12 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item, index }) => {
              const isOwn = item.senderId === currentUserId;
              const prev = messagesQ.data?.messages[index - 1];
              const showAvatar = !isOwn && item.senderId !== prev?.senderId;
              return (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: isOwn ? "flex-end" : "flex-start",
                    alignItems: "flex-end",
                    marginVertical: 2,
                    gap: 6,
                  }}
                >
                  {!isOwn ? (
                    <View style={{ width: 28 }}>
                      {showAvatar ? (
                        <Avatar url={item.sender.photo} username={item.sender.username} size={28} />
                      ) : null}
                    </View>
                  ) : null}
                  <View style={{ maxWidth: "75%", alignItems: isOwn ? "flex-end" : "flex-start" }}>
                    {item.content ? (
                      <View
                        style={{
                          backgroundColor: isOwn ? colors.accent : colors.bgSubtle,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 16,
                          borderBottomRightRadius: isOwn ? 4 : 16,
                          borderBottomLeftRadius: isOwn ? 16 : 4,
                        }}
                      >
                        <Text style={{ color: isOwn ? "#ffffff" : colors.text, fontSize: 14 }}>
                          {item.content}
                        </Text>
                      </View>
                    ) : null}
                    {item.sharedPost ? (
                      <Pressable
                        onPress={() => router.push(`/profile/${item.sharedPost!.author.username}`)}
                        style={{
                          marginTop: 4,
                          padding: 10,
                          borderRadius: 12,
                          borderWidth: StyleSheet.hairlineWidth,
                          borderColor: colors.border,
                          backgroundColor: colors.bgSubtle,
                          maxWidth: 260,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <Avatar
                            url={item.sharedPost.author.photo}
                            username={item.sharedPost.author.username}
                            size={20}
                          />
                          <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>
                            {item.sharedPost.author.displayName ?? item.sharedPost.author.username}
                          </Text>
                        </View>
                        {item.sharedPost.content ? (
                          <Text numberOfLines={2} style={{ color: colors.textMuted, fontSize: 12 }}>
                            {item.sharedPost.content}
                          </Text>
                        ) : null}
                      </Pressable>
                    ) : null}
                    <Text style={{ color: colors.textFaint, fontSize: 10, marginTop: 2, paddingHorizontal: 4 }}>
                      {timeAgo(new Date(item.createdAt))}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor={colors.textFaint}
            multiline
            style={{
              flex: 1,
              minHeight: 40,
              maxHeight: 120,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 20,
              backgroundColor: colors.bgSubtle,
              color: colors.text,
              fontSize: 14,
            }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || sendMut.isPending}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
              opacity: !text.trim() || sendMut.isPending ? 0.5 : 1,
            }}
          >
            <Icon name="send" size={16} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
