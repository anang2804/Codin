"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import UserQuickMenu from "@/components/UserQuickMenu";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

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

      if (profileData?.role !== "admin") {
        router.push("/auth/login");
        return;
      }

      setProfile({ ...profileData, email: user.email || profileData?.email });
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
      <Sidebar role="admin" />
      <main className="flex-1 layout-with-sidebar bg-muted/20 min-h-screen">
        <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2">
          <UserQuickMenu
            role="admin"
            variant="avatar"
            avatarUrl={profile?.avatar_url || null}
            fullName={profile?.full_name || null}
            email={profile?.email || null}
          />
        </div>
        {/* Header */}
        <div className="bg-card border-b border-border px-4 md:px-8 py-4">
          <h1 className="text-lg font-semibold text-foreground">Admin Panel</h1>
        </div>
        <div className="px-6 py-6 md:px-8 md:py-6">{children}</div>
      </main>
    </div>
  );
}
