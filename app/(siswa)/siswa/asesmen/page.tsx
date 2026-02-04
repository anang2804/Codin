"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Play,
  CheckCircle,
  Clock,
  FileText,
  Award,
  BookOpen,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SiswaAsesmenPage() {
  const [asesmen, setAsesmen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardList className="text-green-600" size={28} />
            Akses Kuis
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Kerjakan kuis untuk menguji pemahaman materi
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat kuis...</p>
        </div>
      ) : asesmen.length === 0 ? (
        <Card className="p-12 text-center border-green-100">
          <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">
            Belum ada kuis tersedia untuk kelas Anda.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {asesmen.map((a) => (
            <Card
              key={a.id}
              className="overflow-hidden border-gray-200 hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b bg-gradient-to-r from-green-50 to-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList className="text-green-600" size={16} />
                  <span className="font-medium text-gray-700 text-xs">
                    Kuis
                  </span>
                </div>
                <h2 className="text-sm font-bold text-gray-900 line-clamp-2">
                  {a.title}
                </h2>
              </div>

              {/* Content */}
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Soal</span>
                  <span className="font-semibold text-gray-900">
                    {a.soal_count}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mapel</span>
                  <span className="font-semibold text-gray-900 text-right truncate ml-2">
                    {a.mapel?.name || "Umum"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Waktu</span>
                  <span className="font-semibold text-gray-900">
                    {a.duration ? `${a.duration} Menit` : "Bebas"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Nilai Min</span>
                  <span className="font-semibold text-gray-900">
                    {a.passing_score}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-600">Status</span>
                  {a.is_completed ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs px-2 py-0">
                      Selesai
                    </Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs px-2 py-0">
                      Tersedia
                    </Badge>
                  )}
                </div>
                {a.is_completed && a.nilai && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-600 font-medium">Nilai</span>
                    <span className="font-bold text-green-600 text-base">
                      {a.nilai.score}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="p-3 pt-0">
                {a.is_completed ? (
                  <Button
                    disabled
                    size="sm"
                    className="w-full bg-gray-200 text-gray-600 cursor-not-allowed h-8 text-xs"
                  >
                    Sudah Dikerjakan
                  </Button>
                ) : (
                  <Link href={`/siswa/asesmen/${a.id}`} className="block">
                    <Button
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 gap-2 h-8 text-xs"
                    >
                      Detail Kuis
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
