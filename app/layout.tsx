import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import DarkModeSplashCursor from "@/components/DarkModeSplashCursor";
import AppSplashScreen from "@/components/AppSplashScreen";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const _geist = Geist({
  subsets: ["latin"],
  display: "swap", // Faster font loading
  preload: true,
});
const _geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Codin",
  description: "Platform pembelajaran cerdas untuk guru, siswa, dan admin",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <DarkModeSplashCursor />
          <AppSplashScreen>
            <ReactQueryProvider>{children}</ReactQueryProvider>
          </AppSplashScreen>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
