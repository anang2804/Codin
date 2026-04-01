"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Play,
  RotateCcw,
  Terminal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIMULASI_SLUG = "variabel-terpadu-dasar";

type CommandChoice = "int" | "float" | "char" | "boolean";

type ChallengeData = {
  umur: number;
  tinggi: number;
  inisial: "A" | "B" | "C" | "D";
  aktif: boolean;
};

type LineConfig = {
  before: string;
  after: string;
  expected: CommandChoice;
  choices: CommandChoice[];
};

const COMMAND_DETAILS: Record<
  CommandChoice | "default",
  { title: string; desc: string; color: string }
> = {
  int: {
    title: "INT",
    desc: "int untuk bilangan bulat, contoh: umur = 16",
    color: "bg-emerald-50 border-emerald-200",
  },
  float: {
    title: "FLOAT",
    desc: "float untuk bilangan desimal, contoh: tinggi = 165.5",
    color: "bg-sky-50 border-sky-200",
  },
  char: {
    title: "CHAR",
    desc: "char untuk satu karakter, contoh: inisial = 'A'",
    color: "bg-amber-50 border-amber-200",
  },
  boolean: {
    title: "BOOLEAN",
    desc: "boolean untuk true/false, contoh: aktif = true",
    color: "bg-violet-50 border-violet-200",
  },
  default: {
    title: "DASAR",
    desc: "Pilih tipe data yang tepat untuk setiap variabel.",
    color: "bg-slate-50 border-slate-200",
  },
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createChallenge(): ChallengeData {
  const tinggiBulat = randomInt(150, 178);
  const tinggiDecimal = randomInt(1, 9);
  return {
    umur: randomInt(15, 18),
    tinggi: Number(`${tinggiBulat}.${tinggiDecimal}`),
    inisial: ["A", "B", "C", "D"][randomInt(0, 3)] as "A" | "B" | "C" | "D",
    aktif: Math.random() > 0.5,
  };
}

export default function VariabelTerpaduDasarPage() {
  const [challenge, setChallenge] = useState<ChallengeData>(() =>
    createChallenge(),
  );
  const [selectedCommands, setSelectedCommands] = useState<
    Partial<Record<number, CommandChoice>>
  >({});
  const [openSelectorLine, setOpenSelectorLine] = useState<number | null>(null);
  const [activeLine, setActiveLine] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [errorLine, setErrorLine] = useState(-1);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [feedback, setFeedback] = useState(
    "Sistem siap menjalankan algoritma.",
  );
  const [hasTried, setHasTried] = useState(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lineConfigs: LineConfig[] = [
    {
      before: "",
      after: ` umur = ${challenge.umur};`,
      expected: "int",
      choices: ["int", "float", "char", "boolean"],
    },
    {
      before: "",
      after: ` tinggi = ${challenge.tinggi.toFixed(1)};`,
      expected: "float",
      choices: ["int", "float", "char", "boolean"],
    },
    {
      before: "",
      after: ` inisial = '${challenge.inisial}';`,
      expected: "char",
      choices: ["int", "float", "char", "boolean"],
    },
    {
      before: "",
      after: ` aktif = ${challenge.aktif};`,
      expected: "boolean",
      choices: ["int", "float", "char", "boolean"],
    },
  ];

  const currentChoice =
    activeLine !== -1 ? selectedCommands[activeLine] : undefined;
  const currentDesc = currentChoice
    ? COMMAND_DETAILS[currentChoice]
    : COMMAND_DETAILS.default;

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

  const handleSelectCommand = (lineIndex: number, command: CommandChoice) => {
    if (isRunning) return;
    setSelectedCommands((prev) => ({ ...prev, [lineIndex]: command }));
    setOpenSelectorLine(null);
    setActiveLine(lineIndex);
    setErrorLine(-1);
    setShowSuccessCard(false);
  };

  const resetSim = (regenerateChallenge: boolean) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setFeedback("Sistem siap menjalankan algoritma.");
    if (regenerateChallenge) {
      setChallenge(createChallenge());
      setSelectedCommands({});
      setOpenSelectorLine(null);
    }
  };

  const executeStep = (index: number) => {
    if (index >= lineConfigs.length) {
      setIsRunning(false);
      setActiveLine(-1);
      setShowSuccessCard(true);
      setFeedback("Mantap! Semua tipe data variabel sudah tepat.");
      return;
    }

    setActiveLine(index);
    const chosen = selectedCommands[index];
    const expected = lineConfigs[index].expected;

    if (chosen !== expected) {
      setIsRunning(false);
      setErrorLine(index);
      setFeedback(
        `Baris ${index + 1} belum tepat. Seharusnya ${expected}${lineConfigs[index].after}`,
      );
      return;
    }

    setFeedback(
      `Baris ${index + 1} benar: ${expected}${lineConfigs[index].after}`,
    );
    timerRef.current = setTimeout(() => executeStep(index + 1), 850);
  };

  const startRunning = () => {
    resetSim(false);
    setIsRunning(true);
    timerRef.current = setTimeout(() => executeStep(0), 250);
  };

  const totalDisplayLines = Math.max(lineConfigs.length, 10);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50 to-lime-50 text-foreground">
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
          <h1 className="text-lg font-black uppercase italic leading-none tracking-tighter">
            Variabel Terpadu - Dasar
          </h1>
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
              Konsep Aktif
            </h2>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentDesc.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`rounded-2xl border p-4 shadow-sm ${currentDesc.color}`}
            >
              <h3 className="mb-2 text-xs font-black uppercase tracking-tight text-foreground">
                {currentDesc.title}
              </h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {currentDesc.desc}
              </p>
            </motion.div>
          </AnimatePresence>

          <div
            className={`rounded-2xl border p-3 ${errorLine !== -1 ? "border-rose-200 bg-rose-50/95" : "border-border bg-card"}`}
          >
            <p
              className={`text-[10px] font-black uppercase tracking-widest ${errorLine !== -1 ? "text-rose-600" : "text-muted-foreground"}`}
            >
              Catatan Proses
            </p>
            <p
              className={`mt-2 rounded-lg px-3 py-2 text-[11px] leading-snug ${errorLine !== -1 ? "bg-rose-100/60 text-rose-700" : "bg-muted text-foreground"}`}
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

        <div className="flex min-w-0 flex-1 flex-col bg-transparent">
          <section className="px-6 pb-2 pt-4">
            <div className="flex items-start gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-lime-50 p-4 shadow-sm">
              <div className="rounded-xl bg-white p-2 text-emerald-700 shadow-sm">
                <Lightbulb size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-emerald-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                    MISI DASAR
                  </span>
                  <h2 className="text-[15px] font-black uppercase tracking-tight text-foreground">
                    Tipe Data + Variabel + Assignment
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  Pilih tipe data yang tepat untuk setiap variabel: umur,
                  tinggi, inisial, dan aktif.
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
                className="px-6 pb-2"
              >
                <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
                  <h3 className="text-sm font-black tracking-tight text-emerald-700">
                    Berhasil! Level dasar selesai
                  </h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                    Kunci benar: int, float, char, boolean.
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="flex flex-1 gap-5 overflow-hidden px-6 pb-6">
            <section className="relative flex min-w-[500px] flex-1 flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/60 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${isRunning ? "animate-pulse bg-emerald-500" : errorLine !== -1 ? "bg-red-500" : "bg-emerald-500"}`}
                  />
                  <span className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">
                    ALGORITMA DASAR
                  </span>
                </div>
              </div>

              <div className="relative flex flex-1 overflow-hidden font-mono text-[13px] leading-[26px]">
                <div className="w-12 shrink-0 select-none overflow-hidden border-r border-border bg-muted/30 pt-5 pr-4 text-right text-muted-foreground">
                  {Array.from({ length: totalDisplayLines }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-[26px] transition-all ${activeLine === i ? "scale-110 pr-1 font-black text-emerald-700" : ""}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                <div className="relative flex-1 overflow-hidden bg-card">
                  <div className="absolute inset-0 z-10 overflow-hidden whitespace-pre p-5 pt-5">
                    {lineConfigs.map((line, i) => {
                      const selected = selectedCommands[i];
                      const isActive = activeLine === i;

                      return (
                        <div
                          key={i}
                          className="relative flex h-[26px] items-center"
                        >
                          {isActive && (
                            <motion.div
                              layoutId="lineHighlightDasar"
                              className={`absolute inset-0 -mx-5 -my-1 border-l-4 z-0 ${isRunning ? "border-emerald-500 bg-emerald-50" : "border-emerald-200 bg-emerald-50/30"}`}
                            />
                          )}

                          <div className="relative z-10 whitespace-pre font-bold text-slate-900">
                            <span>{line.before}</span>
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => {
                                setOpenSelectorLine(i);
                                setActiveLine(i);
                              }}
                              className={`rounded px-1.5 py-0.5 transition-all ${selected ? "text-slate-900 hover:bg-emerald-50" : "italic text-slate-300 hover:bg-slate-100"} ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selected ?? "_____"}
                            </button>
                            <span>{line.after}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {openSelectorLine !== null && !isRunning && (
                    <div className="absolute bottom-4 left-5 right-5 z-30 rounded-xl border border-emerald-200 bg-card px-3 py-2 shadow-lg">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        PILIH TOKEN BARIS {openSelectorLine + 1}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {lineConfigs[openSelectorLine].choices.map((choice) => (
                          <button
                            key={`${openSelectorLine}-${choice}`}
                            type="button"
                            onClick={() =>
                              handleSelectCommand(openSelectorLine, choice)
                            }
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

            <aside className="relative flex w-[380px] shrink-0 flex-col overflow-hidden rounded-3xl border border-emerald-400/40 bg-gradient-to-br from-[#0d2f1e] via-[#14532d] to-[#1f6f43] shadow-2xl">
              <div className="flex items-center justify-between border-b border-emerald-300/30 bg-emerald-900/20 px-6 py-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-emerald-100">
                  RINGKASAN VARIABEL
                </h2>
                <div
                  className={`h-2.5 w-2.5 rounded-full ${isRunning ? "animate-pulse bg-emerald-400" : errorLine !== -1 ? "bg-rose-400" : "bg-emerald-500"}`}
                />
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5 text-emerald-50">
                <div className="rounded-xl border border-emerald-200/30 bg-emerald-900/30 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-200/80">
                    umur
                  </p>
                  <p className="text-xl font-black">{challenge.umur}</p>
                </div>
                <div className="rounded-xl border border-emerald-200/30 bg-emerald-900/30 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-200/80">
                    tinggi
                  </p>
                  <p className="text-xl font-black">
                    {challenge.tinggi.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200/30 bg-emerald-900/30 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-200/80">
                    inisial
                  </p>
                  <p className="text-xl font-black">{challenge.inisial}</p>
                </div>
                <div className="rounded-xl border border-emerald-200/30 bg-emerald-900/30 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-200/80">
                    aktif
                  </p>
                  <p className="text-xl font-black">
                    {String(challenge.aktif)}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
