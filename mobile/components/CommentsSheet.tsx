import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { timeAgo } from "~/lib/timeAgo";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

interface Props {
  postId: string | null;
  onClose: () => void;
}

export function CommentsSheet({ postId, onClose }: Props) {
  const { colors } = useTheme();
  const utils = trpc.useUtils();
  const listRef = useRef<FlatList>(null);
  const [draft, setDraft] = useState("");

  const commentsQ = trpc.post.getComments.useInfiniteQuery(
    { postId: postId ?? "", limit: 20 },
    {
      enabled: !!postId,
      getNextPageParam: (last) => last.nextCursor,
    },
  );

  const addMut = trpc.post.addComment.useMutation({
    onSuccess: async () => {
      setDraft("");
      if (postId) {
        await utils.post.getComments.invalidate({ postId });
        await utils.post.getFeed.invalidate();
      }
    },
  });

  useEffect(() => {
    if (!postId) setDraft("");
  }, [postId]);

  const comments = commentsQ.data?.pages.flatMap((p) => p.comments) ?? [];

  const handleSend = () => {
    if (!postId || !draft.trim()) return;
    addMut.mutate({ postId, content: draft.trim() });
  };

  return (
    <Modal
      visible={!!postId}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 17 }}>Comments</Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? colors.bgHover : colors.bgSubtle,
            })}
          >
            <Icon name="x" size={16} color={colors.text} strokeWidth={2.4} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
          style={{ flex: 1 }}
        >
          {commentsQ.isLoading ? (
            <View style={{ padding: 32 }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={comments}
              keyExtractor={(c) => c.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 16 }}
              onEndReached={() => commentsQ.hasNextPage && commentsQ.fetchNextPage()}
              onEndReachedThreshold={0.4}
              renderItem={({ item }) => (
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Avatar url={item.user.photo} username={item.user.username} size={36} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: "row", gap: 6, alignItems: "baseline" }}>
                      <Text style={{ color: colors.text, fontWeight: "700", fontSize: 14 }}>
                        {item.user.displayName ?? item.user.username}
                      </Text>
                      <Text style={{ color: colors.textFaint, fontSize: 12 }}>
                        {timeAgo(new Date(item.createdAt))}
                      </Text>
                    </View>
                    <Text style={{ color: colors.text, fontSize: 14, lineHeight: 19 }}>
                      {item.content}
                    </Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={{ padding: 48, alignItems: "center" }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: colors.bgSubtle,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 14,
                    }}
                  >
                    <Icon
                      name="message-circle"
                      size={24}
                      color={colors.textFaint}
                      strokeWidth={1.8}
                    />
                  </View>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>
                    No comments yet
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                    Be the first to say something.
                  </Text>
                </View>
              }
            />
          )}

          <View
            style={[
              styles.inputRow,
              { backgroundColor: colors.bg, borderTopColor: colors.border },
            ]}
          >
            <TextInput
              placeholder="Add a comment…"
              placeholderTextColor={colors.textFaint}
              value={draft}
              onChangeText={setDraft}
              style={[
                styles.input,
                { backgroundColor: colors.bgSubtle, color: colors.text },
              ]}
              maxLength={300}
              multiline
            />
            <Pressable
              onPress={handleSend}
              disabled={!draft.trim() || addMut.isPending}
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor: colors.accent,
                  opacity: !draft.trim() || addMut.isPending ? 0.45 : pressed ? 0.85 : 1,
                },
              ]}
              hitSlop={8}
            >
              <Icon name="send" size={18} color="#ffffff" strokeWidth={2.4} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 20,
    minHeight: 44,
    maxHeight: 140,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
