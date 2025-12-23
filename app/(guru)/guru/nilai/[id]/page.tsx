"use client";

import React, { useEffect, useState, use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  History,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type NilaiHistory = {
  id: string;
  score: number;
  completed_at: string;
};

type NilaiData = {
  siswa_id: string;
  profiles: any;
  score: number | null;
  completed_at: string | null;
  id: string | null;
  attempt_count: number;
  all_attempts: NilaiHistory[];
};

export default function GuruNilaiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [asesmen, setAsesmen] = useState<any>(null);
  const [nilai, setNilai] = useState<NilaiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyDialog, setHistoryDialog] = useState<{
    open: boolean;
    siswaName: string;
    attempts: NilaiHistory[];
  }>({ open: false, siswaName: "", attempts: [] });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const supabase = createClient();
    try {
      // Fetch asesmen
      const { data: asesmenData, error: asesmenError } = await supabase
        .from("asesmen")
        .select("*")
        .eq("id", id)
        .single();

      if (asesmenError) {
        console.error("Error fetching asesmen:", asesmenError);
      }

      setAsesmen(asesmenData);

      if (!asesmenData?.kelas_id) {
        setNilai([]);
        setLoading(false);
        return;
      }

      // Get kelas name
      const { data: kelasData } = await supabase
        .from("kelas")
        .select("name")
        .eq("id", asesmenData.kelas_id)
        .single();

      // Fetch all students from this kelas
      const { data: siswaData, error: siswaError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "siswa")
        .eq("kelas", kelasData?.name || "")
        .order("full_name", { ascending: true });

      if (siswaError) {
        console.error("Error fetching siswa:", siswaError);
      }

      console.log("Siswa data:", siswaData);

      // For each siswa, get ALL their nilai attempts
      if (siswaData) {
        const siswaWithNilai = await Promise.all(
          siswaData.map(async (siswa) => {
            // Get ALL nilai for this siswa (not just latest)
            const { data: allNilaiData, error: nilaiError } = await supabase
              .from("nilai")
              .select("id, score, completed_at")
              .eq("asesmen_id", id)
              .eq("siswa_id", siswa.id)
              .order("completed_at", { ascending: false });

            console.log(
              `All nilai for ${siswa.full_name}:`,
              allNilaiData,
              nilaiError
            );

            const latestNilai = allNilaiData?.[0];
            const attemptCount = allNilaiData?.length || 0;

            return {
              siswa_id: siswa.id,
              profiles: siswa,
              score: latestNilai?.score ?? null,
              completed_at: latestNilai?.completed_at ?? null,
              id: latestNilai?.id ?? null,
              attempt_count: attemptCount,
              all_attempts: allNilaiData || [],
            };
          })
        );
        console.log("Siswa with nilai:", siswaWithNilai);
        setNilai(siswaWithNilai);
      } else {
        setNilai([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (siswaId: string, siswaName: string) => {
    if (
      !confirm(
        `Yakin ingin membuka ulang asesmen untuk ${siswaName}? Nilai lama akan tetap tersimpan, siswa dapat mengerjakan ulang.`
      )
    )
      return;

    const supabase = createClient();
    try {
      // Only delete jawaban siswa, keep nilai for history
      const { error: jawabanError } = await supabase
        .from("jawaban_siswa")
        .delete()
        .eq("asesmen_id", id)
        .eq("siswa_id", siswaId);

      if (jawabanError) throw jawabanError;

      alert(
        "Berhasil membuka ulang asesmen. Siswa dapat mengerjakan ulang. Nilai lama tetap tersimpan."
      );
      fetchData();
    } catch (error: any) {
      console.error("Error resetting:", error);
      alert(`Gagal membuka ulang: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const completedCount = nilai.filter((n) => n.score !== null).length;
  const totalSiswa = nilai.length;

  const scoreValues = nilai
    .filter((n) => n.score !== null)
    .map((n) => n.score || 0);
  const averageScore =
    scoreValues.length > 0
      ? Math.round(
          scoreValues.reduce((sum, s) => sum + s, 0) / scoreValues.length
        )
      : 0;

  const passedCount = nilai.filter(
    (n) => n.score !== null && n.score >= (asesmen?.passing_score || 70)
  ).length;

  const failedCount = completedCount - passedCount;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/guru/nilai">
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} className="mr-2" />
            Kembali
          </Button>
        </Link>
      </div>

      {/* Asesmen Info */}
      <Card className="p-6 mb-6 border-green-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {asesmen?.title}
        </h1>

        {/* Statistik */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <p className="text-gray-700 font-medium">
            {completedCount} siswa telah mengerjakan
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total siswa</p>
            <p className="text-2xl font-bold text-blue-600">{nilai.length}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Nilai diatas KKM</p>
            <p className="text-2xl font-bold text-green-600">{passedCount}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Dibawah KKM</p>
            <p className="text-2xl font-bold text-red-600">{failedCount}</p>
          </div>
        </div>
      </Card>

      {/* Nilai List */}
      <Card className="border-green-100">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Daftar Nilai Siswa
          </h2>
          {nilai.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              Belum ada siswa yang mengerjakan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Nama Siswa
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Nilai
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Waktu Selesai
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {nilai.map((n, index) => {
                    const hasScore = n.score !== null;
                    const isPassed =
                      hasScore && n.score >= (asesmen?.passing_score || 70);
                    return (
                      <tr
                        key={`${n.siswa_id}-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {n.profiles?.full_name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasScore ? (
                            <div className="flex items-center justify-center gap-2">
                              <span
                                className={`text-lg font-bold ${
                                  isPassed ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {n.score}
                              </span>
                              {n.attempt_count > 1 && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {n.attempt_count}x
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasScore ? (
                            isPassed ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                <CheckCircle size={14} />
                                Lulus
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                <XCircle size={14} />
                                Tidak Lulus
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                              Belum Mengerjakan
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {n.completed_at
                            ? new Date(n.completed_at).toLocaleString("id-ID")
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            {hasScore && n.attempt_count > 1 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setHistoryDialog({
                                    open: true,
                                    siswaName:
                                      n.profiles?.full_name || "Unknown",
                                    attempts: n.all_attempts,
                                  })
                                }
                                className="border-blue-400 text-blue-600 hover:bg-blue-50"
                              >
                                <History size={14} className="mr-1" />
                                History
                              </Button>
                            )}
                            {hasScore && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleReset(
                                    n.siswa_id,
                                    n.profiles?.full_name || "Unknown"
                                  )
                                }
                                className="border-orange-400 text-orange-600 hover:bg-orange-50"
                              >
                                <RefreshCw size={14} className="mr-1" />
                                Buka Ulang
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* History Dialog */}
      <Dialog
        open={historyDialog.open}
        onOpenChange={(open) => setHistoryDialog({ ...historyDialog, open })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>History Nilai - {historyDialog.siswaName}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border">
                    Percobaan
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border">
                    Nilai
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border">
                    Waktu
                  </th>
                </tr>
              </thead>
              <tbody>
                {historyDialog.attempts.map((attempt, index) => {
                  const isPassed =
                    attempt.score >= (asesmen?.passing_score || 70);
                  return (
                    <tr key={attempt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 border">
                        Percobaan ke-{historyDialog.attempts.length - index}
                        {index === 0 && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Terbaru
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center border">
                        <span
                          className={`text-lg font-bold ${
                            isPassed ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {attempt.score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center border">
                        {isPassed ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle size={12} />
                            Lulus
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <XCircle size={12} />
                            Tidak Lulus
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600 border">
                        {new Date(attempt.completed_at).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
