"use client";

import React, { useEffect, useState, use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  RefreshCw,
  History,
  Users,
  ClipboardCheck,
  FileBarChart,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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
  const [resetDialog, setResetDialog] = useState<{
    open: boolean;
    siswaId: string;
    siswaName: string;
  }>({ open: false, siswaId: "", siswaName: "" });
  const [isResetting, setIsResetting] = useState(false);

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

      const { data: mapelData } = asesmenData?.mapel_id
        ? await supabase
            .from("mapel")
            .select("name")
            .eq("id", asesmenData.mapel_id)
            .single()
        : { data: null };

      setAsesmen({
        ...asesmenData,
        kelas: kelasData,
        mapel: mapelData,
      });

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
          }),
        );
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

  const handleReset = (siswaId: string, siswaName: string) => {
    setResetDialog({ open: true, siswaId, siswaName });
  };

  const confirmReset = async () => {
    if (!resetDialog.siswaId) return;

    setIsResetting(true);
    const supabase = createClient();
    try {
      // Only delete jawaban siswa, keep nilai for history
      const { error: jawabanError } = await supabase
        .from("jawaban_siswa")
        .delete()
        .eq("asesmen_id", id)
        .eq("siswa_id", resetDialog.siswaId);

      if (jawabanError) throw jawabanError;

      toast.success(
        "Berhasil membuka ulang asesmen. Siswa dapat mengerjakan ulang. Nilai lama tetap tersimpan.",
      );
      setResetDialog({ open: false, siswaId: "", siswaName: "" });
      fetchData();
    } catch (error: any) {
      console.error("Error resetting:", error);
      toast.error(`Gagal membuka ulang: ${error.message}`);
    } finally {
      setIsResetting(false);
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
          scoreValues.reduce((sum, s) => sum + s, 0) / scoreValues.length,
        )
      : 0;

  const handleDownloadExcel = () => {
    if (nilai.length === 0) {
      toast.info("Belum ada data siswa yang dapat diunduh.");
      return;
    }

    try {
      const rows = nilai.map((n, index) => ({
        No: index + 1,
        "Nama Siswa": n.profiles?.full_name || "-",
        Nilai: n.score ?? "-",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Nilai");

      const kelasName = (asesmen?.kelas?.name || "kelas").replace(/\s+/g, "_");
      const quizName = (asesmen?.title || "kuis")
        .toLowerCase()
        .replace(/\s+/g, "_");
      const fileName = `nilai_${quizName}_${kelasName}.xlsx`;

      const wbout: ArrayBuffer = XLSX.write(wb, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Small delay before cleanup to ensure the click has fired
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);

      toast.success("Data nilai berhasil diunduh.");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Gagal mengunduh file. Silakan coba lagi.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/guru/nilai">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft size={16} className="mr-2" />
            Kembali
          </Button>
        </Link>
      </div>

      {/* Asesmen Info */}
      <Card className="border border-gray-100 p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">
            {asesmen?.title}
          </h1>
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">
              {asesmen?.mapel?.name || "-"}
            </span>
            <span className="mx-2 text-gray-300">•</span>
            <span className="font-medium text-gray-700">
              {asesmen?.kelas?.name || "-"}
            </span>
          </p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            <Users size={14} />
            Total Siswa
          </div>
          <p className="text-3xl font-semibold text-gray-900">{totalSiswa}</p>
        </Card>

        <Card className="border border-blue-100 bg-blue-50/70 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-400">
            <ClipboardCheck size={14} />
            Sudah Mengerjakan
          </div>
          <p className="text-3xl font-semibold text-blue-700">
            {completedCount}
          </p>
        </Card>
      </div>

      {/* Nilai List */}
      <Card className="border border-gray-100 shadow-sm">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileBarChart size={18} className="text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Daftar Nilai Siswa
              </h2>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadExcel}
              className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-colors duration-150"
            >
              <Download size={14} className="mr-1.5" />
              Download Excel
            </Button>
          </div>
          {nilai.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                <FileBarChart size={20} />
              </div>
              <p className="text-base font-medium text-gray-700">
                Belum ada siswa yang mengerjakan kuis ini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedCount === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                  <p className="font-medium text-gray-700">
                    Belum ada siswa yang mengerjakan kuis ini.
                  </p>
                  <p className="mt-1 text-gray-500">
                    Nilai akan muncul setelah siswa menyelesaikan kuis.
                  </p>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">
                        No
                      </th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">
                        Nama Siswa
                      </th>
                      <th className="px-4 py-3.5 text-center text-sm font-semibold text-gray-700">
                        Nilai
                      </th>
                      <th className="px-4 py-3.5 text-center text-sm font-semibold text-gray-700">
                        Waktu Selesai
                      </th>
                      <th className="px-4 py-3.5 text-center text-sm font-semibold text-gray-700">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {nilai.map((n, index) => {
                      const hasScore = n.score !== null;
                      return (
                        <tr
                          key={`${n.siswa_id}-${index}`}
                          className="transition-colors duration-150 hover:bg-gray-50/80"
                        >
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {n.profiles?.full_name || "Unknown"}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {hasScore ? (
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-lg font-semibold text-gray-900">
                                  {n.score}
                                </span>
                                {n.attempt_count > 1 && (
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                    {n.attempt_count}x
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-gray-600">
                            {n.completed_at
                              ? new Date(n.completed_at).toLocaleString("id-ID")
                              : "-"}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex justify-center gap-2">
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
                                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                >
                                  <History size={14} className="mr-1" />
                                  Riwayat
                                </Button>
                              )}
                              {hasScore && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleReset(
                                      n.siswa_id,
                                      n.profiles?.full_name || "Unknown",
                                    )
                                  }
                                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
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
            <DialogTitle>Riwayat Nilai - {historyDialog.siswaName}</DialogTitle>
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
                    Waktu
                  </th>
                </tr>
              </thead>
              <tbody>
                {historyDialog.attempts.map((attempt, index) => {
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
                        <span className="text-lg font-bold text-gray-900">
                          {attempt.score}
                        </span>
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

      <Dialog
        open={resetDialog.open}
        onOpenChange={(open) => setResetDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md rounded-xl border border-gray-100 p-7 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Buka Ulang Asesmen
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              {`Yakin ingin membuka ulang asesmen untuk ${resetDialog.siswaName}? Nilai lama akan tetap tersimpan, siswa dapat mengerjakan ulang.`}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setResetDialog({ open: false, siswaId: "", siswaName: "" })
              }
              disabled={isResetting}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={confirmReset}
              disabled={isResetting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isResetting ? "Memproses..." : "Ya, Buka Ulang"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
