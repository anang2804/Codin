"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Mail,
  Play,
  RotateCcw,
  Send,
  Terminal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIMULASI_SLUG = "struktur-kontrol-kirim-pesan-massal-dasar";

type CommandChoice = "for" | "while" | "do-while";

const CHOICES: CommandChoice[] = ["for", "while", "do-while"];

const DESCRIPTION_BY_CHOICE: Record<CommandChoice, string> = {
  for: "untuk melakukan perulangan dengan jumlah yang sudah diketahui.",
  while:
    "untuk melakukan perulangan selama suatu kondisi bernilai benar (true).",
  "do-while":
    "untuk melakukan perulangan yang pasti dijalankan minimal satu kali, karena kondisi diperiksa di akhir perulangan.",
};

const RECEIVERS = ["Siswa 1", "Siswa 2", "Siswa 3"];

export default function StrukturKontrolKirimPesanMassalDasarPage() {
  const [selectedCommand, setSelectedCommand] = useState<CommandChoice | null>(
    null,
  );
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeLine, setActiveLine] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [errorLine, setErrorLine] = useState(-1);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [feedback, setFeedback] = useState("Sistem siap menjalankan simulasi.");
  const [hasTried, setHasTried] = useState(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const codeLines = [
    null,
    '    printf("Mengirim pesan ke-%d\\n", i);',
    "}",
    'printf("Semua Pesan Terkirim! ✨\\n");',
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
    setSentCount(0);
    setIsSending(false);
    setSendError(false);
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

  const runBroadcast = (index: number) => {
    if (index > RECEIVERS.length) {
      setIsSending(false);
      setIsRunning(false);
      setActiveLine(3);
      setShowSuccessCard(true);
      setFeedback(
        "Berhasil! Semua langkah struktur kontrol sudah sesuai.\n\nPesan berhasil dikirim berulang ke 3 penerima dan proses ditutup dengan status selesai.",
      );
      return;
    }

    setActiveLine(1);
    setSentCount(index);
    setFeedback(
      `Baris 2 berjalan.\n\nMengirim pesan ke-${index}.\n\nSistem melanjutkan perulangan ke penerima berikutnya.`,
    );

    timerRef.current = setTimeout(() => runBroadcast(index + 1), 800);
  };

  const executeStep = () => {
    setActiveLine(0);

    if (!selectedCommand) {
      setIsRunning(false);
      setErrorLine(0);
      setSendError(true);
      setFeedback(
        "Baris 1 belum lengkap.\n\nLengkapi terlebih dahulu token pada baris ini sebelum melanjutkan simulasi.\n\nPetunjuk: baca kebutuhan tipe data atau operasi pada baris tersebut, lalu pilih token yang paling sesuai.",
      );
      return;
    }

    if (selectedCommand !== "for") {
      setIsRunning(false);
      setErrorLine(0);
      setSendError(true);
      setFeedback(
        "Baris 1 belum tepat.\n\nToken pada baris ini belum sesuai konteks proses.\n\nPetunjuk: baca ulang tujuan barisnya, lalu pilih token yang perannya paling tepat.",
      );
      return;
    }

    setErrorLine(-1);
    setSendError(false);
    setIsSending(true);
    setFeedback(
      "Baris 1 benar.\n\nKeyword sudah tepat, sistem memulai proses perulangan pengiriman pesan.",
    );
    timerRef.current = setTimeout(() => runBroadcast(1), 650);
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
              Kirim Pesan Massal
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
            disabled={hasTried || isSavingCompletion}
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
                  : "Pilih keyword yang tepat untuk perulangan pengiriman pesan massal."}
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
                    Perulangan Kirim Pesan
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  Lengkapi keyword struktur kontrol agar sistem bisa mengirim
                  pesan secara berulang ke penerima 1 sampai 3.
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
                    Perulangan berjalan sampai 3 kali dan proses pengiriman
                    ditutup dengan pesan selesai.
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
                            layoutId="lineHighlightPesanMassal"
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
                            <span>
                              {" (int i = 1; i <= 3; i++) { // Isi: for"}
                            </span>
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
                        PILIH TOKEN BARIS 1
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
                              setSendError(false);
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
                    VISUAL KIRIM PESAN
                  </h2>
                </div>
                <span
                  className={`rounded-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    isSending
                      ? "bg-emerald-500 text-white"
                      : sendError
                        ? "bg-rose-500 text-white"
                        : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {isSending ? "SENDING" : sendError ? "FAILED" : "IDLE"}
                </span>
              </div>

              <div className="relative flex flex-1 flex-col overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,#1e293b_0%,#020617_62%)]" />
                <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(to_right,rgba(148,163,184,.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.15)_1px,transparent_1px)] [background-size:28px_28px]" />

                <div className="relative z-10 flex flex-1 flex-col gap-4 p-5 text-slate-100">
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/90 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
                        Alur Pengiriman
                      </p>
                      <span className="rounded-full border border-slate-600 bg-slate-900 px-2 py-0.5 text-[9px] font-bold text-slate-300">
                        3 pesan
                      </span>
                    </div>

                    <div className="relative mt-3 h-32 overflow-hidden rounded-xl border border-slate-700 bg-slate-900/70">
                      <div className="absolute left-6 right-6 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-sky-300/30" />
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-sky-200">
                        Start
                      </div>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-emerald-200">
                        Done
                      </div>

                      {sendError && (
                        <motion.div
                          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(248,113,113,.22),rgba(248,113,113,0)_58%)]"
                          animate={{ opacity: [0.15, 0.38, 0.2, 0.42, 0.16] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        />
                      )}

                      <motion.div
                        animate={{
                          x:
                            sentCount === 0
                              ? 0
                              : sentCount === 1
                                ? 72
                                : sentCount === 2
                                  ? 146
                                  : 220,
                          rotate: isSending ? 2 : 0,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 130,
                          damping: 20,
                          mass: 0.75,
                        }}
                        className="absolute left-8 top-1/2 z-10 -translate-y-1/2"
                      >
                        <motion.div
                          animate={isSending ? { y: [0, -4, 0] } : { y: 0 }}
                          transition={
                            isSending
                              ? {
                                  duration: 1.05,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }
                              : { duration: 0.25 }
                          }
                          className={`flex h-12 w-12 items-center justify-center rounded-xl border shadow-lg ${
                            sentCount > 0
                              ? "border-emerald-300/70 bg-emerald-500/20 text-emerald-300"
                              : "border-sky-300/60 bg-sky-500/20 text-sky-300"
                          }`}
                        >
                          <Mail size={20} />
                        </motion.div>
                      </motion.div>

                      <div className="absolute left-[74px] right-[54px] top-1/2 z-0 flex -translate-y-1/2 items-center justify-between">
                        {RECEIVERS.map((receiver, index) => {
                          const noUrut = index + 1;
                          const isSent = sentCount >= noUrut;

                          return (
                            <div
                              key={`${receiver}-checkpoint`}
                              className={`h-3 w-3 rounded-full border ${
                                isSent
                                  ? "border-emerald-300 bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.65)]"
                                  : "border-slate-500 bg-slate-700"
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-2">
                      {RECEIVERS.map((receiver, index) => {
                        const noUrut = index + 1;
                        const isSent = sentCount >= noUrut;
                        const isActive = isSending && sentCount === noUrut;

                        return (
                          <motion.div
                            key={receiver}
                            animate={isActive ? { x: [0, 5, 0] } : { x: 0 }}
                            transition={
                              isActive
                                ? { duration: 0.45, repeat: Infinity }
                                : { duration: 0.2 }
                            }
                            className={`rounded-xl border px-3 py-2 ${
                              isSent
                                ? "border-emerald-400/60 bg-emerald-500/20"
                                : sendError
                                  ? "border-rose-400/50 bg-rose-500/10"
                                  : "border-slate-700 bg-slate-900/70"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-white">
                                {receiver}
                              </p>
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider ${
                                  isSent
                                    ? "text-emerald-300"
                                    : sendError
                                      ? "text-rose-300"
                                      : "text-slate-400"
                                }`}
                              >
                                {isSent
                                  ? "TERKIRIM"
                                  : sendError
                                    ? "GAGAL"
                                    : "MENUNGGU"}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
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
