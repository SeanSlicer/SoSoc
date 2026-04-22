import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { uploadFile, uploadPath } from "~/lib/upload";
import { useAuth } from "~/lib/auth";
import { Button } from "~/components/Button";
import { Icon } from "~/components/Icon";

const MAX_IMAGES = 15;

export default function Compose() {
  const { colors } = useTheme();
  const utils = trpc.useUtils();
  const { user } = useAuth();
  // Fall back to /user/getMe if AuthContext doesn't carry userId (e.g. after
  // hydration from SecureStore but before first login this session).
  const meQ = trpc.user.getMe.useQuery(undefined, { enabled: !user });
  const userId = user?.id ?? meQ.data?.id;

  const [content, setContent] = useState("");
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMut = trpc.post.create.useMutation({
    onSuccess: async () => {
      setContent("");
      setLocalImages([]);
      await utils.post.getFeed.invalidate();
      router.push("/(tabs)/feed");
    },
  });

  const handlePickImages = async () => {
    const remaining = MAX_IMAGES - localImages.length;
    if (remaining <= 0) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library access is required to add images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });

    if (result.canceled) return;
    setLocalImages((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    setError(null);
  };

  const removeImage = (uri: string) => {
    setLocalImages((prev) => prev.filter((u) => u !== uri));
  };

  const handlePost = async () => {
    if (!content.trim()) {
      setError("Write something first.");
      return;
    }
    if (!userId) {
      setError("Still loading your account — try again in a moment.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < localImages.length; i++) {
        const uri = localImages[i]!;
        const url = await uploadFile(uri, "posts", uploadPath(userId, String(i)));
        uploadedUrls.push(url);
      }
      createMut.mutate({ content: content.trim(), images: uploadedUrls });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
          New post
        </Text>
        <Button
          title="Post"
          onPress={handlePost}
          loading={uploading || createMut.isPending}
          disabled={!content.trim() || uploading || createMut.isPending}
          style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999 }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
          <TextInput
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textFaint}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={500}
            style={{
              color: colors.text,
              fontSize: 17,
              lineHeight: 24,
              minHeight: 140,
              textAlignVertical: "top",
            }}
          />

          {localImages.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {localImages.map((uri) => (
                <View key={uri} style={{ position: "relative" }}>
                  <Image
                    source={{ uri }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 10,
                      backgroundColor: colors.bgSubtle,
                    }}
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={() => removeImage(uri)}
                    hitSlop={8}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      borderRadius: 12,
                      width: 24,
                      height: 24,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="x" size={12} color="#ffffff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <Pressable
            onPress={handlePickImages}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 999,
              backgroundColor: pressed ? colors.bgHover : colors.bgSubtle,
              alignSelf: "flex-start",
              opacity: localImages.length >= MAX_IMAGES ? 0.5 : 1,
            })}
            disabled={localImages.length >= MAX_IMAGES}
          >
            <Icon name="image" size={18} color={colors.text} strokeWidth={2.2} />
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
              Add photos ({localImages.length}/{MAX_IMAGES})
            </Text>
          </Pressable>

          {error ? <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text> : null}

          <Text style={{ color: colors.textFaint, fontSize: 12 }}>
            {content.length}/500 characters
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
