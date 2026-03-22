"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

const SPLASH_SEEN_KEY = "codin-splash-seen";
const SHOW_DURATION_MS = 2400;

export default function AppSplashScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem(SPLASH_SEEN_KEY) === "1";

    if (hasSeenSplash) {
      setIsReady(true);
      return;
    }

    setShowSplash(true);
    const hideTimer = window.setTimeout(() => {
      sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
      setShowSplash(false);
    }, SHOW_DURATION_MS);

    return () => window.clearTimeout(hideTimer);
  }, []);

  return (
    <>
      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          setIsReady(true);
        }}
      >
        {showSplash && (
          <motion.div
            key="app-splash"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-lg"
          >
            <div className="relative flex h-full w-full items-center justify-center px-6">
              <motion.div
                initial={{ y: 12, opacity: 0.85, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex w-full max-w-xl flex-col items-center gap-3"
              >
                <div className="relative p-1 sm:p-2">
                  <Image
                    src="/codin nama.png"
                    alt="Codin"
                    width={420}
                    height={210}
                    priority
                    className="h-auto w-[260px] sm:w-[340px] object-contain"
                  />
                </div>

                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm sm:text-base font-medium text-foreground/85">
                    Menyiapkan pengalaman belajar terbaik...
                  </p>
                  <div className="h-1 w-44 overflow-hidden rounded-full bg-muted/80">
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{
                        duration: 1.9,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                      className="h-full w-1/2 rounded-full bg-gradient-to-r from-primary/70 via-primary to-primary/70"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={isReady ? "opacity-100" : "opacity-0"}>{children}</div>
    </>
  );
}
