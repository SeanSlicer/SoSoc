import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "~/lib/theme";
import { timeAgo } from "~/lib/timeAgo";
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
  onToggleLike: (postId: string) => void;
  onOpenComments: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export function PostCard({ post, onToggleLike, onOpenComments, onShare }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { borderBottomColor: colors.border }]}>
      <Pressable
        style={({ pressed }) => [styles.header, { opacity: pressed ? 0.7 : 1 }]}
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
            color={post.isLiked ? colors.like : colors.text}
            strokeWidth={1.9}
          />
          {post._count.likes > 0 ? (
            <Text
              style={{
                color: post.isLiked ? colors.like : colors.textSecondary,
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {post._count.likes}
            </Text>
          ) : null}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => onOpenComments(post.id)}
          hitSlop={10}
        >
          <Icon name="message-circle" size={23} color={colors.text} strokeWidth={1.9} />
          {post._count.comments > 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "600" }}>
              {post._count.comments}
            </Text>
          ) : null}
        </Pressable>

        {onShare ? (
          <Pressable
            style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
            onPress={() => onShare(post.id)}
            hitSlop={10}
          >
            <Icon name="share" size={22} color={colors.text} strokeWidth={1.9} />
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
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
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
