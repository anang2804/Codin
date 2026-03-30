"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Edit3,
  Lightbulb,
  Play,
  RotateCcw,
  Terminal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIMULASI_SLUG = "ekspresi-operasi";

type OperatorChoice = "+" | "-" | "*" | "/";

type CalculationResult = {
  operator: OperatorChoice;
  result: number;
};

const COMMAND_DETAILS = {
  PLUS: {
    title: "Operator Penjumlahan",
    desc: "Menjumlahkan kedua nilai. Contoh: 10 + 5 = 15",
    color: "bg-emerald-50 border-emerald-200",
  },
  MINUS: {
    title: "Operator Pengurangan",
    desc: "Mengurangi nilai sebelah kanan dari kiri. Contoh: 10 - 5 = 5",
    color: "bg-amber-50 border-amber-200",
  },
  MULTIPLY: {
    title: "Operator Perkalian",
    desc: "Mengalikan kedua nilai. Contoh: 10 * 5 = 50",
    color: "bg-sky-50 border-sky-200",
  },
  DIVIDE: {
    title: "Operator Pembagian",
    desc: "Membagi nilai kiri dengan nilai kanan. Contoh: 10 / 5 = 2",
    color: "bg-violet-50 border-violet-200",
  },
  DEFAULT: {
    title: "Pilih Operator",
    desc: "Klik salah satu operator untuk melihat hasil ekspresi matematika.",
    color: "bg-slate-50 border-slate-200",
  },
};

const TOTAL_CODE_LINES = 1;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateExpression() {
  return {
    leftOperand: randomInt(5, 20),
    rightOperand: randomInt(2, 20),
  };
}

export default function EkspresiOperasiPage() {
  const [selectedCommands, setSelectedCommands] = useState<
    Partial<Record<number, OperatorChoice>>
  >({});
  const [openSelectorLine, setOpenSelectorLine] = useState<number | null>(null);
  const [activeLine, setActiveLine] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [runVisualKey, setRunVisualKey] = useState(0);
  const [feedback, setFeedback] = useState(
    "Sistem siap menjalankan algoritma.",
  );
  const [hasTried, setHasTried] = useState(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);
  const [calculation, setCalculation] = useState<CalculationResult | null>(
    null,
  );
  const [expression, setExpression] = useState(() => generateExpression());

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const blankLineSuffix = `hasil = ${expression.leftOperand} ____ ${expression.rightOperand};`;
  const ghostCommandHints: Record<number, OperatorChoice> = {
    0: "+",
  };

  const calculateResult = (operator: OperatorChoice): number => {
    switch (operator) {
      case "+":
        return expression.leftOperand + expression.rightOperand;
      case "-":
        return expression.leftOperand - expression.rightOperand;
      case "*":
        return expression.leftOperand * expression.rightOperand;
      case "/":
        return expression.leftOperand / expression.rightOperand;
    }
  };

  const linesArray = Array.from({ length: TOTAL_CODE_LINES }).map((_, i) => {
    const selected = selectedCommands[i] ?? "_____";
    return `int ${selected} ${blankLineSuffix}`;
  });

  const currentLine = linesArray[activeLine]?.trim().toLowerCase() || "";
  const currentDesc = selectedCommands[activeLine]
    ? selectedCommands[activeLine] === "+"
      ? COMMAND_DETAILS.PLUS
      : selectedCommands[activeLine] === "-"
        ? COMMAND_DETAILS.MINUS
        : selectedCommands[activeLine] === "*"
          ? COMMAND_DETAILS.MULTIPLY
          : COMMAND_DETAILS.DIVIDE
    : COMMAND_DETAILS.DEFAULT;

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
        if (isActive && data.completed) {
          setHasTried(true);
        }
      } catch (error) {
        console.error("Error checking simulation completion:", error);
      }
    };

    fetchCompletionStatus();

    return () => {
      isActive = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const markAsTried = async () => {
    if (hasTried || isSavingCompletion) return;

    try {
      setIsSavingCompletion(true);
      const response = await fetch("/api/siswa/simulasi/mark-completed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ simulasi_slug: SIMULASI_SLUG }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan progress simulasi");
      }

      setHasTried(true);
      toast.success("Simulasi ditandai selesai");
    } catch (error: unknown) {
      console.error("Error marking simulation as completed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan progress simulasi",
      );
    } finally {
      setIsSavingCompletion(false);
    }
  };

  const handleSelectCommand = (lineIndex: number, command: OperatorChoice) => {
    if (isRunning) return;
    setSelectedCommands((prev) => ({ ...prev, [lineIndex]: command }));
    setOpenSelectorLine(null);
    setActiveLine(lineIndex);
    setShowSuccessCard(false);
  };

  const resetSim = (resetSelection = true) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveLine(-1);
    setIsRunning(false);
    setShowSuccessCard(false);
    setFeedback("Sistem siap menjalankan algoritma.");
    setCalculation(null);
    if (resetSelection) {
      setSelectedCommands({});
      setOpenSelectorLine(null);
      setExpression(generateExpression());
    }
  };

  useEffect(() => {
    let isActive = true;

    if (isRunning && activeLine === -1) {
      const timer = setTimeout(() => {
        if (isActive) {
          executeStep(0);
        }
      }, 300);
      return () => clearTimeout(timer);
    }

    return () => {
      isActive = false;
    };
  }, [isRunning, activeLine]);

  const executeStep = (index: number) => {
    if (index >= TOTAL_CODE_LINES) {
      setActiveLine(-1);
      setIsRunning(false);
      setShowSuccessCard(true);
      void markAsTried();
      return;
    }

    if (!selectedCommands[index]) {
      setIsRunning(false);
      setFeedback("Pilih operator terlebih dahulu sebelum menjalankan.");
      return;
    }

    setActiveLine(index);
    const operator = selectedCommands[index]!;
    const result = calculateResult(operator);

    setFeedback(
      `Baris ${index + 1} benar: int hasil = ${expression.leftOperand} ${operator} ${expression.rightOperand};`,
    );

    setCalculation({
      operator,
      result,
    });

    timerRef.current = setTimeout(() => {
      executeStep(index + 1);
    }, 1200);
  };

  const startRunning = () => {
    if (!selectedCommands[0]) {
      toast.error("Pilih operator dahulu!");
      return;
    }
    setActiveLine(-1);
    setShowSuccessCard(false);
    setRunVisualKey((prev) => prev + 1);
    setIsRunning(true);
  };

  const totalDisplayLines = Math.max(TOTAL_CODE_LINES, 10);
  const formattedResult =
    calculation && selectedCommands[0] === "/"
      ? calculation.result.toFixed(1)
      : calculation?.result;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 text-foreground">
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

          <div>
            <h1 className="text-lg font-black uppercase italic leading-none tracking-tighter">
              Ekspresi Operasi Matematika
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => resetSim(true)}
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
            disabled={isRunning}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 disabled:opacity-50 ${
              isRunning
                ? "cursor-not-allowed border border-border bg-muted text-muted-foreground"
                : "bg-gradient-to-br from-emerald-600 to-green-600 text-white hover:from-green-600 hover:to-emerald-600"
            }`}
          >
            <Play size={14} fill={isRunning ? "none" : "white"} /> Jalankan
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <aside className="z-20 flex w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r border-emerald-100 bg-white/85 p-5 backdrop-blur">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-600/70" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Info Operator
            </h2>
          </div>
          <AnimatePresence>
            {currentDesc && (
              <motion.div
                key={selectedCommands[0] || "default"}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className={`rounded-xl border p-4 ${currentDesc.color}`}
              >
                <h3 className="mb-2 text-xs font-black uppercase tracking-tight text-foreground">
                  {currentDesc.title}
                </h3>
                <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">
                  {currentDesc.desc}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-emerald-600/70" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Catatan Eksekusi
              </h2>
            </div>
            <div className="rounded-lg bg-emerald-50/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground border border-emerald-100/60">
              {feedback}
            </div>
          </div>

          <div className="mt-auto flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600/60" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Status Fokus
              </p>
              <p className="mt-1 text-[11px] font-semibold italic text-muted-foreground">
                {activeLine !== -1
                  ? `Baris ke-${activeLine + 1}`
                  : "Siap digunakan"}
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <section className="px-6 pb-2 pt-4">
            <div className="flex items-start gap-4 rounded-lg border border-emerald-100/80 bg-emerald-50/60 p-4">
              <div className="rounded-lg bg-white p-2 text-emerald-600 shadow-sm">
                <Lightbulb size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-md bg-gradient-to-br from-emerald-600 to-green-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                    Misi
                  </span>
                  <h2 className="text-sm font-black uppercase tracking-tight text-foreground">
                    Pilih Operator Matematika
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  Lengkapi ekspresi dengan memilih operator matematika yang
                  tepat. Semua pilihan operator valid dan akan menunjukkan hasil
                  berbeda.
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
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="px-6 pb-2"
              >
                <div className="rounded-2xl border border-emerald-200 bg-card px-4 py-3 shadow-sm">
                  <h3 className="text-sm font-black tracking-tight text-emerald-700">
                    Ekspresi Selesai Dijalankan
                  </h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                    Hasil: {expression.leftOperand} {selectedCommands[0]}{" "}
                    {expression.rightOperand} = {formattedResult}
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="flex flex-1 gap-5 overflow-hidden px-6 pb-6">
            <section className="relative flex min-w-[500px] flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isRunning
                        ? "animate-pulse bg-emerald-500"
                        : "bg-slate-500"
                    }`}
                  />
                  <span className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">
                    ALGORITMA EKSPRESI
                  </span>
                </div>
              </div>

              <div className="relative flex flex-1 overflow-hidden font-mono text-[13px] leading-[26px]">
                <div
                  id="line-gutter"
                  className="w-12 shrink-0 select-none overflow-hidden border-r border-border bg-muted/30 pt-5 pr-4 text-right text-muted-foreground"
                >
                  {Array.from({ length: totalDisplayLines }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-[26px] transition-all ${
                        activeLine === i
                          ? "scale-110 pr-1 font-black text-emerald-600"
                          : ""
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                <div className="relative flex-1 overflow-hidden bg-card">
                  <div className="absolute inset-0 z-10 overflow-hidden whitespace-pre p-5 pt-5">
                    {Array.from({ length: TOTAL_CODE_LINES }).map((_, i) => {
                      const isActive = activeLine === i;
                      const selected = selectedCommands[i];
                      return (
                        <div
                          key={i}
                          className="relative flex h-[26px] items-center"
                        >
                          {isActive && (
                            <motion.div
                              layoutId="lineHighlight"
                              className={`absolute inset-0 -mx-5 -my-1 border-l-4 z-0 ${
                                isRunning
                                  ? "border-emerald-500 bg-emerald-50"
                                  : "border-emerald-200 bg-emerald-50/30"
                              }`}
                            />
                          )}

                          <div className="relative z-10 whitespace-pre font-bold text-slate-900">
                            <span className="text-slate-900">int hasil = </span>
                            <span className="text-slate-900">
                              {expression.leftOperand}
                            </span>{" "}
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => {
                                setOpenSelectorLine(i);
                                setActiveLine(i);
                              }}
                              className={`rounded px-1.5 py-0.5 transition-all ${
                                selected
                                  ? "text-slate-900 hover:bg-emerald-50"
                                  : "italic text-slate-300 hover:bg-slate-100"
                              } ${
                                isRunning
                                  ? "cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              {selected ?? ghostCommandHints[i] ?? "_____"}
                            </button>{" "}
                            <span className="text-slate-900">
                              {expression.rightOperand}
                            </span>
                            <span className="text-slate-900">;</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {openSelectorLine !== null && !isRunning && (
                    <div className="absolute bottom-4 left-5 right-5 z-30 rounded-xl border border-emerald-200 bg-card px-3 py-2 shadow-lg">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        PILIH OPERATOR BARIS {openSelectorLine + 1}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "+")
                          }
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 hover:bg-emerald-100"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "-")
                          }
                          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-amber-700 hover:bg-amber-100"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "*")
                          }
                          className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-sky-700 hover:bg-sky-100"
                        >
                          ×
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "/")
                          }
                          className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-violet-700 hover:bg-violet-100"
                        >
                          ÷
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside
              key={runVisualKey}
              className="relative flex w-[380px] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-[#020617] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6 py-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  HASIL EKSPRESI
                </h2>
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    isRunning ? "animate-pulse bg-emerald-500" : "bg-slate-700"
                  }`}
                />
              </div>

              <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)] p-6">
                <div className="absolute -left-10 -top-8 h-32 w-32 rounded-full bg-emerald-300/10 blur-2xl" />
                <div className="absolute -right-10 top-8 h-28 w-28 rounded-full bg-purple-400/10 blur-2xl" />

                {isRunning && activeLine !== -1 && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-6 text-center"
                  >
                    <p className="text-[11px] text-slate-300 mb-3">
                      Menghitung...
                    </p>
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-4xl font-black text-emerald-400"
                    >
                      =
                    </motion.div>
                  </motion.div>
                )}

                {calculation && !isRunning && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-center"
                  >
                    <div className="mb-6 text-center">
                      <div className="inline-flex items-center justify-center gap-4 rounded-xl border-2 border-slate-700/40 bg-slate-800/50 px-6 py-3 mb-4">
                        <div className="text-2xl font-black text-slate-300">
                          {expression.leftOperand}
                        </div>
                        <div
                          className={`text-2xl font-black px-3 py-1 rounded-lg ${
                            selectedCommands[0] === "+"
                              ? "bg-emerald-500 text-white"
                              : selectedCommands[0] === "-"
                                ? "bg-amber-500 text-white"
                                : selectedCommands[0] === "*"
                                  ? "bg-sky-500 text-white"
                                  : "bg-violet-500 text-white"
                          }`}
                        >
                          {selectedCommands[0]}
                        </div>
                        <div className="text-2xl font-black text-slate-300">
                          {expression.rightOperand}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border-2 border-emerald-400/60 bg-emerald-500/20 p-6">
                      <p className="text-xs text-slate-400 mb-2">HASIL</p>
                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="text-5xl font-black text-emerald-400"
                      >
                        {formattedResult}
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {!calculation && !isRunning && (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-400">
                      Pilih operator untuk melihat hasil
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
