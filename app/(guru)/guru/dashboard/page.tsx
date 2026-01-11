"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  ClipboardList,
  Target,
  Plus,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Profile {
  full_name: string;
  jenis_kelamin?: string;
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
          .select("full_name, jenis_kelamin")
          .eq("id", user.id)
          .single();

        setProfile(profileData);

        const [kelasRes, materiRes, asesmenRes] = await Promise.all([
          supabase
            .from("kelas")
            .select("*", { count: "exact" })
            .eq("guru_id", user.id),
          supabase
            .from("materi")
            .select("*", { count: "exact" })
            .eq("created_by", user.id),
          supabase
            .from("asesmen")
            .select("*", { count: "exact" })
            .eq("created_by", user.id),
        ]);

        // Count total students
        const { count: totalSiswa } = await supabase
          .from("kelas_siswa")
          .select("*", { count: "exact" })
          .in("kelas_id", kelasRes.data?.map((k) => k.id) || []);

        setStats({
          totalSiswa: totalSiswa || 0,
          totalKelas: kelasRes.count || 0,
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
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Total Kelas",
      value: stats.totalKelas,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Total Materi",
      value: stats.totalMateri,
      icon: BookOpen,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Total Asesmen",
      value: stats.totalAsesmen,
      icon: ClipboardList,
      color: "bg-yellow-100 text-yellow-600",
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
    return `Halo, ${title} ${profile.full_name}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getGreeting()}
          </h1>
          <p className="text-gray-600">Selamat datang di Dashboard Guru</p>
        </div>
        <Link href="/guru/profile">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-green-500 bg-green-50 flex items-center justify-center cursor-pointer hover:border-green-600 transition-colors shadow-md">
            <User size={32} className="text-green-400" />
          </div>
        </Link>
      </div>

      <div className="flex justify-end mb-6">
        <Link href="/guru/materi">
          <Button className="bg-green-600 hover:bg-green-700 gap-2">
            <Plus size={20} />
            Tambah Materi
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-6 border-green-100">
                  <div
                    className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-4`}
                  >
                    <Icon size={24} />
                  </div>
                  <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">
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
