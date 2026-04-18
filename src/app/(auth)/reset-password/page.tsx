import { Suspense } from "react";
import ResetPasswordForm from "~/app/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
