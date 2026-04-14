"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, BookOpen, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface AsesmenCard {
  id: string;
  kelas?: {
    id: string;
    name: string;
  } | null;
  mapel?: {
    id: string;
    name: string;
  } | null;
  participant_count: number;
}

export default function GuruNilaiPage() {
  const [asesmen, setAsesmen] = useState<AsesmenCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
    let isActive = true;

    const initRealtime = async () => {
      await fetchAsesmen();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isActive || !user) return;

      realtimeChannel = supabase
        .channel(`guru-nilai-live:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "asesmen",
            filter: `created_by=eq.${user.id}`,
          },
          () => {
            void fetchAsesmen();
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "nilai",
          },
          () => {
            void fetchAsesmen();
          },
        )
        .subscribe();
    };

    void initRealtime();

    return () => {
      isActive = false;
      if (realtimeChannel) {
        void supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  const fetchAsesmen = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    try {
      // Fetch asesmen created by this guru
      const { data: asesmenData } = await supabase
        .from("asesmen")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      // Get details for each asesmen
      if (asesmenData) {
        const asesmenWithDetails = await Promise.all(
          asesmenData.map(async (a) => {
            // Get kelas
            let kelasData = null;
            if (a.kelas_id) {
              const { data } = await supabase
                .from("kelas")
                .select("id, name")
                .eq("id", a.kelas_id)
                .single();
              kelasData = data;
            }

            // Get mapel
            let mapelData = null;
            if (a.mapel_id) {
              const { data } = await supabase
                .from("mapel")
                .select("id, name")
                .eq("id", a.mapel_id)
                .single();
              mapelData = data;
            }

            // Get nilai stats
            const { data: nilaiData } = await supabase
              .from("nilai")
              .select("siswa_id, score, completed_at")
              .eq("asesmen_id", a.id);

            const completedAttempts = (nilaiData || []).filter(
              (item) => item.completed_at !== null && item.score !== null,
            );

            const participantCount = new Set(
              completedAttempts.map((item) => item.siswa_id),
            ).size;

            return {
              ...a,
              kelas: kelasData,
              mapel: mapelData,
              participant_count: participantCount,
            };
          }),
        );
        setAsesmen(asesmenWithDetails);
      }
    } catch (error) {
      console.error("Error fetching asesmen:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Kelola Nilai</h1>
          <p className="mt-2 text-sm text-gray-500">
            Pantau hasil kuis siswa dengan ringkasan yang lebih cepat dibaca.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-200 border-t-green-600"></div>
          <p className="text-gray-600">Memuat asesmen...</p>
        </div>
      ) : asesmen.length === 0 ? (
        <Card className="rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-600">
            <BarChart3 size={30} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Belum ada nilai yang tersedia.
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Buat kuis terlebih dahulu untuk mulai memantau performa siswa.
          </p>
          <Link href="/guru/asesmen">
            <Button className="mt-6 bg-green-600 hover:bg-green-700">
              Buat Kuis
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {asesmen.map((a) => (
            <Card
              key={a.id}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                      {a.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-600">
                        <BookOpen size={14} />
                        Soal Pilihan Ganda
                      </span>
                      <span className="font-medium text-gray-700">
                        {a.mapel?.name || "-"}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="font-medium text-gray-700">
                        {a.kelas?.name || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-end lg:w-auto">
                    <Link href={`/guru/nilai/${a.id}`}>
                      <Button className="h-10 bg-green-600 px-4 hover:bg-green-700">
                        <Eye size={16} className="mr-2" />
                        Lihat Nilai
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <BarChart3 size={14} className="text-gray-400" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                        Partisipasi
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {a.participant_count} siswa
                      </p>
                    </div>
                  </div>

                  {a.participant_count === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                      Belum ada siswa yang mengerjakan kuis ini.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
