"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ClipboardList,
  Microscope,
  ArrowRight,
  Calendar,
  FileText,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SiswaDashboard() {
  const [stats, setStats] = useState({
    totalMateri: 0,
    totalAsesmen: 0,
    totalSimulasi: 3,
  });
  const [loading, setLoading] = useState(true);
  const [recentMateri, setRecentMateri] = useState<any[]>([]);
  const [recentAsesmen, setRecentAsesmen] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      try {
        const [materiRes, asesmenRes] = await Promise.all([
          supabase.from("materi").select("*", { count: "exact" }),
          supabase.from("asesmen").select("*", { count: "exact" }),
        ]);

        setStats((prev) => ({
          ...prev,
          totalMateri: materiRes.count || 0,
          totalAsesmen: asesmenRes.count || 0,
        }));

        const { data: materiData } = await supabase
          .from("materi")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);
        setRecentMateri(materiData || []);

        const { data: asesmenData } = await supabase
          .from("asesmen")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);

        if (asesmenData && asesmenData.length > 0) {
          const { data: nilaiData } = await supabase
            .from("nilai_asesmen")
            .select("id, nilai, completed_at, asesmen_id")
            .eq("siswa_id", user.id)
            .eq("asesmen_id", asesmenData[0].id)
            .maybeSingle();

          setRecentAsesmen([
            { ...asesmenData[0], nilai_asesmen: nilaiData ? [nilaiData] : [] },
          ]);
        } else {
          setRecentAsesmen([]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Memuat data...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Materi",
      count: stats.totalMateri,
      icon: BookOpen,
      href: "/siswa/materi",
      action: "Lihat Materi",
    },
    {
      label: "Asesmen",
      count: stats.totalAsesmen,
      icon: ClipboardList,
      href: "/siswa/asesmen",
      action: "Mulai Asesmen",
    },
    {
      label: "Simulasi",
      count: stats.totalSimulasi,
      icon: Microscope,
      href: "/siswa/simulasi",
      action: "Jelajahi Simulasi",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map(({ label, count, icon: Icon, href, action }) => (
          <Card
            key={label}
            className="p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Icon size={18} className="text-green-600" />
              </div>
            </div>
            <p className="text-lg font-semibold text-gray-900">{label}</p>
            <p className="text-sm text-gray-500 mb-4">{count} tersedia</p>
            <Link href={href}>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 h-auto"
              >
                {action}
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      {/* Materi & Tugas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Materi Terbaru */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-green-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Materi Terbaru
            </h2>
          </div>
          <div className="space-y-3">
            {recentMateri.length > 0 ? (
              recentMateri.map((materi) => (
                <Card
                  key={materi.id}
                  className="p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-50 rounded-lg shrink-0">
                      <FileText size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm leading-snug mb-1 truncate">
                        {materi.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                        {materi.description || "Deskripsi belum tersedia"}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar size={12} />
                          <span>
                            {new Date(materi.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <Link href={`/siswa/materi/${materi.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs h-auto px-2 py-1"
                          >
                            Detail Materi{" "}
                            <ArrowRight size={12} className="ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-5 border border-gray-100 text-center">
                <p className="text-sm text-gray-400">Belum ada materi</p>
              </Card>
            )}
          </div>
        </section>

        {/* Tugas Terbaru */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={18} className="text-green-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Tugas Terbaru
            </h2>
          </div>
          <div className="space-y-3">
            {recentAsesmen.length > 0 ? (
              recentAsesmen.map((asesmen) => {
                const isCompleted =
                  asesmen.nilai_asesmen && asesmen.nilai_asesmen.length > 0;

                return (
                  <Card
                    key={asesmen.id}
                    className="p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-50 rounded-lg shrink-0">
                        <ClipboardList size={16} className="text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 text-sm leading-snug truncate">
                            {asesmen.title || "Tugas"}
                          </h3>
                          <Badge
                            className={
                              isCompleted
                                ? "bg-green-100 text-green-700 hover:bg-green-100 text-xs px-2 py-0.5 rounded-full font-medium border-0 shrink-0"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs px-2 py-0.5 rounded-full font-medium border-0 shrink-0"
                            }
                          >
                            {isCompleted ? "Selesai" : "Belum Selesai"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                          <span className="flex items-center gap-1">
                            <FileText size={11} />
                            {asesmen.total_questions || 0} soal
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {asesmen.duration || 0} menit
                          </span>
                        </div>
                        <Link href={`/siswa/asesmen/${asesmen.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs h-auto px-2 py-1"
                          >
                            Detail Tugas{" "}
                            <ArrowRight size={12} className="ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="p-5 border border-gray-100 text-center">
                <p className="text-sm text-gray-400">Belum ada tugas</p>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
