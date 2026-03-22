"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import UserQuickMenu from "@/components/UserQuickMenu";
import { createClient } from "@/lib/supabase/client";

export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const hideHeader = pathname === "/guru/profile";

  const getDisplayName = () => {
    if (!profile) return "Guru";
    const fullName = profile.full_name || "Guru";
    const firstName = fullName.split(" ")[0];
    if (profile.jenis_kelamin === "L") return `Pak ${firstName}`;
    if (profile.jenis_kelamin === "P") return `Bu ${firstName}`;
    return firstName;
  };

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData?.role !== "guru") {
        router.push("/auth/login");
        return;
      }

      setProfile(profileData);
      setMounted(true);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="flex">
      <Sidebar role="guru" />
      <main className="flex-1 md:ml-64 bg-muted/20 min-h-screen">
        {hideHeader && (
          <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2">
            <ThemeToggleButton />
            <UserQuickMenu
              role="guru"
              variant="avatar"
              avatarUrl={profile?.avatar_url || null}
            />
          </div>
        )}

        {!hideHeader && (
          <div className="sticky top-0 z-30 bg-muted/20 pt-3 md:pt-4 px-4 md:px-8">
            <div className="flex items-center justify-between mb-3 bg-card rounded-xl px-5 py-3 shadow-sm border border-border">
              <div>
                <h1 className="text-xl font-bold text-foreground leading-tight">
                  Halo, {getDisplayName()} 👋
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Selamat datang di Dashboard Guru
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggleButton />
                <UserQuickMenu
                  role="guru"
                  variant="avatar"
                  avatarUrl={profile?.avatar_url || null}
                />
              </div>
            </div>
          </div>
        )}

        <div
          className={
            hideHeader ? "p-4 md:p-8 pt-16 md:pt-20" : "p-4 md:p-8 pt-0 md:pt-0"
          }
        >
          {children}
        </div>
      </main>
    </div>
  );
}
