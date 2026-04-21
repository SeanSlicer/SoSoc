import { useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { Avatar } from "~/components/Avatar";

export default function Search() {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  const enabled = query.trim().length >= 2;
  const searchQ = trpc.user.search.useQuery(
    { query: query.trim(), limit: 20 },
    { enabled, staleTime: 5_000 },
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search users"
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.input,
            { backgroundColor: colors.bgSubtle, borderColor: colors.border, color: colors.text },
          ]}
        />
      </View>

      {enabled && searchQ.isLoading ? (
        <View style={{ padding: 16 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}

      <FlatList
        data={searchQ.data ?? []}
        keyExtractor={(u) => u.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/profile/${item.username}`)}
            style={({ pressed }) => [
              styles.row,
              { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Avatar url={item.photo} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "600" }}>{item.username}</Text>
              {item.displayName ? (
                <Text style={{ color: colors.textMuted }}>{item.displayName}</Text>
              ) : null}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          enabled && !searchQ.isLoading ? (
            <Text style={{ color: colors.textMuted, padding: 24, textAlign: "center" }}>
              No users found
            </Text>
          ) : !enabled ? (
            <Text style={{ color: colors.textMuted, padding: 24, textAlign: "center" }}>
              Type at least 2 characters to search
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
