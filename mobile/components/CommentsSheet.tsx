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
          <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}>Comments</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Icon name="x" size={18} color={colors.text} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
          style={{ flex: 1 }}
        >
          {commentsQ.isLoading ? (
            <View style={{ padding: 20 }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={comments}
              keyExtractor={(c) => c.id}
              contentContainerStyle={{ padding: 14, gap: 14 }}
              onEndReached={() => commentsQ.hasNextPage && commentsQ.fetchNextPage()}
              onEndReachedThreshold={0.4}
              renderItem={({ item }) => (
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Avatar url={item.user.photo} username={item.user.username} size={32} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", gap: 6, alignItems: "baseline" }}>
                      <Text style={{ color: colors.text, fontWeight: "600" }}>
                        {item.user.displayName ?? item.user.username}
                      </Text>
                      <Text style={{ color: colors.textFaint, fontSize: 12 }}>
                        {timeAgo(new Date(item.createdAt))}
                      </Text>
                    </View>
                    <Text style={{ color: colors.text, marginTop: 2 }}>{item.content}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={{ color: colors.textMuted, textAlign: "center", paddingVertical: 24 }}>
                  Be the first to comment
                </Text>
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
              placeholder="Add a comment"
              placeholderTextColor={colors.textFaint}
              value={draft}
              onChangeText={setDraft}
              style={[
                styles.input,
                { backgroundColor: colors.bgSubtle, color: colors.text, borderColor: colors.border },
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
                  opacity: !draft.trim() || addMut.isPending ? 0.4 : pressed ? 0.8 : 1,
                },
              ]}
              hitSlop={8}
            >
              <Icon name="send" size={16} color="#ffffff" />
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
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
