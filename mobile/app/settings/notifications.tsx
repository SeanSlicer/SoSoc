import {
  View,
  Text,
  Switch,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { Icon } from "~/components/Icon";

type PrefKey =
  | "notifyNewFollower"
  | "notifyNewLike"
  | "notifyNewComment"
  | "notifyFollowRequest"
  | "notifyFollowAccepted"
  | "notifyNewMessage";

const PREFS: { key: PrefKey; label: string; description: string }[] = [
  { key: "notifyNewFollower", label: "New followers", description: "When someone follows you" },
  { key: "notifyNewLike", label: "Likes", description: "When someone likes your post" },
  { key: "notifyNewComment", label: "Comments", description: "When someone comments on your post" },
  { key: "notifyFollowRequest", label: "Follow requests", description: "When someone requests to follow you" },
  { key: "notifyFollowAccepted", label: "Follow request accepted", description: "When your follow request is accepted" },
  { key: "notifyNewMessage", label: "Direct messages", description: "When you receive a new message" },
];

export default function NotificationPrefs() {
  const { colors } = useTheme();
  const utils = trpc.useUtils();
  const prefsQ = trpc.notification.getPrefs.useQuery();
  const updateMut = trpc.notification.updatePrefs.useMutation({
    onSuccess: () => void utils.notification.getPrefs.invalidate(),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
          <Icon name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      {prefsQ.isLoading ? (
        <View style={{ padding: 24 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView>
          {PREFS.map(({ key, label, description }) => {
            const enabled = prefsQ.data?.[key] ?? true;
            return (
              <View
                key={key}
                style={[styles.row, { borderBottomColor: colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "500", fontSize: 14 }}>
                    {label}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    {description}
                  </Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={(value) => updateMut.mutate({ [key]: value })}
                  trackColor={{ false: colors.border, true: colors.accent }}
                />
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
