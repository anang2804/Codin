"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  BookOpen,
  Eye,
  LineChart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface AsesmenCard {
  id: string;
  title: string;
  passing_score?: number | null;
  created_at?: string;
  kelas?: {
    id: string;
    name: string;
  } | null;
  mapel?: {
    id: string;
    name: string;
  } | null;
  participant_count: number;
  average_score: number | null;
  highest_score: number | null;
  lowest_score: number | null;
}

const formatScore = (value: number | null) =>
  value === null
    ? "-"
    : Number.isInteger(value)
      ? `${value}`
      : value.toFixed(1);

export default function GuruNilaiPage() {
  const [asesmen, setAsesmen] = useState<AsesmenCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAsesmen();
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
              .select("siswa_id, score")
              .eq("asesmen_id", a.id);

            const completedScores = (nilaiData || [])
              .filter((item) => item.score !== null)
              .map((item) => item.score as number);

            const participantCount = new Set(
              (nilaiData || [])
                .filter((item) => item.score !== null)
                .map((item) => item.siswa_id),
            ).size;

            const averageScore =
              completedScores.length > 0
                ? Number(
                    (
                      completedScores.reduce((sum, score) => sum + score, 0) /
                      completedScores.length
                    ).toFixed(1),
                  )
                : null;

            const highestScore =
              completedScores.length > 0 ? Math.max(...completedScores) : null;

            const lowestScore =
              completedScores.length > 0 ? Math.min(...completedScores) : null;

            return {
              ...a,
              kelas: kelasData,
              mapel: mapelData,
              participant_count: participantCount,
              average_score: averageScore,
              highest_score: highestScore,
              lowest_score: lowestScore,
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
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
          <BarChart3 size={14} />
          Dashboard Nilai
        </div>
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
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1 space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {a.title}
                    </h3>

                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                      <BookOpen size={14} />
                      Soal Pilihan Ganda
                    </div>

                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">
                        {a.mapel?.name || "-"}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="font-medium text-gray-700">
                        {a.kelas?.name || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                        <BarChart3 size={14} />
                        Partisipasi
                      </div>
                      <p className="text-base font-semibold text-gray-900">
                        {a.participant_count} siswa
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                        <LineChart size={14} />
                        Rata-rata
                      </div>
                      <p className="text-base font-semibold text-gray-900">
                        {formatScore(a.average_score)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                        <TrendingUp size={14} />
                        Tertinggi
                      </div>
                      <p className="text-base font-semibold text-gray-900">
                        {formatScore(a.highest_score)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                        <TrendingDown size={14} />
                        Terendah
                      </div>
                      <p className="text-base font-semibold text-gray-900">
                        {formatScore(a.lowest_score)}
                      </p>
                    </div>
                  </div>

                  {a.participant_count === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                      <p className="font-medium text-gray-700">
                        Belum ada siswa yang mengerjakan kuis ini.
                      </p>
                      <p className="mt-1 text-gray-500">
                        Nilai akan muncul setelah siswa menyelesaikan kuis.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end lg:w-auto">
                  <Link href={`/guru/nilai/${a.id}`}>
                    <Button className="h-11 bg-green-600 px-5 hover:bg-green-700">
                      <Eye size={16} className="mr-2" />
                      Lihat Nilai
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
