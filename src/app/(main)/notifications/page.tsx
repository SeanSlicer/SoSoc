import { type Metadata } from "next";
import NotificationsClient from "~/app/components/notifications/NotificationsClient";

export const metadata: Metadata = { title: "Notifications — sosoc" };

export default function NotificationsPage() {
  return <NotificationsClient />;
}
