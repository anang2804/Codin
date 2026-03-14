"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";
import { User } from "lucide-react";
import Link from "next/link";

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

      setProfile(profileData);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="flex">
      {!hideSidebar && <Sidebar role="siswa" />}
      <main
        className={`flex-1 ${!hideSidebar ? "md:ml-64 bg-gray-50" : ""} min-h-screen`}
      >
        {/* Header - Sticky */}
        {!hideHeader && (
          <div className="sticky top-0 z-30 bg-gray-50 pt-4 md:pt-6 px-4 md:px-8">
            <div className="flex items-center justify-between mb-6 bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100">
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  Halo, {getFirstName()} 👋
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {profile?.kelas ? `Kelas ${profile.kelas}` : "Dashboard Siswa"}
                </p>
              </div>
              <Link href="/siswa/profile">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-500 bg-green-50 flex items-center justify-center cursor-pointer hover:border-green-600 transition-colors">
                  <User size={20} className="text-green-600" />
                </div>
              </Link>
            </div>
          </div>
        )}

        <div className={!hideSidebar ? "p-4 md:p-8 pt-0" : ""}>{children}</div>
      </main>
    </div>
  );
}
