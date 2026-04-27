"use client";

import { useEffect, useRef, useState } from "react";
import { useSimulasiAttemptRecorder } from "@/lib/hooks/useSimulasiAttemptRecorder";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Leaf,
  Lightbulb,
  Play,
  Recycle,
  RotateCcw,
  Terminal,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIMULASI_SLUG = "struktur-kontrol-pemilah-sampah-menengah";

type LoopChoice = "for" | "while" | "do-while";
type IfChoice = "if" | "switch" | "while";
type ElseChoice = "else" | "default" | "if";
type CommandChoice =
  | LoopChoice
  | Exclude<IfChoice, "while">
  | Exclude<ElseChoice, "if">;
type SelectorTarget = "for" | "if" | "else" | null;
type BinType = "ORGANIK" | "NON-ORGANIK";

type TrashItem = {
  name: string;
  kind: BinType;
  emoji: string;
  tint: string;
};

const ITEMS: TrashItem[] = [
  {
    name: "Daun",
    kind: "ORGANIK",
    emoji: "🍃",
    tint: "from-lime-300 to-emerald-400",
  },
  {
    name: "botol",
    kind: "NON-ORGANIK",
    emoji: "🧴",
    tint: "from-sky-300 to-cyan-400",
  },
  {
    name: "kaleng",
    kind: "NON-ORGANIK",
    emoji: "🥫",
    tint: "from-slate-300 to-slate-500",
  },
];

const LOOP_CHOICES: LoopChoice[] = ["for", "while", "do-while"];
const BRANCH_CHOICES: CommandChoice[] = ["if", "switch", "else", "default"];

const OPTION_BUTTON_THEMES = [
  "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100",
  "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100",
  "border-lime-300 bg-lime-50 text-lime-700 hover:bg-lime-100",
  "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100",
  "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
] as const;

const DESCRIPTION_BY_CHOICE: Record<
  LoopChoice | IfChoice | ElseChoice,
  string
> = {
  for: "untuk perulangan dengan jumlah iterasi yang sudah jelas, seperti memproses array indeks 0 sampai 2.",
  while:
    "untuk perulangan selama kondisi bernilai true, biasanya saat jumlah iterasi belum pasti.",
  "do-while":
    "untuk perulangan yang menjalankan blok minimal satu kali sebelum cek kondisi.",
  if: "untuk percabangan saat kondisi bernilai benar, misalnya saat jenis benda adalah Daun.",
  switch:
    "untuk percabangan banyak kasus berdasarkan nilai tertentu, bukan untuk kondisi tunggal sederhana.",
  else: "untuk cabang alternatif saat kondisi if tidak terpenuhi.",
  default:
    "untuk penanganan default pada switch, bukan pasangan langsung untuk if.",
};

export default function StrukturKontrolPemilahSampahMenengahPage() {
  const [selectedFor, setSelectedFor] = useState<CommandChoice | null>(null);
  const [selectedIf, setSelectedIf] = useState<CommandChoice | null>(null);
  const [selectedElse, setSelectedElse] = useState<CommandChoice | null>(null);
  const [selectorTarget, setSelectorTarget] = useState<SelectorTarget>(null);
  const [selectorOptions, setSelectorOptions] = useState<CommandChoice[]>([]);

  const [activeLine, setActiveLine] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [errorLine, setErrorLine] = useState(-1);
  const [showSuccessCard, setShowSuccessCard] = useState(false);

  useSimulasiAttemptRecorder({
    simulasiSlug: SIMULASI_SLUG,
    isRunning,
    isSuccess: showSuccessCard,
  });
  const [feedback, setFeedback] = useState("Sistem siap menjalankan simulasi.");
  const [hasTried, setHasTried] = useState(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);

  const [currentItem, setCurrentItem] = useState<TrashItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [itemX, setItemX] = useState(0);
  const [itemY, setItemY] = useState(0);
  const [organikCount, setOrganikCount] = useState(0);
  const [nonOrganikCount, setNonOrganikCount] = useState(0);
  const [sortError, setSortError] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const codeLines = [
    null,
    null,
    '        printf("Benda %d: Masuk ORGANIK 🍃\\n", b);',
    null,
    '        printf("Benda %d: Masuk NON-ORGANIK 🗑️\\n", b);',
    "    }",
    "}",
  ] as const;

  useEffect(() => {
    let isActive = true;

    const fetchCompletionStatus = async () => {
      try {
        const response = await fetch(
          `/api/siswa/simulasi/check-completed?simulasi_slug=${SIMULASI_SLUG}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const data = (await response.json()) as { completed?: boolean };
        if (isActive && data.completed) setHasTried(true);
      } catch (error) {
        console.error("Error checking simulation completion:", error);
      }
    };

    fetchCompletionStatus();

    return () => {
      isActive = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const pickRandom = <T,>(arr: T[]): T =>
    arr[Math.floor(Math.random() * arr.length)];

  const shuffle = <T,>(arr: T[]): T[] => {
    const next = [...arr];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  };

  const buildMixedOptions = (
    target: Exclude<SelectorTarget, null>,
  ): CommandChoice[] => {
    if (target === "for") {
      const correct: CommandChoice = "for";
      const wrongLoop = pickRandom(
        LOOP_CHOICES.filter((choice) => choice !== "for"),
      );
      const wrongBranch = pickRandom(BRANCH_CHOICES);
      return shuffle([correct, wrongLoop, wrongBranch]);
    }

    if (target === "if") {
      const correct: CommandChoice = "if";
      const wrongBranch = pickRandom(
        BRANCH_CHOICES.filter((choice) => choice !== "if"),
      );
      const wrongLoop = pickRandom(LOOP_CHOICES);
      return shuffle([correct, wrongBranch, wrongLoop]);
    }

    const correct: CommandChoice = "else";
    const wrongBranch = pickRandom(
      BRANCH_CHOICES.filter((choice) => choice !== "else"),
    );
    const wrongLoop = pickRandom(LOOP_CHOICES);
    return shuffle([correct, wrongBranch, wrongLoop]);
  };

  const openSelector = (
    target: Exclude<SelectorTarget, null>,
    line: number,
  ) => {
    setSelectorTarget(target);
    setActiveLine(line);
    setSelectorOptions(buildMixedOptions(target));
  };

  const markAsTried = async () => {
    if (hasTried || isSavingCompletion) return;
    try {
      setIsSavingCompletion(true);
      const response = await fetch("/api/siswa/simulasi/mark-completed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulasi_slug: SIMULASI_SLUG }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan progress simulasi");
      }
      setHasTried(true);
      toast.success("Simulasi ditandai selesai");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan progress simulasi",
      );
    } finally {
      setIsSavingCompletion(false);
    }
  };

  const resetVisualState = () => {
    setCurrentItem(null);
    setCurrentIndex(-1);
    setItemX(0);
    setItemY(0);
    setOrganikCount(0);
    setNonOrganikCount(0);
    setSortError(false);
  };

  const resetSim = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setSelectorTarget(null);
    setSelectedFor(null);
    setSelectedIf(null);
    setSelectedElse(null);
    resetVisualState();
    setFeedback("Sistem siap menjalankan simulasi.");
  };

  const processItem = (index: number) => {
    if (index >= ITEMS.length) {
      setCurrentItem(null);
      setCurrentIndex(-1);
      setActiveLine(6);
      setIsRunning(false);
      setShowSuccessCard(true);
      setFeedback(
        "Berhasil! Semua benda berhasil dipilah sesuai jenisnya.\n\nDaun masuk tong organik, sedangkan botol dan kaleng masuk tong non-organik.",
      );
      return;
    }

    const item = ITEMS[index];
    const isOrganik = item.kind === "ORGANIK";

    setCurrentItem(item);
    setCurrentIndex(index);
    setItemX(0);
    setItemY(-58);
    setActiveLine(0);
    setFeedback(
      `Iterasi b=${index} dimulai. Sistem mengambil benda: ${item.name}.`,
    );

    timerRef.current = setTimeout(() => {
      setActiveLine(1);
      setFeedback(
        `Mengecek kondisi if: apakah ${item.name} termasuk Daun? ${isOrganik ? "Ya" : "Tidak"}.`,
      );

      timerRef.current = setTimeout(() => {
        if (isOrganik) {
          setActiveLine(2);
          setItemX(-74);
          setItemY(34);
          setFeedback(`Benda ${index}: ${item.name} masuk ke tong ORGANIK.`);

          timerRef.current = setTimeout(() => {
            setItemY(56);
            setOrganikCount((prev) => prev + 1);

            timerRef.current = setTimeout(() => processItem(index + 1), 420);
          }, 460);
          return;
        }

        setActiveLine(3);
        setFeedback(
          `Kondisi if tidak terpenuhi, berpindah ke cabang else untuk ${item.name}.`,
        );

        timerRef.current = setTimeout(() => {
          setActiveLine(4);
          setItemX(74);
          setItemY(34);
          setFeedback(
            `Benda ${index}: ${item.name} masuk ke tong NON-ORGANIK.`,
          );

          timerRef.current = setTimeout(() => {
            setItemY(56);
            setNonOrganikCount((prev) => prev + 1);

            timerRef.current = setTimeout(() => processItem(index + 1), 420);
          }, 460);
        }, 450);
      }, 520);
    }, 420);
  };

  const executeStep = () => {
    // Cek Baris 3 (for)
    setActiveLine(0);
    timerRef.current = setTimeout(() => {
      if (!selectedFor) {
        setIsRunning(false);
        setErrorLine(0);
        setSortError(true);
        setFeedback(
          "Baris 3 belum lengkap.\n\nToken pada baris ini masih kosong.\n\nPetunjuk: baca ulang tujuan barisnya, lalu pilih token yang perannya paling tepat.",
        );
        return;
      }

      if (selectedFor !== "for") {
        setIsRunning(false);
        setErrorLine(0);
        setSortError(true);
        setFeedback(
          "Baris 3 belum tepat.\n\nToken pada baris ini belum sesuai konteks proses.\n\nPetunjuk: baca ulang tujuan barisnya, lalu pilih token yang perannya paling tepat.",
        );
        return;
      }

      // Cek Baris 4 (if)
      setActiveLine(1);
      timerRef.current = setTimeout(() => {
        if (!selectedIf) {
          setIsRunning(false);
          setErrorLine(1);
          setSortError(true);
          setFeedback(
            "Baris 4 belum lengkap.\n\nToken pada baris ini masih kosong.\n\nPetunjuk: baca ulang tujuan barisnya, lalu pilih token yang perannya paling tepat.",
          );
          return;
        }

        if (selectedIf !== "if") {
          setIsRunning(false);
          setErrorLine(1);
          setSortError(true);
          setFeedback(
            "Baris 4 belum tepat.\n\nToken pada baris ini belum sesuai konteks proses.\n\nPetunjuk: baca ulang tujuan barisnya, lalu pilih token yang perannya paling tepat.",
          );
          return;
        }

        // Cek Baris 6 (else)
        setActiveLine(3);
        timerRef.current = setTimeout(() => {
          if (!selectedElse) {
            setIsRunning(false);
            setErrorLine(3);
            setSortError(true);
            setFeedback(
              "Baris 6 belum lengkap.\n\nToken pada baris ini masih kosong.\n\nPetunjuk: baca ulang tujuan barisnya, lalu pilih token yang perannya paling tepat.",
            );
            return;
          }

          if (selectedElse !== "else") {
            setIsRunning(false);
            setErrorLine(3);
            setSortError(true);
            setFeedback(
              "Baris 6 belum tepat.\n\nToken pada baris ini belum sesuai konteks proses.\n\nPetunjuk: baca ulang tujuan barisnya, lalu pilih token yang perannya paling tepat.",
            );
            return;
          }

          // Semua benar
          setErrorLine(-1);
          setSortError(false);
          setFeedback(
            "Semua token benar. Sistem mulai memilah benda satu per satu ke tong yang sesuai.",
          );

          timerRef.current = setTimeout(() => processItem(0), 380);
        }, 320);
      }, 320);
    }, 320);
  };

  const startRunning = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(true);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    resetVisualState();
    setCurrentItem(ITEMS[0]);
    setItemX(0);
    setItemY(-58);
    setFeedback(
      "Memulai simulasi pemilah sampah...\n\nSistem membaca baris kode dari atas lalu mengeksekusi perulangan.",
    );
    timerRef.current = setTimeout(executeStep, 250);
  };

  const selectedDescription =
    selectorTarget === "for"
      ? selectedFor
        ? DESCRIPTION_BY_CHOICE[selectedFor]
        : "Pilih token yang tepat untuk perulangan indeks array jenisBenda."
      : selectorTarget === "if"
        ? selectedIf
          ? DESCRIPTION_BY_CHOICE[selectedIf]
          : "Pilih token yang tepat untuk pengecekan kondisi jenis benda."
        : selectorTarget === "else"
          ? selectedElse
            ? DESCRIPTION_BY_CHOICE[selectedElse]
            : "Pilih token pasangan cabang alternatif dari if."
          : selectedFor
            ? DESCRIPTION_BY_CHOICE[selectedFor]
            : "Pilih token yang tepat untuk melengkapi struktur kontrol pemilah sampah.";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-lime-50 via-emerald-50 to-cyan-50 text-foreground">
      <header className="z-40 flex shrink-0 items-center justify-between border-b border-emerald-100/80 bg-white/90 px-6 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              window.location.href = "/siswa/simulasi";
            }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
          >
            <ArrowLeft size={14} /> Kembali
          </button>
          <div className="h-6 w-px bg-border" />
          <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-2 text-white shadow-lg shadow-emerald-200/60">
            <Terminal size={20} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black uppercase italic leading-none tracking-tighter">
              Pemilah Sampah
            </h1>
            <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
              Level Menengah
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetSim}
            className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-5 py-2.5 text-xs font-bold transition-all duration-200 hover:bg-emerald-50"
          >
            <RotateCcw size={14} /> Reset
          </button>

          <button
            onClick={markAsTried}
            disabled={hasTried || isSavingCompletion || !showSuccessCard}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 disabled:opacity-50 ${
              hasTried
                ? "border-2 border-emerald-300 bg-emerald-100 text-emerald-800"
                : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 size={14} /> {hasTried ? "Selesai" : "Tandai Selesai"}
          </button>

          <button
            onClick={startRunning}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-all duration-200 hover:from-green-600 hover:to-emerald-600"
          >
            <Play size={14} fill="white" /> Jalankan
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <aside className="z-20 flex w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r border-emerald-100 bg-white/85 p-5 backdrop-blur">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-600/70" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Deskripsi Perintah
            </h2>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedFor ?? "none"}-${selectedIf ?? "none"}-${selectedElse ?? "none"}-${selectorTarget ?? "idle"}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"
            >
              <h3 className="mb-2 text-xs font-black uppercase tracking-tight text-foreground">
                {selectorTarget === "for"
                  ? "FOR"
                  : selectorTarget === "if"
                    ? "IF"
                    : selectorTarget === "else"
                      ? "ELSE"
                      : selectedFor
                        ? selectedFor.toUpperCase()
                        : "SIAP MENULIS"}
              </h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {selectedDescription}
              </p>
            </motion.div>
          </AnimatePresence>

          <div
            className={`rounded-2xl border p-3 transition-all ${
              errorLine !== -1
                ? "border-rose-200 bg-rose-50"
                : "border-border bg-card"
            }`}
          >
            <p
              className={`text-[10px] font-black uppercase tracking-widest ${
                errorLine !== -1 ? "text-rose-600" : "text-muted-foreground"
              }`}
            >
              CATATAN PROSES
            </p>
            <p
              className={`mt-2 rounded-lg px-3 py-2 text-[11px] leading-snug whitespace-pre-line ${
                errorLine !== -1
                  ? "bg-rose-100/70 text-rose-700"
                  : "bg-muted text-foreground"
              }`}
            >
              {feedback}
            </p>
          </div>

          <div className="mt-auto rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4">
            <div className="mb-2 flex items-center justify-between text-[9px] font-black uppercase text-emerald-700">
              <span>Status Fokus</span>
              <Activity size={10} />
            </div>
            <p className="text-[10px] font-bold italic leading-tight text-muted-foreground">
              {activeLine !== -1
                ? `Menganalisis baris ke-${activeLine + 3}`
                : "Editor siap digunakan"}
            </p>
          </div>
        </aside>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-transparent">
          <section className="px-6 pb-2 pt-4">
            <div className="flex items-start gap-4 rounded-2xl border border-primary/20 bg-primary/10 p-4 shadow-sm">
              <div className="rounded-xl bg-background p-2 text-primary shadow-sm">
                <Lightbulb size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                    Misi
                  </span>
                  <h2 className="text-[15px] font-black uppercase tracking-tight text-foreground">
                    Pemilah Sampah
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  Lengkapi token struktur kontrol agar sistem bisa memilah benda
                  ke tong organik dan non-organik sesuai jenisnya.
                </p>
              </div>
            </div>
          </section>

          <AnimatePresence>
            {showSuccessCard && (
              <motion.section
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="absolute left-6 right-6 top-[96px] z-20 px-0 pb-0"
              >
                <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
                  <h3 className="text-sm font-black tracking-tight text-emerald-700">
                    Berhasil! Pemilahan sampah selesai
                  </h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                    Semua benda sudah masuk tong yang benar berdasarkan
                    jenisnya.
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="flex flex-1 gap-5 overflow-x-hidden overflow-y-auto px-6 pb-6">
            <section className="relative flex min-w-[500px] flex-1 flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/60 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isRunning
                        ? "animate-pulse bg-emerald-500"
                        : errorLine !== -1
                          ? "bg-red-500"
                          : "bg-emerald-500"
                    }`}
                  />
                  <span className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">
                    Algortima dan Pemrograman
                  </span>
                </div>
              </div>

              <div className="relative flex flex-1 overflow-hidden font-mono text-[11px] leading-[24px]">
                <div className="w-12 shrink-0 select-none overflow-hidden border-r border-border bg-muted/30 pt-5 pr-4 text-right text-muted-foreground">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-[26px] transition-all ${
                        activeLine !== -1 && i === activeLine + 2
                          ? "scale-110 pr-1 font-black text-emerald-700"
                          : errorLine !== -1 && i === errorLine + 2
                            ? "pr-1 font-black text-rose-600"
                            : ""
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                <div className="relative flex-1 overflow-hidden bg-card">
                  <div className="absolute inset-0 z-10 overflow-hidden whitespace-pre p-5 pt-5">
                    <div className="relative flex h-[26px] items-center">
                      <span className="relative z-10 whitespace-pre font-bold text-slate-900">
                        String[] jenisBenda = {"{"}"Daun", "botol", "kaleng"
                        {"}"};
                      </span>
                    </div>

                    <div className="relative flex h-[26px] items-center" />

                    {codeLines.map((line, i) => (
                      <div
                        key={i}
                        className="relative flex h-[26px] items-center"
                      >
                        {activeLine === i && (
                          <motion.div
                            layoutId="lineHighlightPemilahSampah"
                            className={`absolute inset-0 -mx-5 -my-1 z-0 border-l-4 ${
                              isRunning
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-emerald-200 bg-emerald-50/30"
                            }`}
                          />
                        )}

                        {errorLine === i && (
                          <motion.div
                            layoutId="lineErrorHighlightPemilahSampah"
                            className="absolute inset-0 -mx-5 -my-1 z-0 border-l-4 border-rose-500 bg-rose-50/50"
                            animate={{ opacity: [0.4, 0.8, 0.4] }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                          />
                        )}

                        {i === 0 ? (
                          <div className="relative z-10 whitespace-pre font-bold text-slate-900">
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => {
                                openSelector("for", 0);
                              }}
                              className={`rounded px-1.5 py-0.5 transition-all ${
                                selectedFor
                                  ? "text-slate-900 hover:bg-emerald-50"
                                  : "italic text-slate-300 hover:bg-slate-100"
                              } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selectedFor ?? "_____"}
                            </button>
                            <span>{" (int b = 0; b < 3; b++) {"}</span>
                          </div>
                        ) : i === 1 ? (
                          <div className="relative z-10 whitespace-pre font-bold text-slate-900">
                            <span>{"    "}</span>
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => {
                                openSelector("if", 1);
                              }}
                              className={`rounded px-1.5 py-0.5 transition-all ${
                                selectedIf
                                  ? "text-slate-900 hover:bg-emerald-50"
                                  : "italic text-slate-300 hover:bg-slate-100"
                              } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selectedIf ?? "_____"}
                            </button>
                            <span>{' (jenisBenda[b] == "Daun") {'}</span>
                          </div>
                        ) : i === 3 ? (
                          <div className="relative z-10 whitespace-pre font-bold text-slate-900">
                            <span>{"    } "}</span>
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => {
                                openSelector("else", 3);
                              }}
                              className={`rounded px-1.5 py-0.5 transition-all ${
                                selectedElse
                                  ? "text-slate-900 hover:bg-emerald-50"
                                  : "italic text-slate-300 hover:bg-slate-100"
                              } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selectedElse ?? "_____"}
                            </button>
                            <span>{" {"}</span>
                          </div>
                        ) : (
                          <div className="relative z-10 whitespace-pre font-bold text-slate-900">
                            {line}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectorTarget && !isRunning && (
                    <div className="absolute bottom-4 left-5 right-5 z-30 rounded-xl border border-emerald-200 bg-card px-3 py-2 shadow-lg">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        {selectorTarget === "for"
                          ? "PILIH TOKEN BARIS 3"
                          : selectorTarget === "if"
                            ? "PILIH TOKEN BARIS 4"
                            : "PILIH TOKEN BARIS 6"}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {selectorOptions.map((choice, idx) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => {
                              if (selectorTarget === "for") {
                                setSelectedFor(choice);
                              } else if (selectorTarget === "if") {
                                setSelectedIf(choice);
                              } else {
                                setSelectedElse(choice);
                              }
                              setSelectorTarget(null);
                              setErrorLine(-1);
                              setShowSuccessCard(false);
                              setSortError(false);
                            }}
                            className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${
                              OPTION_BUTTON_THEMES[
                                idx % OPTION_BUTTON_THEMES.length
                              ]
                            }`}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="relative flex w-[380px] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-[#020617] shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-1.5 text-emerald-400">
                    <Recycle size={14} />
                  </div>
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    VISUAL PEMILAH SAMPAH
                  </h2>
                </div>
                <span
                  className={`rounded-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    isRunning
                      ? "bg-emerald-500 text-white"
                      : sortError
                        ? "bg-rose-500 text-white"
                        : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {isRunning ? "RUNNING" : sortError ? "FAILED" : "IDLE"}
                </span>
              </div>

              <div className="relative flex flex-1 flex-col overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,.22),#020617_58%)]" />
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(148,163,184,.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.16)_1px,transparent_1px)] [background-size:26px_26px]" />

                <div className="relative z-10 flex flex-1 flex-col gap-4 p-5 text-slate-100">
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/90 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
                        Stasiun Pemilah
                      </p>
                      <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-200">
                        {currentIndex === -1 ? "Siap" : `Benda ${currentIndex}`}
                      </span>
                    </div>

                    <div className="relative mt-3 flex h-64 items-end justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                      <div className="absolute top-4 flex items-center gap-2 text-[10px] font-bold text-cyan-200">
                        <Recycle size={12} />
                        <span>
                          {isRunning
                            ? "Menyortir benda..."
                            : "Menunggu perintah sortir"}
                        </span>
                      </div>

                      {sortError && (
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_50%_30%,rgba(248,113,113,.2),rgba(248,113,113,0)_58%)]"
                          animate={{ opacity: [0.16, 0.38, 0.2, 0.42, 0.14] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        />
                      )}

                      <div className="relative h-[250px] w-[250px]">
                        <div className="absolute left-1/2 top-[18px] h-14 w-1 -translate-x-1/2 rounded-full bg-emerald-200/60" />
                        <div className="absolute left-1/2 top-[66px] h-2 w-16 -translate-x-1/2 rounded-full bg-emerald-200/40" />

                        <div className="absolute bottom-6 left-0 h-28 w-[106px] rounded-t-2xl rounded-b-lg border border-lime-300/60 bg-gradient-to-b from-lime-400/35 to-emerald-600/45">
                          <div className="mx-auto mt-3 flex w-fit items-center gap-1 rounded-full border border-lime-200/50 bg-lime-500/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-lime-100">
                            <Leaf size={10} /> ORGANIK
                          </div>
                          <p className="mt-3 text-center text-[18px] font-black text-lime-100">
                            {organikCount}
                          </p>
                        </div>

                        <div className="absolute bottom-6 right-0 h-28 w-[106px] rounded-t-2xl rounded-b-lg border border-sky-300/60 bg-gradient-to-b from-sky-400/35 to-cyan-700/45">
                          <div className="mx-auto mt-3 flex w-fit items-center gap-1 rounded-full border border-sky-200/50 bg-sky-500/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-sky-100">
                            <Trash2 size={10} /> NON-ORG
                          </div>
                          <p className="mt-3 text-center text-[18px] font-black text-sky-100">
                            {nonOrganikCount}
                          </p>
                        </div>

                        <div className="absolute bottom-[132px] left-1/2 h-3 w-[220px] -translate-x-1/2 rounded-full bg-slate-500/45 blur-[1px]" />

                        {currentItem && (
                          <motion.div
                            animate={
                              errorLine === 0
                                ? {
                                    x: [
                                      itemX,
                                      itemX - 4,
                                      itemX + 4,
                                      itemX - 4,
                                      itemX + 4,
                                      itemX,
                                    ],
                                    y: itemY,
                                    opacity: 1,
                                  }
                                : errorLine === 1
                                  ? {
                                      x: [-8, 8, -8, 8, 0],
                                      y: [
                                        itemY,
                                        itemY - 3,
                                        itemY,
                                        itemY + 3,
                                        itemY,
                                      ],
                                      opacity: 1,
                                      rotate: [-2, 2, -2, 2, 0],
                                    }
                                  : errorLine === 3
                                    ? {
                                        x: [
                                          itemX - 20,
                                          itemX + 20,
                                          itemX - 20,
                                          itemX + 20,
                                          itemX,
                                        ],
                                        y: [
                                          itemY,
                                          itemY + 8,
                                          itemY,
                                          itemY + 8,
                                          itemY,
                                        ],
                                        opacity: 1,
                                      }
                                    : {
                                        x: itemX,
                                        y: itemY,
                                        opacity: 1,
                                        scale: [1, 1.02, 1],
                                      }
                            }
                            transition={
                              errorLine === 0
                                ? {
                                    duration: 0.4,
                                    repeat: Infinity,
                                    repeatType: "loop",
                                  }
                                : errorLine === 1
                                  ? {
                                      duration: 0.5,
                                      repeat: Infinity,
                                      repeatType: "loop",
                                    }
                                  : errorLine === 3
                                    ? {
                                        duration: 0.6,
                                        repeat: Infinity,
                                        repeatType: "loop",
                                      }
                                    : {
                                        x: {
                                          type: "spring",
                                          stiffness: 120,
                                          damping: 16,
                                        },
                                        y: {
                                          type: "spring",
                                          stiffness: 120,
                                          damping: 16,
                                        },
                                        scale: {
                                          duration: 0.45,
                                          ease: "easeInOut",
                                        },
                                      }
                            }
                            className="absolute left-1/2 top-[70px] z-20 -translate-x-1/2"
                          >
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 bg-gradient-to-br ${currentItem.tint} text-2xl shadow-[0_8px_20px_rgba(15,23,42,.4)]`}
                            >
                              {currentItem.emoji}
                            </div>
                            <p className="mt-1 text-center text-[9px] font-bold text-slate-200">
                              {currentItem.name}
                            </p>
                          </motion.div>
                        )}

                        {errorLine === 0 && sortError && (
                          <div className="absolute bottom-12 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                            {[0, 1, 2].map((b) => (
                              <motion.div
                                key={b}
                                animate={{ scale: [1, 0.9, 1] }}
                                transition={{
                                  duration: 0.5,
                                  repeat: Infinity,
                                  delay: b * 0.1,
                                }}
                                className="flex h-8 w-12 items-center justify-center rounded-lg border-2 border-rose-400 bg-rose-100/50 text-[10px] font-black text-rose-600"
                              >
                                b={b} ❌
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {errorLine === 3 && sortError && (
                          <div className="absolute bottom-12 left-1/2 z-20 flex -translate-x-1/2 gap-3">
                            {["ORGANIK", "NON-ORG"].map((bin, idx) => (
                              <motion.div
                                key={bin}
                                animate={{ x: [0, 12, -12, 0] }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  delay: idx * 0.15,
                                }}
                                className="flex h-8 w-16 items-center justify-center rounded-lg border-2 border-rose-400 bg-rose-100/50 text-[9px] font-black text-rose-600"
                              >
                                {bin} ↔
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
