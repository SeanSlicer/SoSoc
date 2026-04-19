import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";
import { cookies } from "next/headers";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/app/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "sosoc",
  description: "Share moments with the people you care about.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

// Stamps the `theme` cookie on first visit so subsequent SSR renders match.
// Also handles the system-preference case for users without an explicit cookie.
const themeScript = `(function(){
  var t=localStorage.getItem('theme');
  var d=window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark=t==='dark'||((!t||t==='system')&&d);
  if(isDark)document.documentElement.classList.add('dark');
  if(!document.cookie.match(/(?:^|;)theme=/)){
    var age=365*24*60*60;
    document.cookie='theme='+(t||'system')+';path=/;max-age='+age+';SameSite=Strict';
  }
})();`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read the theme cookie so the server renders the correct initial class.
  // Eliminates the hydration mismatch for users with an explicit dark/light preference.
  // The `system` case is inherently unknowable server-side (no access to OS preference),
  // so suppressHydrationWarning covers that narrow edge case.
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const serverDark = themeCookie === "dark";
  const htmlClass = [geist.variable, serverDark ? "dark" : ""].filter(Boolean).join(" ");

  return (
    <html lang="en" className={htmlClass} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <TRPCReactProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
