import { FollowList } from "~/components/FollowList";
import { useLocalSearchParams } from "expo-router";

export default function Following() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return <FollowList kind="following" username={username ?? ""} />;
}
