"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

interface MateriProgressCard {
  materi_id: string;
  materi_title: string;
  siswa_count: number;
  completed_count: number;
  average_progress: number;
  progress: Array<
    DetailProgress & {
      siswa_id: string;
      full_name: string;
      kelas: string | null;
    }
  >;
}

export default function GuruMateriProgressPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [summary, setSummary] = useState<Summary>({
    total_siswa: 0,
    active_siswa: 0,
    completed_siswa: 0,
    overall_average: 0,
  });
  const [siswaList, setSiswaList] = useState<SiswaProgress[]>([]);
  const [selectedMateri, setSelectedMateri] =
    useState<MateriProgressCard | null>(null);
  const [detailQuery, setDetailQuery] = useState("");
  const [detailRowsPerPage, setDetailRowsPerPage] = useState(10);
  const [detailPage, setDetailPage] = useState(0);
  const detailSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedMateri) return;

    detailSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [selectedMateri]);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async (options?: { showRefreshState?: boolean }) => {
    if (options?.showRefreshState) {
      setIsRefreshing(true);
    }
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
      setIsRefreshing(false);
    }
  };

  const materiCards = useMemo<MateriProgressCard[]>(() => {
    const map = new Map<string, MateriProgressCard>();

    for (const siswa of siswaList) {
      for (const progressItem of siswa.progress) {
        const existing = map.get(progressItem.materi_id);
        const entry = {
          ...progressItem,
          siswa_id: siswa.id,
          full_name: siswa.full_name,
          kelas: siswa.kelas,
        };

        if (!existing) {
          map.set(progressItem.materi_id, {
            materi_id: progressItem.materi_id,
            materi_title: progressItem.materi_title,
            siswa_count: 1,
            completed_count: progressItem.progress_percentage >= 100 ? 1 : 0,
            average_progress: progressItem.progress_percentage,
            progress: [entry],
          });
        } else {
          existing.progress.push(entry);
        }
      }
    }

    return Array.from(map.values())
      .map((materi) => {
        const progress = materi.progress.sort(
          (a, b) =>
            new Date(b.last_read_at).getTime() -
            new Date(a.last_read_at).getTime(),
        );
        const siswa_count = progress.length;
        const completed_count = progress.filter(
          (item) => item.progress_percentage >= 100,
        ).length;
        const average_progress =
          siswa_count > 0
            ? Math.round(
                progress.reduce(
                  (sum, item) => sum + item.progress_percentage,
                  0,
                ) / siswa_count,
              )
            : 0;

        return {
          ...materi,
          progress,
          siswa_count,
          completed_count,
          average_progress,
        };
      })
      .sort((a, b) => a.materi_title.localeCompare(b.materi_title));
  }, [siswaList]);

  const filteredMateri = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return materiCards;
    return materiCards.filter((materi) =>
      materi.materi_title.toLowerCase().includes(term),
    );
  }, [materiCards, query]);

  const totalMateri = materiCards.length;
  const detailRows = useMemo(() => {
    if (!selectedMateri) return [];

    const term = detailQuery.trim().toLowerCase();
    return selectedMateri.progress.filter((item) => {
      return (
        !term ||
        item.full_name.toLowerCase().includes(term) ||
        (item.kelas || "").toLowerCase().includes(term)
      );
    });
  }, [selectedMateri, detailQuery]);

  const detailTotalPages = Math.max(
    1,
    Math.ceil(detailRows.length / detailRowsPerPage),
  );
  const detailPaginatedRows = detailRows.slice(
    detailPage * detailRowsPerPage,
    detailPage * detailRowsPerPage + detailRowsPerPage,
  );
  const detailStartIndex =
    detailRows.length === 0 ? 0 : detailPage * detailRowsPerPage + 1;
  const detailEndIndex = Math.min(
    (detailPage + 1) * detailRowsPerPage,
    detailRows.length,
  );

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
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
          Progress Materi Siswa
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Pilih materi untuk melihat daftar siswa dan progresnya.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-secondary/50 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
            <Users size={13} />
            Total Siswa
          </div>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {summary.total_siswa}
          </p>
        </Card>

        <Card className="border border-blue-100 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-900/20 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-400 dark:text-blue-400">
            <BookOpen size={13} />
            Total Materi
          </div>
          <p className="text-3xl font-semibold text-blue-700 dark:text-blue-300">
            {totalMateri}
          </p>
        </Card>

        <Card className="border border-green-100 dark:border-green-900/40 bg-green-50/70 dark:bg-green-900/20 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-green-400 dark:text-green-400">
            <CheckCircle2 size={13} />
            Selesai
          </div>
          <p className="text-3xl font-semibold text-green-700 dark:text-green-300">
            {summary.completed_siswa}
          </p>
        </Card>
      </div>

      <Card className="border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama materi"
              className="pl-9 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/40"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => fetchProgress({ showRefreshState: true })}
            disabled={isRefreshing}
            className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw
              size={15}
              className={`mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Memuat..." : "Refresh"}
          </Button>
        </div>
      </Card>

      {filteredMateri.length === 0 ? (
        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600">
              <BookOpen size={20} />
            </div>
            <p className="text-base font-medium text-gray-700 dark:text-gray-200">
              Data tidak ditemukan
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Coba ubah kata kunci pencarian materi.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMateri.map((materi) => (
            <Card
              key={materi.materi_id}
              className="overflow-hidden border border-gray-200 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-4 border-b border-green-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-green-700 border border-green-100">
                      <FileText size={12} />
                      Materi
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {materi.materi_title}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-5 py-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-gray-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400">
                      Siswa Aktif
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {materi.siswa_count}
                    </p>
                  </div>
                  <div className="rounded-xl bg-green-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-green-500">
                      Selesai
                    </p>
                    <p className="mt-1 font-semibold text-green-700">
                      {materi.completed_count}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      Rata-rata progress
                    </span>
                    <span className="font-semibold text-gray-900">
                      {materi.average_progress}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${materi.average_progress}%` }}
                    />
                  </div>
                </div>

                <Button
                  className={`w-full gap-2 transition-all duration-200 ${
                    selectedMateri?.materi_id === materi.materi_id
                      ? "bg-green-700 hover:bg-green-800"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                  onClick={() => {
                    setSelectedMateri(
                      selectedMateri?.materi_id === materi.materi_id
                        ? null
                        : materi,
                    );
                    setDetailQuery("");
                    setDetailRowsPerPage(10);
                    setDetailPage(0);
                  }}
                >
                  {selectedMateri?.materi_id === materi.materi_id
                    ? "Tutup Detail"
                    : "Lihat Progres Siswa"}
                  <ArrowRight size={15} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedMateri && (
        <div ref={detailSectionRef} className="space-y-4 scroll-mt-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-card">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Detail Progress Materi
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedMateri.materi_title}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-secondary/30 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
                  Total siswa
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {selectedMateri.siswa_count}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-green-50 dark:bg-green-900/20 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-green-500 dark:text-green-400">
                  Selesai
                </p>
                <p className="mt-1 text-2xl font-semibold text-green-700 dark:text-green-300">
                  {selectedMateri.completed_count}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-blue-50 dark:bg-blue-900/20 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-blue-500 dark:text-blue-400">
                  Rata-rata progress
                </p>
                <p className="mt-1 text-2xl font-semibold text-blue-700 dark:text-blue-300">
                  {selectedMateri.average_progress}%
                </p>
              </div>
            </div>

            <Card className="mt-4 border border-gray-100 dark:border-gray-800 p-3 shadow-sm">
              <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-center">
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  />
                  <Input
                    value={detailQuery}
                    onChange={(e) => {
                      setDetailQuery(e.target.value);
                      setDetailPage(0);
                    }}
                    placeholder="Cari nama siswa atau kelas"
                    className="pl-9 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/40"
                  />
                </div>

                <select
                  value={detailRowsPerPage}
                  onChange={(e) => {
                    setDetailRowsPerPage(Number(e.target.value));
                    setDetailPage(0);
                  }}
                  className="h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-input px-3 text-sm text-gray-900 dark:text-foreground focus:outline-none focus:border-green-500 dark:focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/40"
                >
                  {[5, 10, 20, 50].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>

                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {detailRows.length === 0
                    ? "0-0 of 0"
                    : `${detailStartIndex}-${detailEndIndex} of ${detailRows.length}`}
                </div>
              </div>
            </Card>

            <Card className="border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              {detailRows.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  Belum ada siswa yang membuka materi ini.
                </div>
              ) : (
                <>
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
                            Sudah Dibuka
                          </th>
                          <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Progress
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-card">
                        {detailPaginatedRows.map((item) => (
                          <tr
                            key={`${item.siswa_id}-${item.materi_id}`}
                            className="hover:bg-gray-50/60 dark:hover:bg-secondary/50 transition-colors"
                          >
                            <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                              {item.full_name}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {item.kelas || "-"}
                            </td>
                            <td className="px-4 py-4 text-xs text-gray-500 dark:text-gray-400">
                              {item.completed_sub_bab}/{item.total_sub_bab}{" "}
                              sub-bab
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                  <div
                                    className="h-full rounded-full bg-green-500 dark:bg-green-500"
                                    style={{
                                      width: `${item.progress_percentage}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  {item.progress_percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-gray-200 rounded-b-xl bg-white px-4 py-4 shadow-sm sticky bottom-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                        <span>Rows per page:</span>
                        <span className="font-semibold text-gray-700">
                          {detailRows.length === 0
                            ? "0-0 of 0"
                            : `${detailStartIndex}-${detailEndIndex} of ${detailRows.length}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailPage(0)}
                          disabled={detailPage === 0}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Halaman pertama"
                        >
                          <ChevronsLeft size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDetailPage((p) => Math.max(0, p - 1))
                          }
                          disabled={detailPage === 0}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Sebelumnya"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="min-w-16 px-2 text-sm font-medium text-gray-600">
                          {detailPage + 1} / {detailTotalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDetailPage((p) =>
                              Math.min(detailTotalPages - 1, p + 1),
                            )
                          }
                          disabled={detailPage >= detailTotalPages - 1}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Selanjutnya"
                        >
                          <ChevronRight size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetailPage(detailTotalPages - 1)}
                          disabled={detailPage >= detailTotalPages - 1}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Halaman terakhir"
                        >
                          <ChevronsRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
