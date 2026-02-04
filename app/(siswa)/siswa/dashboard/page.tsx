"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ClipboardList,
  Microscope,
  User,
  ArrowRight,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SiswaDashboard() {
  const [stats, setStats] = useState({
    totalKelas: 0,
    totalMateri: 0,
    totalAsesmen: 0,
  });
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentMateri, setRecentMateri] = useState<any[]>([]);
  const [recentAsesmen, setRecentAsesmen] = useState<any[]>([]);

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
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(profileData);

        const [kelasRes, materiRes, asesmenRes] = await Promise.all([
          supabase
            .from("kelas_siswa")
            .select("*", { count: "exact" })
            .eq("siswa_id", user.id),
          supabase.from("materi").select("*", { count: "exact" }),
          supabase.from("asesmen").select("*", { count: "exact" }),
        ]);

        setStats({
          totalKelas: kelasRes.count || 0,
          totalMateri: materiRes.count || 0,
          totalAsesmen: asesmenRes.count || 0,
        });

        // Fetch recent materi (latest 1)
        const { data: materiData, error: materiError } = await supabase
          .from("materi")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);

        console.log("Materi data:", materiData);
        console.log("Materi error:", materiError);

        if (materiError) {
          console.error("Error fetching materi:", materiError);
        }

        setRecentMateri(materiData || []);

        // Fetch recent asesmen (latest 1) - most simple query
        const { data: asesmenData, error: asesmenError } = await supabase
          .from("asesmen")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);

        console.log("=== ASESMEN DEBUG ===");
        console.log("Asesmen data:", asesmenData);
        console.log("Asesmen error:", asesmenError);
        console.log("Asesmen length:", asesmenData?.length);

        if (asesmenError) {
          console.error("Error fetching asesmen:", asesmenError);
          setRecentAsesmen([]);
        } else if (asesmenData && asesmenData.length > 0) {
          // Fetch nilai untuk asesmen ini
          const { data: nilaiData, error: nilaiError } = await supabase
            .from("nilai_asesmen")
            .select("id, nilai, completed_at, asesmen_id")
            .eq("siswa_id", user.id)
            .eq("asesmen_id", asesmenData[0].id)
            .maybeSingle();

          console.log("Nilai data:", nilaiData);
          console.log("Nilai error:", nilaiError);

          // Combine data
          const processedData = [
            {
              ...asesmenData[0],
              nilai_asesmen: nilaiData ? [nilaiData] : [],
            },
          ];

          console.log("Processed asesmen:", processedData);
          setRecentAsesmen(processedData);
        } else {
          console.log("No asesmen data found");
          setRecentAsesmen([]);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getGreeting = () => {
    if (!profile) return "Halo";
    const name = profile.full_name || "Siswa";
    return `Halo, ${name}`;
  };

  return (
    <div>
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 border-green-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Materi</h3>
                <BookOpen className="text-green-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-green-600 mb-4">
                {stats.totalMateri}
              </p>
              <Link href="/siswa/materi">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Lihat Materi
                </Button>
              </Link>
            </Card>

            <Card className="p-6 border-green-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Asesmen</h3>
                <ClipboardList className="text-green-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-green-600 mb-4">
                {stats.totalAsesmen}
              </p>
              <Link href="/siswa/asesmen">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Mulai Asesmen
                </Button>
              </Link>
            </Card>

            <Card className="p-6 border-green-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Simulasi</h3>
                <Microscope className="text-green-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-green-600 mb-4">3</p>
              <Link href="/siswa/simulasi">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Jelajahi
                </Button>
              </Link>
            </Card>
          </div>

          {/* Section Materi Terbaru & Tugas Terbaru */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Materi Terbaru */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="text-green-600" size={24} />
                Materi Terbaru
              </h2>
              <div className="space-y-4">
                {recentMateri.length > 0 ? (
                  recentMateri.map((materi) => (
                    <Card
                      key={materi.id}
                      className="p-5 border-green-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="text-green-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {materi.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {materi.description ||
                              "Deskripsi materi belum tersedia"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                            <Calendar size={14} />
                            <span>
                              Diupload:{" "}
                              {new Date(materi.created_at).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          <Link href={`/siswa/materi/${materi.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-green-600 border-green-600 hover:bg-green-50"
                            >
                              Detail Materi{" "}
                              <ArrowRight size={16} className="ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-5 text-center text-gray-500">
                    <p>Belum ada materi terbaru</p>
                  </Card>
                )}
              </div>
            </div>

            {/* Tugas Terbaru */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ClipboardList className="text-green-600" size={24} />
                Tugas Terbaru
              </h2>
              <div className="space-y-4">
                {recentAsesmen.length > 0 ? (
                  recentAsesmen.map((asesmen) => {
                    const isCompleted =
                      asesmen.nilai_asesmen && asesmen.nilai_asesmen.length > 0;
                    const nilaiData = isCompleted
                      ? asesmen.nilai_asesmen[0]
                      : null;

                    return (
                      <Card
                        key={asesmen.id}
                        className="p-5 border-green-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <ClipboardList
                              className="text-green-600"
                              size={20}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {asesmen.title || "Tugas"}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {asesmen.total_questions || "0"} Soal •{" "}
                              {asesmen.duration || "0"} Menit • Nilai:{" "}
                              {nilaiData
                                ? nilaiData.nilai
                                : asesmen.passing_score || "-"}
                            </p>
                            <div className="flex items-center gap-2 text-xs mb-3">
                              {isCompleted ? (
                                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                  ● Selesai
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                                  ● Belum Selesai
                                </span>
                              )}
                            </div>
                            <Link href={`/siswa/asesmen/${asesmen.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-green-600 border-green-600 hover:bg-green-50"
                              >
                                Detail Tugas{" "}
                                <ArrowRight size={16} className="ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="p-5 text-center text-gray-500">
                    <p>Belum ada tugas terbaru</p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
