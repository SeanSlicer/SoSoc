import { Tabs, Redirect } from "expo-router";
import { View, Text, Platform } from "react-native";
import { useAuth } from "~/lib/auth";
import { useTheme } from "~/lib/theme";
import { Icon, type IconName } from "~/components/Icon";
import { trpc } from "~/lib/trpc";

/**
 * Renders a tab bar icon along with an optional unread-count badge. The badge
 * uses the theme's "like" color so it pops against both light and dark.
 */
function TabIcon({
  name,
  color,
  focused,
  badgeCount,
}: {
  name: IconName;
  color: string;
  focused: boolean;
  badgeCount?: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Icon name={name} size={26} color={color} strokeWidth={focused ? 2.4 : 1.9} />
      {badgeCount && badgeCount > 0 ? (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -10,
            backgroundColor: colors.like,
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 5,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1.5,
            borderColor: colors.bg,
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "800" }}>
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

  const notifQ = trpc.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
    enabled: status === "signedIn",
  });
  const msgQ = trpc.messages.getTotalUnread.useQuery(undefined, {
    refetchInterval: 60_000,
    enabled: status === "signedIn",
  });

  if (status === "loading") return null;
  if (status === "signedOut") return <Redirect href="/(auth)/login" />;

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
          borderTopWidth: 0.5,
          height: Platform.OS === "ios" ? 84 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
        },
        tabBarItemStyle: { paddingTop: 4 },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="search" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="compose"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="plus" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="bell" color={color} focused={focused} badgeCount={notifQ.data ?? 0} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="mail" color={color} focused={focused} badgeCount={msgQ.data ?? 0} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="user" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
