"use client";

import { useEffect, useRef, useState } from "react";
import { useSimulasiAttemptRecorder } from "@/lib/hooks/useSimulasiAttemptRecorder";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  MoonStar,
  Play,
  RotateCcw,
  Terminal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIMULASI_SLUG = "struktur-kontrol-lampu-tidur-dasar";

type CommandChoice = "if" | "else";

const CHOICES: CommandChoice[] = ["if", "else"];

export default function StrukturKontrolLampuTidurDasarPage() {
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
  const [lampuNyala, setLampuNyala] = useState(false);
  const [lampuRusak, setLampuRusak] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensorCahaya = 20;
  const batasGelap = 30;

  const codeLines = [
    `int sensorCahaya = ${sensorCahaya};`,
    `int batasGelap = ${batasGelap};`,
    "",
    null,
    '    System.out.println("Lampu Tidur Nyala ");',
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

  const resetSim = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setIsSelectorOpen(false);
    setSelectedCommand(null);
    setLampuNyala(false);
    setLampuRusak(false);
    setFeedback("Sistem siap menjalankan simulasi.");
  };

  const executeStep = (index: number) => {
    if (index >= codeLines.length) {
      setIsRunning(false);
      setActiveLine(3);
      setShowSuccessCard(true);
      setFeedback(
        "Berhasil! Semua langkah struktur kontrol sudah sesuai.\n\nKarena sensorCahaya (20) < batasGelap (30), blok kondisi dijalankan dan lampu tidur menyala.",
      );
      return;
    }

    setActiveLine(index);

    if (index === 3) {
      if (!selectedCommand) {
        setIsRunning(false);
        setErrorLine(index);
        setFeedback(
          "Baris 4 belum lengkap.\n\nLengkapi terlebih dahulu token pada baris ini sebelum melanjutkan simulasi.\n\nPetunjuk: baca kebutuhan tipe data atau operasi pada baris tersebut, lalu pilih token yang paling sesuai.",
        );
        return;
      }

      if (selectedCommand !== "if") {
        setIsRunning(false);
        setErrorLine(index);
        setFeedback(
          "Baris 4 belum tepat.\n\nToken pada baris ini belum sesuai konteks proses.\n\nPetunjuk: baca ulang tujuan barisnya, lalu pilih token yang perannya paling tepat.",
        );
        setLampuNyala(false);
        setLampuRusak(true);
        return;
      }

      setLampuRusak(false);
      setFeedback(
        "Baris 4 benar.\n\nKeyword sudah tepat, sistem masuk ke blok kondisi.",
      );
      timerRef.current = setTimeout(() => executeStep(index + 1), 850);
      return;
    }

    if (index === 4) {
      setLampuNyala(true);
      setLampuRusak(false);
      setFeedback('Baris 5 benar.\n\nOutput dieksekusi: "Lampu Tidur Nyala".');
    }

    timerRef.current = setTimeout(() => executeStep(index + 1), 700);
  };

  const startRunning = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(true);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setLampuNyala(false);
    setLampuRusak(false);
    setFeedback(
      "Memulai simulasi struktur kontrol...\n\nSistem membaca baris perintah dari atas ke bawah.",
    );
    timerRef.current = setTimeout(() => executeStep(0), 250);
  };

  const lampuVisualNyala = lampuNyala && !lampuRusak;

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
              Lampu Tidur
            </h1>
            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[8px] font-bold uppercase italic tracking-widest text-emerald-600">
              Dasar
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
                {selectedCommand === "if"
                  ? "Mengecek apakah suatu kondisi bernilai True (benar)."
                  : selectedCommand === "else"
                    ? "sebagai cadangan yang dijalankan jika semua kondisi if dan elif tidak terpenuhi."
                    : "Lengkapi token pada baris kondisi. Pilih if atau else."}
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
                ? `Menganalisis baris ke-${activeLine + 1}`
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
                    Lampu Tidur Otomatis
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  💡 Ayo bantu lengkapi struktur kontrol di bawah ini agar lampu
                  menyala tepat ketika suasana mulai redup.
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
                    Token kondisi yang kamu pilih sudah tepat. Kondisi bernilai
                    true, sehingga output "Lampu Tidur Nyala" dijalankan.
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

              <div className="relative flex flex-1 overflow-hidden font-mono text-[13px] leading-[26px]">
                <div className="w-12 shrink-0 select-none overflow-hidden border-r border-border bg-muted/30 pt-5 pr-4 text-right text-muted-foreground">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-[26px] transition-all ${
                        activeLine === i
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
                    {codeLines.map((line, i) => (
                      <div
                        key={i}
                        className="relative flex h-[26px] items-center"
                      >
                        {activeLine === i && (
                          <motion.div
                            layoutId="lineHighlightLampuTidur"
                            className={`absolute inset-0 -mx-5 -my-1 border-l-4 z-0 ${
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
                                setActiveLine(i);
                              }}
                              className={`rounded px-1.5 py-0.5 transition-all ${
                                selectedCommand
                                  ? "text-slate-900 hover:bg-emerald-50"
                                  : "italic text-slate-300 hover:bg-slate-100"
                              } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selectedCommand ?? "_____"}
                            </button>
                            <span>{" (sensorCahaya < batasGelap) {"}</span>
                          </div>
                        ) : (
                          <div className="relative z-10 whitespace-pre font-bold text-slate-900">
                            {line}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {isSelectorOpen && !isRunning && (
                    <div className="absolute bottom-4 left-5 right-5 z-30 rounded-xl border border-emerald-200 bg-card px-3 py-2 shadow-lg">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        PILIH TOKEN BARIS 4
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {CHOICES.map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => {
                              setSelectedCommand(choice);
                              setIsSelectorOpen(false);
                              setErrorLine(-1);
                              setShowSuccessCard(false);
                              setActiveLine(3);
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
                  <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-1.5 text-emerald-400">
                    <Activity size={14} />
                  </div>
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    VISUAL LAMPU TIDUR
                  </h2>
                </div>
                <span
                  className={`rounded-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    isRunning
                      ? "bg-emerald-500 text-white"
                      : errorLine !== -1
                        ? "bg-rose-500 text-white"
                        : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {isRunning ? "RUNNING" : errorLine !== -1 ? "ERROR" : "IDLE"}
                </span>
              </div>

              <div className="relative flex flex-1 flex-col overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,#1e293b_0%,#020617_62%)]" />
                <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(to_right,rgba(148,163,184,.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.2)_1px,transparent_1px)] [background-size:28px_28px]" />

                <div className="relative z-10 flex flex-1 flex-col gap-4 p-5 text-slate-100">
                  <div className="relative flex h-64 items-end justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
                    <div className="absolute right-5 top-4 rounded-full border border-slate-600/80 bg-slate-900/70 p-2">
                      <MoonStar size={18} className="text-slate-300" />
                    </div>

                    <div
                      className={`absolute inset-0 transition-all duration-500 ${
                        lampuVisualNyala
                          ? "bg-[radial-gradient(circle_at_50%_38%,rgba(255,217,120,.28),rgba(255,217,120,0)_56%)]"
                          : "bg-transparent"
                      }`}
                    />

                    {lampuRusak && (
                      <motion.div
                        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(248,113,113,.12),rgba(248,113,113,0)_58%)]"
                        animate={{ opacity: [0.15, 0.45, 0.2, 0.5, 0.12] }}
                        transition={{ duration: 0.75, repeat: Infinity }}
                      />
                    )}

                    <motion.div
                      className={`absolute left-1/2 top-[68px] h-52 w-64 -translate-x-1/2 rounded-full transition-all duration-500 ${
                        lampuVisualNyala
                          ? "bg-amber-200/80 blur-3xl"
                          : "bg-slate-700/20 blur-3xl"
                      }`}
                      animate={
                        lampuRusak
                          ? { opacity: [0.08, 0.28, 0.12, 0.32, 0.09] }
                          : { opacity: 1 }
                      }
                      transition={
                        lampuRusak
                          ? { duration: 0.45, repeat: Infinity }
                          : { duration: 0.2 }
                      }
                    />

                    <div
                      className={`absolute left-1/2 top-[74px] h-34 w-44 -translate-x-1/2 [clip-path:polygon(14%_0%,86%_0%,100%_100%,0%_100%)] transition-all duration-500 ${
                        lampuVisualNyala
                          ? "bg-gradient-to-b from-amber-100/85 to-amber-300/30"
                          : "bg-gradient-to-b from-slate-600/30 to-slate-800/10"
                      }`}
                    />

                    <div
                      className={`absolute left-1/2 bottom-[30px] h-14 w-52 -translate-x-1/2 rounded-full blur-xl transition-all duration-500 ${
                        lampuVisualNyala
                          ? "bg-amber-200/65"
                          : lampuRusak
                            ? "bg-rose-300/20"
                            : "bg-slate-800/35"
                      }`}
                    />

                    <motion.div
                      className="relative z-10 mb-5 flex w-full flex-col items-center"
                      animate={
                        lampuRusak
                          ? {
                              x: [0, -1.5, 1.5, -1, 1, 0],
                              rotate: [0, -0.4, 0.4, -0.2, 0.2, 0],
                            }
                          : { x: 0, rotate: 0 }
                      }
                      transition={
                        lampuRusak
                          ? { duration: 0.28, repeat: Infinity, ease: "linear" }
                          : { duration: 0.2 }
                      }
                    >
                      <div className="relative h-36 w-44">
                        <div
                          className={`absolute left-1/2 top-2 h-12 w-24 -translate-x-1/2 rounded-t-[32px] rounded-b-[12px] border transition-all duration-300 ${
                            lampuVisualNyala
                              ? "border-amber-200 bg-gradient-to-b from-amber-50 to-amber-200 text-amber-700"
                              : "border-slate-600 bg-gradient-to-b from-slate-600 to-slate-700 text-slate-300"
                          }`}
                        >
                          <div className="absolute inset-x-4 top-2 h-1 rounded-full bg-black/15" />
                          <div className="absolute inset-x-3 bottom-2 h-1.5 rounded-full bg-black/10" />
                        </div>

                        <div className="absolute left-1/2 top-[58px] h-10 w-2 -translate-x-1/2 rounded-full bg-slate-500" />
                        <div className="absolute left-1/2 top-[94px] h-6 w-28 -translate-x-1/2 rounded-full bg-slate-700" />
                        <div className="absolute left-1/2 top-[86px] h-14 w-4 -translate-x-1/2 rounded-full bg-slate-600" />
                        <div className="absolute left-1/2 top-[108px] h-6 w-36 -translate-x-1/2 rounded-[999px] border border-slate-600 bg-slate-800" />

                        <motion.div
                          className={`absolute left-1/2 top-[22px] h-4 w-4 -translate-x-1/2 rounded-full transition-all ${
                            lampuVisualNyala
                              ? "bg-amber-300 shadow-[0_0_24px_rgba(251,191,36,.95)]"
                              : lampuRusak
                                ? "bg-rose-300 shadow-[0_0_16px_rgba(248,113,113,.8)]"
                                : "bg-slate-400"
                          }`}
                          animate={
                            lampuRusak
                              ? {
                                  opacity: [0.25, 0.85, 0.35, 0.9, 0.2],
                                  scale: [0.9, 1.05, 0.92, 1.08, 0.88],
                                }
                              : { opacity: 1, scale: 1 }
                          }
                          transition={
                            lampuRusak
                              ? {
                                  duration: 0.32,
                                  repeat: Infinity,
                                  ease: "linear",
                                }
                              : { duration: 0.2 }
                          }
                        />

                        {lampuRusak && (
                          <>
                            <motion.div
                              className="absolute left-[48%] top-[20px] h-1 w-1 rounded-full bg-rose-200"
                              animate={{
                                y: [0, -8, -3],
                                x: [0, -5, -2],
                                opacity: [0, 1, 0],
                              }}
                              transition={{
                                duration: 0.35,
                                repeat: Infinity,
                                repeatDelay: 0.2,
                              }}
                            />
                            <motion.div
                              className="absolute left-[53%] top-[21px] h-1 w-1 rounded-full bg-amber-200"
                              animate={{
                                y: [0, -7, -2],
                                x: [0, 5, 2],
                                opacity: [0, 1, 0],
                              }}
                              transition={{
                                duration: 0.38,
                                repeat: Infinity,
                                repeatDelay: 0.18,
                              }}
                            />
                          </>
                        )}
                      </div>
                    </motion.div>

                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900 to-transparent" />
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
