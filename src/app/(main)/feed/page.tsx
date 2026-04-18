import { type Metadata } from "next";
import FeedClient from "~/app/components/feed/FeedClient";
import { api, HydrateClient } from "~/trpc/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Home — sosoc" };

export default async function FeedPage() {
  void api.post.getFeed.prefetchInfinite({ feedType: "all" });
  void api.user.getMe.prefetch();

  return (
    <HydrateClient>
      <FeedClient />
    </HydrateClient>
  );
}
