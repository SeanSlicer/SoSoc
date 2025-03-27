import React from "react";
import { useRouter } from "next/router";
import { trpc } from "@/lib/client/trpc";

const SignOutButton: React.FC = () => {
  const router = useRouter();
  const { mutate: signOut, error } = trpc.user.signOut.useMutation({
    onSuccess: async () => {
      await router.push("/login");
    },
  });

  return (
    <>
      <div className="text-center text-sm text-red-500">
        {error && <p>{error.message}</p>}
      </div>
      <button
        onClick={() => signOut()}
        className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-600 focus:outline-none"
      >
        Sign Out
      </button>
    </>
  );
};

export default SignOutButton;
