"use client";

import { useEffect, useRef, useState } from "react";
import { useSimulasiAttemptRecorder } from "@/lib/hooks/useSimulasiAttemptRecorder";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lock,
  Lightbulb,
  Play,
  RotateCcw,
  Terminal,
  GripHorizontal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIMULASI_SLUG = "struktur-kontrol-pintu-otomatis-lanjutan";

type CodeBlock = {
  id: string;
  content: string;
  category: "condition" | "statement" | "closing";
};

const AVAILABLE_BLOCKS: CodeBlock[] = [
  {
    id: "for-loop",
    content: "for (let i = 0; i < 4; i++) {",
    category: "condition",
  },
  {
    id: "if-condition",
    content: "  if (sensorJarak[i] < 50) {",
    category: "condition",
  },
  {
    id: "console-log-dekat",
    content: "    console.log(`Sensor ${i+1}: Orang Dekat -> PINTU BUKA`);",
    category: "statement",
  },
  {
    id: "increment-total",
    content: "    totalAksi++;",
    category: "statement",
  },
  {
    id: "else-block",
    content: "  } else {",
    category: "closing",
  },
  {
    id: "console-log-kosong",
    content: "    console.log(`Sensor ${i+1}: Area Kosong -> PINTU TUTUP`);",
    category: "statement",
  },
  {
    id: "close-brace",
    content: "  }",
    category: "closing",
  },
  {
    id: "console-log-total",
    content:
      "  console.log(`Total aktivitas sensor hari ini: ${totalAksi} kali.`);",
    category: "statement",
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

const SENSOR_DATA = [
  { id: 0, jarak: 150, nama: "Sensor 1" },
  { id: 1, jarak: 30, nama: "Sensor 2" },
  { id: 2, jarak: 25, nama: "Sensor 3" },
  { id: 3, jarak: 200, nama: "Sensor 4" },
];
const THRESHOLD = 50;

const SyntaxHighlight = ({ code }: { code: string }) => {
  const tokens = code
    .split(/(\{|\}|\(|\)|;|=|<|>|"[^"]*"|\b\w+\b)/g)
    .filter(Boolean);

  return (
    <>
      {tokens.map((token, i) => {
        if (["for", "if", "else", "int"].includes(token))
          return (
            <span key={i} className="text-purple-600">
              {token}
            </span>
          );
        if (["{", "}", "(", ")", ";", "=", "<", ">"].includes(token))
          return (
            <span key={i} className="text-slate-500">
              {token}
            </span>
          );
        if (token.startsWith('"') && token.endsWith('"'))
          return (
            <span key={i} className="text-emerald-600">
              {token}
            </span>
          );
        if (token.match(/^\d+$/))
          return (
            <span key={i} className="text-orange-500">
              {token}
            </span>
          );
        return (
          <span key={i} className="text-slate-900">
            {token}
          </span>
        );
      })}
    </>
  );
};

export default function StrukturKontrolPintuOtomatisLanjutanPage() {
  const [placedBlocks, setPlacedBlocks] = useState<(CodeBlock | null)[]>([
    null,
    null,
    null,
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
  const [errorLine, setErrorLine] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [feedback, setFeedback] = useState("Sistem siap menjalankan simulasi.");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Visualization states
  const [currentSensorIndex, setCurrentSensorIndex] = useState(-1);
  const [doorOpen, setDoorOpen] = useState(false);
  const [doorAction, setDoorAction] = useState<"buka" | "tutup" | null>(null);
  const [bukaSensorCount, setBukaSensorCount] = useState(0);
  const [tutupSensorCount, setTutupSensorCount] = useState(0);
  const [processedSensors, setProcessedSensors] = useState<number[]>([]);
  const [isErrorAnimating, setIsErrorAnimating] = useState(false);

  useSimulasiAttemptRecorder({
    simulasiSlug: SIMULASI_SLUG,
    isRunning,
    isSuccess: showSuccessCard,
  });

  useEffect(() => {
    setShuffledBlocks(shuffleArray(AVAILABLE_BLOCKS));

    let isActive = true;
    const fetchCompletionStatus = async () => {
      try {
        const response = await fetch(
          `/api/siswa/simulasi/check-completed?simulasi_slug=${SIMULASI_SLUG}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const data = (await response.json()) as { completed?: boolean };
        if (isActive && data.completed) {
          setFeedback("✓ Simulasi sudah selesai sebelumnya.");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchCompletionStatus();
    return () => {
      isActive = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const resetVisualState = () => {
    setCurrentSensorIndex(-1);
    setDoorOpen(false);
    setDoorAction(null);
    setBukaSensorCount(0);
    setTutupSensorCount(0);
    setProcessedSensors([]);
    setIsErrorAnimating(false);
  };

  const processSensor = (sensorIdx: number) => {
    setIsRunning(true);

    if (sensorIdx >= SENSOR_DATA.length) {
      setIsRunning(false);
      setCurrentSensorIndex(-1);
      setShowSuccessCard(true);
      setFeedback(
        `Berhasil! Semua sensor diproses.\n\n🔓 PINTU BUKA: ${bukaSensorCount}x\n🔒 PINTU TUTUP: ${tutupSensorCount}x`,
      );
      markAsTried();
      return;
    }

    const sensor = SENSOR_DATA[sensorIdx];
    const isNear = sensor.jarak < THRESHOLD;

    setCurrentSensorIndex(sensorIdx);
    setDoorAction(null);

    setTimeout(() => {
      setDoorAction(isNear ? "buka" : "tutup");
      setDoorOpen(isNear);

      if (isNear) {
        setBukaSensorCount((c) => c + 1);
      } else {
        setTutupSensorCount((c) => c + 1);
      }

      setProcessedSensors((prev) => [...prev, sensorIdx]);
    }, 500);

    setTimeout(() => {
      processSensor(sensorIdx + 1);
    }, 1400);
  };

  const markAsTried = async () => {
    try {
      await fetch("/api/siswa/simulasi/mark-completed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulasi_slug: SIMULASI_SLUG }),
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const executeStep = (index: number) => {
    const totalLines = 2 + placedBlocks.length;

    if (index >= totalLines) {
      if (
        placedBlocks[0]?.id === "for-loop" &&
        placedBlocks[1]?.id === "if-condition" &&
        placedBlocks[2]?.id === "console-log-dekat" &&
        placedBlocks[3]?.id === "increment-total" &&
        placedBlocks[4]?.id === "else-block" &&
        placedBlocks[5]?.id === "console-log-kosong" &&
        placedBlocks[6]?.id === "close-brace" &&
        placedBlocks[7]?.id === "close-brace" &&
        placedBlocks[8]?.id === "console-log-total"
      ) {
        setActiveLine(-1);
        setFeedback("Struktur kontrol sudah tepat. Mulai pengujian sensor...");
        setTimeout(() => {
          processSensor(0);
        }, 800);
        return;
      } else {
        setIsRunning(false);
        setActiveLine(2);
        setShowSuccessCard(false);
        setFeedback(
          "Simulasi selesai, tetapi urutan blok belum sesuai.\n\nPastikan urutan: for → if → console(Dekat) → totalAksi++ → } else { → console(Kosong) → } → } → console(Total)",
        );
        return;
      }
    }

    if (index < 2) {
      setActiveLine(index);
      setFeedback("Baris " + (index + 1) + " diproses: Deklarasi variabel.");
      timerRef.current = setTimeout(() => executeStep(index + 1), 700);
      return;
    }

    const blockIndex = index - 2;

    if (blockIndex >= placedBlocks.length) {
      return;
    }

    const block = placedBlocks[blockIndex];

    if (block === null) {
      timerRef.current = setTimeout(() => executeStep(index + 1), 850);
      return;
    }

    setActiveLine(2 + blockIndex);

    const lineNum = 3 + blockIndex;
    let isValid = false;
    let expectedDesc = "";

    if (blockIndex === 0) {
      isValid = block.id === "for-loop";
      expectedDesc = "for-loop statement";
      if (isValid)
        setFeedback("✓ Baris " + lineNum + " benar: for-loop dimulai.");
    } else if (blockIndex === 1) {
      isValid = block.id === "if-condition";
      expectedDesc = "if-condition";
      if (isValid)
        setFeedback("✓ Baris " + lineNum + " benar: kondisi jarak < 50.");
    } else if (blockIndex === 2) {
      isValid = block.id === "console-log-dekat";
      expectedDesc = "console.log untuk Orang Dekat";
      if (isValid) {
        setFeedback("✓ Baris " + lineNum + " benar: cetak Orang Dekat.");
        // Trigger door animation
        setTimeout(() => {
          setCurrentSensorIndex(0);
          setDoorAction("buka");
          setDoorOpen(true);
          setBukaSensorCount((c) => c + 1);
        }, 300);
        setTimeout(() => {
          setDoorAction(null);
        }, 1100);
      }
    } else if (blockIndex === 3) {
      isValid = block.id === "increment-total";
      expectedDesc = "totalAksi++";
      if (isValid)
        setFeedback("✓ Baris " + lineNum + " benar: increment totalAksi.");
    } else if (blockIndex === 4) {
      isValid = block.id === "else-block";
      expectedDesc = "} else {";
      if (isValid)
        setFeedback("✓ Baris " + lineNum + " benar: blok else dibuka.");
    } else if (blockIndex === 5) {
      isValid = block.id === "console-log-kosong";
      expectedDesc = "console.log untuk Area Kosong";
      if (isValid) {
        setFeedback("✓ Baris " + lineNum + " benar: cetak Area Kosong.");
        // Trigger door animation
        setTimeout(() => {
          setCurrentSensorIndex(1);
          setDoorAction("tutup");
          setDoorOpen(false);
          setTutupSensorCount((c) => c + 1);
        }, 300);
        setTimeout(() => {
          setDoorAction(null);
        }, 1100);
      }
    } else if (blockIndex === 6) {
      isValid = block.id === "close-brace";
      expectedDesc = "} untuk menutup if/else";
      if (isValid)
        setFeedback("✓ Baris " + lineNum + " benar: tutup blok if/else.");
    } else if (blockIndex === 7) {
      isValid = block.id === "close-brace";
      expectedDesc = "} untuk menutup for";
      if (isValid)
        setFeedback("✓ Baris " + lineNum + " benar: tutup loop for.");
    } else if (blockIndex === 8) {
      isValid = block.id === "console-log-total";
      expectedDesc = "console.log untuk total aktivitas";
      if (isValid)
        setFeedback("✓ Baris " + lineNum + " benar: cetak total aktivitas.");
    }

    if (!isValid) {
      setIsRunning(false);
      setErrorLine(2 + blockIndex);
      setDoorAction(null);
      setIsErrorAnimating(true);
      setTimeout(() => setIsErrorAnimating(false), 800);
      setFeedback(
        `Baris ${lineNum} salah! Ditemukan: "${block.content}"\n\nSeharusnya: ${expectedDesc}`,
      );
      return;
    }

    // Longer delay for console-log blocks to show door animation
    const delayTime = blockIndex === 2 || blockIndex === 5 ? 1200 : 850;
    timerRef.current = setTimeout(() => executeStep(index + 1), delayTime);
  };

  const startRunning = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(true);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    resetVisualState();
    setFeedback("Memulai simulasi kontrol pintu otomatis...");
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

  const resetSim = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setPlacedBlocks([null, null, null, null, null, null, null, null, null]);
    resetVisualState();
    setFeedback(
      "Simulasi direset. Susun blok kode untuk kontrol pintu otomatis.",
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
              Pintu Otomatis
            </h1>
            <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
              Level Lanjutan
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
            onClick={startRunning}
            disabled={isRunning}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-all duration-200 hover:from-green-600 hover:to-emerald-600 disabled:bg-slate-400"
          >
            <Play size={14} fill="white" /> Jalankan
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="z-20 flex w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r border-emerald-100 bg-white/85 p-5 backdrop-blur">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-600/70" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Blok Tersedia
            </h2>
          </div>

          <div className="flex flex-col gap-1">
            {shuffledBlocks.map((block) => (
              <motion.div
                key={block.id}
                draggable
                onDragStart={() => handleDragStart(block)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group cursor-move rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 transition-all hover:border-emerald-400 hover:bg-emerald-100 active:bg-emerald-200"
              >
                <div className="flex items-start gap-1.5">
                  <GripHorizontal
                    size={12}
                    className="mt-0.5 text-emerald-600/50 group-hover:text-emerald-600 shrink-0"
                  />
                  <div className="flex-1 font-mono text-[10px] text-slate-900 break-words">
                    <SyntaxHighlight code={block.content} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              CATATAN PROSES
            </p>
            <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-[11px] leading-snug text-foreground whitespace-pre-line">
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

        {/* MAIN CONTENT */}
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
                    Pintu Otomatis
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  💡 Susun kode untuk mengontrol pintu otomatis berdasarkan 4
                  sensor jarak. Pintu terbuka jika ada orang (jarak &lt; 50cm),
                  dan tertutup jika area kosong.
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
                    Berhasil! Sistem pintu otomatis berfungsi dengan benar
                  </h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                    Kontrol pintu otomatis sudah tepat dan siap melayani.
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="flex flex-1 gap-5 overflow-x-hidden overflow-y-auto px-6 pb-6">
            {/* CODE EDITOR PANEL */}
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

              <div className="relative flex flex-1 overflow-hidden font-mono text-[11px] leading-[26px]">
                <div className="w-12 shrink-0 select-none overflow-hidden border-r border-emerald-100 bg-emerald-50/60 pt-5 pr-4 text-right text-muted-foreground">
                  {Array.from({ length: 11 }).map((_, i) => (
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

                <div className="relative flex-1 overflow-hidden bg-white">
                  <div className="absolute inset-0 z-10 overflow-y-auto whitespace-pre p-5 pt-5">
                    {/* Static lines */}
                    {[
                      "const sensorJarak = [150, 30, 25, 200];",
                      "let totalAksi = 0;",
                    ].map((line, i) => (
                      <div
                        key={`static-${i}`}
                        className="relative flex h-[26px] items-center"
                      >
                        {activeLine === i && (
                          <motion.div
                            layoutId="lineHighlightPintuOtomatis"
                            className="absolute inset-0 -mx-5 -my-1 z-0 border-l-4 border-emerald-500 bg-emerald-50"
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
                              layoutId="lineHighlightPintuOtomatis"
                              className="absolute inset-0 -mx-5 -my-1 z-0 border-l-4 border-emerald-500 bg-emerald-50"
                            />
                          )}
                          {errorLine === 2 + idx && (
                            <motion.div
                              layoutId="lineErrorHighlightPintuOtomatis"
                              className="absolute inset-0 -mx-5 -my-1 z-0 border-l-4 border-red-500 bg-red-50/50"
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

            {/* VISUALIZATION PANEL */}
            <aside className="relative flex w-[380px] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-[#020617] shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-1.5 text-emerald-400">
                    <Lock size={14} />
                  </div>
                  <div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                      Stasiun Kontrol Pintu
                    </h2>
                    <p className="text-[8px] text-slate-400">
                      Buka: {bukaSensorCount} | Tutup: {tutupSensorCount}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    isRunning
                      ? "bg-emerald-500 text-white animate-pulse"
                      : errorLine !== -1
                        ? "bg-red-500 text-white"
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
                  {/* Door Visualization */}
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-5">
                    <div
                      className="flex h-80 flex-col items-center justify-center overflow-hidden rounded-xl border-2 bg-gradient-to-b from-slate-800/50 to-slate-900/70 p-4 relative"
                      style={{
                        borderColor: errorLine !== -1 ? "#ef4444" : "#475569",
                      }}
                    >
                      {/* Error flash */}
                      {errorLine !== -1 && (
                        <motion.div
                          className="absolute inset-0 rounded-lg bg-red-500/20"
                          animate={{ opacity: [0, 0.5, 0] }}
                          transition={{ duration: 0.4, repeat: 3 }}
                        />
                      )}

                      {/* Status text */}
                      <div
                        className="absolute top-3 left-0 right-0 text-center text-[10px] font-bold z-20"
                        style={{
                          color: errorLine !== -1 ? "#ef4444" : "#06b6d4",
                        }}
                      >
                        {errorLine !== -1
                          ? "❌ ERROR - Cek urutan blok!"
                          : isRunning && currentSensorIndex >= 0
                            ? `📡 ${SENSOR_DATA[currentSensorIndex]?.nama}: ${SENSOR_DATA[currentSensorIndex]?.jarak}cm`
                            : "📡 Menunggu eksekusi..."}
                      </div>

                      {/* Doorway Frame */}
                      <div className="relative flex flex-col items-center justify-center flex-1 w-full">
                        {/* Frame Top */}
                        <div className="w-40 h-2 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 rounded-t-lg shadow-lg" />

                        {/* Door Container */}
                        <motion.div
                          className="relative w-40 h-48 bg-gradient-to-b from-slate-700 to-slate-800 border-2 flex items-center justify-center overflow-hidden shadow-2xl"
                          style={{
                            borderColor: isErrorAnimating
                              ? "#ef4444"
                              : "#374151",
                          }}
                          animate={
                            isErrorAnimating
                              ? {
                                  x: [0, -8, 8, -8, 8, 0],
                                  boxShadow: isErrorAnimating
                                    ? "0 0 20px 3px rgba(239, 68, 68, 0.6)"
                                    : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                                }
                              : {}
                          }
                          transition={{ duration: 0.6 }}
                        >
                          {/* Error overlay flash */}
                          {isErrorAnimating && (
                            <motion.div
                              className="absolute inset-0 bg-red-500/40"
                              animate={{
                                opacity: [0.4, 0.8, 0.4, 0.8, 0.3, 0],
                              }}
                              transition={{ duration: 0.6 }}
                            />
                          )}

                          {/* Doorway background */}
                          <div className="absolute inset-0 bg-black/40" />

                          {/* Left Door */}
                          <motion.div
                            className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 border-r border-amber-900 origin-left flex items-center justify-center"
                            animate={{
                              x: doorOpen ? -80 : 0,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 120,
                              damping: 20,
                            }}
                          >
                            {/* Door detail */}
                            <div className="absolute right-2 w-3 h-12 bg-amber-900/60 rounded-full" />
                          </motion.div>

                          {/* Right Door */}
                          <motion.div
                            className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-amber-600 via-amber-700 to-amber-800 border-l border-amber-900 origin-right flex items-center justify-center"
                            animate={{
                              x: doorOpen ? 80 : 0,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 120,
                              damping: 20,
                            }}
                          >
                            {/* Door detail */}
                            <div className="absolute left-2 w-3 h-12 bg-amber-900/60 rounded-full" />
                          </motion.div>

                          {/* Sensor indicator light */}
                          <motion.div
                            className="absolute top-6 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full border border-slate-500 z-10"
                            animate={
                              isErrorAnimating
                                ? {
                                    boxShadow: [
                                      "0 0 20px 4px #ef4444, inset 0 0 8px #7f1d1d",
                                      "0 0 8px 2px #ef4444, inset 0 0 2px #3f0d0d",
                                      "0 0 20px 4px #ef4444, inset 0 0 8px #7f1d1d",
                                    ],
                                    backgroundColor: [
                                      "#dc2626",
                                      "#b91c1c",
                                      "#dc2626",
                                    ],
                                  }
                                : {
                                    boxShadow: doorOpen
                                      ? "0 0 12px 2px #22c55e, inset 0 0 4px #16a34a"
                                      : "0 0 12px 2px #ef4444, inset 0 0 4px #991b1b",
                                    backgroundColor: doorOpen
                                      ? "#22c55e"
                                      : "#ef4444",
                                  }
                            }
                            transition={
                              isErrorAnimating
                                ? { duration: 0.6, repeat: 0 }
                                : { duration: 0.3 }
                            }
                          />
                        </motion.div>

                        {/* Frame Bottom */}
                        <div className="w-40 h-2 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 rounded-b-lg shadow-lg" />

                        {/* Error Warning Alert */}
                        {isErrorAnimating && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-red-500 text-white text-[9px] font-bold rounded-md whitespace-nowrap"
                          >
                            ⚠️ AKSES DITOLAK
                          </motion.div>
                        )}
                      </div>

                      {/* Action text */}
                      {doorAction && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.8 }}
                          className={`absolute bottom-6 px-4 py-2 rounded-lg font-bold text-sm ${
                            doorAction === "buka"
                              ? "bg-green-500/40 text-green-300 border border-green-500/60"
                              : "bg-red-500/40 text-red-300 border border-red-500/60"
                          }`}
                        >
                          {doorAction === "buka" ? "🔓 TERBUKA" : "🔒 TERTUTUP"}
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Results */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-green-500/50 bg-green-900/20 p-3 text-center">
                      <div className="text-2xl">🔓</div>
                      <div className="text-[9px] font-bold text-green-400 mt-1">
                        BUKA
                      </div>
                      <div className="text-xl font-black text-green-300 mt-1">
                        {bukaSensorCount}
                      </div>
                    </div>
                    <div className="rounded-lg border border-red-500/50 bg-red-900/20 p-3 text-center">
                      <div className="text-2xl">🔒</div>
                      <div className="text-[9px] font-bold text-red-400 mt-1">
                        TUTUP
                      </div>
                      <div className="text-xl font-black text-red-300 mt-1">
                        {tutupSensorCount}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                    <div className="mb-2 flex items-center justify-between text-[9px] font-bold text-slate-300">
                      <span>Progress</span>
                      <span className="text-emerald-400">
                        {processedSensors.length}/4
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                        animate={{
                          width: `${(processedSensors.length / 4) * 100}%`,
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
