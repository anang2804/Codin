"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
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
  };

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
        <div className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
          <MonitorPlay size={13} />
          Monitoring Simulasi
        </div>
        <h1 className="text-3xl font-semibold text-gray-900">
          Progress Simulasi Siswa
        </h1>
        <p className="text-sm text-gray-500">
          Monitor progress siswa dalam menyelesaikan simulasi interaktif
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            <Users size={13} />
            Total Siswa
          </div>
          <p className="text-3xl font-semibold text-gray-900">{totalSiswa}</p>
        </Card>

        <Card className="border border-green-100 bg-green-50/70 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-green-400">
            <CheckCircle2 size={13} />
            Selesai Semua
          </div>
          <p className="text-3xl font-semibold text-green-700">
            {selesaiSemua}
          </p>
        </Card>

        <Card className="border border-gray-200 bg-gray-50/60 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            <MonitorPlay size={13} />
            Belum Selesai
          </div>
          <p className="text-3xl font-semibold text-gray-600">{belumSelesai}</p>
        </Card>
      </div>

      {/* Progress Table */}
      <Card className="border border-gray-100 shadow-sm">
        {siswaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Users size={20} />
            </div>
            <p className="text-base font-medium text-gray-700">
              Tidak ada data siswa
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Data akan muncul setelah siswa terdaftar di kelas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">
                    Nama Siswa
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">
                    Kelas
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">
                    Progress
                  </th>
                  <th className="px-4 py-3.5 text-center text-sm font-semibold text-gray-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
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
                      className="transition-colors duration-150 hover:bg-gray-50/60"
                    >
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {siswa.full_name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {siswa.kelas || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-green-500 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">
                            {pct}%
                          </span>
                          <span className="text-xs text-gray-400">
                            ({doneCount}/{totalSimulasi} simulasi)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Detail Simulasi
            </DialogTitle>
            {detailSiswa && (
              <p className="text-sm text-gray-500">
                {detailSiswa.full_name}
                {detailSiswa.kelas ? (
                  <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
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
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">
                      {pct}%
                    </span>
                    <span className="text-xs text-gray-400">
                      {done}/{total} simulasi
                    </span>
                  </div>
                );
              })()}

              {/* Simulasi list */}
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/50">
                {simulasiList.map((sim) => {
                  const progress = detailSiswa.simulasi.find(
                    (s) => s.id === sim.id,
                  );
                  const completed = progress?.completed ?? false;
                  const completed_at = progress?.completed_at ?? null;
                  return (
                    <div
                      key={sim.id}
                      className="flex items-start gap-3 px-4 py-3"
                    >
                      <span className="mt-0.5 shrink-0">
                        {completed ? (
                          <CheckCircle2
                            size={16}
                            className="text-green-500"
                            fill="currentColor"
                          />
                        ) : (
                          <XCircle size={16} className="text-gray-300" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium ${
                            completed ? "text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {sim.name}
                        </p>
                        {completed && completed_at && (
                          <p className="mt-0.5 text-xs text-gray-400">
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
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          completed
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-400"
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
