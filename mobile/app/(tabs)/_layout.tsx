import { Tabs, Redirect } from "expo-router";
import { View, Text } from "react-native";
import { useAuth } from "~/lib/auth";
import { useTheme } from "~/lib/theme";
import { Icon, type IconName } from "~/components/Icon";
import { trpc } from "~/lib/trpc";

/**
 * Renders the tab bar icon along with an optional unread-count badge. The
 * badge is only shown when `count > 0`.
 */
function TabIcon({ name, color, badgeCount }: { name: IconName; color: string; badgeCount?: number }) {
  return (
    <View>
      <Icon name={name} size={22} color={color} />
      {badgeCount && badgeCount > 0 ? (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -10,
            backgroundColor: "#ef4444",
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "700" }}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  const { status } = useAuth();
  const { colors } = useTheme();

  if (status === "loading") return null;
  if (status === "signedOut") return <Redirect href="/(auth)/login" />;

  const notifQ = trpc.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const msgQ = trpc.messages.getTotalUnread.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          height: 60,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="compose"
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="plus" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon name="bell" color={color} badgeCount={notifQ.data ?? 0} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon name="mail" color={color} badgeCount={msgQ.data ?? 0} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
