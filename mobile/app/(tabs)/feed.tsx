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
import { useAuth } from "~/lib/auth";
import { PostCard, type FeedPost } from "~/components/PostCard";
import { CommentsSheet } from "~/components/CommentsSheet";

type FeedType = "all" | "following";

function PostCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.skeleton, { borderBottomColor: colors.border }]}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgSubtle }} />
        <View style={{ flex: 1, gap: 7 }}>
          <View style={{ height: 13, width: "48%", borderRadius: 6, backgroundColor: colors.bgSubtle }} />
          <View style={{ height: 11, width: "32%", borderRadius: 5, backgroundColor: colors.bgSubtle }} />
        </View>
      </View>
      <View style={{ gap: 7 }}>
        <View style={{ height: 12, width: "100%", borderRadius: 6, backgroundColor: colors.bgSubtle }} />
        <View style={{ height: 12, width: "82%", borderRadius: 6, backgroundColor: colors.bgSubtle }} />
        <View style={{ height: 12, width: "63%", borderRadius: 6, backgroundColor: colors.bgSubtle }} />
      </View>
      <View style={{ flexDirection: "row", gap: 20, marginTop: 14 }}>
        <View style={{ height: 11, width: 36, borderRadius: 5, backgroundColor: colors.bgSubtle }} />
        <View style={{ height: 11, width: 36, borderRadius: 5, backgroundColor: colors.bgSubtle }} />
      </View>
    </View>
  );
}

export default function Feed() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const meQ = trpc.user.getMe.useQuery(undefined, { enabled: !user });
  const currentUserId = user?.id ?? meQ.data?.id;

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
      <View style={[styles.titleBar, { borderBottomColor: colors.border }]}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
          sosoc
        </Text>
      </View>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <FeedTab label="For you" active={feedType === "all"} onPress={() => setFeedType("all")} />
        <FeedTab
          label="Following"
          active={feedType === "following"}
          onPress={() => setFeedType("following")}
        />
      </View>

      {feedQ.isLoading ? (
        <>
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={currentUserId}
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
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ color: colors.textMuted, textAlign: "center" }}>
                {feedType === "following"
                  ? "Follow someone to fill this feed."
                  : "Nothing to show yet — come back soon."}
              </Text>
            </View>
          }
        />
      )}

      <CommentsSheet
        postId={commentsPostId}
        currentUserId={currentUserId}
        onClose={() => setCommentsPostId(null)}
      />
    </SafeAreaView>
  );
}

function FeedTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  skeleton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
