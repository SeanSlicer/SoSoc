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
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
          <Icon name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>New message</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 12 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search users…"
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: colors.bgSubtle,
            color: colors.text,
            fontSize: 14,
          }}
        />
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
                { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Avatar url={item.photo} username={item.username} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>{item.username}</Text>
                {item.displayName ? (
                  <Text style={{ color: colors.textMuted }}>{item.displayName}</Text>
                ) : null}
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
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
