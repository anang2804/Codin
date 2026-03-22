"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { BookOpen, Users, ClipboardList, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Profile {
  full_name: string;
  jenis_kelamin?: string;
  avatar_url?: string;
}

export default function GuruDashboard() {
  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalKelas: 0,
    totalMateri: 0,
    totalAsesmen: 0,
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, jenis_kelamin, avatar_url")
          .eq("id", user.id)
          .single();

        setProfile(profileData);

        const [materiRes, asesmenRes] = await Promise.all([
          supabase
            .from("materi")
            .select("kelas_id", { count: "exact" })
            .eq("created_by", user.id),
          supabase
            .from("asesmen")
            .select("*", { count: "exact" })
            .eq("created_by", user.id),
        ]);

        // Collect distinct kelas_id from guru's materi
        const kelasIdSet = new Set<string>(
          (materiRes.data ?? []).map((m: any) => m.kelas_id).filter(Boolean),
        );
        const kelasIds = [...kelasIdSet];

        let totalKelas = 0;
        let totalSiswa = 0;

        if (kelasIds.length > 0) {
          // Get kelas names for those IDs
          const { data: kelasData } = await supabase
            .from("kelas")
            .select("name")
            .in("id", kelasIds);

          const kelasNames = (kelasData ?? []).map((k: any) => k.name);
          totalKelas = kelasNames.length;

          // Count students whose kelas matches any of those names
          const { count: siswaCount } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "siswa")
            .in("kelas", kelasNames);

          totalSiswa = siswaCount || 0;
        }

        setStats({
          totalSiswa,
          totalKelas,
          totalMateri: materiRes.count || 0,
          totalAsesmen: asesmenRes.count || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Total Siswa",
      value: stats.totalSiswa,
      icon: Users,
      description: "Siswa terdaftar di kelas",
    },
    {
      label: "Total Kelas",
      value: stats.totalKelas,
      icon: Users,
      description: "Kelas aktif dikelola",
    },
    {
      label: "Total Materi",
      value: stats.totalMateri,
      icon: BookOpen,
      description: "Konten pembelajaran",
    },
    {
      label: "Total Asesmen",
      value: stats.totalAsesmen,
      icon: ClipboardList,
      description: "Ujian telah dibuat",
    },
  ];

  const getGreeting = () => {
    if (!profile) return "Halo, Guru";
    const title =
      profile.jenis_kelamin === "L"
        ? "Pak"
        : profile.jenis_kelamin === "P"
          ? "Bu"
          : "";
    const name = profile.full_name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    return `Halo, ${title} ${name} 👋`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            {getGreeting()}
          </h1>
          <p className="text-sm text-muted-foreground">
            Selamat datang di Dashboard Guru
          </p>
        </div>
        <Link href="/guru/profile" className="mr-6 shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-border hover:ring-emerald-300 dark:hover:ring-emerald-500/40 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 bg-muted/30">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={26} className="text-muted-foreground" />
            )}
          </div>
        </Link>
      </div>
      <div className="border-b border-border mb-8" />

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.label}
                  className="p-6 bg-card rounded-xl shadow-sm border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-emerald-500/15 text-green-600 dark:text-emerald-300 flex items-center justify-center mb-4">
                    <Icon size={22} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
