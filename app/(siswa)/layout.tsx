"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import UserQuickMenu from "@/components/UserQuickMenu";
import { createClient } from "@/lib/supabase/client";

export default function SiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Check if current page should hide header and sidebar
  const hideHeader =
    pathname === "/siswa/profile" ||
    (pathname?.includes("/asesmen/") && pathname !== "/siswa/asesmen") ||
    (pathname?.includes("/simulasi/") && pathname !== "/siswa/simulasi");

  const showFloatingProfileMenu = hideHeader && pathname !== "/siswa/profile";

  const hideSidebar =
    (pathname?.includes("/asesmen/") && pathname !== "/siswa/asesmen") ||
    (pathname?.includes("/simulasi/") && pathname !== "/siswa/simulasi");

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

      if (profileData?.role !== "siswa") {
        router.push("/auth/login");
        return;
      }

      setProfile({ ...profileData, email: user.email || profileData?.email });
      setMounted(true);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const getFirstName = () => {
    if (!profile) return "Siswa";
    const fullName = profile.full_name || "Siswa";
    return fullName.split(" ")[1] || fullName.split(" ")[0];
  };

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
      {!hideSidebar && <Sidebar role="siswa" />}
      <main
        className={`flex-1 ${!hideSidebar ? "md:ml-64 bg-muted/20" : ""} min-h-screen`}
      >
        {hideHeader && (
          <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2">
            {showFloatingProfileMenu && (
              <UserQuickMenu
                role="siswa"
                variant="avatar"
                avatarUrl={profile?.avatar_url || null}
                fullName={profile?.full_name || null}
                email={profile?.email || null}
              />
            )}
          </div>
        )}
        {/* Header - Sticky */}
        {!hideHeader && (
          <div className="sticky top-0 z-30 bg-muted/20 pt-3 md:pt-4 px-4 md:px-8">
            <div className="flex items-center justify-between mb-3 bg-card rounded-xl px-5 py-3 shadow-sm border border-border">
              <div className="pl-14 md:pl-0">
                <h1 className="text-xl font-bold text-foreground leading-tight">
                  Halo, {getFirstName()} 👋
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {profile?.kelas
                    ? `Kelas ${profile.kelas}`
                    : "Dashboard Siswa"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <UserQuickMenu
                  role="siswa"
                  variant="avatar"
                  avatarUrl={profile?.avatar_url || null}
                  fullName={profile?.full_name || null}
                  email={profile?.email || null}
                />
              </div>
            </div>
          </div>
        )}

        <div className={!hideSidebar ? "p-4 md:p-8 pt-0 md:pt-0" : ""}>
          {children}
        </div>
      </main>
    </div>
  );
}
