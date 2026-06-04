"use client";

import { useEffect, useRef, useState } from "react";
import { useSimulasiAttemptRecorder } from "@/lib/hooks/useSimulasiAttemptRecorder";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  MessageSquare,
  Play,
  RotateCcw,
  Terminal,
  GripHorizontal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIMULASI_SLUG = "struktur-kontrol-kirim-pesan-massal-dasar";

type CodeBlock = {
  id: string;
  content: string;
  category: "statement" | "condition" | "closing";
};

const AVAILABLE_BLOCKS: CodeBlock[] = [
  {
    id: "start-log",
    content: 'console.log("Mulai pengiriman...");',
    category: "statement",
  },
  {
    id: "for-loop",
    content: "for (let i = 1; i <= 3; i++) {",
    category: "condition",
  },
  {
    id: "loop-body",
    content: "    console.log(`Mengirim pesan ke-${i}`);",
    category: "statement",
  },
  {
    id: "loop-close",
    content: "}",
    category: "closing",
  },
  {
    id: "end-log",
    content: 'console.log("Semua Pesan Terkirim! ✨");',
    category: "statement",
  },
];

export default function StrukturKontrolKirimPesanMassalDasarPage() {
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
  const [messagesCount, setMessagesCount] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const codeLines = [`let i = 1;`, `let max = 3;`, ""];

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
    setMessagesCount(0);
    setVisibleMessages([]);
    setPlacedBlocks([null, null, null, null, null]);
    setFeedback("Sistem siap menjalankan simulasi.");
  };

  // Helper: find the first problematic slot index (null or wrong block)
  // Returns the EDITOR line index (3 + blockIndex) of the first bad slot,
  // or -1 if everything is correct.
  const findFirstBadLine = (blocks: (CodeBlock | null)[]): number => {
    const isFullSolution = blocks[0]?.id === "start-log";

    if (isFullSolution) {
      const expected = [
        "start-log",
        "for-loop",
        "loop-body",
        "loop-close",
        "end-log",
      ];
      for (let i = 0; i < expected.length; i++) {
        if (blocks[i] === null || blocks[i]?.id !== expected[i]) {
          return 3 + i;
        }
      }
    } else {
      // Simplified or mixed: check if first filled block defines the path
      const expected = ["for-loop", "loop-body", "loop-close", "end-log"];
      for (let i = 0; i < expected.length; i++) {
        if (blocks[i] === null || blocks[i]?.id !== expected[i]) {
          return 3 + i;
        }
      }
    }
    return -1;
  };

  const executeStep = (index: number) => {
    const totalLines = 3 + placedBlocks.length;

    if (index >= totalLines) {
      const fullSolution =
        placedBlocks[0]?.id === "start-log" &&
        placedBlocks[1]?.id === "for-loop" &&
        placedBlocks[2]?.id === "loop-body" &&
        placedBlocks[3]?.id === "loop-close" &&
        placedBlocks[4]?.id === "end-log";

      const simplifiedSolution =
        placedBlocks[0]?.id === "for-loop" &&
        placedBlocks[1]?.id === "loop-body" &&
        placedBlocks[2]?.id === "loop-close" &&
        placedBlocks[3]?.id === "end-log" &&
        placedBlocks[4] === null;

      if (fullSolution || simplifiedSolution) {
        setIsRunning(false);
        setActiveLine(-1);
        setShowSuccessCard(true);
        setFeedback(
          "Berhasil! Struktur for-loop sudah lengkap dan benar!\n\nPerintah dieksekusi dari atas ke bawah. Loop berjalan 3 kali, mengirim pesan di setiap iterasi.",
        );
        return;
      } else {
        setIsRunning(false);
        // Point to the first bad slot, not hardcoded line 4
        const badLine = findFirstBadLine(placedBlocks);
        setActiveLine(badLine);
        setErrorLine(badLine);
        setShowSuccessCard(false);
        setFeedback(
          "Simulasi selesai, namun struktur loop belum sempurna.\n\nCoba perhatikan urutan blok-blok yang sudah kamu susun. Apakah setiap bagian loop sudah berada di posisi yang tepat?",
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

    // Detect solution type
    const isFullSolution = placedBlocks[0]?.id === "start-log";

    if (isFullSolution) {
      // Full solution: start-log → for-loop → loop-body → loop-close → end-log
      if (blockIndex === 0) {
        if (block.id !== "start-log") {
          setIsRunning(false);
          setErrorLine(3 + blockIndex);
          setFeedback(
            "Baris 4 perlu diperiksa kembali.\n\nCoba pikirkan: apa yang sebaiknya dilakukan program sebelum loop dimulai?",
          );
          return;
        }
        const newOutput = [...consoleOutput, "Mulai pengiriman..."];
        setConsoleOutput(newOutput);
        setFeedback("Baris 4 benar.\n\nOutput: Mulai pengiriman...");
      } else if (blockIndex === 1) {
        if (block.id !== "for-loop") {
          setIsRunning(false);
          setErrorLine(3 + blockIndex);
          setFeedback(
            "Baris 5 perlu diperiksa kembali.\n\nPerhatikan: bagian mana dari struktur loop yang seharusnya ditulis pertama kali?",
          );
          return;
        }
        setFeedback("Baris 5 benar.\n\nLoop dimulai: i dari 1 hingga 3.");
      } else if (blockIndex === 2) {
        if (block.id !== "loop-body") {
          setIsRunning(false);
          setErrorLine(3 + blockIndex);
          setFeedback(
            "Baris 6 perlu diperiksa kembali.\n\nCoba pikirkan: apa yang harus dilakukan program di dalam loop setiap kali iterasi berjalan?",
          );
          return;
        }
        const messages: string[] = [];
        for (let i = 1; i <= 3; i++) {
          messages.push(`Mengirim pesan ke-${i}`);
        }
        const updatedOutput = [...consoleOutput, ...messages];
        setConsoleOutput(updatedOutput);
        setMessagesCount(3);
        setVisibleMessages([1, 2, 3]);
        setFeedback(
          "Baris 6 benar.\n\nLoop body dieksekusi 3 kali:\n- Mengirim pesan ke-1\n- Mengirim pesan ke-2\n- Mengirim pesan ke-3",
        );
      } else if (blockIndex === 3) {
        if (block.id !== "loop-close") {
          setIsRunning(false);
          setErrorLine(3 + blockIndex);
          setFeedback(
            "Baris 7 perlu diperiksa kembali.\n\nSetiap blok kode yang dibuka dengan '{' harus diakhiri dengan sesuatu. Kira-kira apa itu?",
          );
          return;
        }
        setFeedback("Baris 7 benar.\n\nLoop ditutup dengan baik.");
      } else if (blockIndex === 4) {
        if (block.id !== "end-log") {
          setIsRunning(false);
          setErrorLine(3 + blockIndex);
          setFeedback(
            "Baris 8 perlu diperiksa kembali.\n\nSetelah semua pengiriman selesai, apa yang sebaiknya ditampilkan program kepada pengguna?",
          );
          return;
        }
        setFeedback('Baris 8 benar.\n\nOutput: "Semua Pesan Terkirim! ✨"');
      }
    } else {
      // Simplified solution: for-loop → loop-body → loop-close → end-log
      if (blockIndex === 0) {
        if (block.id !== "for-loop") {
          setIsRunning(false);
          setErrorLine(3 + blockIndex);
          setFeedback(
            "Baris 4 perlu diperiksa kembali.\n\nPerhatikan: bagian mana dari struktur loop yang seharusnya ditulis pertama kali?",
          );
          return;
        }
        setFeedback("Baris 4 benar.\n\nLoop dimulai: i dari 1 hingga 3.");
      } else if (blockIndex === 1) {
        if (block.id !== "loop-body") {
          setIsRunning(false);
          setErrorLine(3 + blockIndex);
          setFeedback(
            "Baris 5 perlu diperiksa kembali.\n\nCoba pikirkan: apa yang harus dilakukan program di dalam loop setiap kali iterasi berjalan?",
          );
          return;
        }
        const messages: string[] = [];
        for (let i = 1; i <= 3; i++) {
          messages.push(`Mengirim pesan ke-${i}`);
        }
        const updatedOutput = [...consoleOutput, ...messages];
        setConsoleOutput(updatedOutput);
        setMessagesCount(3);
        setVisibleMessages([1, 2, 3]);
        setFeedback(
          "Baris 5 benar.\n\nLoop body dieksekusi 3 kali:\n- Mengirim pesan ke-1\n- Mengirim pesan ke-2\n- Mengirim pesan ke-3",
        );
      } else if (blockIndex === 2) {
        if (block.id !== "loop-close") {
          setIsRunning(false);
          setErrorLine(3 + blockIndex);
          setFeedback(
            "Baris 6 perlu diperiksa kembali.\n\nSetiap blok kode yang dibuka dengan '{' harus diakhiri dengan sesuatu. Kira-kira apa itu?",
          );
          return;
        }
        setFeedback("Baris 6 benar.\n\nLoop ditutup dengan baik.");
      } else if (blockIndex === 3) {
        if (block.id !== "end-log") {
          setIsRunning(false);
          setErrorLine(3 + blockIndex);
          setFeedback(
            "Baris 7 perlu diperiksa kembali.\n\nSetelah semua pengiriman selesai, apa yang sebaiknya ditampilkan program kepada pengguna?",
          );
          return;
        }
        setFeedback('Baris 7 benar.\n\nOutput: "Semua Pesan Terkirim! ✨"');
      }
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
    setMessagesCount(0);
    setVisibleMessages([]);
    setFeedback(
      "Memulai simulasi struktur kontrol for-loop...\n\nSistem membaca baris perintah dari atas ke bawah.",
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
      setFeedback(
        "Blok ditambahkan. Coba jalankan simulasi untuk memeriksa hasilnya!",
      );
    }
    setDraggedBlock(null);
  };

  const removeBlock = (index: number) => {
    const newBlocks = [...placedBlocks];
    newBlocks[index] = null;
    setPlacedBlocks(newBlocks);
    setFeedback("Blok dihapus. Slot kosong siap diisi kembali.");
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
        const strMatch = remaining.match(/^`[^`]*`|^"[^"]*"/);
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
                <MessageSquare size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                    Misi
                  </span>
                  <h2 className="text-[15px] font-black uppercase tracking-tight text-foreground">
                    Pengiriman Pesan Massal
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  📨 Lengkapi struktur for-loop di bawah ini dengan drag & drop
                  blok kode agar pesan dapat dikirim secara berulang sesuai
                  jumlah yang ditentukan.
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
                    Berhasil! Struktur for-loop sudah tepat
                  </h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                    Loop dijalankan 3 kali, mengirim pesan di setiap iterasi.
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="flex flex-1 gap-5 overflow-x-hidden overflow-y-auto px-6 pb-6">
            <section className="relative flex min-w-[500px] flex-1 flex-col overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm">
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
                          : errorLine === i
                            ? "scale-110 pr-1 font-black text-red-600"
                            : ""
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                <div className="relative flex-1 overflow-hidden bg-card">
                  <div className="absolute inset-0 z-10 overflow-y-auto whitespace-pre p-5 pt-5">
                    {codeLines.map((line, i) => (
                      <div
                        key={`static-${i}`}
                        className="relative flex h-[26px] items-center"
                      >
                        {activeLine === i && (
                          <motion.div
                            layoutId="lineHighlightKirimPesan"
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
                                layoutId="lineHighlightKirimPesan"
                                className={`absolute inset-0 -mx-5 -my-1 border-l-4 z-0 ${
                                  errorLine === 3 + idx
                                    ? "border-red-500 bg-red-50"
                                    : isRunning
                                      ? "border-emerald-500 bg-emerald-50"
                                      : "border-emerald-200 bg-emerald-50/30"
                                }`}
                              />
                            )}
                            {block === null ? (
                              <div
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDropOnEditor(e, idx)}
                                className={`relative z-10 w-full flex-1 h-[26px] border-2 border-dashed rounded text-center text-[10px] flex items-center justify-center transition-all ${
                                  errorLine === 3 + idx
                                    ? "border-red-400 bg-red-50 text-red-500"
                                    : "border-emerald-200 text-emerald-500 hover:border-emerald-400 hover:bg-emerald-50"
                                }`}
                              >
                                {errorLine === 3 + idx
                                  ? "⚠ Slot ini perlu diisi"
                                  : "↓ Drop di sini"}
                              </div>
                            ) : (
                              <div
                                className={`relative z-10 flex-1 font-bold text-slate-900 flex items-center justify-between ${
                                  errorLine === 3 + idx ? "text-red-700" : ""
                                }`}
                              >
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

            <aside className="relative flex w-[420px] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-[#0f0f1e] shadow-2xl">
              {/* Visual Panel */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-1.5 text-emerald-400">
                    <MessageSquare size={14} />
                  </div>
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    VISUAL PENGIRIMAN PESAN
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

              <div className="relative flex h-56 flex-col overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />

                <div className="relative z-10 flex flex-1 flex-col overflow-y-auto p-4 space-y-3">
                  {visibleMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center">
                      <div className="text-slate-500">
                        <MessageSquare
                          size={32}
                          className="mx-auto mb-2 opacity-20"
                        />
                        <p className="text-[10px] italic">
                          Menunggu pesan dikirim...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Header Chat */}
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg">
                          <span className="text-xs font-black text-white">
                            📱
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-slate-200">
                            Recipient
                          </p>
                          <p className="text-[9px] text-emerald-400">Online</p>
                        </div>
                      </div>

                      {/* Messages */}
                      {visibleMessages.map((msgNum, idx) => (
                        <motion.div
                          key={msgNum}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                            delay: idx * 0.15,
                          }}
                          className="flex justify-end gap-1 items-end"
                        >
                          {/* Message Bubble */}
                          <div className="max-w-[70%] group">
                            <div className="rounded-3xl rounded-tr-lg bg-gradient-to-br from-emerald-500 to-green-600 px-4 py-2 shadow-lg">
                              <p className="text-sm font-semibold text-white">
                                Pesan ke-{msgNum} ✓
                              </p>
                            </div>
                            <p className="text-[8px] text-slate-400 mt-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {new Date().toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>

                          {/* Status Indicator */}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.15 + 0.3 }}
                            className="text-emerald-400"
                          >
                            {msgNum ===
                              visibleMessages[visibleMessages.length - 1] &&
                            isRunning ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                              >
                                ⏱
                              </motion.div>
                            ) : (
                              <span>✓✓</span>
                            )}
                          </motion.div>
                        </motion.div>
                      ))}

                      {/* Completion Status */}
                      {messagesCount === 3 && !isRunning && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 }}
                          className="flex justify-center mt-3 pt-3 border-t border-slate-700"
                        >
                          <div className="rounded-full bg-gradient-to-r from-emerald-500/20 to-green-600/20 border border-emerald-400/50 px-4 py-2">
                            <p className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                              <span>✨</span> Semua Pesan Terkirim!
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Console Output Panel */}
              <div className="relative flex flex-1 flex-col overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,#1e293b_0%,#0f0f1e_62%)]" />
                <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(to_right,rgba(148,163,184,.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.2)_1px,transparent_1px)] [background-size:28px_28px]" />

                <div className="relative z-10 flex flex-1 flex-col gap-4 p-4 text-slate-100 overflow-y-auto">
                  <div className="space-y-2">
                    {consoleOutput.length === 0 ? (
                      <div className="text-[11px] text-slate-500 italic">
                        Output akan tampil di sini...
                      </div>
                    ) : (
                      <>
                        {consoleOutput.map((output, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="font-mono text-[10px] text-green-400 border-l-2 border-green-400/30 pl-3 py-0.5"
                          >
                            &gt; {output}
                          </motion.div>
                        ))}
                      </>
                    )}
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
