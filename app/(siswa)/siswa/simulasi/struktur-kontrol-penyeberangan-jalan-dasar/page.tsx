"use client";

import { useEffect, useRef, useState } from "react";
import { useSimulasiAttemptRecorder } from "@/lib/hooks/useSimulasiAttemptRecorder";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Play,
  RotateCcw,
  Terminal,
  GripHorizontal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIMULASI_SLUG = "struktur-kontrol-penyeberangan-jalan-dasar";

type CodeBlock = {
  id: string;
  content: string;
  category: "opening" | "statement" | "closing";
};

const AVAILABLE_BLOCKS: CodeBlock[] = [
  {
    id: "do-open",
    content: "do {",
    category: "opening",
  },
  {
    id: "console-log",
    content: '    console.log("Lampu masih merah");',
    category: "statement",
  },
  {
    id: "set-lamp",
    content: '    warnaLampu = "Hijau";',
    category: "statement",
  },
  {
    id: "while-close",
    content: '} while (warnaLampu == "Merah");',
    category: "closing",
  },
];

export default function StrukturKontrolPenyeberanganJalanDasarPage() {
  const [placedBlocks, setPlacedBlocks] = useState<(CodeBlock | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [draggedBlock, setDraggedBlock] = useState<CodeBlock | null>(null);

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

  const [lampColor, setLampColor] = useState<"Merah" | "Hijau">("Merah");
  const [isCrossing, setIsCrossing] = useState(false);
  const [crossError, setCrossError] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const codeLines = ['let warnaLampu = "Merah";', ""];

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
    setLampColor("Merah");
    setIsCrossing(false);
    setCrossError(false);
  };

  const resetSim = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setPlacedBlocks([null, null, null, null]);
    setFeedback("Sistem siap menjalankan simulasi.");
    resetVisualState();
  };

  const handleDragStart = (block: CodeBlock) => {
    setDraggedBlock(block);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDropOnEditor = (e: React.DragEvent, slotIndex?: number) => {
    e.preventDefault();
    if (!draggedBlock) return;
    if (isRunning) {
      toast.error("Tidak bisa menambah blok saat simulasi berjalan!");
      return;
    }

    if (slotIndex !== undefined && slotIndex < placedBlocks.length) {
      const newBlocks = [...placedBlocks];
      newBlocks[slotIndex] = draggedBlock;
      setPlacedBlocks(newBlocks);
      setFeedback("Blok ditambahkan.");
    }
    setDraggedBlock(null);
  };

  const removeBlock = (index: number) => {
    const newBlocks = [...placedBlocks];
    newBlocks[index] = null;
    setPlacedBlocks(newBlocks);
    setFeedback("Blok dihapus.");
  };

  const executeStep = (index: number) => {
    const totalLines = 2 + placedBlocks.length; // 2 + 4 = 6

    if (index >= totalLines) {
      // Check if all blocks are placed correctly
      if (
        placedBlocks[0]?.id === "do-open" &&
        placedBlocks[1]?.id === "console-log" &&
        placedBlocks[2]?.id === "set-lamp" &&
        placedBlocks[3]?.id === "while-close"
      ) {
        setIsRunning(false);
        setActiveLine(-1);
        setShowSuccessCard(true);
        setFeedback(
          "Berhasil! Struktur kontrol do-while sudah lengkap dan benar!\n\nSistem menunggu lampu merah, lalu mengubah ke hijau, dan akhirnya pejalan kaki bisa menyeberang.",
        );
        return;
      } else {
        setIsRunning(false);
        setActiveLine(2);
        setErrorLine(2);
        setCrossError(true);
        setShowSuccessCard(false);
        setFeedback(
          "Simulasi selesai, tetapi struktur kontrol belum lengkap atau tidak tepat.\n\nPastikan semua blok ditambahkan dalam urutan yang benar: do { → console.log → assignment → } while.",
        );
        return;
      }
    }

    // Check first 2 lines (variable declarations)
    if (index < 2) {
      setActiveLine(index);
      setFeedback("Baris " + (index + 1) + " diproses: Deklarasi variabel.");
      timerRef.current = setTimeout(() => executeStep(index + 1), 700);
      return;
    }

    // Check placed blocks starting from line 2
    const blockIndex = index - 2;

    if (blockIndex >= placedBlocks.length) {
      return;
    }

    const block = placedBlocks[blockIndex];

    // Skip null blocks
    if (block === null) {
      setErrorLine(2 + blockIndex);
      setCrossError(true);
      setIsRunning(false);
      setFeedback(
        "Blok pada posisi " +
          (blockIndex + 1) +
          " belum ditempatkan.\n\nLengkapi struktur kontrol dengan drag & drop blok yang tepat.",
      );
      return;
    }

    setActiveLine(2 + blockIndex);

    if (blockIndex === 0) {
      if (block.id !== "do-open") {
        setIsRunning(false);
        setErrorLine(2 + blockIndex);
        setCrossError(true);
        setFeedback(
          "Baris 3 belum tepat.\n\nBlok pembuka perulangan belum sesuai.\n\nPetunjuk: Gunakan blok 'do {' untuk memulai perulangan.",
        );
        return;
      }
      setFeedback(
        "Baris 3 benar.\n\nKeyword 'do' dijalankan, sistem memasuki blok perulangan.",
      );
    } else if (blockIndex === 1) {
      if (block.id !== "console-log") {
        setIsRunning(false);
        setErrorLine(2 + blockIndex);
        setCrossError(true);
        setFeedback(
          "Baris 4 belum tepat.\n\nStatement console.log belum sesuai.\n\nPetunjuk: Gunakan blok yang menampilkan status lampu masih merah.",
        );
        return;
      }
      setFeedback(
        'Baris 4 benar.\n\nOutput dieksekusi: "Lampu masih merah".\n\nSistem membaca status lampu.',
      );
    } else if (blockIndex === 2) {
      if (block.id !== "set-lamp") {
        setIsRunning(false);
        setErrorLine(2 + blockIndex);
        setCrossError(true);
        setFeedback(
          "Baris 5 belum tepat.\n\nAssignment statement belum sesuai.\n\nPetunjuk: Gunakan blok yang mengubah warna lampu menjadi hijau.",
        );
        return;
      }
      setLampColor("Hijau");
      setFeedback(
        'Baris 5 benar.\n\nVariabel diperbarui: warnaLampu = "Hijau".\n\nLampu berubah menjadi hijau.',
      );
    } else if (blockIndex === 3) {
      if (block.id !== "while-close") {
        setIsRunning(false);
        setErrorLine(2 + blockIndex);
        setCrossError(true);
        setFeedback(
          "Baris 6 belum tepat.\n\nBlok penutup perulangan belum sesuai.\n\nPetunjuk: Gunakan blok '} while' untuk menutup kondisi perulangan.",
        );
        return;
      }
      setFeedback(
        'Baris 6 benar.\n\nKondisi while diperiksa: warnaLampu == "Merah" ?\n\nKarena lampu sudah hijau, perulangan berhenti.',
      );
    }

    timerRef.current = setTimeout(() => executeStep(index + 1), 700);
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
    timerRef.current = setTimeout(() => executeStep(0), 250);
  };
  const SyntaxHighlight = ({ code }: { code: string }) => {
    return <span className="font-mono text-slate-900">{code}</span>;
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
              Penyeberangan Jalan
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
              Blok Tersedia
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            {AVAILABLE_BLOCKS.map((block) => (
              <motion.div
                key={block.id}
                draggable
                onDragStart={() => handleDragStart(block)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group cursor-move rounded-xl border border-emerald-200 bg-emerald-50 p-3 transition-all hover:border-emerald-400 hover:bg-emerald-100 active:bg-emerald-200"
              >
                <div className="flex items-start gap-2">
                  <GripHorizontal
                    size={14}
                    className="mt-1 text-emerald-600/50 group-hover:text-emerald-600"
                  />
                  <div className="flex-1 font-mono text-[11px] text-slate-900 break-words">
                    <SyntaxHighlight code={block.content} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

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
                    Simulasi Penyeberangan Jalan
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  💡 Ayo bantu lengkapi struktur kontrol di bawah ini dengan
                  drag & drop blok kode agar pejalan kaki bisa menyeberang
                  dengan aman ketika lampu berubah hijau.
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
                    Sistem menunggu saat lampu merah dan mengizinkan menyeberang
                    saat lampu berubah hijau.
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
                    Algortima dan Pemrograman (Drag & Drop)
                  </span>
                </div>
              </div>

              <div className="relative flex flex-1 overflow-hidden font-mono text-[13px] leading-[26px]">
                <div className="w-12 shrink-0 select-none overflow-hidden border-r border-border bg-muted/30 pt-5 pr-4 text-right text-muted-foreground">
                  {Array.from({ length: 6 }).map((_, i) => (
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
                  <div className="absolute inset-0 z-10 overflow-y-auto whitespace-pre p-5 pt-5">
                    {/* Static lines */}
                    {codeLines.map((line, i) => (
                      <div
                        key={`static-${i}`}
                        className="relative flex h-[26px] items-center"
                      >
                        {activeLine === i && (
                          <motion.div
                            layoutId="lineHighlightPenyeberangan"
                            className={`absolute inset-0 -mx-5 -my-1 border-l-4 z-0 ${
                              isRunning
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-emerald-200 bg-emerald-50/30"
                            }`}
                          />
                        )}
                        <div className="relative z-10 font-bold text-slate-900">
                          <SyntaxHighlight code={line} />
                        </div>
                      </div>
                    ))}

                    {/* Placed blocks or drop zone */}
                    <div className="relative mt-1 flex flex-col gap-1">
                      {placedBlocks.map((block, idx) => (
                        <div
                          key={`placed-${idx}`}
                          className="relative flex h-[26px] items-center group"
                        >
                          {activeLine === 2 + idx && (
                            <motion.div
                              layoutId="lineHighlightPenyeberangan"
                              className={`absolute inset-0 -mx-5 -my-1 border-l-4 z-0 ${
                                isRunning
                                  ? "border-emerald-500 bg-emerald-50"
                                  : "border-emerald-200 bg-emerald-50/30"
                              }`}
                            />
                          )}
                          {block === null ? (
                            <div
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDropOnEditor(e, idx)}
                              className="relative z-10 w-full flex-1 h-[26px] border-2 border-dashed border-emerald-200 rounded text-center text-[10px] text-emerald-500 flex items-center justify-center hover:border-emerald-400 hover:bg-emerald-50 transition-all"
                            >
                              ↓ Drop di sini
                            </div>
                          ) : (
                            <div className="relative z-10 flex-1 font-bold text-slate-900 flex items-center justify-between">
                              <span>
                                <SyntaxHighlight code={block.content} />
                              </span>
                              <button
                                type="button"
                                onClick={() => removeBlock(idx)}
                                disabled={isRunning}
                                className="ml-2 px-2 py-1 text-xs rounded bg-red-100 text-red-600 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                              >
                                Hapus
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
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
                    VISUAL PENYEBERANGAN
                  </h2>
                </div>
                <span
                  className={`rounded-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    isRunning
                      ? "bg-emerald-500 text-white"
                      : crossError
                        ? "bg-rose-500 text-white"
                        : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {isRunning ? "RUNNING" : crossError ? "FAILED" : "IDLE"}
                </span>
              </div>

              <div className="relative flex flex-1 flex-col overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,.20),#020617_58%)]" />
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(148,163,184,.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.16)_1px,transparent_1px)] [background-size:26px_26px]" />

                <div className="relative z-10 flex flex-1 flex-col gap-4 p-5 text-slate-100">
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/90 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">
                        Lampu Penyeberangan
                      </p>
                    </div>

                    <div className="relative mt-3 flex h-64 items-end justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                      <div className="absolute top-4 flex items-center gap-2 text-[10px] font-bold text-cyan-200">
                        <Activity size={12} />
                        <span>
                          {lampColor === "Merah"
                            ? "Tunggu Lampu Hijau"
                            : "Silakan Menyeberang"}
                        </span>
                      </div>

                      {crossError && (
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_50%_30%,rgba(248,113,113,.2),rgba(248,113,113,0)_58%)]"
                          animate={{ opacity: [0.16, 0.38, 0.2, 0.42, 0.14] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        />
                      )}

                      <div className="relative h-[250px] w-[230px]">
                        <div className="absolute left-1/2 top-[10px] h-[106px] w-[58px] -translate-x-1/2 rounded-2xl border border-slate-500/70 bg-slate-800/90 p-2 shadow-lg shadow-black/40">
                          <motion.div
                            animate={
                              crossError
                                ? {
                                    opacity: [1, 0.3, 1, 0.5, 1, 0, 1, 0.4],
                                    boxShadow: [
                                      "0_0_20px_rgba(244,63,94,.55)",
                                      "0_0_0px_rgba(244,63,94,0)",
                                      "0_0_20px_rgba(244,63,94,.55)",
                                      "0_0_5px_rgba(244,63,94,.2)",
                                      "0_0_20px_rgba(244,63,94,.55)",
                                      "0_0_0px_rgba(244,63,94,0)",
                                      "0_0_20px_rgba(244,63,94,.55)",
                                      "0_0_10px_rgba(244,63,94,.3)",
                                    ],
                                  }
                                : {}
                            }
                            transition={
                              crossError
                                ? {
                                    duration: 0.7,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }
                                : {}
                            }
                            className={`h-7 rounded-full border ${
                              !crossError && lampColor === "Merah"
                                ? "border-rose-200/70 bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,.55)]"
                                : crossError
                                  ? "border-rose-200/70 bg-rose-500"
                                  : "border-rose-300/30 bg-rose-500/20"
                            }`}
                          />
                          <motion.div
                            animate={
                              crossError
                                ? {
                                    opacity: [0.4, 1, 0.2, 1, 0, 1, 0.5],
                                    boxShadow: [
                                      "0_0_0px_rgba(180,83,9,0)",
                                      "0_0_15px_rgba(180,83,9,.6)",
                                      "0_0_0px_rgba(180,83,9,0)",
                                      "0_0_15px_rgba(180,83,9,.6)",
                                      "0_0_0px_rgba(180,83,9,0)",
                                      "0_0_15px_rgba(180,83,9,.6)",
                                      "0_0_5px_rgba(180,83,9,.3)",
                                    ],
                                  }
                                : {}
                            }
                            transition={
                              crossError
                                ? {
                                    duration: 0.6,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }
                                : {}
                            }
                            className={`mt-2 h-7 rounded-full border ${
                              crossError
                                ? "border-amber-400/70 bg-amber-400"
                                : "border-amber-300/30 bg-amber-400/15"
                            }`}
                          />
                          <motion.div
                            animate={
                              crossError
                                ? {
                                    opacity: [1, 0.2, 0.5, 1, 0, 1, 0.4, 1],
                                    boxShadow: [
                                      "0_0_20px_rgba(16,185,129,.55)",
                                      "0_0_0px_rgba(16,185,129,0)",
                                      "0_0_10px_rgba(16,185,129,.3)",
                                      "0_0_20px_rgba(16,185,129,.55)",
                                      "0_0_0px_rgba(16,185,129,0)",
                                      "0_0_20px_rgba(16,185,129,.55)",
                                      "0_0_5px_rgba(16,185,129,.2)",
                                      "0_0_20px_rgba(16,185,129,.55)",
                                    ],
                                  }
                                : {}
                            }
                            transition={
                              crossError
                                ? {
                                    duration: 0.8,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }
                                : {}
                            }
                            className={`mt-2 h-7 rounded-full border ${
                              !crossError && lampColor === "Hijau"
                                ? "border-emerald-200/70 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,.55)]"
                                : crossError
                                  ? "border-emerald-200/70 bg-emerald-500"
                                  : "border-emerald-300/30 bg-emerald-500/15"
                            }`}
                          />
                        </div>

                        <div className="absolute left-1/2 top-[116px] h-[90px] w-2 -translate-x-1/2 bg-slate-500/70" />

                        <div className="absolute bottom-8 left-1/2 h-14 w-[210px] -translate-x-1/2 rounded-lg border border-slate-600/80 bg-slate-900/85">
                          <div className="mt-2 grid grid-cols-7 gap-1 px-3">
                            {Array.from({ length: 14 }).map((_, idx) => (
                              <div
                                key={idx}
                                className="h-1.5 rounded-sm bg-slate-200/80"
                              />
                            ))}
                          </div>
                        </div>

                        <motion.div
                          animate={{
                            x: isCrossing ? 120 : -100,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 95,
                            damping: 16,
                          }}
                          className="absolute bottom-[52px] left-1/2 z-10 -translate-x-1/2"
                        >
                          <div className="relative h-12 w-8">
                            <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full border border-cyan-200/60 bg-cyan-200/90 shadow-[0_0_10px_rgba(34,211,238,.35)]" />
                            <div className="absolute left-1/2 top-[10px] h-5 w-[3px] -translate-x-1/2 rounded-full bg-cyan-100" />

                            <motion.div
                              className="absolute left-1/2 top-[13px] h-[2px] w-4 -translate-x-1/2 rounded-full bg-cyan-100"
                              animate={
                                isCrossing
                                  ? { rotate: [-16, 16, -16] }
                                  : { rotate: 0 }
                              }
                              transition={
                                isCrossing
                                  ? {
                                      duration: 0.55,
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                    }
                                  : { duration: 0.2 }
                              }
                            />

                            <motion.div
                              className="absolute left-[11px] top-[27px] h-5 w-[2px] origin-top rounded-full bg-cyan-100"
                              animate={
                                isCrossing
                                  ? { rotate: [22, -22, 22] }
                                  : { rotate: 8 }
                              }
                              transition={
                                isCrossing
                                  ? {
                                      duration: 0.45,
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                    }
                                  : { duration: 0.2 }
                              }
                            />
                            <motion.div
                              className="absolute left-[17px] top-[27px] h-5 w-[2px] origin-top rounded-full bg-cyan-100"
                              animate={
                                isCrossing
                                  ? { rotate: [-22, 22, -22] }
                                  : { rotate: -8 }
                              }
                              transition={
                                isCrossing
                                  ? {
                                      duration: 0.45,
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                    }
                                  : { duration: 0.2 }
                              }
                            />
                          </div>
                        </motion.div>
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
