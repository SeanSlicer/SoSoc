import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/app/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "sosoc",
  description: "Share moments with the people you care about.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

// viewport-fit=cover lets the page extend under the iPhone notch/home indicator,
// enabling env(safe-area-inset-*) CSS values to be used for precise padding.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

// Inline script runs before first paint to apply the correct theme class,
// preventing a flash of the wrong theme on page load.
const themeScript = `(function(){
  var t=localStorage.getItem('theme');
  var d=window.matchMedia('(prefers-color-scheme: dark)').matches;
  if(t==='dark'||((!t||t==='system')&&d))document.documentElement.classList.add('dark');
})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
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
