import { type Metadata } from "next";
import NotificationPrefsClient from "~/app/components/settings/NotificationPrefsClient";

export const metadata: Metadata = { title: "Notification Preferences — sosoc" };

export default function NotificationPrefsPage() {
  return <NotificationPrefsClient />;
}
