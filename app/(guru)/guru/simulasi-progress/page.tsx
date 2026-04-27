"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  MonitorPlay,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SimulasiProgress {
  id: string;
  name: string;
  slug: string;
  completed: boolean;
  completed_at: string | null;
  attempt_count: number;
  first_success_at: string | null;
  success_attempt_no: number | null;
  attempt_history: {
    attempt_no: number;
    result: "success" | "failed";
    created_at: string;
  }[];
}

interface SiswaProgress {
  id: string;
  full_name: string;
  kelas: string;
  simulasi: SimulasiProgress[];
}

interface Simulasi {
  id: string;
  name: string;
  slug: string;
}

export default function SimulasiProgressPage() {
  const [siswaList, setSiswaList] = useState<SiswaProgress[]>([]);
  const [simulasiList, setSimulasiList] = useState<Simulasi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailSiswa, setDetailSiswa] = useState<SiswaProgress | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      const response = await fetch("/api/guru/simulasi-progress", {
        cache: "no-store",
      });
      const data = await response.json();

      if (response.ok) {
        setSiswaList(data.siswa || []);
        setSimulasiList(data.simulasi || []);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();

    const intervalId = window.setInterval(() => {
      fetchProgress();
    }, 15000);

    const handleFocus = () => fetchProgress();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchProgress();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchProgress]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-green-600" size={36} />
      </div>
    );
  }

  const totalSiswa = siswaList.length;
  const totalSimulasi = simulasiList.length;

  // Count siswa who completed ALL simulasi
  const selesaiSemua = siswaList.filter(
    (s) => s.simulasi.length > 0 && s.simulasi.every((sim) => sim.completed),
  ).length;
  const belumSelesai = totalSiswa - selesaiSemua;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
          Progress Simulasi Siswa
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Monitor progress siswa dalam menyelesaikan simulasi interaktif
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-secondary/50 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
            <Users size={13} />
            Total Siswa
          </div>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {totalSiswa}
          </p>
        </Card>

        <Card className="border border-green-100 dark:border-green-900/40 bg-green-50/70 dark:bg-green-900/20 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-green-400 dark:text-green-400">
            <CheckCircle2 size={13} />
            Selesai Semua
          </div>
          <p className="text-3xl font-semibold text-green-700 dark:text-green-300">
            {selesaiSemua}
          </p>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-secondary/30 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
            <MonitorPlay size={13} />
            Belum Selesai
          </div>
          <p className="text-3xl font-semibold text-gray-600 dark:text-gray-400">
            {belumSelesai}
          </p>
        </Card>
      </div>

      {/* Progress Table */}
      <Card className="border border-gray-100 dark:border-gray-800 shadow-sm">
        {siswaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600">
              <Users size={20} />
            </div>
            <p className="text-base font-medium text-gray-700 dark:text-gray-200">
              Tidak ada data siswa
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Data akan muncul setelah siswa terdaftar di kelas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50/80 dark:bg-secondary/30 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Nama Siswa
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Kelas
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Progress
                  </th>
                  <th className="px-4 py-3.5 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-card">
                {siswaList.map((siswa) => {
                  const doneCount = siswa.simulasi.filter(
                    (s) => s.completed,
                  ).length;
                  const pct =
                    totalSimulasi > 0
                      ? Math.round((doneCount / totalSimulasi) * 100)
                      : 0;

                  return (
                    <tr
                      key={siswa.id}
                      className="transition-colors duration-150 hover:bg-gray-50/60 dark:hover:bg-secondary/50"
                    >
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {siswa.full_name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {siswa.kelas || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                            <div
                              className="h-full rounded-full bg-green-500 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {pct}%
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            ({doneCount}/{totalSimulasi} simulasi)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-secondary"
                          onClick={() => setDetailSiswa(siswa)}
                        >
                          Detail
                          <ChevronRight size={13} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={detailSiswa !== null}
        onOpenChange={(open) => !open && setDetailSiswa(null)}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[85vh] overflow-y-auto dark:bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Detail Simulasi
            </DialogTitle>
            {detailSiswa && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {detailSiswa.full_name}
                {detailSiswa.kelas ? (
                  <span className="ml-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">
                    {detailSiswa.kelas}
                  </span>
                ) : null}
              </p>
            )}
          </DialogHeader>

          {detailSiswa && (
            <div className="mt-2 space-y-3">
              {/* Mini progress summary */}
              {(() => {
                const progressMap = Object.fromEntries(
                  detailSiswa.simulasi.map((s) => [s.id, s]),
                );
                const done = simulasiList.filter(
                  (s) => progressMap[s.id]?.completed,
                ).length;
                const total = simulasiList.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {pct}%
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {done}/{total} simulasi
                    </span>
                  </div>
                );
              })()}

              {/* Simulasi list */}
              <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-secondary/30">
                {simulasiList.map((sim) => {
                  const progress = detailSiswa.simulasi.find(
                    (s) => s.id === sim.id,
                  );
                  const completed = progress?.completed ?? false;
                  const completed_at = progress?.completed_at ?? null;
                  const attemptCount = progress?.attempt_count ?? 0;
                  const successAttemptNo = progress?.success_attempt_no ?? null;
                  const firstSuccessAt = progress?.first_success_at ?? null;
                  const history = progress?.attempt_history ?? [];
                  return (
                    <div
                      key={sim.id}
                      className="flex items-start gap-3 px-4 py-3"
                    >
                      <span className="mt-0.5 shrink-0">
                        {completed ? (
                          <CheckCircle2
                            size={16}
                            className="text-green-500 dark:text-green-400"
                            fill="currentColor"
                          />
                        ) : (
                          <XCircle
                            size={16}
                            className="text-gray-300 dark:text-gray-700"
                          />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium ${
                            completed
                              ? "text-gray-900 dark:text-gray-100"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          {sim.name}
                        </p>
                        {completed && completed_at && (
                          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                            Selesai{" "}
                            {new Date(completed_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Percobaan: {attemptCount}
                          {successAttemptNo
                            ? ` • Berhasil di percobaan ke-${successAttemptNo}`
                            : " • Belum berhasil"}
                        </p>
                        {firstSuccessAt && (
                          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                            Berhasil pertama:{" "}
                            {new Date(firstSuccessAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </p>
                        )}
                        {history.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {history.map((attempt) => (
                              <span
                                key={`${sim.id}-${attempt.attempt_no}`}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  attempt.result === "success"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                                    : "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300"
                                }`}
                              >
                                #{attempt.attempt_no}{" "}
                                {attempt.result === "success"
                                  ? "berhasil"
                                  : "gagal"}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          completed
                            ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {completed ? "Selesai" : "Belum"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
