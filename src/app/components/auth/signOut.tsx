"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

const SignOutButton: React.FC = () => {
  const router = useRouter();
  const { mutate: signOut, error } = api.user.signOut.useMutation({
    onSuccess: () => {
      router.push("/login");
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
