"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Play, CheckCircle } from "lucide-react";
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
                    nilaiData
                  );

                  return {
                    ...a,
                    soal_count: count || 0,
                    mapel: mapelData,
                    nilai: nilaiData,
                    is_completed: isCompleted,
                  };
                })
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
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Akses Asesmen</h1>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat asesmen...</p>
        </div>
      ) : asesmen.length === 0 ? (
        <Card className="p-12 text-center border-green-100">
          <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">
            Belum ada asesmen tersedia untuk kelas Anda.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {asesmen.map((a) => (
            <Card
              key={a.id}
              className="p-6 border-green-100 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{a.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{a.description}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>
                      <span className="text-gray-500">Mata Pelajaran:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {a.mapel?.name || "-"}
                      </span>
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>📝 {a.soal_count} soal</span>
                    <span>✓ Nilai minimum: {a.passing_score}</span>
                    {a.duration && <span>⏱️ {a.duration} menit</span>}
                  </div>
                  {a.is_completed && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <CheckCircle size={16} />
                      Selesai - Nilai: {a.nilai?.score || 0}
                    </div>
                  )}
                </div>
                {a.is_completed ? (
                  <Button
                    disabled
                    className="bg-gray-300 text-gray-600 cursor-not-allowed"
                  >
                    Sudah Dikerjakan
                  </Button>
                ) : (
                  <Link href={`/siswa/asesmen/${a.id}`}>
                    <Button className="bg-green-600 hover:bg-green-700 gap-2">
                      <Play size={16} />
                      Mulai
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
