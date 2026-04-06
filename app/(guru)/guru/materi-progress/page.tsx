"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Loader2,
  Search,
  TrendingUp,
  Users,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DetailProgress {
  materi_id: string;
  materi_title: string;
  completed_sub_bab: number;
  total_sub_bab: number;
  progress_percentage: number;
  last_read_at: string;
  completed_at: string | null;
}

interface SiswaProgress {
  id: string;
  full_name: string;
  kelas: string | null;
  materi_started: number;
  materi_completed: number;
  average_progress: number;
  progress: DetailProgress[];
}

interface Summary {
  total_siswa: number;
  active_siswa: number;
  completed_siswa: number;
  overall_average: number;
}

export default function GuruMateriProgressPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [kelasFilter, setKelasFilter] = useState("all");
  const [summary, setSummary] = useState<Summary>({
    total_siswa: 0,
    active_siswa: 0,
    completed_siswa: 0,
    overall_average: 0,
  });
  const [siswaList, setSiswaList] = useState<SiswaProgress[]>([]);
  const [detailSiswa, setDetailSiswa] = useState<SiswaProgress | null>(null);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await fetch(
        `/api/guru/materi-progress?t=${Date.now()}`,
        {
          cache: "no-store",
        },
      );
      const data = await response.json();
      if (response.ok) {
        setSummary(data.summary || summary);
        setSiswaList(data.siswa || []);
      }
    } catch (error) {
      console.error("Error fetching materi progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const kelasOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of siswaList) {
      if (s.kelas) set.add(s.kelas);
    }
    return Array.from(set).sort();
  }, [siswaList]);

  const filteredSiswa = useMemo(() => {
    const term = query.trim().toLowerCase();
    return siswaList.filter((s) => {
      const matchTerm =
        !term ||
        s.full_name.toLowerCase().includes(term) ||
        (s.kelas || "").toLowerCase().includes(term);
      const matchKelas = kelasFilter === "all" || s.kelas === kelasFilter;
      return matchTerm && matchKelas;
    });
  }, [siswaList, query, kelasFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-green-600" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-gray-900">
          Progress Materi Siswa
        </h1>
        <p className="text-sm text-gray-500">
          Pantau perkembangan belajar siswa berdasarkan materi yang telah
          dibaca.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            <Users size={13} />
            Total Siswa
          </div>
          <p className="text-3xl font-semibold text-gray-900">
            {summary.total_siswa}
          </p>
        </Card>

        <Card className="border border-blue-100 bg-blue-50/70 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-400">
            <BookOpen size={13} />
            Sudah Dibuka
          </div>
          <p className="text-3xl font-semibold text-blue-700">
            {summary.active_siswa}
          </p>
        </Card>

        <Card className="border border-green-100 bg-green-50/70 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-green-400">
            <CheckCircle2 size={13} />
            Selesai
          </div>
          <p className="text-3xl font-semibold text-green-700">
            {summary.completed_siswa}
          </p>
        </Card>

        <Card className="border border-gray-200 bg-gray-50/60 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            <TrendingUp size={13} />
            Rata-rata
          </div>
          <p className="text-3xl font-semibold text-gray-700">
            {summary.overall_average}%
          </p>
        </Card>
      </div>

      <Card className="border border-gray-100 p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-center">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama siswa atau kelas"
              className="pl-9 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          >
            <option value="all">Semua Kelas</option>
            {kelasOptions.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={fetchProgress}
            className="border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <Eye size={15} className="mr-1.5" />
            Refresh
          </Button>
        </div>
      </Card>

      <Card className="border border-gray-100 shadow-sm">
        {filteredSiswa.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Users size={20} />
            </div>
            <p className="text-base font-medium text-gray-700">
              Data tidak ditemukan
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Coba ubah kata kunci pencarian atau filter kelas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">
                    Nama Siswa
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">
                    Kelas
                  </th>
                  <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">
                    Sudah Dibuka
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
                {filteredSiswa.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {s.full_name}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {s.kelas || "-"}
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-500">
                      {s.materi_started} dibuka, {s.materi_completed} selesai
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{ width: `${s.average_progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">
                          {s.average_progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => setDetailSiswa(s)}
                      >
                        Detail
                        <ChevronRight size={13} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog
        open={detailSiswa !== null}
        onOpenChange={(open) => !open && setDetailSiswa(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Detail Progress Materi
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
            <div className="mt-2 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {detailSiswa.progress.length === 0 ? (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                  Belum ada aktivitas membaca materi.
                </div>
              ) : (
                detailSiswa.progress.map((item) => (
                  <div
                    key={`${detailSiswa.id}-${item.materi_id}`}
                    className="rounded-xl border border-gray-100 bg-gray-50/70 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.materi_title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Sub-bab: {item.completed_sub_bab}/{item.total_sub_bab}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                        {item.progress_percentage}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${item.progress_percentage}%` }}
                      />
                    </div>

                    <div className="mt-2 text-[11px] text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                      <span>
                        Terakhir baca:{" "}
                        {new Date(item.last_read_at).toLocaleDateString(
                          "id-ID",
                        )}
                      </span>
                      {item.completed_at && (
                        <span className="text-green-600">
                          Selesai:{" "}
                          {new Date(item.completed_at).toLocaleDateString(
                            "id-ID",
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
