import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
          sosoc
        </h1>
        <p className="text-lg text-gray-600">
          Share moments with the people you care about.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
          >
            Log In
          </Link>
          <Link
            href="/signUp"
            className="rounded-md border border-indigo-600 px-6 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
