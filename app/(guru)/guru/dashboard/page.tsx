"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { BookOpen, Users, ClipboardList, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, jenis_kelamin, avatar_url")
          .eq("id", user.id)
          .single();

        setProfile(profileData);

        const [materiRes, asesmenRes, waliKelasRes, mapelRes] =
          await Promise.all([
            supabase
              .from("materi")
              .select("id, kelas_id, mapel_id")
              .eq("created_by", user.id),
            supabase
              .from("asesmen")
              .select("id, kelas_id, mapel_id")
              .eq("created_by", user.id),
            supabase
              .from("kelas")
              .select("id, name")
              .eq("wali_kelas_id", user.id),
            supabase.from("mapel").select("id").eq("guru_id", user.id),
          ]);

        const mapelIds = (mapelRes.data ?? [])
          .map((m: any) => m.id)
          .filter(Boolean);

        let materiByMapel: Array<{ id: string; kelas_id: string | null }> = [];
        let asesmenByMapel: Array<{ id: string; kelas_id: string | null }> = [];

        if (mapelIds.length > 0) {
          const [materiByMapelRes, asesmenByMapelRes] = await Promise.all([
            supabase
              .from("materi")
              .select("id, kelas_id")
              .in("mapel_id", mapelIds),
            supabase
              .from("asesmen")
              .select("id, kelas_id")
              .in("mapel_id", mapelIds),
          ]);
          materiByMapel = materiByMapelRes.data ?? [];
          asesmenByMapel = asesmenByMapelRes.data ?? [];
        }

        const materiIds = new Set<string>(
          [...(materiRes.data ?? []), ...materiByMapel]
            .map((m: any) => m.id)
            .filter(Boolean),
        );
        const asesmenIds = new Set<string>(
          [...(asesmenRes.data ?? []), ...asesmenByMapel]
            .map((a: any) => a.id)
            .filter(Boolean),
        );

        const kelasIdSet = new Set<string>(
          [
            ...(waliKelasRes.data ?? []).map((k: any) => k.id),
            ...(materiRes.data ?? []).map((m: any) => m.kelas_id),
            ...(asesmenRes.data ?? []).map((a: any) => a.kelas_id),
            ...materiByMapel.map((m: any) => m.kelas_id),
            ...asesmenByMapel.map((a: any) => a.kelas_id),
          ].filter(Boolean),
        );

        const kelasIds = [...kelasIdSet];
        let kelasNames = (waliKelasRes.data ?? [])
          .map((k: any) => k.name)
          .filter(Boolean);

        if (kelasIds.length > 0) {
          const { data: kelasData } = await supabase
            .from("kelas")
            .select("id, name")
            .in("id", kelasIds);
          kelasNames = [...new Set((kelasData ?? []).map((k: any) => k.name))];
        }

        let totalSiswa = 0;
        if (kelasNames.length > 0) {
          const { count: siswaCount } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "siswa")
            .in("kelas", kelasNames);
          totalSiswa = siswaCount || 0;
        }

        setStats({
          totalSiswa,
          totalKelas: kelasIds.length,
          totalMateri: materiIds.size,
          totalAsesmen: asesmenIds.size,
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
