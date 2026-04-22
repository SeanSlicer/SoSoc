import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "~/lib/auth";
import { useTheme } from "~/lib/theme";

export default function Index() {
  const { status } = useAuth();
  const { colors } = useTheme();

  // Silence unused warning when status is "signedIn"/"signedOut" (both Redirect)
  useEffect(() => {
    /* noop */
  }, [status]);

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return status === "signedIn" ? <Redirect href="/(tabs)/feed" /> : <Redirect href="/(auth)/login" />;
}
