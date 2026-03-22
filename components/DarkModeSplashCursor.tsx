"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import SplashCursor from "@/components/SplashCursor";

export default function DarkModeSplashCursor() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || resolvedTheme !== "dark") {
    return null;
  }

  return <SplashCursor />;
}
