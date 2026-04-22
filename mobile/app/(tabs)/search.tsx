import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { Avatar } from "~/components/Avatar";
import { Icon } from "~/components/Icon";

export default function Search() {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  const enabled = query.trim().length >= 2;
  const searchQ = trpc.user.search.useQuery(
    { query: query.trim(), limit: 20 },
    { enabled, staleTime: 5_000 },
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={[styles.titleBar, { borderBottomColor: colors.border }]}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
          Search
        </Text>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 14,
            backgroundColor: colors.bgSubtle,
            borderRadius: 14,
          }}
        >
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search users…"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              flex: 1,
              paddingVertical: 12,
              fontSize: 15,
              color: colors.text,
            }}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <Icon name="x" size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {enabled && searchQ.isLoading ? (
        <View style={{ padding: 24 }}>
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
              { backgroundColor: pressed ? colors.bgHover : "transparent" },
            ]}
          >
            <Avatar url={item.photo} username={item.username} size={48} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>
                {item.displayName ?? item.username}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>@{item.username}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          enabled && !searchQ.isLoading ? (
            <View style={{ padding: 48, alignItems: "center" }}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>No users found</Text>
            </View>
          ) : !enabled ? (
            <View style={{ padding: 48, alignItems: "center" }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: colors.bgSubtle,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Icon name="search" size={28} color={colors.textFaint} strokeWidth={1.8} />
              </View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
                Find people
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center" }}>
                Search by username or display name.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
