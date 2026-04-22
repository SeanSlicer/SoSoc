import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { Avatar } from "~/components/Avatar";
import { Icon } from "~/components/Icon";

export default function NewMessage() {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const searchQ = trpc.user.search.useQuery(
    { query, limit: 20 },
    { enabled: query.trim().length > 0 },
  );

  const dmMut = trpc.messages.getOrCreateDM.useMutation({
    onSuccess: (convo) => {
      router.replace(`/messages/${convo.id}`);
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? colors.bgHover : "transparent",
          })}
        >
          <Icon name="chevron-left" size={22} color={colors.text} strokeWidth={2.4} />
        </Pressable>
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 17 }}>New message</Text>
        <View style={{ width: 36 }} />
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
            autoFocus
            style={{
              flex: 1,
              paddingVertical: 12,
              fontSize: 15,
              color: colors.text,
            }}
          />
        </View>
      </View>

      {searchQ.isLoading ? (
        <View style={{ padding: 24 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={searchQ.data ?? []}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => dmMut.mutate({ userId: item.id })}
              disabled={dmMut.isPending}
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
            query.trim().length === 0 ? (
              <Text style={{ color: colors.textMuted, padding: 32, textAlign: "center" }}>
                Search for a user to start a conversation.
              </Text>
            ) : (
              <Text style={{ color: colors.textMuted, padding: 32, textAlign: "center" }}>
                No users found.
              </Text>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
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
