import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "~/lib/auth";
import { useTheme } from "~/lib/theme";
import { FormField } from "~/components/FormField";
import { Button } from "~/components/Button";

export default function Login() {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!usernameOrEmail.trim() || !password) {
      setError("Enter your username/email and password.");
      return;
    }
    setLoading(true);
    try {
      await signIn(usernameOrEmail.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: "center", gap: 18 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: 6, marginBottom: 16 }}>
            <Text style={{ fontSize: 36, fontWeight: "800", color: colors.text, letterSpacing: -1 }}>
              sosoc
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 16 }}>
              Welcome back. Sign in to continue.
            </Text>
          </View>

          <FormField
            label="Username or email"
            value={usernameOrEmail}
            onChangeText={setUsernameOrEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
          />

          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
          />

          {error ? (
            <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>
          ) : null}

          <Button title="Sign in" onPress={handleSubmit} loading={loading} />

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 8 }}>
            <Text style={{ color: colors.textMuted }}>No account?</Text>
            <Link href="/(auth)/signup" style={{ color: colors.accent, fontWeight: "600" }}>
              Sign up
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
