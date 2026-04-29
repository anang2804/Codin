"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Play,
  Clock,
  FileText,
  BookOpen,
  CalendarClock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SiswaAsesmenPage() {
  const [asesmen, setAsesmen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [animateCards, setAnimateCards] = useState(false);

  const getScheduleStatus = (
    startAt?: string | null,
    endAt?: string | null,
  ) => {
    const now = Date.now();
    const startMs = startAt ? new Date(startAt).getTime() : Number.NaN;
    const endMs = endAt ? new Date(endAt).getTime() : Number.NaN;

    if (!Number.isNaN(startMs) && now < startMs) return "upcoming" as const;
    if (!Number.isNaN(endMs) && now > endMs) return "closed" as const;
    return "open" as const;
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const fetchAsesmen = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      if (!silent) setLoading(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("kelas")
        .eq("id", user.id)
        .single();

      if (profile?.kelas) {
        const { data: kelasData } = await supabase
          .from("kelas")
          .select("id")
          .eq("name", profile.kelas)
          .single();

        if (kelasData) {
          const { data: asesmenData } = await supabase
            .from("asesmen")
            .select("*")
            .eq("kelas_id", kelasData.id)
            .order("created_at", { ascending: false });

          if (asesmenData) {
            const asesmenWithDetails = await Promise.all(
              asesmenData.map(async (a) => {
                const { count } = await supabase
                  .from("soal")
                  .select("*", { count: "exact", head: true })
                  .eq("asesmen_id", a.id);

                let mapelData = null;
                if (a.mapel_id) {
                  const { data } = await supabase
                    .from("mapel")
                    .select("name")
                    .eq("id", a.mapel_id)
                    .single();
                  mapelData = data;
                }

                const { data: jawabanData, error: jawabanError } =
                  await supabase
                    .from("jawaban_siswa")
                    .select("id")
                    .eq("asesmen_id", a.id)
                    .eq("siswa_id", user.id)
                    .limit(1);

                if (jawabanError) {
                  console.error("Error checking jawaban:", jawabanError);
                }

                const isCompleted = Boolean(
                  jawabanData && jawabanData.length > 0,
                );

                let nilaiData = null;
                if (isCompleted) {
                  const { data } = await supabase
                    .from("nilai")
                    .select("score, completed_at")
                    .eq("asesmen_id", a.id)
                    .eq("siswa_id", user.id)
                    .order("completed_at", { ascending: false })
                    .limit(1)
                    .single();
                  nilaiData = data;
                }

                return {
                  ...a,
                  soal_count: count || 0,
                  mapel: mapelData,
                  nilai: nilaiData,
                  is_completed: isCompleted,
                  schedule_status: getScheduleStatus(
                    a.waktu_mulai,
                    a.waktu_selesai,
                  ),
                };
              }),
            );
            setAsesmen(asesmenWithDetails);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching asesmen:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAsesmen();

    const supabase = createClient();
    const channel = supabase
      .channel("siswa-asesmen-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "asesmen" },
        () => {
          fetchAsesmen(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAsesmen]);

  useEffect(() => {
    const supabase = createClient();
    let refreshTimer: number | undefined;
    let realtimeChannel: any = null;

    const scheduleRefresh = () => {
      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }

      refreshTimer = window.setTimeout(() => {
        void fetchAsesmen(true);
      }, 200);
    };

    const initRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      realtimeChannel = supabase
        .channel(`siswa-asesmen-live:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "jawaban_siswa",
            filter: `siswa_id=eq.${user.id}`,
          },
          () => scheduleRefresh(),
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "nilai",
            filter: `siswa_id=eq.${user.id}`,
          },
          () => scheduleRefresh(),
        )
        .subscribe();
    };

    void initRealtime();

    const handleFocus = () => {
      scheduleRefresh();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        scheduleRefresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }

      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);

      if (realtimeChannel) {
        void supabase.removeChannel(realtimeChannel);
      }
    };
  }, [fetchAsesmen]);

  useEffect(() => {
    if (!loading) {
      const timer = window.setTimeout(() => setAnimateCards(true), 40);
      return () => window.clearTimeout(timer);
    }
  }, [loading]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-gray-100 flex items-center gap-3">
            <ClipboardList className="text-green-600" size={28} />
            Akses Kuis
          </h1>
          <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
            Kerjakan kuis untuk menguji pemahaman materi
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-gray-400">
            Memuat kuis...
          </p>
        </div>
      ) : asesmen.length === 0 ? (
        <Card className="p-12 text-center border-green-100 dark:border-green-900/50 bg-card">
          <ClipboardList
            size={48}
            className="mx-auto text-muted-foreground dark:text-gray-600 mb-4"
          />
          <p className="text-muted-foreground dark:text-gray-400">
            Belum ada kuis tersedia untuk kelas Anda.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
          {asesmen.map((a, index) => (
            <Card
              key={a.id}
              className={`overflow-hidden border border-border dark:border-gray-800 bg-card dark:bg-card rounded-xl shadow-sm hover:shadow-md hover:-translate-y-[5px] transition-all duration-200 flex flex-col ${animateCards ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <div className="px-4 py-2.5 border-b border-border dark:border-gray-800 bg-gradient-to-r from-green-50 dark:from-emerald-500/10 to-green-100 dark:to-emerald-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList className="text-green-600" size={16} />
                  <span className="font-medium text-muted-foreground dark:text-gray-400 text-xs">
                    Kuis
                  </span>
                </div>
                <h2 className="text-sm font-bold text-foreground dark:text-gray-100 line-clamp-2">
                  {a.title}
                </h2>
              </div>

              <div className="p-4 space-y-2.5 text-sm flex-1 border-b border-border dark:border-gray-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                    <FileText size={14} className="text-green-600" />
                    <span className="text-xs">Jumlah Soal</span>
                  </div>
                  <span className="font-semibold text-foreground dark:text-gray-100 text-xs">
                    {a.soal_count} soal
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                    <BookOpen size={14} className="text-green-600" />
                    <span className="text-xs">Mata Pelajaran</span>
                  </div>
                  <span className="font-semibold text-foreground dark:text-gray-100 text-xs text-right truncate ml-2">
                    {a.mapel?.name || "Umum"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                    <Clock size={14} className="text-green-600" />
                    <span className="text-xs">Waktu</span>
                  </div>
                  <span className="font-semibold text-foreground dark:text-gray-100 text-xs">
                    {a.duration ? `${a.duration} Menit` : "Bebas"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                    <CalendarClock size={14} className="text-green-600" />
                    <span className="text-xs">Jadwal</span>
                  </div>
                  <span className="font-semibold text-foreground dark:text-gray-100 text-[11px] text-right ml-2">
                    {formatDateTime(a.waktu_mulai)} -{" "}
                    {formatDateTime(a.waktu_selesai)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-muted-foreground dark:text-gray-400 text-xs">
                    Status
                  </span>
                  {a.is_completed ? (
                    <Badge className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-900/50 text-[11px] px-2 py-0.5 rounded-full">
                      Selesai
                    </Badge>
                  ) : a.schedule_status === "upcoming" ? (
                    <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-900/50 text-[11px] px-2 py-0.5 rounded-full">
                      Belum Mulai
                    </Badge>
                  ) : a.schedule_status === "closed" ? (
                    <Badge className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-900/50 text-[11px] px-2 py-0.5 rounded-full">
                      Ditutup
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-900/50 text-[11px] px-2 py-0.5 rounded-full">
                      Tersedia
                    </Badge>
                  )}
                </div>

                {a.is_completed && a.nilai && (
                  <div className="flex justify-between items-center pt-2 mt-2">
                    <span className="text-muted-foreground dark:text-gray-400 font-medium text-xs">
                      Nilai
                    </span>
                    <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                      {a.nilai.score}/100
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 pt-3 mt-auto">
                {a.is_completed ? (
                  <Button
                    disabled
                    size="sm"
                    className="w-full bg-muted dark:bg-gray-800 text-muted-foreground dark:text-gray-500 cursor-not-allowed h-9 text-xs border border-border dark:border-gray-700"
                  >
                    Sudah Dikerjakan
                  </Button>
                ) : a.schedule_status === "upcoming" ? (
                  <Button
                    disabled
                    size="sm"
                    className="w-full bg-muted dark:bg-gray-800 text-muted-foreground dark:text-gray-500 cursor-not-allowed h-9 text-xs border border-border dark:border-gray-700"
                  >
                    Belum Mulai
                  </Button>
                ) : a.schedule_status === "closed" ? (
                  <Button
                    disabled
                    size="sm"
                    className="w-full bg-muted dark:bg-gray-800 text-muted-foreground dark:text-gray-500 cursor-not-allowed h-9 text-xs border border-border dark:border-gray-700"
                  >
                    Sudah Ditutup
                  </Button>
                ) : (
                  <Link href={`/siswa/asesmen/${a.id}`} className="block">
                    <Button
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 gap-2 h-9 text-xs"
                    >
                      Mulai Kuis
                      <Play size={14} />
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
