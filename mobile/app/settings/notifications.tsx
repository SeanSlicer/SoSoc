import {
  View,
  Text,
  Switch,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { ScreenHeader } from "~/components/ScreenHeader";

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
      <ScreenHeader title="Notifications" />

      {prefsQ.isLoading ? (
        <View style={{ padding: 32 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}>
          <View
            style={{
              marginHorizontal: 16,
              borderRadius: 14,
              overflow: "hidden",
              backgroundColor: colors.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
            }}
          >
            {PREFS.map(({ key, label, description }, idx) => {
              const enabled = prefsQ.data?.[key] ?? true;
              return (
                <View
                  key={key}
                  style={[
                    styles.row,
                    {
                      borderTopWidth: idx > 0 ? StyleSheet.hairlineWidth : 0,
                      borderTopColor: colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>
                      {label}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 3 }}>
                      {description}
                    </Text>
                  </View>
                  <Switch
                    value={enabled}
                    onValueChange={(value) => updateMut.mutate({ [key]: value })}
                    trackColor={{ false: colors.borderStrong, true: colors.accent }}
                    thumbColor="#ffffff"
                    ios_backgroundColor={colors.borderStrong}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
});
