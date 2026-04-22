import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { useAuth } from "~/lib/auth";
import { uploadFile, uploadPath } from "~/lib/upload";
import { FormField } from "~/components/FormField";
import { Button } from "~/components/Button";
import { Avatar } from "~/components/Avatar";
import { Icon } from "~/components/Icon";

export default function EditProfile() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const meQ = trpc.user.getMe.useQuery();
  const userId = user?.id ?? meQ.data?.id;
  const username = user?.username ?? meQ.data?.username ?? "";
  const profileQ = trpc.user.getProfile.useQuery({ username }, { enabled: !!username });

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [hideFollowLists, setHideFollowLists] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<"photo" | "banner" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileQ.data) return;
    setDisplayName(profileQ.data.displayName ?? "");
    setBio(profileQ.data.bio ?? "");
    setIsPrivate(profileQ.data.isPrivate);
    setHideFollowLists(profileQ.data.hideFollowLists);
    setPhoto(profileQ.data.photo);
    setBanner(profileQ.data.bannerUrl);
  }, [profileQ.data]);

  const saveMut = trpc.user.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.user.getProfile.invalidate();
      await utils.user.getMe.invalidate();
      router.back();
    },
    onError: (e) => setError(e.message),
  });

  const photoMut = trpc.user.updatePhoto.useMutation({
    onSuccess: async () => {
      await utils.user.getProfile.invalidate();
      await utils.user.getMe.invalidate();
    },
  });
  const bannerMut = trpc.user.updateBanner.useMutation({
    onSuccess: async () => {
      await utils.user.getProfile.invalidate();
    },
  });

  const pickAndUpload = async (kind: "photo" | "banner") => {
    if (!userId) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: kind === "photo" ? [1, 1] : [3, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    setSavingField(kind);
    setError(null);
    try {
      const url = await uploadFile(
        result.assets[0].uri,
        kind === "photo" ? "avatars" : "banners",
        uploadPath(userId, kind),
      );
      if (kind === "photo") {
        setPhoto(url);
        await photoMut.mutateAsync({ photo: url });
      } else {
        setBanner(url);
        await bannerMut.mutateAsync({ bannerUrl: url });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSavingField(null);
    }
  };

  const handleSave = () => {
    setError(null);
    saveMut.mutate({
      displayName: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
      isPrivate,
      hideFollowLists,
    });
  };

  if (profileQ.isLoading || !profileQ.data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
          <Icon name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>Edit profile</Text>
        <Button
          title="Save"
          onPress={handleSave}
          loading={saveMut.isPending}
          style={{ paddingVertical: 8, paddingHorizontal: 14 }}
        />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => pickAndUpload("banner")}>
            {banner ? (
              <Image
                source={{ uri: banner }}
                style={{ width: "100%", aspectRatio: 3, borderRadius: 10, backgroundColor: colors.bgSubtle }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  aspectRatio: 3,
                  borderRadius: 10,
                  backgroundColor: colors.bgSubtle,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.textMuted }}>Tap to add banner</Text>
              </View>
            )}
            {savingField === "banner" ? (
              <View style={StyleSheet.absoluteFill}>
                <ActivityIndicator color={colors.accent} style={{ alignSelf: "center", marginTop: 30 }} />
              </View>
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => pickAndUpload("photo")}
            style={{ alignSelf: "center", marginTop: -48 }}
          >
            <Avatar url={photo} username={username} size={96} />
            {savingField === "photo" ? (
              <View style={StyleSheet.absoluteFill}>
                <ActivityIndicator color={colors.accent} style={{ alignSelf: "center", marginTop: 36 }} />
              </View>
            ) : null}
          </Pressable>

          <FormField label="Display name" value={displayName} onChangeText={setDisplayName} maxLength={50} />
          <FormField label="Bio" value={bio} onChangeText={setBio} maxLength={160} multiline />

          <View style={[styles.toggleRow, { borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "600" }}>Private account</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                Followers must be approved before they can see your posts.
              </Text>
            </View>
            <Switch value={isPrivate} onValueChange={setIsPrivate} />
          </View>

          <View style={[styles.toggleRow, { borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: "600" }}>Hide follow lists</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                Other people can't see who you follow or who follows you.
              </Text>
            </View>
            <Switch value={hideFollowLists} onValueChange={setHideFollowLists} />
          </View>

          {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
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
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 10,
  },
});
