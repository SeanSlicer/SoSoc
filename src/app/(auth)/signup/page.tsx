import { type Metadata } from "next";
import SignUpForm from "~/app/components/auth/SignUpForm";

export const metadata: Metadata = { title: "Sign up — sosoc" };

export default function SignUpPage() {
  return <SignUpForm />;
}
