import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { PostCard, type FeedPost } from "~/components/PostCard";
import { CommentsSheet } from "~/components/CommentsSheet";

type FeedType = "all" | "following";

export default function Feed() {
  const { colors } = useTheme();
  const utils = trpc.useUtils();
  const [feedType, setFeedType] = useState<FeedType>("all");
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const feedQ = trpc.post.getFeed.useInfiniteQuery(
    { feedType },
    { getNextPageParam: (last) => last.nextCursor },
  );

  const likeMut = trpc.post.toggleLike.useMutation({
    onMutate: async ({ postId }) => {
      await utils.post.getFeed.cancel();
      const snapshot = utils.post.getFeed.getInfiniteData({ feedType });
      utils.post.getFeed.setInfiniteData({ feedType }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    isLiked: !p.isLiked,
                    _count: { ...p._count, likes: p._count.likes + (p.isLiked ? -1 : 1) },
                  }
                : p,
            ),
          })),
        };
      });
      return { snapshot };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.snapshot) utils.post.getFeed.setInfiniteData({ feedType }, ctx.snapshot);
    },
    onSettled: () => utils.post.getFeed.invalidate({ feedType }),
  });

  const posts = (feedQ.data?.pages.flatMap((p) => p.posts) ?? []) as FeedPost[];

  const handleToggleLike = useCallback(
    (postId: string) => {
      likeMut.mutate({ postId });
    },
    [likeMut],
  );

  const onRefresh = useCallback(() => {
    void feedQ.refetch();
  }, [feedQ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <FeedTab label="For you" active={feedType === "all"} onPress={() => setFeedType("all")} />
        <FeedTab
          label="Following"
          active={feedType === "following"}
          onPress={() => setFeedType("following")}
        />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onToggleLike={handleToggleLike}
            onOpenComments={(id) => setCommentsPostId(id)}
          />
        )}
        onEndReached={() => feedQ.hasNextPage && feedQ.fetchNextPage()}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={feedQ.isRefetching && !feedQ.isFetchingNextPage}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        ListFooterComponent={
          feedQ.isFetchingNextPage ? (
            <View style={{ padding: 20 }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          feedQ.isLoading ? (
            <View style={{ padding: 40 }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ color: colors.textMuted, textAlign: "center" }}>
                {feedType === "following"
                  ? "Follow someone to fill this feed."
                  : "Nothing to show yet — come back soon."}
              </Text>
            </View>
          )
        }
      />

      <CommentsSheet postId={commentsPostId} onClose={() => setCommentsPostId(null)} />
    </SafeAreaView>
  );
}

function FeedTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderBottomWidth: 2,
        borderBottomColor: active ? colors.text : "transparent",
      }}
    >
      <Text
        style={{
          color: active ? colors.text : colors.textMuted,
          fontWeight: active ? "700" : "500",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
