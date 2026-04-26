"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchAsesmen = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      try {
        // Get siswa's kelas from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("kelas")
          .eq("id", user.id)
          .single();

        if (profile?.kelas) {
          // Get kelas_id from kelas name
          const { data: kelasData } = await supabase
            .from("kelas")
            .select("id")
            .eq("name", profile.kelas)
            .single();

          if (kelasData) {
            // Fetch asesmen for this kelas
            const { data: asesmenData } = await supabase
              .from("asesmen")
              .select("*")
              .eq("kelas_id", kelasData.id)
              .order("created_at", { ascending: false });

            // Fetch details for each asesmen
            if (asesmenData) {
              const asesmenWithDetails = await Promise.all(
                asesmenData.map(async (a) => {
                  // Get soal count
                  const { count } = await supabase
                    .from("soal")
                    .select("*", { count: "exact", head: true })
                    .eq("asesmen_id", a.id);

                  // Get mapel
                  let mapelData = null;
                  if (a.mapel_id) {
                    const { data } = await supabase
                      .from("mapel")
                      .select("name")
                      .eq("id", a.mapel_id)
                      .single();
                    mapelData = data;
                  }

                  // Check if siswa has submitted answers
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

                  console.log(`Asesmen ${a.title} - Jawaban:`, jawabanData);

                  const isCompleted = jawabanData && jawabanData.length > 0;

                  // Get latest nilai
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

                  console.log(
                    `Asesmen ${a.title} - isCompleted:`,
                    isCompleted,
                    "Nilai:",
                    nilaiData,
                  );

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
        setLoading(false);
      }
    };

    fetchAsesmen();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = window.setTimeout(() => setAnimateCards(true), 40);
      return () => window.clearTimeout(timer);
    }
  }, [loading]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
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
            <p className="text-muted-foreground dark:text-gray-400">Memuat kuis...</p>
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
              className={`overflow-hidden border-border bg-card rounded-xl shadow-sm hover:shadow-md hover:-translate-y-[5px] transition-all duration-200 flex flex-col ${animateCards ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-border bg-gradient-to-r from-green-50 to-green-100 dark:from-emerald-500/10 dark:to-emerald-500/20">
                className={`overflow-hidden border-border dark:border-gray-800 bg-card dark:bg-card rounded-xl shadow-sm hover:shadow-md hover:-translate-y-[5px] transition-all duration-200 flex flex-col ${animateCards ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
                  <ClipboardList className="text-green-600" size={16} />
                  <span className="font-medium text-muted-foreground text-xs">
                    Kuis
                <div className="px-4 py-2.5 border-b border-border dark:border-gray-800 bg-gradient-to-r from-green-50 dark:from-emerald-500/10 to-green-100 dark:to-emerald-500/20">
                </div>
                <h2 className="text-sm font-bold text-foreground line-clamp-2">
                    <span className="font-medium text-muted-foreground dark:text-gray-400 text-xs">
                </h2>
              </div>

                  <h2 className="text-sm font-bold text-foreground dark:text-gray-100 line-clamp-2">
              <div className="p-4 space-y-2.5 text-sm flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText size={14} className="text-green-600" />
                    <span className="text-xs">Jumlah Soal</span>
                <div className="p-4 space-y-2.5 text-sm flex-1 border-b border-border dark:border-gray-800">
                  <span className="font-semibold text-foreground text-xs">
                    {a.soal_count} soal
                  </span>
                </div>

                    <span className="font-semibold text-foreground dark:text-gray-100 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen size={14} className="text-green-600" />
                    <span className="text-xs">Mata Pelajaran</span>
                  </div>
                  <span className="font-semibold text-foreground text-xs text-right truncate ml-2">
                    {a.mapel?.name || "Umum"}
                  </span>
                </div>

                    <span className="font-semibold text-foreground dark:text-gray-100 text-xs text-right truncate ml-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={14} className="text-green-600" />
                    <span className="text-xs">Waktu</span>
                  </div>
                  <span className="font-semibold text-foreground text-xs">
                    {a.duration ? `${a.duration} Menit` : "Bebas"}
                  </span>
                </div>

                    <span className="font-semibold text-foreground dark:text-gray-100 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarClock size={14} className="text-green-600" />
                    <span className="text-xs">Jadwal</span>
                  </div>
                  <span className="font-semibold text-foreground text-[11px] text-right ml-2">
                    {formatDateTime(a.waktu_mulai)} -{" "}
                    {formatDateTime(a.waktu_selesai)}
                  </span>
                </div>
                    <span className="font-semibold text-foreground dark:text-gray-100 text-[11px] text-right ml-2">
                <div className="flex justify-between items-center pt-1.5 border-t border-border">
                  <span className="text-muted-foreground text-xs">Status</span>
                  {a.is_completed ? (
                    <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border border-green-200 text-[11px] px-2 py-0.5 rounded-full">
                      Selesai
                  <div className="flex justify-between items-center pt-1.5">
                    <span className="text-muted-foreground dark:text-gray-400 text-xs">Status</span>
                    <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200 text-[11px] px-2 py-0.5 rounded-full">
                      <Badge className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-900/50 text-[11px] px-2 py-0.5 rounded-full">
                    </Badge>
                  ) : a.schedule_status === "closed" ? (
                    <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border border-red-200 text-[11px] px-2 py-0.5 rounded-full">
                      <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-900/50 text-[11px] px-2 py-0.5 rounded-full">
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 text-[11px] px-2 py-0.5 rounded-full">
                      <Badge className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-900/50 text-[11px] px-2 py-0.5 rounded-full">
                    </Badge>
                  )}
                </div>
                      <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-900/50 text-[11px] px-2 py-0.5 rounded-full">
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

              {/* Action Button */}
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
