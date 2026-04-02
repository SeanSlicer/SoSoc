import { type Metadata } from "next";
import FeedClient from "~/app/components/feed/FeedClient";

export const metadata: Metadata = { title: "Home — sosoc" };

export default function FeedPage() {
  return <FeedClient />;
}
