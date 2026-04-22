import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "~/lib/auth";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { ProfileView } from "~/components/ProfileView";
import { Icon } from "~/components/Icon";

export default function UserProfile() {
  const { colors } = useTheme();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { user } = useAuth();
  const meQ = trpc.user.getMe.useQuery(undefined, { enabled: !user });
  const meUsername = user?.username ?? meQ.data?.username;
  const isOwn = meUsername === username;

  const dmMut = trpc.messages.getOrCreateDM.useMutation({
    onSuccess: (convo) => {
      router.push(`/messages/${convo.id}`);
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
          <Icon name="chevron-left" size={24} color={colors.text} />
        </Pressable>
      </View>
      {username ? (
        <ProfileView
          username={username}
          isOwnProfile={isOwn}
          onEdit={() => router.push("/profile/edit")}
          onMessage={(userId) => dmMut.mutate({ userId })}
        />
      ) : null}
    </SafeAreaView>
  );
}
