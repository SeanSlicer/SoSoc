import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "~/lib/auth";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { ProfileView } from "~/components/ProfileView";

export default function MyProfile() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const meQ = trpc.user.getMe.useQuery(undefined, { enabled: !user });
  const username = user?.username ?? meQ.data?.username;

  if (!username) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ProfileView
        username={username}
        isOwnProfile
        onEdit={() => router.push("/profile/edit")}
        onOpenSettings={() => router.push("/settings")}
      />
    </View>
  );
}
