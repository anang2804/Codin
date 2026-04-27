"use client";

import { useEffect, useRef, useState } from "react";
import { useSimulasiAttemptRecorder } from "@/lib/hooks/useSimulasiAttemptRecorder";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Droplets,
  Lightbulb,
  Play,
  RotateCcw,
  Terminal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIMULASI_SLUG = "struktur-kontrol-pengisian-galon-air-dasar";

type CommandChoice = "for" | "while" | "do-while";

const CHOICES: CommandChoice[] = ["for", "while", "do-while"];

const DESCRIPTION_BY_CHOICE: Record<CommandChoice, string> = {
  for: "untuk perulangan dengan jumlah iterasi yang biasanya sudah ditentukan.",
  while: "untuk melakukan perulangan selama kondisi bernilai benar (true).",
  "do-while":
    "untuk melakukan perulangan yang dijalankan minimal satu kali sebelum pengecekan kondisi.",
};

const KAPASITAS_MAKS = 5;

export default function StrukturKontrolPengisianGalonAirDasarPage() {
  const [selectedCommand, setSelectedCommand] = useState<CommandChoice | null>(
    null,
  );
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
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
  const [literSekarang, setLiterSekarang] = useState(0);
  const [isFilling, setIsFilling] = useState(false);
  const [fillError, setFillError] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const codeLines = [
    null,
    '        printf("Mengisi... %d Liter\\n", literSekarang);',
    "        literSekarang++;",
    "    }",
    "",
    '    printf("Galon Penuh!\\n");',
    "    return 0;",
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
    setLiterSekarang(0);
    setIsFilling(false);
    setFillError(false);
  };

  const resetSim = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setIsSelectorOpen(false);
    setSelectedCommand(null);
    resetVisualState();
    setFeedback("Sistem siap menjalankan simulasi.");
  };

  const runFilling = (liter: number) => {
    if (liter > KAPASITAS_MAKS) {
      setIsFilling(false);
      setIsRunning(false);
      setActiveLine(5);
      setShowSuccessCard(true);
      setFeedback(
        "Berhasil! Semua langkah struktur kontrol sudah sesuai.\n\nGalon berhasil diisi bertahap dari 0 hingga 5 liter dan proses ditutup dengan status penuh.",
      );
      return;
    }

    setActiveLine(1);
    setLiterSekarang(liter);
    setFeedback(
      `Baris 2 berjalan.\n\nMengisi air ke galon: ${liter} liter.\n\nSistem melanjutkan perulangan sampai kapasitas maksimum tercapai.`,
    );

    timerRef.current = setTimeout(() => {
      setActiveLine(2);
      timerRef.current = setTimeout(() => runFilling(liter + 1), 420);
    }, 380);
  };

  const executeStep = () => {
    setActiveLine(0);

    if (!selectedCommand) {
      setIsRunning(false);
      setErrorLine(0);
      setFillError(true);
      setFeedback(
        "Baris 5 belum lengkap.\n\nLengkapi terlebih dahulu token pada baris ini sebelum melanjutkan simulasi.\n\nPetunjuk: baca kebutuhan tipe data atau operasi pada baris tersebut, lalu pilih token yang paling sesuai.",
      );
      return;
    }

    if (selectedCommand !== "while") {
      setIsRunning(false);
      setErrorLine(0);
      setFillError(true);
      setFeedback(
        "Baris 5 belum tepat.\n\nToken pada baris ini belum sesuai konteks proses.\n\nPetunjuk: baca ulang tujuan barisnya, lalu pilih token yang perannya paling tepat.",
      );
      return;
    }

    setErrorLine(-1);
    setFillError(false);
    setIsFilling(true);
    setFeedback(
      "Baris 5 benar.\n\nKeyword sudah tepat, sistem memulai proses perulangan pengisian galon.",
    );
    timerRef.current = setTimeout(() => runFilling(1), 650);
  };

  const startRunning = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(true);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    resetVisualState();
    setFeedback(
      "Memulai simulasi struktur kontrol...\n\nSistem membaca baris perintah dari atas ke bawah.",
    );
    timerRef.current = setTimeout(executeStep, 250);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-lime-50 via-emerald-50 to-amber-50 text-foreground">
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
              Pengisian Galon Air
            </h1>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Level Dasar
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
              key={selectedCommand ?? "default"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"
            >
              <h3 className="mb-2 text-xs font-black uppercase tracking-tight text-foreground">
                {selectedCommand
                  ? selectedCommand.toUpperCase()
                  : "SIAP MENULIS"}
              </h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {selectedCommand
                  ? DESCRIPTION_BY_CHOICE[selectedCommand]
                  : "Pilih keyword yang tepat untuk perulangan pengisian galon air."}
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
                ? `Menganalisis baris ke-${activeLine + 5}`
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
                    Perulangan Pengisian Galon
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  Ayo bantu sistem dispenser ini mengisi galon selama airnya
                  belum mencapai 5 liter!
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
                    Berhasil! Struktur kontrol sudah tepat
                  </h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                    Perulangan berjalan sampai 5 liter dan proses pengisian
                    ditutup dengan status galon penuh.
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
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-[26px] transition-all ${
                        activeLine !== -1 && i === activeLine + 4
                          ? "scale-110 pr-1 font-black text-emerald-700"
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
                        {"int main() {"}
                      </span>
                    </div>
                    <div className="relative flex h-[26px] items-center">
                      <span className="relative z-10 whitespace-pre font-bold text-slate-900">
                        int literSekarang = 0;
                      </span>
                    </div>
                    <div className="relative flex h-[26px] items-center">
                      <span className="relative z-10 whitespace-pre font-bold text-slate-900">
                        int kapasitasMaks = 5;
                      </span>
                    </div>
                    <div className="relative flex h-[26px] items-center" />

                    {codeLines.map((line, i) => {
                      const lineIndex = i + 3;

                      return (
                        <div
                          key={i}
                          className="relative flex h-[26px] items-center"
                        >
                          {activeLine === i && (
                            <motion.div
                              layoutId="lineHighlightGalonAir"
                              className={`absolute inset-0 -mx-5 -my-1 z-0 border-l-4 ${
                                isRunning
                                  ? "border-emerald-500 bg-emerald-50"
                                  : "border-emerald-200 bg-emerald-50/30"
                              }`}
                            />
                          )}

                          {line === null ? (
                            <div className="relative z-10 whitespace-pre font-bold text-slate-900">
                              <button
                                type="button"
                                disabled={isRunning}
                                onClick={() => {
                                  setIsSelectorOpen(true);
                                  setActiveLine(0);
                                }}
                                className={`rounded px-1.5 py-0.5 transition-all ${
                                  selectedCommand
                                    ? "text-slate-900 hover:bg-emerald-50"
                                    : "italic text-slate-300 hover:bg-slate-100"
                                } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                {selectedCommand ?? "_____"}
                              </button>
                              <span>
                                {" (literSekarang < kapasitasMaks) {"}
                              </span>
                            </div>
                          ) : (
                            <div className="relative z-10 whitespace-pre font-bold text-slate-900">
                              {line}
                            </div>
                          )}

                          {activeLine === lineIndex && (
                            <motion.div
                              layoutId="lineHighlightGalonAirExtra"
                              className="pointer-events-none absolute inset-0"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {isSelectorOpen && !isRunning && (
                    <div className="absolute bottom-4 left-5 right-5 z-30 rounded-xl border border-emerald-200 bg-card px-3 py-2 shadow-lg">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        PILIH TOKEN BARIS 5
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {CHOICES.map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => {
                              setSelectedCommand(choice);
                              setIsSelectorOpen(false);
                              setErrorLine(-1);
                              setShowSuccessCard(false);
                              setActiveLine(0);
                              setFillError(false);
                            }}
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 hover:bg-emerald-100"
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
                  <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-1.5 text-cyan-300">
                    <Droplets size={14} />
                  </div>
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    VISUAL PENGISIAN GALON
                  </h2>
                </div>
                <span
                  className={`rounded-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    isFilling
                      ? "bg-cyan-500 text-white"
                      : fillError
                        ? "bg-rose-500 text-white"
                        : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {isFilling ? "FILLING" : fillError ? "FAILED" : "IDLE"}
                </span>
              </div>

              <div className="relative flex flex-1 flex-col overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,.22),#020617_58%)]" />
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(148,163,184,.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.16)_1px,transparent_1px)] [background-size:26px_26px]" />

                <div className="relative z-10 flex flex-1 flex-col gap-4 p-5 text-slate-100">
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/90 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
                        Tangki Galon
                      </p>
                      <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2 py-0.5 text-[9px] font-bold text-cyan-200">
                        {literSekarang}/{KAPASITAS_MAKS} Liter
                      </span>
                    </div>

                    <div className="relative mt-3 flex h-64 items-end justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                      <div className="absolute top-4 flex items-center gap-2 text-[10px] font-bold text-cyan-200">
                        <Droplets size={12} />
                        <span>
                          {isFilling ? "Air Mengalir" : "Siap Mengisi"}
                        </span>
                      </div>

                      {fillError && (
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_50%_30%,rgba(248,113,113,.2),rgba(248,113,113,0)_58%)]"
                          animate={{ opacity: [0.16, 0.38, 0.2, 0.42, 0.14] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        />
                      )}

                      {isFilling && (
                        <motion.div
                          className="absolute left-1/2 top-[56px] z-10 h-[118px] w-1.5 -translate-x-1/2 rounded-full bg-cyan-300"
                          animate={{
                            opacity: [0.45, 1, 0.55],
                            scaleY: [0.92, 1.08, 0.92],
                          }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      )}

                      <div className="relative h-[250px] w-[150px]">
                        <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-14 w-40 -translate-x-1/2">
                          <div className="absolute left-3 top-1.5 h-5 w-8 rounded-full border border-slate-200/70 bg-gradient-to-br from-slate-100 to-slate-300 shadow-[0_3px_8px_rgba(0,0,0,.22)]" />
                          <div className="absolute left-8 top-3.5 h-2.5 w-20 rounded-full border border-slate-200/75 bg-gradient-to-b from-slate-100 to-slate-300" />
                          <div className="absolute left-[88px] top-5 h-8 w-3.5 rounded-b-lg rounded-t-sm border border-slate-200/75 bg-gradient-to-b from-slate-100 to-slate-300" />
                          <div className="absolute left-[82px] top-[34px] h-2.5 w-[16px] rounded-b-md border border-slate-200/75 bg-gradient-to-b from-slate-100 to-slate-300" />
                          <div className="absolute left-5 top-0 h-[2px] w-5 rotate-12 rounded-full bg-slate-50/90" />
                          <div className="absolute left-5 top-[5px] h-[2px] w-5 -rotate-12 rounded-full bg-slate-50/90" />
                        </div>

                        <div className="absolute left-1/2 top-[76px] h-5 w-8 -translate-x-1/2 rounded-t-[10px] rounded-b-[6px] border border-cyan-200/55 bg-sky-900/70" />
                        <div className="absolute left-1/2 top-[80px] h-7 w-12 -translate-x-1/2 rounded-t-[14px] rounded-b-[10px] border border-cyan-200/55 bg-sky-900/60" />

                        <div className="absolute inset-x-0 top-[84px] bottom-0 overflow-hidden rounded-t-[52px] rounded-b-[34px] border-2 border-cyan-200/60 bg-sky-950/55">
                          <motion.div
                            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cyan-600 via-sky-500 to-cyan-300"
                            animate={{
                              height: `${(literSekarang / KAPASITAS_MAKS) * 100}%`,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 120,
                              damping: 20,
                            }}
                          />

                          <div className="absolute inset-x-0 top-[14%] h-px border-t border-cyan-200/30" />
                          <div className="absolute inset-x-0 top-[29%] h-px border-t border-cyan-200/28" />
                          <div className="absolute inset-x-0 top-[44%] h-px border-t border-cyan-200/26" />
                          <div className="absolute inset-x-0 top-[59%] h-px border-t border-cyan-200/24" />
                          <div className="absolute inset-x-0 top-[74%] h-px border-t border-cyan-200/22" />

                          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,.22)_0,rgba(255,255,255,0)_36%,rgba(255,255,255,.16)_68%,rgba(255,255,255,0)_100%)]" />
                        </div>

                        <div className="absolute bottom-0 left-1/2 h-2.5 w-[106px] -translate-x-1/2 rounded-full bg-black/35 blur-md" />
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
