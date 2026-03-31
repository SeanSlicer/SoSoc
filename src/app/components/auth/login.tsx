"use client";

import React, { type FC, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import Link from "next/link";

const Login: FC = () => {
  const router = useRouter();

  const { mutate: login, error } = api.user.login.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
    },
  });

  const [input, setInput] = useState({
    usernameOrEmail: "",
    password: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Log in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6">
          <div className="text-center text-sm text-red-500">
            {error && <p>{error.message}</p>}
          </div>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Email or Username
              </label>
              <input
                id="email"
                name="usernameOrEmail"
                type="text"
                autoComplete="email"
                required
                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                placeholder="Email address or username"
                value={input.usernameOrEmail}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                placeholder="Password"
                value={input.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              onClick={() => login(input)}
              type="button"
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              Log In
            </button>
          </div>
        </form>
        <div className="text-center">
          <Link
            className="text-indigo-600 hover:text-indigo-500"
            href="/signUp"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
