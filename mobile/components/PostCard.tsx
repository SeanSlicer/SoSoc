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
        style={styles.header}
        onPress={() => router.push(`/profile/${post.author.username}`)}
      >
        <Avatar url={post.author.photo} username={post.author.username} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "600" }} numberOfLines={1}>
            {post.author.displayName ?? post.author.username}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }} numberOfLines={1}>
            @{post.author.username} · {timeAgo(new Date(post.createdAt))}
          </Text>
        </View>
      </Pressable>

      {post.content ? (
        <Text style={{ color: colors.text, paddingHorizontal: 14, paddingBottom: 10, lineHeight: 20 }}>
          {post.content}
        </Text>
      ) : null}

      {post.images.length > 0 ? <PostImageCarousel images={post.images} /> : null}

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => onToggleLike(post.id)} hitSlop={8}>
          <Icon
            name={post.isLiked ? "heart-filled" : "heart"}
            size={22}
            color={post.isLiked ? "#ef4444" : colors.text}
          />
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{post._count.likes}</Text>
        </Pressable>

        <Pressable style={styles.action} onPress={() => onOpenComments(post.id)} hitSlop={8}>
          <Icon name="message-circle" size={20} color={colors.text} />
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{post._count.comments}</Text>
        </Pressable>

        {onShare ? (
          <Pressable style={styles.action} onPress={() => onShare(post.id)} hitSlop={8}>
            <Icon name="share" size={20} color={colors.text} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingTop: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingBottom: 10 },
  actions: { flexDirection: "row", gap: 20, paddingHorizontal: 14, paddingVertical: 12 },
  action: { flexDirection: "row", alignItems: "center", gap: 6 },
});
