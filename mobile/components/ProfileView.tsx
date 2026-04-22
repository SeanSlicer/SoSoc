import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useTheme } from "~/lib/theme";
import { trpc } from "~/lib/trpc";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { PostCard, type FeedPost } from "./PostCard";
import { CommentsSheet } from "./CommentsSheet";

interface Props {
  username: string;
  isOwnProfile: boolean;
  onEdit?: () => void;
  onOpenSettings?: () => void;
  onMessage?: (userId: string) => void;
}

export function ProfileView({ username, isOwnProfile, onEdit, onOpenSettings, onMessage }: Props) {
  const { colors } = useTheme();
  const utils = trpc.useUtils();
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const profileQ = trpc.user.getProfile.useQuery({ username });
  const postsQ = trpc.post.getUserPosts.useQuery({ username });
  const statusQ = trpc.user.getFollowStatus.useQuery(
    { userId: profileQ.data?.id ?? "" },
    { enabled: !!profileQ.data?.id && !isOwnProfile },
  );

  const followMut = trpc.user.follow.useMutation({
    onSuccess: () => {
      if (profileQ.data?.id) void utils.user.getFollowStatus.invalidate({ userId: profileQ.data.id });
      void utils.user.getProfile.invalidate({ username });
    },
  });
  const unfollowMut = trpc.user.unfollow.useMutation({
    onSuccess: () => {
      if (profileQ.data?.id) void utils.user.getFollowStatus.invalidate({ userId: profileQ.data.id });
      void utils.user.getProfile.invalidate({ username });
    },
  });
  const cancelReqMut = trpc.user.cancelFollowRequest.useMutation({
    onSuccess: () => {
      if (profileQ.data?.id) void utils.user.getFollowStatus.invalidate({ userId: profileQ.data.id });
    },
  });

  const likeMut = trpc.post.toggleLike.useMutation({
    onSuccess: () => {
      void utils.post.getUserPosts.invalidate({ username });
    },
  });

  const refetchAll = useCallback(() => {
    void profileQ.refetch();
    void postsQ.refetch();
    if (!isOwnProfile) void statusQ.refetch();
  }, [profileQ, postsQ, statusQ, isOwnProfile]);

  if (profileQ.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!profileQ.data) {
    return (
      <View style={{ flex: 1, padding: 24, backgroundColor: colors.bg }}>
        <Text style={{ color: colors.textMuted, textAlign: "center" }}>User not found.</Text>
      </View>
    );
  }

  const profile = profileQ.data;
  const status = statusQ.data;
  const showPosts = !postsQ.data?.locked;
  const posts = (postsQ.data?.posts ?? []) as FeedPost[];

  const renderFollowButton = () => {
    if (isOwnProfile) return null;
    if (status?.following) {
      return <Button title="Following" variant="secondary" onPress={() => unfollowMut.mutate({ userId: profile.id })} />;
    }
    if (status?.requested) {
      return <Button title="Requested" variant="secondary" onPress={() => cancelReqMut.mutate({ userId: profile.id })} />;
    }
    return (
      <Button
        title={profile.isPrivate ? "Request" : "Follow"}
        onPress={() => followMut.mutate({ userId: profile.id })}
        loading={followMut.isPending}
      />
    );
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        refreshControl={<RefreshControl refreshing={profileQ.isRefetching} onRefresh={refetchAll} tintColor={colors.accent} />}
      >
        {profile.bannerUrl ? (
          <Image
            source={{ uri: profile.bannerUrl }}
            style={{ width: "100%", aspectRatio: 3, backgroundColor: colors.bgSubtle }}
            contentFit="cover"
          />
        ) : (
          <View style={{ height: 140, backgroundColor: colors.bgSubtle }} />
        )}

        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 12, marginTop: -56 }}>
            <View
              style={{
                borderRadius: 56,
                borderWidth: 4,
                borderColor: colors.bg,
              }}
            >
              <Avatar url={profile.photo} username={profile.username} size={104} />
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 8,
                paddingBottom: 14,
              }}
            >
              {isOwnProfile ? (
                <>
                  <Button title="Edit" variant="secondary" onPress={onEdit ?? (() => {})} />
                  {onOpenSettings ? (
                    <Button title="Settings" variant="secondary" onPress={onOpenSettings} />
                  ) : null}
                </>
              ) : (
                <>
                  {renderFollowButton()}
                  {onMessage ? (
                    <Button title="Message" variant="secondary" onPress={() => onMessage(profile.id)} />
                  ) : null}
                </>
              )}
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 22,
                  fontWeight: "800",
                  letterSpacing: -0.5,
                }}
              >
                {profile.displayName ?? profile.username}
              </Text>
              {status?.friends ? (
                <View
                  style={{
                    backgroundColor: colors.successBg,
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text style={{ color: colors.success, fontSize: 11, fontWeight: "700" }}>
                    FRIENDS
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: "500" }}>
              @{profile.username}
            </Text>
          </View>

          {profile.bio ? (
            <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>
              {profile.bio}
            </Text>
          ) : null}

          <View style={{ flexDirection: "row", gap: 22, paddingTop: 4, paddingBottom: 12 }}>
            <Pressable
              onPress={() => router.push(`/profile/${profile.username}/followers`)}
              hitSlop={6}
            >
              <Text style={{ color: colors.text, fontSize: 15 }}>
                <Text style={{ fontWeight: "800" }}>{profile._count.followers}</Text>
                <Text style={{ color: colors.textMuted, fontWeight: "500" }}> followers</Text>
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/profile/${profile.username}/following`)}
              hitSlop={6}
            >
              <Text style={{ color: colors.text, fontSize: 15 }}>
                <Text style={{ fontWeight: "800" }}>{profile._count.follows}</Text>
                <Text style={{ color: colors.textMuted, fontWeight: "500" }}> following</Text>
              </Text>
            </Pressable>
            <Text style={{ color: colors.text, fontSize: 15 }}>
              <Text style={{ fontWeight: "800" }}>{profile._count.posts}</Text>
              <Text style={{ color: colors.textMuted, fontWeight: "500" }}> posts</Text>
            </Text>
          </View>
        </View>

        <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: 8 }}>
          {postsQ.isLoading ? (
            <View style={{ padding: 24 }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : !showPosts ? (
            <Text style={{ color: colors.textMuted, padding: 32, textAlign: "center" }}>
              This account is private. Follow to see their posts.
            </Text>
          ) : posts.length === 0 ? (
            <Text style={{ color: colors.textMuted, padding: 32, textAlign: "center" }}>
              No posts yet.
            </Text>
          ) : (
            posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                onToggleLike={(id) => likeMut.mutate({ postId: id })}
                onOpenComments={(id) => setCommentsPostId(id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <CommentsSheet postId={commentsPostId} onClose={() => setCommentsPostId(null)} />
    </>
  );
}
