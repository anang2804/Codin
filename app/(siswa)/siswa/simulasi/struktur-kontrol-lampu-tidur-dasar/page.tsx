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
  GripHorizontal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIMULASI_SLUG = "struktur-kontrol-lampu-tidur-dasar";

type CodeBlock = {
  id: string;
  content: string;
  category: "condition" | "statement" | "closing";
};

const AVAILABLE_BLOCKS: CodeBlock[] = [
  {
    id: "if-block",
    content: "if (sensorCahaya < batasGelap) {",
    category: "condition",
  },
  {
    id: "print-nyala-stmt",
    content: '    console.log("Lampu Tidur Nyala");',
    category: "statement",
  },
  {
    id: "close-else-block",
    content: "} else {",
    category: "closing",
  },
  {
    id: "print-mati-stmt",
    content: '    console.log("Lampu Tidur Mati");',
    category: "statement",
  },
  {
    id: "close-brace",
    content: "}",
    category: "closing",
  },
];

export default function StrukturKontrolLampuTidurDasarPage() {
  // Initialize with 5 empty slots for the required blocks
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
  const [lampuNyala, setLampuNyala] = useState(false);
  const [lampuRusak, setLampuRusak] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensorCahaya = 20;
  const batasGelap = 30;

  const codeLines = [
    `let sensorCahaya = ${sensorCahaya};`,
    `let batasGelap = ${batasGelap};`,
    "",
  ];

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
    setLampuNyala(false);
    setLampuRusak(false);
    setPlacedBlocks([null, null, null, null, null]);
    setFeedback("Sistem siap menjalankan simulasi.");
  };

  const executeStep = (index: number) => {
    const totalLines = 3 + placedBlocks.length; // 3 + 5 = 8

    if (index >= totalLines) {
      // Check if user placed all required blocks
      if (
        placedBlocks[0]?.id === "if-block" &&
        placedBlocks[1]?.id === "print-nyala-stmt" &&
        placedBlocks[2]?.id === "close-else-block" &&
        placedBlocks[3]?.id === "print-mati-stmt" &&
        placedBlocks[4]?.id === "close-brace"
      ) {
        setIsRunning(false);
        setActiveLine(-1);
        setShowSuccessCard(true);
        setFeedback(
          "Berhasil! Struktur kontrol if-else sudah lengkap dan benar!\n\nKarena sensorCahaya (20) < batasGelap (30), blok if dijalankan dan lampu tidur menyala.",
        );
        return;
      } else {
        setIsRunning(false);
        setActiveLine(3);
        setShowSuccessCard(false);
        setFeedback(
          "Simulasi selesai, tetapi struktur kontrol belum lengkap atau tidak tepat.\n\nPastikan semua blok ditambahkan dalam urutan yang benar: if → print nyala → } else { → print mati → }",
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
      // Should not reach here since totalLines is calculated correctly
      return;
    }

    const block = placedBlocks[blockIndex];

    // Skip null blocks (empty slots)
    if (block === null) {
      timerRef.current = setTimeout(() => executeStep(index + 1), 850);
      return;
    }

    setActiveLine(3 + blockIndex);

    if (blockIndex === 0) {
      // First block should be if condition
      if (block.id !== "if-block") {
        setIsRunning(false);
        setErrorLine(3 + blockIndex);
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
    } else if (blockIndex === 1) {
      // Second block should be the print nyala statement
      if (block.id !== "print-nyala-stmt") {
        setIsRunning(false);
        setErrorLine(3 + blockIndex);
        setFeedback(
          "Output statement belum tepat. Harus mencetak 'Lampu Tidur Nyala'.",
        );
        setLampuRusak(true);
        return;
      }
      setLampuNyala(true);
      setLampuRusak(false);
      setFeedback('Baris 5 benar.\n\nOutput dieksekusi: "Lampu Tidur Nyala".');
    } else if (blockIndex === 2) {
      // Third block should be closing else block
      if (block.id !== "close-else-block") {
        setIsRunning(false);
        setErrorLine(3 + blockIndex);
        setFeedback("Baris 6 belum tepat. Seharusnya } else {");
        return;
      }
      setFeedback(
        "Baris 6 benar.\n\nBlok if ditutup dan blok else dibuka dengan benar.",
      );
    } else if (blockIndex === 3) {
      // Fourth block should be print mati statement
      if (block.id !== "print-mati-stmt") {
        setIsRunning(false);
        setErrorLine(3 + blockIndex);
        setFeedback(
          "Output statement untuk else belum tepat. Harus mencetak 'Lampu Tidur Mati'.",
        );
        setLampuRusak(true);
        return;
      }
      setLampuNyala(false);
      setLampuRusak(false);
      setFeedback(
        'Baris 7 benar.\n\nOutput else dieksekusi: "Lampu Tidur Mati".',
      );
    } else if (blockIndex === 4) {
      // Fifth block should be closing brace
      if (block.id !== "close-brace") {
        setIsRunning(false);
        setErrorLine(3 + blockIndex);
        setFeedback("Penutup blok else belum tepat.");
        return;
      }
      setFeedback(
        "Baris 8 benar.\n\nBlok else ditutup dengan benar. Struktur kontrol lengkap!",
      );
    }

    timerRef.current = setTimeout(() => executeStep(index + 1), 850);
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
      // Replace the slot
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

  const lampuVisualNyala = lampuNyala && !lampuRusak;

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
                  💡 Ayo bantu lengkapi struktur kontrol di bawah ini dengan
                  drag & drop blok kode agar lampu menyala tepat ketika suasana
                  mulai redup.
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

          <AnimatePresence>
            {showSuccessCard && (
              <motion.section
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="absolute left-6 right-6 top-[180px] z-20 px-0 pb-0"
              >
                <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
                  <h3 className="text-sm font-black tracking-tight text-emerald-700">
                    Berhasil! Struktur kontrol sudah tepat
                  </h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                    Blok kode yang kamu susun sudah tepat. Kondisi bernilai
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
                            layoutId="lineHighlightLampuTidur"
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
                    {placedBlocks.length === 0 ? (
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDropOnEditor}
                        className="relative mt-1 min-h-[26px] border-2 border-dashed border-emerald-300 rounded-lg p-2 text-center text-[11px] text-emerald-600 transition-all hover:border-emerald-500 hover:bg-emerald-50"
                      >
                        ↓ Letakkan blok kode di sini
                      </div>
                    ) : (
                      <div className="relative mt-1 flex flex-col gap-1">
                        {placedBlocks.map((block, idx) => (
                          <div
                            key={`placed-${idx}`}
                            className="relative flex h-[26px] items-center group"
                          >
                            {activeLine === 3 + idx && (
                              <motion.div
                                layoutId="lineHighlightLampuTidur"
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
                    )}
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
