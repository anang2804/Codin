"use client";

import { useEffect, useRef, useState } from "react";
import { useSimulasiAttemptRecorder } from "@/lib/hooks/useSimulasiAttemptRecorder";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Droplet,
  Play,
  RotateCcw,
  Terminal,
  GripHorizontal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIMULASI_SLUG = "struktur-kontrol-pengisian-galon-air-dasar";

type CodeBlock = {
  id: string;
  content: string;
  category: "statement" | "condition" | "closing";
};

const AVAILABLE_BLOCKS: CodeBlock[] = [
  {
    id: "while-condition",
    content: "while (literSekarang < kapasitasMaks) {",
    category: "condition",
  },
  {
    id: "water-fill",
    content: "    console.log(`Mengisi... ${literSekarang} Liter`);",
    category: "statement",
  },
  {
    id: "water-increment",
    content: "    literSekarang++;",
    category: "statement",
  },
  {
    id: "while-close",
    content: "}",
    category: "closing",
  },
  {
    id: "water-complete",
    content: 'console.log("Galon Penuh!");',
    category: "statement",
  },
];

export default function StrukturKontrolPengisianGalonAirDasarPage() {
  const [placedBlocks, setPlacedBlocks] = useState<(CodeBlock | null)[]>([
    null,
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
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [waterLevel, setWaterLevel] = useState(0);
  const [visibleIterations, setVisibleIterations] = useState<number[]>([]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const codeLines = [`let literSekarang = 0;`, `let kapasitasMaks = 5;`, ""];

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
    setConsoleOutput([]);
    setWaterLevel(0);
    setVisibleIterations([]);
    setPlacedBlocks([null, null, null, null, null]);
    setFeedback("Sistem siap menjalankan simulasi.");
  };

  const executeStep = (index: number) => {
    const totalLines = 3 + placedBlocks.length;

    if (index >= totalLines) {
      const correctSolution =
        placedBlocks[0]?.id === "while-condition" &&
        placedBlocks[1]?.id === "water-fill" &&
        placedBlocks[2]?.id === "water-increment" &&
        placedBlocks[3]?.id === "while-close" &&
        placedBlocks[4]?.id === "water-complete";

      if (correctSolution) {
        setIsRunning(false);
        setActiveLine(-1);
        setShowSuccessCard(true);
        setFeedback(
          "Berhasil! Struktur while-loop sudah lengkap dan benar!\n\nGalon terisi penuh dalam 5 iterasi (0-4 Liter).",
        );
        return;
      } else {
        setIsRunning(false);
        setActiveLine(3);
        setShowSuccessCard(false);
        setFeedback(
          "Simulasi selesai, tetapi struktur while-loop belum lengkap atau tidak tepat.\n\nPastikan urutan: while → fill → increment → close → complete",
        );
        return;
      }
    }

    // Check first 3 lines (variable declarations)
    if (index < 3) {
      setActiveLine(index);
      setFeedback("Baris " + (index + 1) + " diproses: Deklarasi variabel.");
      timerRef.current = setTimeout(() => executeStep(index + 1), 700);
      return;
    }

    // Check placed blocks starting from line 3
    const blockIndex = index - 3;

    if (blockIndex >= placedBlocks.length) {
      return;
    }

    const block = placedBlocks[blockIndex];

    // Skip null blocks
    if (block === null) {
      timerRef.current = setTimeout(() => executeStep(index + 1), 850);
      return;
    }

    setActiveLine(3 + blockIndex);

    if (blockIndex === 0) {
      // While condition
      if (block.id !== "while-condition") {
        setIsRunning(false);
        setErrorLine(3 + blockIndex);
        setFeedback(
          "Baris 4 belum tepat.\n\nSeharusnya while-condition statement.",
        );
        return;
      }
      setFeedback("Baris 4 benar.\n\nLoop dimulai: saat literSekarang < 5.");
    } else if (blockIndex === 1) {
      // Water fill statement
      if (block.id !== "water-fill") {
        setIsRunning(false);
        setErrorLine(3 + blockIndex);
        setFeedback(
          "Baris 5 belum tepat.\n\nSeharusnya console.log mengisi air.",
        );
        return;
      }

      // Execute loop 5 times
      const iterations: number[] = [];
      const messages: string[] = [];
      for (let i = 0; i < 5; i++) {
        iterations.push(i);
        messages.push(`Mengisi... ${i} Liter`);
      }
      const updatedOutput = [...consoleOutput, ...messages];
      setConsoleOutput(updatedOutput);
      setWaterLevel(5);
      setVisibleIterations(iterations);
      setFeedback(
        "Baris 5 benar.\n\nLoop body dieksekusi 5 kali:\n- Mengisi... 0 Liter\n- Mengisi... 1 Liter\n- Mengisi... 2 Liter\n- Mengisi... 3 Liter\n- Mengisi... 4 Liter",
      );
    } else if (blockIndex === 2) {
      // Water increment
      if (block.id !== "water-increment") {
        setIsRunning(false);
        setErrorLine(3 + blockIndex);
        setFeedback(
          "Baris 6 belum tepat.\n\nSeharusnya literSekarang++ untuk increment.",
        );
        return;
      }
      setFeedback(
        "Baris 6 benar.\n\nVariabel literSekarang ditambah 1 setiap iterasi.",
      );
    } else if (blockIndex === 3) {
      // While close
      if (block.id !== "while-close") {
        setIsRunning(false);
        setErrorLine(3 + blockIndex);
        setFeedback("Baris 7 belum tepat.\n\nSeharusnya } untuk menutup loop.");
        return;
      }
      setFeedback("Baris 7 benar.\n\nLoop ditutup dengan baik.");
    } else if (blockIndex === 4) {
      // Water complete
      if (block.id !== "water-complete") {
        setIsRunning(false);
        setErrorLine(3 + blockIndex);
        setFeedback(
          "Baris 8 belum tepat.\n\nSeharusnya console.log pesan galon penuh.",
        );
        return;
      }
      setFeedback('Baris 8 benar.\n\nOutput: "Galon Penuh!"');
    }

    timerRef.current = setTimeout(() => executeStep(index + 1), 850);
  };

  const startRunning = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(true);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setConsoleOutput([]);
    setWaterLevel(0);
    setVisibleIterations([]);
    setFeedback(
      "Memulai simulasi struktur kontrol while-loop...\n\nSistem membaca baris perintah dari atas ke bawah.",
    );
    timerRef.current = setTimeout(() => executeStep(0), 250);
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

  // Syntax highlighting component with proper token parsing
  const SyntaxHighlight = ({ code }: { code: string }) => {
    if (!code) return <>{code}</>;

    const tokens: Array<{ text: string; type: string }> = [];
    let remaining = code;

    while (remaining.length > 0) {
      let matched = false;

      // Keywords
      const keywordMatch = remaining.match(
        /^(if|else|for|while|switch|case|return|new|class|public|private|static|final|System)\b/,
      );
      if (keywordMatch) {
        tokens.push({ text: keywordMatch[0], type: "keyword" });
        remaining = remaining.slice(keywordMatch[0].length);
        matched = true;
      }

      // Types
      if (!matched) {
        const typeMatch = remaining.match(
          /^(int|String|boolean|void|double|float|char|long|short)\b/,
        );
        if (typeMatch) {
          tokens.push({ text: typeMatch[0], type: "type" });
          remaining = remaining.slice(typeMatch[0].length);
          matched = true;
        }
      }

      // Numbers
      if (!matched) {
        const numMatch = remaining.match(/^\d+/);
        if (numMatch) {
          tokens.push({ text: numMatch[0], type: "number" });
          remaining = remaining.slice(numMatch[0].length);
          matched = true;
        }
      }

      // Strings
      if (!matched) {
        const strMatch = remaining.match(/^"[^"]*"/);
        if (strMatch) {
          tokens.push({ text: strMatch[0], type: "string" });
          remaining = remaining.slice(strMatch[0].length);
          matched = true;
        }
      }

      // Constants
      if (!matched) {
        const constMatch = remaining.match(/^(true|false|null)\b/);
        if (constMatch) {
          tokens.push({ text: constMatch[0], type: "constant" });
          remaining = remaining.slice(constMatch[0].length);
          matched = true;
        }
      }

      // Regular character
      if (!matched) {
        tokens.push({ text: remaining[0], type: "default" });
        remaining = remaining.slice(1);
      }
    }

    const getColor = (type: string) => {
      switch (type) {
        case "keyword":
          return "text-purple-500";
        case "type":
          return "text-blue-500";
        case "number":
          return "text-orange-500";
        case "string":
          return "text-green-600";
        case "constant":
          return "text-amber-600";
        default:
          return "";
      }
    };

    return (
      <>
        {tokens.map((token, idx) => (
          <span key={idx} className={getColor(token.type)}>
            {token.text}
          </span>
        ))}
      </>
    );
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
            <Droplet size={20} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black uppercase italic leading-none tracking-tighter">
              Pengisian Galon Air
            </h1>
            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[8px] font-bold uppercase italic tracking-widest text-emerald-600">
              while Loop
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={resetSim}
            className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-5 py-2.5 text-xs font-bold transition-all duration-200 hover:bg-emerald-50"
            disabled={isRunning}
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={startRunning}
            disabled={isRunning}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-all duration-200 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
          >
            <Play size={14} /> Jalankan
          </button>
          <button
            onClick={() => {
              markAsTried();
            }}
            disabled={isSavingCompletion}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 disabled:opacity-50 ${
              hasTried
                ? "border-2 border-emerald-300 bg-emerald-100 text-emerald-800"
                : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 size={14} /> {hasTried ? "Selesai" : "Selesaikan"}
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <aside className="z-20 flex w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r border-emerald-100 bg-white/85 p-5 backdrop-blur">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-600/70" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Blok Kode Tersedia
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
                <Droplet size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                    Misi
                  </span>
                  <h2 className="text-[15px] font-black uppercase tracking-tight text-foreground">
                    Pengisian Galon Air Otomatis
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  💧 Ayo bantu lengkapi struktur while-loop di bawah ini dengan
                  drag & drop blok kode agar galon dapat terisi penuh secara
                  otomatis.
                </p>
              </div>
            </div>
          </section>

          <div
            className={`mx-6 mb-4 rounded-2xl border p-3 transition-all ${
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
                  <div className="absolute inset-0 z-10 overflow-y-auto whitespace-pre p-5 pt-5">
                    {/* Static lines */}
                    {codeLines.map((line, i) => (
                      <div
                        key={`static-${i}`}
                        className="relative flex h-[26px] items-center"
                      >
                        {activeLine === i && (
                          <motion.div
                            layoutId="lineHighlightGalonAir"
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
                          {activeLine === 3 + idx && (
                            <motion.div
                              layoutId="lineHighlightGalonAir"
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
                    VISUAL PENGISIAN GALON
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
                  {/* Water Gallon Visualization */}
                  <div className="flex flex-col items-center gap-3 w-full">
                    <p className="text-xs font-bold text-slate-300">
                      Kapasitas: 5L
                    </p>

                    {/* Galon Container */}
                    <motion.div className="relative w-24 h-40 rounded-b-3xl rounded-t-lg border-2 border-emerald-400/60 bg-slate-900/60 overflow-hidden shadow-2xl">
                      {/* Water Level Fill */}
                      <motion.div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-emerald-300 transition-all duration-500"
                        style={{
                          height: `${(waterLevel / 5) * 100}%`,
                        }}
                        animate={{
                          height: `${(waterLevel / 5) * 100}%`,
                        }}
                        transition={{ duration: 0.6 }}
                      />

                      {/* Water Level Markers */}
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className="absolute left-0 right-0 border-t border-emerald-400/30 text-[8px] text-emerald-300 px-1"
                          style={{
                            top: `${100 - (level / 5) * 100}%`,
                          }}
                        >
                          {level}L
                        </div>
                      ))}

                      {/* Shine Effect */}
                      {waterLevel > 0 && (
                        <motion.div
                          className="absolute top-0 left-2 w-1 bg-white/20 rounded-full opacity-60"
                          style={{ height: `${(waterLevel / 5) * 100}%` }}
                          animate={{ opacity: [0.3, 0.8, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.div>

                    {/* Water Level Display */}
                    <motion.div className="text-center">
                      <p className="text-sm font-black text-emerald-400">
                        {waterLevel.toFixed(1)}L / 5L
                      </p>
                      {waterLevel >= 5 && (
                        <motion.p
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-xs font-bold text-emerald-300 mt-2"
                        >
                          ✨ Galon Penuh!
                        </motion.p>
                      )}
                    </motion.div>
                  </div>

                  {/* Iterations Counter */}
                  {visibleIterations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-1 flex-wrap justify-center"
                    >
                      {visibleIterations.map((iter) => (
                        <motion.div
                          key={iter}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="rounded-full bg-emerald-500/30 border border-emerald-400 px-2 py-1 text-[9px] font-bold text-emerald-300"
                        >
                          Iter {iter}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
