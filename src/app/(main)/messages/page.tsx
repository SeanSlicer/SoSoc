import { type Metadata } from "next";
import { cookies } from "next/headers";
import { verifyAuth } from "~/../lib/client/auth";
import MessagesPage from "~/app/components/messages/MessagesPage";

export const metadata: Metadata = { title: "Messages — sosoc" };

export default async function Messages() {
  const cookieStore = await cookies();
  const token = cookieStore.get("user-token")?.value ?? "";
  const payload = verifyAuth(token);
  return <MessagesPage currentUserId={payload.sub} />;
}
