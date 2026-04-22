import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "~/lib/theme";
import { timeAgo } from "~/lib/timeAgo";
import { Avatar } from "./Avatar";

interface Member {
  userId: string;
  user: { id: string; username: string; displayName: string | null; photo: string | null };
}

interface LastMessage {
  id: string;
  content: string | null;
  createdAt: Date;
  senderId: string;
  sharedPostId: string | null;
}

export interface ConversationLike {
  id: string;
  name: string | null;
  members: Member[];
  messages: LastMessage[];
  unread: number;
}

interface Props {
  convo: ConversationLike;
  currentUserId: string;
  onPress: () => void;
  onLongPress?: () => void;
}

export function ConversationRow({ convo, currentUserId, onPress, onLongPress }: Props) {
  const { colors } = useTheme();

  const others = convo.members.filter((m) => m.userId !== currentUserId).map((m) => m.user);
  const title =
    convo.name ??
    others.map((u) => u.displayName ?? u.username).join(", ") ??
    "Conversation";

  const last = convo.messages[0];
  const preview = last
    ? last.sharedPostId
      ? "Shared a post"
      : (last.content ?? "")
    : "No messages yet";

  const isUnread = convo.unread > 0;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Avatar url={others[0]?.photo} username={others[0]?.username} size={48} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <Text
            numberOfLines={1}
            style={{ color: colors.text, fontWeight: isUnread ? "700" : "600", flex: 1 }}
          >
            {title}
          </Text>
          {last ? (
            <Text style={{ color: colors.textFaint, fontSize: 12, marginLeft: 8 }}>
              {timeAgo(new Date(last.createdAt))}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              color: isUnread ? colors.text : colors.textMuted,
              fontWeight: isUnread ? "600" : "400",
              fontSize: 13,
            }}
          >
            {preview}
          </Text>
          {isUnread ? (
            <View
              style={{
                backgroundColor: colors.accent,
                borderRadius: 10,
                paddingHorizontal: 6,
                minWidth: 18,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>
                {convo.unread > 99 ? "99+" : convo.unread}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
