import { Stack, Redirect } from "expo-router";
import { useAuth } from "~/lib/auth";

export default function AuthLayout() {
  const { status } = useAuth();

  // Already signed in? Bounce into the app.
  if (status === "signedIn") return <Redirect href="/(tabs)/feed" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
}
