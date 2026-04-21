import { FollowList } from "~/components/FollowList";
import { useLocalSearchParams } from "expo-router";

export default function Followers() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return <FollowList kind="followers" username={username ?? ""} />;
}
