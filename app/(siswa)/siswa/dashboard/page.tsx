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
import { SIMULATION_TOTAL } from "@/lib/simulation-catalog";
import Link from "next/link";

const SIMULASI_MENU_TOTAL = SIMULATION_TOTAL;

export default function SiswaDashboard() {
  const [stats, setStats] = useState({
    totalMateri: 0,
    totalAsesmen: 0,
    totalSimulasi: SIMULASI_MENU_TOTAL,
  });
  const [learningProgress, setLearningProgress] = useState({
    materiCompleted: 0,
    materiTotal: 0,
    simulasiCompleted: 0,
    simulasiTotal: 0,
    kuisCompleted: 0,
    kuisTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentMateri, setRecentMateri] = useState<any[]>([]);
  const [recentAsesmen, setRecentAsesmen] = useState<any[]>([]);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let isActive = true;
    let refreshTimer: number | null = null;
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    const fetchData = async (userId: string) => {
      if (!isActive) return;

      try {
        const [materiRes, asesmenRes] = await Promise.all([
          supabase.from("materi").select("*", { count: "exact" }),
          supabase.from("asesmen").select("*", { count: "exact" }),
        ]);

        setStats((prev) => ({
          ...prev,
          totalMateri: materiRes.count || 0,
          totalAsesmen: asesmenRes.count || 0,
          totalSimulasi: SIMULASI_MENU_TOTAL,
        }));

        const [materiDoneRes, simulasiDoneRes, kuisDoneRes] = await Promise.all(
          [
            supabase
              .from("materi_progress")
              .select("materi_id", { count: "exact" })
              .eq("siswa_id", userId)
              .eq("progress_percentage", 100),
            supabase
              .from("simulasi_progress")
              .select("simulasi_id", { count: "exact" })
              .eq("siswa_id", userId)
              .eq("completed", true),
            supabase
              .from("nilai_asesmen")
              .select("asesmen_id")
              .eq("siswa_id", userId)
              .not("completed_at", "is", null),
          ],
        );

        const kuisCompletedUnique = new Set(
          (kuisDoneRes.data || []).map(
            (item: { asesmen_id: string }) => item.asesmen_id,
          ),
        ).size;

        setLearningProgress({
          materiCompleted: materiDoneRes.count || 0,
          materiTotal: materiRes.count || 0,
          simulasiCompleted: simulasiDoneRes.count || 0,
          simulasiTotal: SIMULASI_MENU_TOTAL,
          kuisCompleted: kuisCompletedUnique,
          kuisTotal: asesmenRes.count || 0,
        });

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
          const { count: soalCount } = await supabase
            .from("soal")
            .select("id", { count: "exact", head: true })
            .eq("asesmen_id", asesmenData[0].id);

          const { data: nilaiData } = await supabase
            .from("nilai_asesmen")
            .select("id, nilai, completed_at, asesmen_id")
            .eq("siswa_id", userId)
            .eq("asesmen_id", asesmenData[0].id)
            .maybeSingle();

          setRecentAsesmen([
            {
              ...asesmenData[0],
              question_count: soalCount ?? asesmenData[0].total_questions ?? 0,
              nilai_asesmen: nilaiData ? [nilaiData] : [],
            },
          ]);
        } else {
          setRecentAsesmen([]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    const scheduleRefresh = (userId: string) => {
      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }

      refreshTimer = window.setTimeout(() => {
        void fetchData(userId);
      }, 200);
    };

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (isActive) setLoading(false);
        return;
      }

      await fetchData(user.id);

      realtimeChannel = supabase
        .channel(`siswa-dashboard-live:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "materi_progress",
            filter: `siswa_id=eq.${user.id}`,
          },
          () => scheduleRefresh(user.id),
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "simulasi_progress",
            filter: `siswa_id=eq.${user.id}`,
          },
          () => scheduleRefresh(user.id),
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "nilai_asesmen",
            filter: `siswa_id=eq.${user.id}`,
          },
          () => scheduleRefresh(user.id),
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "materi",
          },
          () => scheduleRefresh(user.id),
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "asesmen",
          },
          () => scheduleRefresh(user.id),
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "soal",
          },
          () => scheduleRefresh(user.id),
        )
        .subscribe();
    };

    void init();

    return () => {
      isActive = false;
      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }
      if (realtimeChannel) {
        void supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = window.setTimeout(() => setAnimateIn(true), 30);
      return () => window.clearTimeout(timer);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">Memuat data...</p>
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

  const entranceClass = animateIn
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-2";

  const getProgressPercentage = (completed: number, total: number) => {
    if (!total) return 0;
    return Math.min(100, Math.round((completed / total) * 100));
  };

  const getAnimatedProgressWidth = (completed: number, total: number) => {
    if (!animateIn) return 0;
    return getProgressPercentage(completed, total);
  };

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map(({ label, count, icon: Icon, href, action }) => (
          <Card
            key={label}
            className={`h-full p-3 border border-border bg-card rounded-xl shadow-sm flex flex-col transition-all duration-200 ${entranceClass} hover:-translate-y-1 hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="p-1 bg-green-50 dark:bg-emerald-500/15 rounded-md inline-flex">
                <Icon size={14} className="text-green-500" />
              </div>
            </div>
            <p className="text-base font-semibold text-foreground">{label}</p>
            <p className="text-sm text-muted-foreground mb-2.5">
              {count} tersedia
            </p>
            <Link href={href}>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-7"
              >
                {action}
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      <Card
        className={`p-4 border border-border bg-card rounded-xl shadow-sm transition-all duration-200 ${entranceClass}`}
      >
        <h2 className="text-base font-semibold text-foreground mb-3">
          Progress Belajar
        </h2>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
              <span>Materi selesai</span>
              <span>
                {learningProgress.materiCompleted} dari{" "}
                {learningProgress.materiTotal}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-[width] duration-[800ms] ease-out"
                style={{
                  width: `${getAnimatedProgressWidth(
                    learningProgress.materiCompleted,
                    learningProgress.materiTotal,
                  )}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
              <span>Simulasi selesai</span>
              <span>
                {learningProgress.simulasiCompleted} dari{" "}
                {learningProgress.simulasiTotal}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-[width] duration-[800ms] ease-out"
                style={{
                  width: `${getAnimatedProgressWidth(
                    learningProgress.simulasiCompleted,
                    learningProgress.simulasiTotal,
                  )}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
              <span>Kuis selesai</span>
              <span>
                {learningProgress.kuisCompleted} dari{" "}
                {learningProgress.kuisTotal}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-[width] duration-[800ms] ease-out"
                style={{
                  width: `${getAnimatedProgressWidth(
                    learningProgress.kuisCompleted,
                    learningProgress.kuisTotal,
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Materi & Tugas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Materi Terbaru */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-green-500" />
            <h2 className="text-base font-semibold text-foreground">
              Materi Terbaru
            </h2>
          </div>
          <div className="space-y-2.5">
            {recentMateri.length > 0 ? (
              recentMateri.map((materi) => (
                <Card
                  key={materi.id}
                  className={`p-3 border border-border bg-card rounded-xl shadow-sm transition-all duration-200 ${entranceClass}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 bg-green-50 dark:bg-emerald-500/15 rounded-md shrink-0">
                      <FileText size={14} className="text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground text-base leading-snug mb-0.5 truncate">
                        {materi.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-1.5">
                        {materi.description || "Deskripsi belum tersedia"}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
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
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 text-sm h-auto px-2 py-1"
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
              <Card className="p-4 border border-border bg-card rounded-xl shadow-sm text-center">
                <p className="text-sm text-muted-foreground">
                  Belum ada materi
                </p>
              </Card>
            )}
          </div>
        </section>

        {/* Tugas Terbaru */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList size={16} className="text-green-500" />
            <h2 className="text-base font-semibold text-foreground">
              Tugas Terbaru
            </h2>
          </div>
          <div className="space-y-2.5">
            {recentAsesmen.length > 0 ? (
              recentAsesmen.map((asesmen) => {
                const isCompleted =
                  asesmen.nilai_asesmen && asesmen.nilai_asesmen.length > 0;

                return (
                  <Card
                    key={asesmen.id}
                    className={`p-3 border border-border bg-card rounded-xl shadow-sm transition-all duration-200 ${entranceClass}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 bg-green-50 dark:bg-emerald-500/15 rounded-md shrink-0">
                        <ClipboardList size={14} className="text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-medium text-foreground text-base leading-snug truncate">
                            {asesmen.title || "Tugas"}
                          </h3>
                          <Badge
                            className={
                              isCompleted
                                ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/30 text-sm px-2 py-0.5 rounded-full font-medium border border-green-200 shrink-0"
                                : "bg-amber-50 text-amber-600 hover:bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 text-sm px-2 py-0.5 rounded-full font-medium border border-amber-200 shrink-0"
                            }
                          >
                            {isCompleted ? "Selesai" : "Belum Selesai"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <FileText size={12} />
                            {(asesmen.question_count ??
                              asesmen.total_questions) ||
                              0}{" "}
                            soal
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {asesmen.duration || 0} menit
                          </span>
                        </div>
                        <Link href={`/siswa/asesmen/${asesmen.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 text-sm h-auto px-2 py-1"
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
              <Card className="p-4 border border-border bg-card rounded-xl shadow-sm text-center">
                <p className="text-sm text-muted-foreground">Belum ada tugas</p>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
