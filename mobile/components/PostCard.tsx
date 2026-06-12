import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { useTheme } from "~/lib/theme";
import { timeAgo } from "~/lib/timeAgo";
import { trpc } from "~/lib/trpc";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { PostImageCarousel } from "./PostImageCarousel";

export interface PostAuthor {
  id: string;
  username: string;
  displayName: string | null;
  photo: string | null;
}

export interface FeedPost {
  id: string;
  content: string | null;
  images: string[];
  videoUrl: string | null;
  createdAt: Date;
  type: "PHOTO" | "CAPTION" | "VIDEO";
  author: PostAuthor;
  isLiked: boolean;
  _count: { likes: number; comments: number };
}

interface Props {
  post: FeedPost;
  currentUserId?: string;
  onToggleLike: (postId: string) => void;
  onOpenComments: (postId: string) => void;
  onShare?: (postId: string) => void;
  onDeleted?: (postId: string) => void;
}

export function PostCard({ post, currentUserId, onToggleLike, onOpenComments, onShare, onDeleted }: Props) {
  const { colors } = useTheme();
  const utils = trpc.useUtils();
  const isOwn = !!currentUserId && post.author.id === currentUserId;

  const deleteMut = trpc.post.delete.useMutation({
    onSuccess: () => {
      void utils.post.getFeed.invalidate();
      void utils.post.getUserPosts.invalidate();
      onDeleted?.(post.id);
    },
  });

  const handleMorePress = () => {
    Alert.alert(
      "Post options",
      undefined,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete post",
          style: "destructive",
          onPress: () => {
            Alert.alert("Delete post?", "This can't be undone.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => deleteMut.mutate({ postId: post.id }),
              },
            ]);
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.card, { borderBottomColor: colors.border }]}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.authorRow, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push(`/profile/${post.author.username}`)}
        >
          <Avatar url={post.author.photo} username={post.author.username} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }} numberOfLines={1}>
              {post.author.displayName ?? post.author.username}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 1 }} numberOfLines={1}>
              @{post.author.username} · {timeAgo(new Date(post.createdAt))}
            </Text>
          </View>
        </Pressable>

        {isOwn && (
          <Pressable
            onPress={handleMorePress}
            hitSlop={10}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? colors.bgHover : "transparent",
            })}
          >
            <Icon name="dots" size={20} color={colors.textMuted} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      {post.content ? (
        <Text
          style={{
            color: colors.text,
            paddingHorizontal: 16,
            paddingBottom: 12,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          {post.content}
        </Text>
      ) : null}

      {post.images.length > 0 ? <PostImageCarousel images={post.images} /> : null}

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => onToggleLike(post.id)}
          hitSlop={10}
        >
          <Icon
            name={post.isLiked ? "heart-filled" : "heart"}
            size={24}
            color={post.isLiked ? colors.like : colors.textMuted}
            strokeWidth={1.9}
          />
          <Text
            style={{
              color: post.isLiked ? colors.like : colors.textMuted,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {post._count.likes}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => onOpenComments(post.id)}
          hitSlop={10}
        >
          <Icon name="message-circle" size={23} color={colors.textMuted} strokeWidth={1.9} />
          <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: "600" }}>
            {post._count.comments}
          </Text>
        </Pressable>

        {onShare ? (
          <Pressable
            style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
            onPress={() => onShare(post.id)}
            hitSlop={10}
          >
            <Icon name="share" size={22} color={colors.textMuted} strokeWidth={1.9} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingTop: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  authorRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 22,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 6 },
});
