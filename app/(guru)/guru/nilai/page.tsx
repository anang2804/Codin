"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart3,
  BookOpen,
  Eye,
  Upload,
  FileDown,
  Users,
  ChevronDown,
  ChevronRight,
  Search,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface AsesmenCard {
  id: string;
  title?: string;
  kelas?: {
    id: string;
    name: string;
  } | null;
  mapel?: {
    id: string;
    name: string;
  } | null;
  participant_count: number;
}

interface PengumpulanTugasItem {
  id: string | null;
  sub_bab_id: string;
  bab_id: string;
  siswa_id: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number;
  mime_type: string | null;
  submitted_at: string | null;
  updated_at: string | null;
  sub_bab_title: string;
  bab_title: string;
  materi_id: string;
  materi_title: string;
  siswa_name: string | null;
  siswa_kelas: string | null;
  nilai_tugas: number | null;
  komentar_guru: string | null;
  has_unread_komentar_siswa: boolean;
}

interface SubmissionComment {
  id: string;
  submission_id: string;
  sender_id: string;
  sender_name: string | null;
  sender_role: string | null;
  message: string;
  created_at: string;
}

export default function GuruNilaiPage() {
  const [asesmen, setAsesmen] = useState<AsesmenCard[]>([]);
  const [loadingAsesmen, setLoadingAsesmen] = useState(true);
  const [pengumpulanTugas, setPengumpulanTugas] = useState<
    PengumpulanTugasItem[]
  >([]);
  const [loadingPengumpulan, setLoadingPengumpulan] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMateri, setSelectedMateri] = useState("all");
  const [selectedKelas, setSelectedKelas] = useState("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedSubBab, setExpandedSubBab] = useState<Set<string>>(new Set());
  const [subBabSearchTerms, setSubBabSearchTerms] = useState<
    Record<string, string>
  >({});
  const [draftPenilaian, setDraftPenilaian] = useState<Record<string, string>>(
    {},
  );
  const [savingPenilaianIds, setSavingPenilaianIds] = useState<Set<string>>(
    new Set(),
  );
  const [activeNilaiId, setActiveNilaiId] = useState<string | null>(null);
  const [activeKomentarId, setActiveKomentarId] = useState<string | null>(null);
  const [komentarList, setKomentarList] = useState<SubmissionComment[]>([]);
  const [komentarDraft, setKomentarDraft] = useState("");
  const [loadingKomentar, setLoadingKomentar] = useState(false);
  const [sendingKomentar, setSendingKomentar] = useState(false);

  const getTimestamp = (value?: string | null) =>
    value ? new Date(value).getTime() : 0;

  useEffect(() => {
    const supabase = createClient();
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
    let isActive = true;

    const initRealtime = async () => {
      await fetchAsesmen();
      await fetchPengumpulanTugas();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isActive || !user) return;

      realtimeChannel = supabase
        .channel(`guru-nilai-live:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "asesmen",
            filter: `created_by=eq.${user.id}`,
          },
          () => {
            void fetchAsesmen();
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "nilai",
          },
          () => {
            void fetchAsesmen();
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "materi_pengumpulan_tugas",
          },
          () => {
            void fetchPengumpulanTugas();
          },
        )
        .subscribe();
    };

    void initRealtime();

    return () => {
      isActive = false;
      if (realtimeChannel) {
        void supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  useEffect(() => {
    setDraftPenilaian((prev) => {
      let hasChanges = false;
      const next = { ...prev };

      pengumpulanTugas.forEach((item) => {
        if (!item.id || next[item.id]) return;

        hasChanges = true;
        next[item.id] =
          typeof item.nilai_tugas === "number" ? String(item.nilai_tugas) : "";
      });

      return hasChanges ? next : prev;
    });
  }, [pengumpulanTugas]);

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
              .select("siswa_id, score, completed_at")
              .eq("asesmen_id", a.id);

            const completedAttempts = (nilaiData || []).filter(
              (item) => item.completed_at !== null && item.score !== null,
            );

            const participantCount = new Set(
              completedAttempts.map((item) => item.siswa_id),
            ).size;

            return {
              ...a,
              kelas: kelasData,
              mapel: mapelData,
              participant_count: participantCount,
            };
          }),
        );
        setAsesmen(asesmenWithDetails);
      } else {
        setAsesmen([]);
      }
    } catch (error) {
      console.error("Error fetching asesmen:", error);
    } finally {
      setLoadingAsesmen(false);
    }
  };

  const fetchPengumpulanTugas = async () => {
    try {
      const response = await fetch("/api/guru/pengumpulan-tugas", {
        cache: "no-store",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Gagal memuat pengumpulan tugas");
      }

      setPengumpulanTugas(json.data || []);
    } catch (error) {
      console.error("Error fetching pengumpulan tugas:", error);
      setPengumpulanTugas([]);
    } finally {
      setLoadingPengumpulan(false);
    }
  };

  const materiOptions = useMemo(
    () =>
      Array.from(
        new Set(pengumpulanTugas.map((item) => item.materi_title)),
      ).sort((a, b) => a.localeCompare(b)),
    [pengumpulanTugas],
  );

  const kelasOptions = useMemo(
    () =>
      Array.from(
        new Set(
          pengumpulanTugas
            .map((item) => item.siswa_kelas)
            .filter((value): value is string => !!value),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [pengumpulanTugas],
  );

  const filteredPengumpulan = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return pengumpulanTugas.filter((item) => {
      const matchesMateri =
        selectedMateri === "all" || item.materi_title === selectedMateri;
      const matchesKelas =
        selectedKelas === "all" || (item.siswa_kelas || "-") === selectedKelas;

      const matchesKeyword =
        keyword.length === 0 ||
        item.materi_title.toLowerCase().includes(keyword) ||
        item.bab_title.toLowerCase().includes(keyword) ||
        item.sub_bab_title.toLowerCase().includes(keyword) ||
        (item.siswa_name || "").toLowerCase().includes(keyword) ||
        (item.file_name || "").toLowerCase().includes(keyword);

      return matchesMateri && matchesKelas && matchesKeyword;
    });
  }, [pengumpulanTugas, searchTerm, selectedMateri, selectedKelas]);

  const groupedPengumpulan = useMemo(() => {
    const groups = new Map<string, PengumpulanTugasItem[]>();

    filteredPengumpulan.forEach((item) => {
      const key = item.materi_id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)?.push(item);
    });

    return Array.from(groups.entries())
      .map(([key, items]) => {
        const sortedItems = [...items].sort(
          (a, b) => getTimestamp(b.submitted_at) - getTimestamp(a.submitted_at),
        );
        const latest = sortedItems[0];

        const babMap = new Map<string, PengumpulanTugasItem[]>();
        sortedItems.forEach((item) => {
          const babKey = item.bab_id;
          if (!babMap.has(babKey)) babMap.set(babKey, []);
          babMap.get(babKey)?.push(item);
        });

        const babs = Array.from(babMap.entries())
          .map(([bab_id, babItems]) => {
            const babSorted = [...babItems].sort(
              (a, b) =>
                getTimestamp(b.submitted_at) - getTimestamp(a.submitted_at),
            );
            const babLatest = babSorted[0];

            const subBabMap = new Map<string, PengumpulanTugasItem[]>();
            babSorted.forEach((item) => {
              const subKey = item.sub_bab_id;
              if (!subBabMap.has(subKey)) subBabMap.set(subKey, []);
              subBabMap.get(subKey)?.push(item);
            });

            const sub_babs = Array.from(subBabMap.entries())
              .map(([sub_bab_id, subItems]) => {
                const subSorted = [...subItems].sort(
                  (a, b) =>
                    getTimestamp(b.submitted_at) - getTimestamp(a.submitted_at),
                );
                const subLatest = subSorted[0];
                const submittedItems = subSorted.filter((item) => !!item.id);

                return {
                  sub_bab_id,
                  sub_bab_title: subLatest.sub_bab_title,
                  total_submit: submittedItems.length,
                  total_siswa: new Set(
                    subSorted.map((i) => i.siswa_id).filter(Boolean),
                  ).size,
                  latest_submitted_at: subLatest.submitted_at,
                  items: subSorted,
                };
              })
              .sort(
                (a, b) =>
                  getTimestamp(b.latest_submitted_at) -
                  getTimestamp(a.latest_submitted_at),
              );

            const submittedInBab = babSorted.filter((item) => !!item.id);

            return {
              bab_id,
              bab_title: babLatest.bab_title,
              total_submit: submittedInBab.length,
              total_siswa: new Set(
                babSorted.map((i) => i.siswa_id).filter(Boolean),
              ).size,
              latest_submitted_at: babLatest.submitted_at,
              sub_babs,
            };
          })
          .sort(
            (a, b) =>
              getTimestamp(b.latest_submitted_at) -
              getTimestamp(a.latest_submitted_at),
          );

        const submittedInMateri = sortedItems.filter((item) => !!item.id);

        return {
          key,
          materi_title: latest.materi_title,
          total_submit: submittedInMateri.length,
          total_siswa: new Set(
            sortedItems.map((i) => i.siswa_id).filter(Boolean),
          ).size,
          total_bab: babs.length,
          total_sub_bab: new Set(sortedItems.map((i) => i.sub_bab_id)).size,
          latest_submitted_at: latest.submitted_at,
          babs,
        };
      })
      .sort(
        (a, b) =>
          getTimestamp(b.latest_submitted_at) -
          getTimestamp(a.latest_submitted_at),
      );
  }, [filteredPengumpulan]);

  const activeNilaiItem = useMemo(() => {
    if (!activeNilaiId) return null;
    return pengumpulanTugas.find((item) => item.id === activeNilaiId) || null;
  }, [pengumpulanTugas, activeNilaiId]);

  const activeKomentarItem = useMemo(() => {
    if (!activeKomentarId) return null;
    return (
      pengumpulanTugas.find((item) => item.id === activeKomentarId) || null
    );
  }, [pengumpulanTugas, activeKomentarId]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSubBab = (key: string) => {
    setExpandedSubBab((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const setSubBabSearchTerm = (key: string, value: string) => {
    setSubBabSearchTerms((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const onChangePenilaianDraft = (submissionId: string, value: string) => {
    setDraftPenilaian((prev) => ({
      ...prev,
      [submissionId]: value,
    }));
  };

  const getDraftNilai = (item: PengumpulanTugasItem) => {
    if (!item.id) {
      return "";
    }

    return (
      draftPenilaian[item.id] ??
      (typeof item.nilai_tugas === "number" ? String(item.nilai_tugas) : "")
    );
  };

  const isNilaiChanged = (item: PengumpulanTugasItem) => {
    if (!item.id) return false;
    const draftNilai = getDraftNilai(item).trim();
    const nilaiNow = draftNilai === "" ? null : Number.parseInt(draftNilai, 10);

    if (draftNilai !== "" && Number.isNaN(nilaiNow)) {
      return true;
    }

    return nilaiNow !== item.nilai_tugas;
  };

  const savePenilaian = async (
    item: PengumpulanTugasItem,
    closeAfterSave = false,
  ) => {
    if (!item.id) return;

    const nilaiRaw = getDraftNilai(item).trim();

    let nilai: number | null = null;
    if (nilaiRaw !== "") {
      nilai = Number.parseInt(nilaiRaw, 10);
      if (!Number.isInteger(nilai) || nilai < 0 || nilai > 100) {
        toast.error("Nilai harus bilangan bulat 0-100");
        return;
      }
    }

    setSavingPenilaianIds((prev) => {
      const next = new Set(prev);
      next.add(item.id!);
      return next;
    });

    try {
      const response = await fetch("/api/guru/pengumpulan-tugas", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: item.id,
          nilai,
          // Keep existing single comment field intact while nilai is updated.
          komentarGuru: item.komentar_guru,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Gagal menyimpan nilai dan komentar");
      }

      setPengumpulanTugas((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                nilai_tugas: json.data?.nilai_tugas ?? null,
                komentar_guru: json.data?.komentar_guru ?? null,
                updated_at: json.data?.updated_at ?? it.updated_at,
              }
            : it,
        ),
      );

      setDraftPenilaian((prev) => ({
        ...prev,
        [item.id!]:
          typeof json.data?.nilai_tugas === "number"
            ? String(json.data.nilai_tugas)
            : "",
      }));

      if (closeAfterSave) {
        setActiveNilaiId(null);
      }

      toast.success("Nilai dan komentar berhasil disimpan");
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan nilai dan komentar");
    } finally {
      setSavingPenilaianIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id!);
        return next;
      });
    }
  };

  const fetchKomentar = async (submissionId: string) => {
    try {
      setLoadingKomentar(true);
      const response = await fetch(
        `/api/submission-comments?submission_id=${submissionId}&mark_as_read=1`,
        { cache: "no-store" },
      );
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Gagal memuat komentar");
      }

      setKomentarList(json.data || []);

      setPengumpulanTugas((prev) =>
        prev.map((item) =>
          item.id === submissionId
            ? { ...item, has_unread_komentar_siswa: false }
            : item,
        ),
      );
    } catch (error: any) {
      toast.error(error?.message || "Gagal memuat komentar");
      setKomentarList([]);
    } finally {
      setLoadingKomentar(false);
    }
  };

  const openKomentarDialog = async (submissionId: string) => {
    setActiveKomentarId(submissionId);
    setKomentarDraft("");
    await fetchKomentar(submissionId);
  };

  const sendKomentar = async (submissionId: string) => {
    const message = komentarDraft.trim();
    if (!message) {
      toast.error("Komentar tidak boleh kosong");
      return;
    }

    try {
      setSendingKomentar(true);

      const response = await fetch("/api/submission-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, message }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Gagal mengirim komentar");
      }

      setKomentarList((prev) => [...prev, json.data]);
      setKomentarDraft("");
    } catch (error: any) {
      toast.error(error?.message || "Gagal mengirim komentar");
    } finally {
      setSendingKomentar(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }
    return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-green-950 dark:text-green-400">
            Kelola Nilai
          </h1>
          <p className="mt-2 text-sm text-green-700/80 dark:text-green-400/60">
            Pantau hasil kuis dan pengumpulan tugas siswa.
          </p>
        </div>
      </div>

      <Tabs defaultValue="nilai-kuis" className="space-y-4">
        <TabsList className="h-11 border border-green-100 dark:border-green-900/50 bg-green-50/70 dark:bg-card">
          <TabsTrigger
            value="nilai-kuis"
            className="px-4 data-[state=active]:bg-green-600 data-[state=active]:text-white dark:data-[state=active]:bg-green-600 dark:data-[state=active]:text-white"
          >
            Nilai Kuis
          </TabsTrigger>
          <TabsTrigger
            value="pengumpulan-tugas"
            className="px-4 data-[state=active]:bg-green-600 data-[state=active]:text-white dark:data-[state=active]:bg-green-600 dark:data-[state=active]:text-white"
          >
            Pengumpulan Tugas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nilai-kuis">
          {loadingAsesmen ? (
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-card p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-200 dark:border-green-900 border-t-green-600"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Memuat asesmen...
              </p>
            </div>
          ) : asesmen.length === 0 ? (
            <Card className="rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center shadow-sm">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                <BarChart3 size={30} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Belum ada nilai yang tersedia.
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
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
                  className="rounded-2xl border border-green-100 dark:border-green-900/30 bg-white dark:bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                          {a.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-green-700/80 dark:text-green-400/70">
                          <span className="inline-flex items-center gap-2 rounded-full border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 px-3 py-1 text-[11px] font-medium text-green-700 dark:text-green-400">
                            <BookOpen size={14} />
                            Soal Pilihan Ganda
                          </span>
                          <span className="font-medium text-green-900 dark:text-green-200">
                            {a.mapel?.name || "-"}
                          </span>
                          <span className="text-green-300 dark:text-green-700">
                            •
                          </span>
                          <span className="font-medium text-green-900 dark:text-green-200">
                            {a.kelas?.name || "-"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start justify-end lg:w-auto">
                        <Link href={`/guru/nilai/${a.id}`}>
                          <Button className="h-10 bg-green-600 px-4 hover:bg-green-700">
                            <Eye size={16} className="mr-2" />
                            Lihat Nilai
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-green-100 dark:border-green-900/30 bg-green-50 dark:bg-green-900/20 px-3 py-2">
                        <BarChart3
                          size={14}
                          className="text-green-500 dark:text-green-400"
                        />
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-green-600/80 dark:text-green-400/70">
                            Partisipasi
                          </p>
                          <p className="text-sm font-semibold text-green-950 dark:text-green-200">
                            {a.participant_count} siswa
                          </p>
                        </div>
                      </div>

                      {a.participant_count === 0 && (
                        <div className="rounded-xl border border-dashed border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700/80 dark:text-green-400/60">
                          Belum ada siswa yang mengerjakan kuis ini.
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pengumpulan-tugas" className="space-y-4">
          {loadingPengumpulan ? (
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-card p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-200 dark:border-green-900 border-t-green-600"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Memuat pengumpulan tugas...
              </p>
            </div>
          ) : pengumpulanTugas.length === 0 ? (
            <Card className="rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center shadow-sm">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                <Upload size={30} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Belum ada tugas pengumpulan.
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Buat sub-bab dengan tipe tugas pada materi untuk mulai memantau
                pengumpulan siswa.
              </p>
            </Card>
          ) : (
            <>
              <Card className="rounded-xl border border-green-100 dark:border-green-900/30 bg-green-50/40 dark:bg-green-900/10 p-4 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-4">
                  <div className="relative lg:col-span-2">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 dark:text-green-400"
                    />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari siswa, materi, sub-bab, atau nama file..."
                      className="pl-9"
                    />
                  </div>
                  <select
                    value={selectedMateri}
                    onChange={(e) => setSelectedMateri(e.target.value)}
                    className="h-10 rounded-md border border-green-200 dark:border-green-900/50 bg-white dark:bg-input px-3 py-2 text-sm text-green-900 dark:text-foreground focus:outline-none focus:border-green-500 dark:focus:border-green-400"
                  >
                    <option value="all">Semua Materi</option>
                    {materiOptions.map((materiName) => (
                      <option key={materiName} value={materiName}>
                        {materiName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedKelas}
                    onChange={(e) => setSelectedKelas(e.target.value)}
                    className="h-10 rounded-md border border-green-200 dark:border-green-900/50 bg-white dark:bg-input px-3 py-2 text-sm text-green-900 dark:text-foreground focus:outline-none focus:border-green-500 dark:focus:border-green-400"
                  >
                    <option value="all">Semua Kelas</option>
                    {kelasOptions.map((kelasName) => (
                      <option key={kelasName} value={kelasName}>
                        {kelasName}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>

              <div className="grid gap-3">
                {groupedPengumpulan.length === 0 ? (
                  <Card className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    Tidak ada data yang sesuai filter.
                  </Card>
                ) : (
                  groupedPengumpulan.map((group) => {
                    const isOpen = expandedGroups.has(group.key);

                    return (
                      <Card
                        key={group.key}
                        className="rounded-xl border border-green-100 dark:border-green-900/30 bg-white dark:bg-card p-4 shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.key)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <h3 className="text-base font-semibold text-green-950 dark:text-green-200 truncate">
                                {group.materi_title}
                              </h3>
                              <p className="text-sm text-green-700/80 dark:text-green-400/60 truncate">
                                {group.total_bab} bab • {group.total_sub_bab}{" "}
                                sub-bab
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-green-700/80 dark:text-green-400/60">
                                <span className="inline-flex items-center gap-1 rounded-full border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 px-2 py-0.5">
                                  <Users size={12} />
                                  {group.total_siswa} siswa
                                </span>
                                <span className="inline-flex items-center rounded-full border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 px-2 py-0.5">
                                  {group.total_submit} pengumpulan
                                </span>
                              </div>
                            </div>

                            <div className="text-green-700 dark:text-green-400 shrink-0 pt-1">
                              {isOpen ? (
                                <ChevronDown size={18} />
                              ) : (
                                <ChevronRight size={18} />
                              )}
                            </div>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="mt-4 space-y-3 border-t border-green-100 dark:border-green-900/30 pt-3">
                            {group.babs.map((bab) => (
                              <div
                                key={bab.bab_id}
                                className="rounded-lg border border-green-100 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10 p-3"
                              >
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-green-100 dark:border-green-900/30 pb-2">
                                  <p className="text-sm font-semibold text-green-900 dark:text-green-200">
                                    {bab.bab_title}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-green-700/80 dark:text-green-400/60">
                                    <span className="inline-flex items-center rounded-full border border-green-200 dark:border-green-900/50 bg-white dark:bg-input/50 px-2 py-0.5">
                                      {bab.total_submit} pengumpulan
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-green-200 dark:border-green-900/50 bg-white dark:bg-input/50 px-2 py-0.5">
                                      {bab.sub_babs.length} sub-bab
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  {bab.sub_babs.map((subBab) => (
                                    <div
                                      key={subBab.sub_bab_id}
                                      className="rounded-lg border border-green-100 dark:border-green-900/30 bg-white dark:bg-card/50 p-3"
                                    >
                                      {(() => {
                                        const subBabKey = `${group.key}::${bab.bab_id}::${subBab.sub_bab_id}`;
                                        const isSubBabOpen =
                                          expandedSubBab.has(subBabKey);

                                        return (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                toggleSubBab(subBabKey)
                                              }
                                              className="mb-2 flex w-full flex-wrap items-center justify-between gap-2 text-left"
                                            >
                                              <p className="text-sm font-semibold text-green-900 dark:text-green-200">
                                                {subBab.sub_bab_title}
                                              </p>
                                              <div className="flex items-center gap-2 text-xs text-green-700/80 dark:text-green-400/60">
                                                <span className="inline-flex items-center rounded-full border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 px-2 py-0.5">
                                                  {subBab.total_submit}{" "}
                                                  pengumpulan
                                                </span>
                                                <span className="inline-flex items-center rounded-full border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 px-2 py-0.5">
                                                  {subBab.total_siswa} siswa
                                                </span>
                                                {isSubBabOpen ? (
                                                  <ChevronDown
                                                    size={16}
                                                    className="text-green-700 dark:text-green-400"
                                                  />
                                                ) : (
                                                  <ChevronRight
                                                    size={16}
                                                    className="text-green-700 dark:text-green-400"
                                                  />
                                                )}
                                              </div>
                                            </button>

                                            {isSubBabOpen && (
                                              <div className="space-y-2">
                                                <div className="relative">
                                                  <Search
                                                    size={14}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 dark:text-green-400"
                                                  />
                                                  <Input
                                                    value={
                                                      subBabSearchTerms[
                                                        subBabKey
                                                      ] || ""
                                                    }
                                                    onChange={(e) =>
                                                      setSubBabSearchTerm(
                                                        subBabKey,
                                                        e.target.value,
                                                      )
                                                    }
                                                    placeholder="Cari nama siswa di sub-bab ini..."
                                                    className="h-9 pl-8"
                                                  />
                                                </div>

                                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                                  {subBab.items
                                                    .filter((item) => {
                                                      const keyword = (
                                                        subBabSearchTerms[
                                                          subBabKey
                                                        ] || ""
                                                      )
                                                        .trim()
                                                        .toLowerCase();

                                                      if (!keyword) {
                                                        return true;
                                                      }

                                                      return (
                                                        item.siswa_name || ""
                                                      )
                                                        .toLowerCase()
                                                        .includes(keyword);
                                                    })
                                                    .map((item, idx) => {
                                                      const hasSubmission =
                                                        !!item.id;

                                                      return (
                                                        <div
                                                          key={
                                                            item.id ||
                                                            `${subBab.sub_bab_id}-pending-${idx}`
                                                          }
                                                          className="flex flex-col gap-3 rounded-lg border border-green-100 dark:border-green-900/30 bg-green-50/70 dark:bg-green-900/10 px-3 py-3"
                                                        >
                                                          <div className="min-w-0">
                                                            {hasSubmission ? (
                                                              <>
                                                                <p className="text-sm font-medium text-green-900 dark:text-green-200 truncate">
                                                                  {item.siswa_name ||
                                                                    "Tanpa Nama"}{" "}
                                                                  •{" "}
                                                                  {item.siswa_kelas ||
                                                                    "-"}
                                                                </p>
                                                                <p className="text-xs text-green-700/80 dark:text-green-400/60 truncate">
                                                                  {
                                                                    item.file_name
                                                                  }{" "}
                                                                  (
                                                                  {formatFileSize(
                                                                    item.file_size,
                                                                  )}
                                                                  )
                                                                </p>
                                                              </>
                                                            ) : (
                                                              <>
                                                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 truncate">
                                                                  {item.siswa_name ||
                                                                    "Tanpa Nama"}{" "}
                                                                  •{" "}
                                                                  {item.siswa_kelas ||
                                                                    "-"}
                                                                </p>
                                                                <p className="text-xs text-amber-700/80 dark:text-amber-400/70 truncate">
                                                                  Belum
                                                                  mengumpulkan
                                                                  tugas
                                                                </p>
                                                              </>
                                                            )}
                                                          </div>

                                                          {hasSubmission ? (
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                              <div className="flex flex-wrap items-center gap-2 text-xs text-green-800 dark:text-green-300">
                                                                {typeof item.nilai_tugas ===
                                                                "number" ? (
                                                                  <span className="inline-flex items-center rounded-full border border-green-200 dark:border-green-900/50 bg-white dark:bg-input/50 px-2 py-0.5 font-medium">
                                                                    Nilai:{" "}
                                                                    {
                                                                      item.nilai_tugas
                                                                    }
                                                                  </span>
                                                                ) : (
                                                                  <span className="inline-flex items-center rounded-full border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-amber-700 dark:text-amber-300">
                                                                    Belum
                                                                    dinilai
                                                                  </span>
                                                                )}
                                                              </div>

                                                              <div className="flex flex-wrap items-center gap-2">
                                                                {item.file_url ? (
                                                                  <a
                                                                    href={
                                                                      item.file_url
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                  >
                                                                    <Button
                                                                      size="sm"
                                                                      className="bg-green-600 hover:bg-green-700"
                                                                    >
                                                                      <FileDown
                                                                        size={
                                                                          14
                                                                        }
                                                                        className="mr-1.5"
                                                                      />
                                                                      Lihat File
                                                                    </Button>
                                                                  </a>
                                                                ) : null}

                                                                <Button
                                                                  size="sm"
                                                                  variant="outline"
                                                                  onClick={() =>
                                                                    setActiveNilaiId(
                                                                      item.id,
                                                                    )
                                                                  }
                                                                >
                                                                  <BookOpen
                                                                    size={14}
                                                                    className="mr-1.5"
                                                                  />
                                                                  Nilai
                                                                </Button>

                                                                <Button
                                                                  size="sm"
                                                                  variant="outline"
                                                                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                                                  onClick={() =>
                                                                    openKomentarDialog(
                                                                      item.id!,
                                                                    )
                                                                  }
                                                                >
                                                                  {item.has_unread_komentar_siswa ? (
                                                                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                                                                  ) : null}
                                                                  <MessageSquare
                                                                    size={14}
                                                                    className="mr-1.5"
                                                                  />
                                                                  Komentar
                                                                </Button>
                                                              </div>
                                                            </div>
                                                          ) : (
                                                            <div className="flex justify-end">
                                                              <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled
                                                              >
                                                                Menunggu
                                                                Pengumpulan
                                                              </Button>
                                                            </div>
                                                          )}
                                                        </div>
                                                      );
                                                    })}

                                                  {subBab.items.filter(
                                                    (item) => {
                                                      const keyword = (
                                                        subBabSearchTerms[
                                                          subBabKey
                                                        ] || ""
                                                      )
                                                        .trim()
                                                        .toLowerCase();

                                                      if (!keyword) {
                                                        return true;
                                                      }

                                                      return (
                                                        item.siswa_name || ""
                                                      )
                                                        .toLowerCase()
                                                        .includes(keyword);
                                                    },
                                                  ).length === 0 ? (
                                                    <div className="rounded-lg border border-dashed border-green-200 dark:border-green-900/50 bg-white/80 dark:bg-card/40 px-3 py-4 text-center text-xs text-green-700/70 dark:text-green-400/60">
                                                      Tidak ada nama siswa yang
                                                      cocok.
                                                    </div>
                                                  ) : null}
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!activeNilaiItem}
        onOpenChange={(open) => {
          if (!open) setActiveNilaiId(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Input Nilai Siswa</DialogTitle>
          </DialogHeader>

          {activeNilaiItem ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-100 dark:border-green-900/30 bg-green-50/60 dark:bg-green-900/10 p-3">
                <p className="text-sm font-semibold text-green-900 dark:text-green-200">
                  {activeNilaiItem.siswa_name || "Tanpa Nama"} •{" "}
                  {activeNilaiItem.siswa_kelas || "-"}
                </p>
                <p className="mt-1 text-xs text-green-700/80 dark:text-green-400/60 truncate">
                  {activeNilaiItem.file_name || "Tanpa File"}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nilai (0-100)
                </p>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={getDraftNilai(activeNilaiItem)}
                  onChange={(e) =>
                    onChangePenilaianDraft(activeNilaiItem.id!, e.target.value)
                  }
                  placeholder="Masukkan nilai"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveNilaiId(null)}
                >
                  Tutup
                </Button>
                <Button
                  type="button"
                  onClick={() => savePenilaian(activeNilaiItem, true)}
                  disabled={
                    savingPenilaianIds.has(activeNilaiItem.id!) ||
                    !isNilaiChanged(activeNilaiItem)
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  {savingPenilaianIds.has(activeNilaiItem.id!)
                    ? "Menyimpan..."
                    : "Simpan Nilai"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!activeKomentarItem}
        onOpenChange={(open) => {
          if (!open) {
            setActiveKomentarId(null);
            setKomentarDraft("");
            setKomentarList([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Komentar Tugas (Chat)</DialogTitle>
          </DialogHeader>

          {activeKomentarItem ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900">
                {activeKomentarItem.siswa_name || "Tanpa Nama"} •{" "}
                {activeKomentarItem.siswa_kelas || "-"}
              </div>

              <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                {loadingKomentar ? (
                  <p className="text-sm text-gray-500">Memuat komentar...</p>
                ) : komentarList.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Belum ada komentar. Mulai percakapan dari sini.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {komentarList.map((comment) => {
                      const isGuru = comment.sender_role === "guru";
                      return (
                        <div
                          key={comment.id}
                          className={`flex ${isGuru ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                              isGuru
                                ? "bg-green-600 text-white"
                                : "bg-white border border-gray-200 text-gray-800"
                            }`}
                          >
                            <p className="text-[11px] opacity-80 mb-0.5">
                              {comment.sender_name ||
                                (isGuru ? "Guru" : "Siswa")}
                            </p>
                            <p className="whitespace-pre-wrap">
                              {comment.message}
                            </p>
                            <p className="mt-1 text-[10px] opacity-70">
                              {new Date(comment.created_at).toLocaleString(
                                "id-ID",
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Textarea
                  value={komentarDraft}
                  onChange={(e) => setKomentarDraft(e.target.value)}
                  placeholder="Tulis balasan komentar..."
                  maxLength={2000}
                  className="min-h-24"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setActiveKomentarId(null);
                      setKomentarDraft("");
                      setKomentarList([]);
                    }}
                  >
                    Tutup
                  </Button>
                  <Button
                    type="button"
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => sendKomentar(activeKomentarItem.id!)}
                    disabled={
                      sendingKomentar || komentarDraft.trim().length === 0
                    }
                  >
                    {sendingKomentar ? "Mengirim..." : "Kirim Komentar"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
