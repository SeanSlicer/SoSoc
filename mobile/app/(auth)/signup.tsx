import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "~/lib/auth";
import { useTheme } from "~/lib/theme";
import { FormField } from "~/components/FormField";
import { Button } from "~/components/Button";

export default function Signup() {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!username.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await signUp({ username: username.trim(), email: email.trim(), password });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign up failed");
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
          <View style={{ gap: 4, marginBottom: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text }}>Create account</Text>
            <Text style={{ color: colors.textMuted, fontSize: 15 }}>Pick a username to get started</Text>
          </View>

          <FormField
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
          />

          {error ? (
            <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>
          ) : null}

          <Button title="Sign up" onPress={handleSubmit} loading={loading} />

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 8 }}>
            <Text style={{ color: colors.textMuted }}>Already have one?</Text>
            <Link href="/(auth)/login" style={{ color: colors.accent, fontWeight: "600" }}>
              Sign in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
