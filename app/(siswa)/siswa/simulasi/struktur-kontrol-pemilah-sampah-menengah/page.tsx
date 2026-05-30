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
  GripHorizontal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIMULASI_SLUG = "struktur-kontrol-pemilah-sampah-menengah";

type CodeBlock = {
  id: string;
  content: string;
  category: "condition" | "statement" | "closing";
};

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

const AVAILABLE_BLOCKS: CodeBlock[] = [
  {
    id: "for-loop",
    content: "for (let b = 0; b < 3; b++) {",
    category: "condition",
  },
  {
    id: "if-condition",
    content: '    if (jenisBenda[b] == "Daun") {',
    category: "condition",
  },
  {
    id: "console-log-organik",
    content: '        console.log("Benda " + b + ": Masuk ORGANIK");',
    category: "statement",
  },
  {
    id: "else-block",
    content: "    } else {",
    category: "closing",
  },
  {
    id: "console-log-non-organik",
    content: '        console.log("Benda " + b + ": Masuk NON-ORGANIK");',
    category: "statement",
  },
  {
    id: "close-brace",
    content: "    }",
    category: "closing",
  },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function StrukturKontrolPemilahSampahMenengahPage() {
  // Initialize with 6 empty slots for the required blocks
  const [placedBlocks, setPlacedBlocks] = useState<(CodeBlock | null)[]>([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
  const [draggedBlock, setDraggedBlock] = useState<CodeBlock | null>(null);
  const [shuffledBlocks, setShuffledBlocks] = useState<CodeBlock[]>([]);
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

  const codeLines = [`let jenisBenda = ["Daun", "botol", "kaleng"];`, ""];

  useEffect(() => {
    // Shuffle blocks on component mount
    setShuffledBlocks(shuffleArray(AVAILABLE_BLOCKS));
  }, []);

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
    resetVisualState();
    setPlacedBlocks([null, null, null, null, null, null]);
    setFeedback("Sistem siap menjalankan simulasi.");
  };

  const processItem = (index: number) => {
    if (index >= ITEMS.length) {
      setCurrentItem(null);
      setCurrentIndex(-1);
      setActiveLine(-1);
      setIsRunning(false);
      setShowSuccessCard(true);
      setFeedback(
        "✨ Berhasil! Semua benda (3/3) berhasil dipilah sesuai jenisnya.\n\n🍃 Daun → Tong ORGANIK\n🧴 Botol → Tong NON-ORGANIK\n🥫 Kaleng → Tong NON-ORGANIK",
      );
      return;
    }

    setIsRunning(true);
    const item = ITEMS[index];
    const isOrganik = item.kind === "ORGANIK";

    setCurrentItem(item);
    setCurrentIndex(index);
    setItemX(0);
    setItemY(-58);
    setActiveLine(2 + index); // Show which iteration we're in
    setFeedback(`[Iterasi ${index}] Ambil benda: ${item.emoji} ${item.name}`);

    timerRef.current = setTimeout(() => {
      setActiveLine(3 + index);
      setFeedback(
        `[Iterasi ${index}] Cek: Apakah ${item.name} = "Daun"? ${isOrganik ? "✓ Ya → ORGANIK" : "✗ Tidak → NON-ORGANIK"}`,
      );

      timerRef.current = setTimeout(() => {
        if (isOrganik) {
          setItemX(-74);
          setItemY(34);
          setFeedback(
            `[Iterasi ${index}] ${item.emoji} ${item.name} bergerak ke tong ORGANIK...`,
          );

          timerRef.current = setTimeout(() => {
            setItemY(56);
            setOrganikCount((prev) => prev + 1);

            timerRef.current = setTimeout(() => {
              setCurrentItem(null);
              processItem(index + 1);
            }, 420);
          }, 460);
          return;
        }

        setItemX(74);
        setItemY(34);
        setFeedback(
          `[Iterasi ${index}] ${item.emoji} ${item.name} bergerak ke tong NON-ORGANIK...`,
        );

        timerRef.current = setTimeout(() => {
          setItemY(56);
          setNonOrganikCount((prev) => prev + 1);

          timerRef.current = setTimeout(() => {
            setCurrentItem(null);
            processItem(index + 1);
          }, 420);
        }, 460);
      }, 520);
    }, 420);
  };

  const executeStep = (index: number) => {
    const totalLines = 2 + placedBlocks.length; // 2 static lines + 6 placed blocks = 8

    if (index >= totalLines) {
      // Check if solution is correct
      if (
        placedBlocks[0]?.id === "for-loop" &&
        placedBlocks[1]?.id === "if-condition" &&
        placedBlocks[2]?.id === "console-log-organik" &&
        placedBlocks[3]?.id === "else-block" &&
        placedBlocks[4]?.id === "console-log-non-organik" &&
        placedBlocks[5]?.id === "close-brace"
      ) {
        setActiveLine(-1);
        setFeedback(
          "✓ Berhasil! Struktur kontrol sudah tepat.\n\nMemulai pemilahan sampah...",
        );
        setTimeout(() => {
          processItem(0);
        }, 800);
        return;
      } else {
        setIsRunning(false);
        setActiveLine(2);
        setShowSuccessCard(false);
        setFeedback(
          "❌ Simulasi selesai, tetapi URUTAN BLOK TIDAK SESUAI!\n\nPastikan urutan: for → if → console.log → } else { → console.log → }",
        );
        return;
      }
    }

    // Process static lines (baris 1-2)
    if (index < 2) {
      setActiveLine(index);
      setFeedback("Baris " + (index + 1) + " diproses: Deklarasi variabel.");
      timerRef.current = setTimeout(() => executeStep(index + 1), 700);
      return;
    }

    // Process placed blocks (baris 3-8)
    const blockIndex = index - 2;

    if (blockIndex >= placedBlocks.length) {
      return;
    }

    const block = placedBlocks[blockIndex];

    // SKIP null blocks - don't stop, continue to next
    if (block === null) {
      timerRef.current = setTimeout(() => executeStep(index + 1), 850);
      return;
    }

    setActiveLine(2 + blockIndex);

    if (blockIndex === 0) {
      if (block.id !== "for-loop") {
        setIsRunning(false);
        setErrorLine(2 + blockIndex);
        setFeedback(
          `❌ Baris 3 SALAH!\n\nDitemukan: "${block.content}"\n\nSeharusnya: for-loop statement`,
        );
        return;
      }
      setFeedback("✓ Baris 3 benar.\n\nLoop dimulai: b dari 0 hingga 2.");
    } else if (blockIndex === 1) {
      if (block.id !== "if-condition") {
        setIsRunning(false);
        setErrorLine(2 + blockIndex);
        setFeedback(
          `❌ Baris 4 SALAH!\n\nDitemukan: "${block.content}"\n\nSeharusnya: if-condition statement`,
        );
        return;
      }
      setFeedback(
        '✓ Baris 4 benar.\n\nKondisi "apakah benda adalah Daun?" sudah disiapkan.',
      );
    } else if (blockIndex === 2) {
      if (block.id !== "console-log-organik") {
        setIsRunning(false);
        setErrorLine(2 + blockIndex);
        setFeedback(
          `❌ Baris 5 SALAH!\n\nDitemukan: "${block.content}"\n\nSeharusnya: console.log untuk ORGANIK`,
        );
        return;
      }
      setFeedback("✓ Baris 5 benar.\n\nCetak pesan untuk benda ORGANIK.");
    } else if (blockIndex === 3) {
      if (block.id !== "else-block") {
        setIsRunning(false);
        setErrorLine(2 + blockIndex);
        setFeedback(
          `❌ Baris 6 SALAH!\n\nDitemukan: "${block.content}"\n\nSeharusnya: } else {`,
        );
        return;
      }
      setFeedback("✓ Baris 6 benar.\n\nBlok if ditutup dan blok else dibuka.");
    } else if (blockIndex === 4) {
      if (block.id !== "console-log-non-organik") {
        setIsRunning(false);
        setErrorLine(2 + blockIndex);
        setFeedback(
          `❌ Baris 7 SALAH!\n\nDitemukan: "${block.content}"\n\nSeharusnya: console.log untuk NON-ORGANIK`,
        );
        return;
      }
      setFeedback(
        "✓ Baris 7 benar.\n\nCetak pesan untuk benda NON-ORGANIK.",
      );
    } else if (blockIndex === 5) {
      if (block.id !== "close-brace") {
        setIsRunning(false);
        setErrorLine(2 + blockIndex);
        setFeedback(
          `❌ Baris 8 SALAH!\n\nDitemukan: "${block.content}"\n\nSeharusnya: } untuk menutup blok`,
        );
        return;
      }
      setFeedback("✓ Baris 8 benar.\n\nStruktur kontrol sudah lengkap!");
    }

    timerRef.current = setTimeout(() => executeStep(index + 1), 850);
  };

  const startRunning = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setIsRunning(true);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    resetVisualState();
    setFeedback(
      "Memulai simulasi pemilah sampah...\n\nSistem membaca baris kode dari atas ke bawah.\n\n(Hanya blok yang terisi yang dijalankan)",
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

  const SyntaxHighlight = ({ code }: { code: string }) => {
    if (!code) return <>{code}</>;

    const tokens: Array<{ text: string; type: string }> = [];
    let remaining = code;

    while (remaining.length > 0) {
      let matched = false;

      const keywordMatch = remaining.match(
        /^(if|else|for|while|switch|case|return|new|class|public|private|static|final|let|const|var)\b/,
      );
      if (keywordMatch) {
        tokens.push({ text: keywordMatch[0], type: "keyword" });
        remaining = remaining.slice(keywordMatch[0].length);
        matched = true;
      }

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

      if (!matched) {
        const numMatch = remaining.match(/^\d+/);
        if (numMatch) {
          tokens.push({ text: numMatch[0], type: "number" });
          remaining = remaining.slice(numMatch[0].length);
          matched = true;
        }
      }

      if (!matched) {
        const strMatch = remaining.match(/^"[^"]*"/);
        if (strMatch) {
          tokens.push({ text: strMatch[0], type: "string" });
          remaining = remaining.slice(strMatch[0].length);
          matched = true;
        }
      }

      if (!matched) {
        const constMatch = remaining.match(/^(true|false|null)\b/);
        if (constMatch) {
          tokens.push({ text: constMatch[0], type: "constant" });
          remaining = remaining.slice(constMatch[0].length);
          matched = true;
        }
      }

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
              Blok Tersedia
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            {shuffledBlocks.map((block) => (
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
                    Pemilah Sampah
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  💡 Ayo lengkapi struktur kontrol dengan drag & drop blok kode
                  agar sistem dapat memilah benda ke tong organik dan
                  non-organik sesuai jenisnya.
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
                className="absolute left-6 right-6 top-[180px] z-20 px-0 pb-0"
              >
                <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
                  <h3 className="text-sm font-black tracking-tight text-emerald-700">
                    Berhasil! Struktur kontrol sudah tepat
                  </h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                    Blok kode yang kamu susun sudah tepat. Semua benda siap
                    dipilah ke tong yang sesuai.
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
                    Algoritma dan Pemrograman (Drag & Drop)
                  </span>
                </div>
              </div>

              <div className="relative flex flex-1 overflow-hidden font-mono text-[13px] leading-[26px]">
                <div className="w-12 shrink-0 select-none overflow-hidden border-r border-border bg-muted/30 pt-5 pr-4 text-right text-muted-foreground">
                  {Array.from({ length: 8 }).map((_, i) => (
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
                            layoutId="lineHighlightPemilahSampah"
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

                    {/* Placed blocks or drop zones */}
                    <div className="relative mt-1 flex flex-col gap-1">
                      {placedBlocks.map((block, idx) => (
                        <div
                          key={`placed-${idx}`}
                          className="relative flex h-[26px] items-center group"
                        >
                          {activeLine === 2 + idx && (
                            <motion.div
                              layoutId="lineHighlightPemilahSampah"
                              className={`absolute inset-0 -mx-5 -my-1 border-l-4 z-0 ${
                                isRunning
                                  ? "border-emerald-500 bg-emerald-50"
                                  : "border-emerald-200 bg-emerald-50/30"
                              }`}
                            />
                          )}
                          {errorLine === 2 + idx && (
                            <motion.div
                              layoutId="lineErrorHighlightPemilahSampah"
                              className="absolute inset-0 -mx-5 -my-1 z-0 border-l-4 border-rose-500 bg-rose-50/50"
                              animate={{ opacity: [0.4, 0.8, 0.4] }}
                              transition={{ duration: 0.6, repeat: Infinity }}
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
                    <Recycle size={14} />
                  </div>
                  <div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                      Stasiun Pemilah Sampah
                    </h2>
                    <p className="text-[8px] text-slate-400">
                      Organik: {organikCount}/1 | Non-Organik: {nonOrganikCount}
                      /2
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    isRunning
                      ? "bg-emerald-500 text-white animate-pulse"
                      : errorLine !== -1
                        ? "bg-rose-500 text-white"
                        : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {isRunning
                    ? "▶ RUNNING"
                    : errorLine !== -1
                      ? "⚠ ERROR"
                      : "⏸ IDLE"}
                </span>
              </div>

              <div className="relative flex flex-1 flex-col overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,.15),#020617_58%)]" />

                <div className="relative z-10 flex flex-1 flex-col gap-3 p-6 text-slate-100">
                  {/* Sorting Arena */}
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-5">
                    <div className="flex h-80 flex-col items-center justify-start overflow-hidden rounded-xl border-2 bg-gradient-to-b from-slate-800/50 to-slate-900/70 p-4 relative"
                      style={{
                        borderColor: errorLine !== -1 ? "#ef4444" : "#475569",
                      }}>
                      {/* Conveyor belt effect */}
                      <div className="absolute inset-0 opacity-10 [background-image:repeating-linear-gradient(90deg,transparent,transparent_10px,rgba(52,211,153,.2)_10px,rgba(52,211,153,.2)_20px)]" />

                      {/* Error flash */}
                      {errorLine !== -1 && (
                        <motion.div
                          className="absolute inset-0 rounded-lg bg-red-500/20"
                          animate={{ opacity: [0, 0.5, 0] }}
                          transition={{ duration: 0.4, repeat: 3 }}
                        />
                      )}

                      {/* Status text */}
                      <div className="absolute top-3 left-0 right-0 text-center text-[10px] font-bold z-20"
                        style={{
                          color: errorLine !== -1 ? "#ef4444" : "#06b6d4",
                        }}>
                        {errorLine !== -1
                          ? "❌ ERROR - Cek urutan blok kode!"
                          : isRunning
                            ? currentIndex >= 0
                              ? `▼ Benda ${currentIndex + 1}: ${ITEMS[currentIndex]?.emoji} ${ITEMS[currentIndex]?.name}`
                              : "Siap..."
                            : "Menunggu eksekusi..."}
                      </div>

                      {/* Item falling animation */}
                      {currentItem && (
                        <motion.div
                          animate={{
                            x: itemX,
                            y: itemY,
                            opacity: 1,
                            scale: 1,
                          }}
                          transition={{
                            x: {
                              type: "spring",
                              stiffness: 140,
                              damping: 18,
                            },
                            y: {
                              type: "spring",
                              stiffness: 80,
                              damping: 14,
                            },
                          }}
                          className="absolute left-1/2 top-12 z-30 -translate-x-1/2"
                        >
                          <motion.div
                            animate={{ rotate: isRunning ? 360 : 0 }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 bg-gradient-to-br ${currentItem.tint} text-4xl shadow-lg border-white/40`}
                          >
                            {currentItem.emoji}
                          </motion.div>
                        </motion.div>
                      )}

                      {/* Bins at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-3 px-3 pb-3 h-40">
                        {/* Organik Bin */}
                        <div className="flex flex-1 flex-col items-center">
                          <motion.div
                            className="relative flex h-32 w-full flex-col items-center justify-end rounded-t-3xl rounded-b-lg border-2 border-lime-400/70 bg-gradient-to-b from-lime-500/25 to-emerald-700/40 shadow-lg overflow-hidden"
                            animate={
                              errorLine !== -1
                                ? {
                                    x: [-4, 4, -4, 4, -2, 2, -1, 1, 0],
                                    borderColor: [
                                      "rgba(163, 230, 53, 0.7)",
                                      "rgba(239, 68, 68, 0.8)",
                                      "rgba(239, 68, 68, 0.8)",
                                      "rgba(163, 230, 53, 0.7)",
                                    ],
                                  }
                                : organikCount > 0
                                  ? {
                                      borderColor: [
                                        "rgba(163, 230, 53, 0.7)",
                                        "rgba(34, 197, 94, 0.7)",
                                      ],
                                    }
                                  : {}
                            }
                            transition={
                              errorLine !== -1
                                ? { duration: 0.4 }
                                : { duration: 0.8, repeat: Infinity }
                            }
                          >
                            {/* Trash inside bin */}
                            {organikCount > 0 && (
                              <div className="absolute bottom-2 left-1/2 text-2xl -translate-x-1/2 flex flex-wrap justify-center gap-1 w-full px-1">
                                {Array(organikCount)
                                  .fill("🍃")
                                  .map((emoji, i) => (
                                    <motion.span
                                      key={i}
                                      animate={{ y: [0, -2, 0] }}
                                      transition={{
                                        duration: 0.4,
                                        delay: i * 0.05,
                                        repeat: Infinity,
                                      }}
                                    >
                                      {emoji}
                                    </motion.span>
                                  ))}
                              </div>
                            )}
                            <div className="absolute top-2 flex items-center gap-1 text-[9px] font-black uppercase text-lime-200">
                              <Leaf size={12} /> ORGANIK
                            </div>
                            <div className="text-2xl font-black text-lime-100 mt-auto mb-2">
                              {organikCount}
                            </div>
                          </motion.div>
                        </div>

                        {/* Non-Organik Bin */}
                        <div className="flex flex-1 flex-col items-center">
                          <motion.div
                            className="relative flex h-32 w-full flex-col items-center justify-end rounded-t-3xl rounded-b-lg border-2 border-sky-400/70 bg-gradient-to-b from-sky-500/25 to-cyan-700/40 shadow-lg overflow-hidden"
                            animate={
                              errorLine !== -1
                                ? {
                                    x: [-4, 4, -4, 4, -2, 2, -1, 1, 0],
                                    borderColor: [
                                      "rgba(56, 189, 248, 0.7)",
                                      "rgba(239, 68, 68, 0.8)",
                                      "rgba(239, 68, 68, 0.8)",
                                      "rgba(56, 189, 248, 0.7)",
                                    ],
                                  }
                                : nonOrganikCount > 0
                                  ? {
                                      borderColor: [
                                        "rgba(56, 189, 248, 0.7)",
                                        "rgba(34, 211, 238, 0.7)",
                                      ],
                                    }
                                  : {}
                            }
                            transition={
                              errorLine !== -1
                                ? { duration: 0.4 }
                                : { duration: 0.8, repeat: Infinity }
                            }
                          >
                            {/* Trash inside bin */}
                            {nonOrganikCount > 0 && (
                              <div className="absolute bottom-2 left-1/2 text-2xl -translate-x-1/2 flex flex-wrap justify-center gap-1 w-full px-1">
                                {Array(nonOrganikCount)
                                  .fill(null)
                                  .map((_, i) => {
                                    const emojis = ["🧴", "🥫"];
                                    return (
                                      <motion.span
                                        key={i}
                                        animate={{ y: [0, -2, 0] }}
                                        transition={{
                                          duration: 0.4,
                                          delay: i * 0.05,
                                          repeat: Infinity,
                                        }}
                                      >
                                        {emojis[i % 2]}
                                      </motion.span>
                                    );
                                  })}
                              </div>
                            )}
                            <div className="absolute top-2 flex items-center gap-1 text-[9px] font-black uppercase text-sky-200">
                              <Trash2 size={12} /> NON-ORG
                            </div>
                            <div className="text-2xl font-black text-sky-100 mt-auto mb-2">
                              {nonOrganikCount}
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                    <div className="mb-2 flex items-center justify-between text-[9px] font-bold text-slate-300">
                      <span>Progress</span>
                      <span className="text-emerald-400">
                        {organikCount + nonOrganikCount}/3 Selesai
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                        animate={{
                          width: `${((organikCount + nonOrganikCount) / 3) * 100}%`,
                        }}
                        transition={{ duration: 0.5 }}
                      />
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
