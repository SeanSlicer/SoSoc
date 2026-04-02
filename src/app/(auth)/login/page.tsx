import { type Metadata } from "next";
import LoginForm from "~/app/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in — sosoc" };

export default function LoginPage() {
  return <LoginForm />;
}
