"use client";

import { useEffect, useRef, useState } from "react";
import { useSimulasiAttemptRecorder } from "@/lib/hooks/useSimulasiAttemptRecorder";
import {
  Activity,
  AlertTriangle,
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

const SIMULASI_SLUG = "variabel-spedomater";
const MODE_OPTIONS = ["Eco", "Sport", "Normal", "Comfort"] as const;

type CommandChoice = "Number" | "String" | "Boolean" | "Array" | "Object";

type ChallengeData = {
  umur: number;
  tinggi: number;
  inisial: "A" | "B" | "C" | "D";
  aktif: boolean;
  mode: string;
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
  Number: {
    title: "NUMBER",
    desc: "Digunakan untuk menyimpan data berupa angka, baik bilangan bulat maupun desimal.",
    color: "bg-emerald-50 border-emerald-200",
  },
  String: {
    title: "STRING",
    desc: "Digunakan untuk menyimpan data berupa teks atau kumpulan karakter.",
    color: "bg-amber-50 border-amber-200",
  },
  Boolean: {
    title: "BOOLEAN",
    desc: "Digunakan untuk menyimpan nilai logika, yaitu benar (true) atau salah (false).",
    color: "bg-violet-50 border-violet-200",
  },
  Array: {
    title: "ARRAY",
    desc: "Digunakan untuk menyimpan kumpulan data dalam satu variabel.",
    color: "bg-sky-50 border-sky-200",
  },
  Object: {
    title: "OBJECT",
    desc: "Digunakan untuk menyimpan data yang memiliki beberapa atribut",
    color: "bg-rose-50 border-rose-200",
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

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createChallenge(): ChallengeData {
  return {
    umur: 18,
    tinggi: 164.3,
    inisial: "B",
    aktif: true,
    mode: "Sport",
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

  useSimulasiAttemptRecorder({
    simulasiSlug: SIMULASI_SLUG,
    isRunning,
    isSuccess: showSuccessCard,
  });
  const [feedback, setFeedback] = useState(
    "Sistem siap menjalankan algoritma.",
  );
  const [hasTried, setHasTried] = useState(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [labPreview, setLabPreview] = useState<{
    umur: number | null;
    tinggi: number | null;
    inisial: string;
    aktif: boolean | null;
    mode: string;
  }>({
    umur: null,
    tinggi: null,
    inisial: "",
    aktif: null,
    mode: "",
  });

  const lineConfigs: LineConfig[] = [
    {
      before: `let kecepatan = ${challenge.umur};      // tipe data: `,
      after: "",
      expected: "Number",
      choices: shuffle(["Number", "String", "Boolean", "Array", "Object"]),
    },
    {
      before: `let trip_meter = ${challenge.tinggi.toFixed(1)};  // tipe data: `,
      after: "",
      expected: "Number",
      choices: shuffle(["Number", "String", "Boolean", "Array", "Object"]),
    },
    {
      before: `let gigi = '${challenge.inisial}';          // tipe data: `,
      after: "",
      expected: "String",
      choices: shuffle(["Number", "String", "Boolean", "Array", "Object"]),
    },
    {
      before: `let ready = ${challenge.aktif};        // tipe data: `,
      after: "",
      expected: "Boolean",
      choices: shuffle(["Number", "String", "Boolean", "Array", "Object"]),
    },
    {
      before: `let mode = "${challenge.mode}";      // tipe data: `,
      after: "",
      expected: "String",
      choices: shuffle(["Number", "String", "Boolean", "Array", "Object"]),
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

  const getLineGuideMessage = (lineIndex: number, selected?: CommandChoice) => {
    const token = selected ?? "_______";

    if (lineIndex === 0) {
      return `Variabel kecepatan memiliki nilai 18, maka bertipe data ${token}`;
    }
    if (lineIndex === 1) {
      return `Variabel trip_meter memiliki nilai 164.3, maka bertipe data ${token}`;
    }
    if (lineIndex === 2) {
      return `Variabel gigi memiliki nilai 'B', maka bertipe data ${token}`;
    }
    if (lineIndex === 3) {
      return `Variabel ready memiliki nilai true, maka bertipe data ${token}`;
    }
    if (lineIndex === 4) {
      return `Variabel mode memiliki nilai "Sport", maka bertipe data ${token}`;
    }

    return "Sistem siap menjalankan algoritma.";
  };

  const handleSelectCommand = (lineIndex: number, command: CommandChoice) => {
    if (isRunning) return;
    setSelectedCommands((prev) => ({ ...prev, [lineIndex]: command }));
    setOpenSelectorLine(null);
    setActiveLine(lineIndex);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setFeedback(getLineGuideMessage(lineIndex, command));
  };

  const resetSim = (regenerateChallenge: boolean) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setFeedback("Sistem siap menjalankan algoritma.");
    setLabPreview({
      umur: null,
      tinggi: null,
      inisial: "",
      aktif: null,
      mode: "",
    });
    if (regenerateChallenge) {
      setChallenge(createChallenge());
      setSelectedCommands({});
      setOpenSelectorLine(null);
    }
  };

  const feedbackHints: Record<CommandChoice, string> = {
    Number:
      "Cek kembali apakah nilainya berupa angka (bisa bulat atau desimal).",
    String: "Cek apakah variabel ini berisi teks/karakter dalam tanda kutip.",
    Boolean: "Pastikan variabel ini bertipe kondisi true/false.",
    Array: "Array dipakai untuk kumpulan nilai dalam tanda kurung siku [].",
    Object: "Object dipakai untuk pasangan key-value dalam kurung kurawal {}.",
  };

  const executeStep = (index: number) => {
    if (index >= lineConfigs.length) {
      setIsRunning(false);
      setActiveLine(-1);
      setShowSuccessCard(true);
      setFeedback(
        "Berhasil! Semua tipe data sudah sesuai.\n\nDashboard menampilkan data dengan benar dari kecepatan, trip meter, gear, ready, hingga mode berkendara.\n\nUrutan konsep yang dipakai: Number -> Number -> String -> Boolean -> String.",
      );
      return;
    }

    setActiveLine(index);
    const chosen = selectedCommands[index];
    const expected = lineConfigs[index].expected;

    if (!chosen) {
      setIsRunning(false);
      setErrorLine(index);
      setFeedback(
        `Baris ${index + 1} belum diisi.\n\nBagian ini masih kosong dan perlu dilengkapi.\n\nPetunjuk: Perhatikan tujuan dari baris tersebut, kemudian pilih jawaban yang sesuai.`,
      );
      return;
    }

    if (chosen !== expected) {
      setIsRunning(false);
      setErrorLine(index);
      setFeedback(
        `Baris ${index + 1} belum tepat.\n\nBagian yang dipilih belum sesuai dengan fungsi pada baris ini.\n\nPetunjuk: Perhatikan tujuan dari baris tersebut, kemudian sesuaikan dengan jenis data atau proses yang dilakukan.`,
      );
      return;
    }

    if (index === 0) {
      setLabPreview((prev) => ({ ...prev, umur: challenge.umur }));
    }
    if (index === 1) {
      setLabPreview((prev) => ({ ...prev, tinggi: challenge.tinggi }));
    }
    if (index === 2) {
      setLabPreview((prev) => ({ ...prev, inisial: challenge.inisial }));
    }
    if (index === 3) {
      setLabPreview((prev) => ({ ...prev, aktif: challenge.aktif }));
    }
    if (index === 4) {
      setLabPreview((prev) => ({ ...prev, mode: challenge.mode }));
    }

    setFeedback(
      `Baris ${index + 1} benar.\n\nDeklarasi \"${expected}\" sudah sesuai dan berhasil dibaca sistem dashboard.`,
    );
    timerRef.current = setTimeout(() => executeStep(index + 1), 850);
  };

  const startRunning = () => {
    resetSim(false);
    setIsRunning(true);
    timerRef.current = setTimeout(() => executeStep(0), 250);
  };

  const totalDisplayLines = Math.max(lineConfigs.length, 10);
  const renderCodePrefix = (lineIndex: number) => {
    const kwClass = "text-violet-700 dark:text-violet-300";
    const varClass = "text-blue-700 dark:text-blue-300";
    const opClass = "text-slate-700 dark:text-slate-300";
    const numberClass = "text-orange-700 dark:text-orange-300";
    const stringClass = "text-emerald-700 dark:text-emerald-300";
    const booleanClass = "text-amber-700 dark:text-amber-300";
    const commentClass = "text-slate-500 dark:text-slate-400";

    if (lineIndex === 0) {
      return (
        <>
          <span className={kwClass}>let</span>{" "}
          <span className={varClass}>kecepatan</span>{" "}
          <span className={opClass}>=</span>{" "}
          <span className={numberClass}>{challenge.umur}</span>
          <span className={opClass}>;</span>
          {"      "}
          <span className={commentClass}>// tipe data: </span>
        </>
      );
    }

    if (lineIndex === 1) {
      return (
        <>
          <span className={kwClass}>let</span>{" "}
          <span className={varClass}>trip_meter</span>{" "}
          <span className={opClass}>=</span>{" "}
          <span className={numberClass}>{challenge.tinggi.toFixed(1)}</span>
          <span className={opClass}>;</span>
          {"  "}
          <span className={commentClass}>// tipe data: </span>
        </>
      );
    }

    if (lineIndex === 2) {
      return (
        <>
          <span className={kwClass}>let</span>{" "}
          <span className={varClass}>gigi</span>{" "}
          <span className={opClass}>=</span>{" "}
          <span className={stringClass}>'{challenge.inisial}'</span>
          <span className={opClass}>;</span>
          {"          "}
          <span className={commentClass}>// tipe data: </span>
        </>
      );
    }

    if (lineIndex === 3) {
      return (
        <>
          <span className={kwClass}>let</span>{" "}
          <span className={varClass}>ready</span>{" "}
          <span className={opClass}>=</span>{" "}
          <span className={booleanClass}>{String(challenge.aktif)}</span>
          <span className={opClass}>;</span>
          {"        "}
          <span className={commentClass}>// tipe data: </span>
        </>
      );
    }

    return (
      <>
        <span className={kwClass}>let</span>{" "}
        <span className={varClass}>mode</span>{" "}
        <span className={opClass}>=</span>{" "}
        <span className={stringClass}>"{challenge.mode}"</span>
        <span className={opClass}>;</span>
        {"      "}
        <span className={commentClass}>// tipe data: </span>
      </>
    );
  };

  const umurLevel =
    labPreview.umur === null
      ? 8
      : Math.max(24, Math.min(92, labPreview.umur * 5));
  const tinggiLevel =
    labPreview.tinggi === null
      ? 6
      : Math.max(20, Math.min(94, (labPreview.tinggi - 140) * 2));
  const inisialLevel = labPreview.inisial ? 84 : 10;
  const aktifColor =
    labPreview.aktif === null
      ? "#94a3b8"
      : labPreview.aktif
        ? "#22c55e"
        : "#f97316";
  const speedometerAngle = (() => {
    if (labPreview.umur === null) return -120;
    const minValue = 15;
    const maxValue = 18;
    const clamped = Math.max(minValue, Math.min(maxValue, labPreview.umur));
    const ratio = (clamped - minValue) / (maxValue - minValue);
    return -120 + ratio * 240;
  })();
  const isSpeedBroken = errorLine === 0;
  const isTripGlitch = errorLine === 1 || errorLine === 2;
  const isReadyDisco = errorLine === 3;
  const isModeChaos = errorLine === 4;

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
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black uppercase italic leading-none tracking-tighter">
              Dashboard Digital
            </h1>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Level Dasar
            </span>
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
              Deskripsi Perintah
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
            className={`p-3 rounded-2xl border transition-all duration-300 ${
              errorLine !== -1
                ? "bg-rose-50/95 border-rose-200"
                : "border-emerald-200 bg-gradient-to-br from-emerald-50/95 to-sky-50/80 dark:border-emerald-800/60 dark:from-emerald-900/20 dark:to-sky-900/20"
            }`}
          >
            <div
              className={`flex items-center gap-2 pb-2 border-b ${
                errorLine !== -1
                  ? "border-rose-200"
                  : "border-emerald-200/80 dark:border-emerald-800/60"
              }`}
            >
              {errorLine !== -1 ? (
                <AlertTriangle size={13} className="text-rose-500" />
              ) : (
                <CheckCircle2
                  size={12}
                  className={
                    showSuccessCard ? "text-emerald-500" : "text-emerald-500"
                  }
                />
              )}
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  errorLine !== -1
                    ? "text-rose-600"
                    : "text-emerald-700 dark:text-emerald-300"
                }`}
              >
                CATATAN PROSES
              </span>
            </div>

            <div
              className={`mt-2 rounded-lg px-3 py-2 text-[11px] leading-snug whitespace-pre-line ${
                errorLine !== -1
                  ? "text-rose-700 bg-rose-100/60"
                  : "bg-white/80 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
              }`}
            >
              {feedback}
            </div>
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
                    Dashboard Digital Tema Speedometer
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  Ayo bantu dashboard speedometer bekerja dengan benar! 🚘
                  Lengkapi tipe data yang tepat agar sistem dapat membaca nilai,
                  menampilkan indikator, dan memproses status kendaraan secara
                  akurat.
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
                    Berhasil! Level dasar selesai
                  </h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                    Tipe data sudah dipilih dengan tepat pada setiap variabel
                    dashboard.
                    <br />
                    Dashboard speedometer berhasil menampilkan data kendaraan
                    dengan benar.
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="relative flex min-h-0 flex-1 gap-5 overflow-x-hidden overflow-y-auto px-6 pb-6">
            <section className="relative flex min-w-[500px] flex-1 flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/60 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${isRunning ? "animate-pulse bg-emerald-500" : errorLine !== -1 ? "bg-red-500" : "bg-emerald-500"}`}
                  />
                  <span className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">
                    Algortima dan Pemrograman
                  </span>
                </div>
              </div>

              <div className="relative flex flex-1 overflow-hidden font-mono text-[13px] leading-[26px]">
                <div className="w-12 shrink-0 select-none overflow-hidden border-r border-border bg-muted/40 pt-5 pr-4 text-right text-muted-foreground dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                  {Array.from({ length: totalDisplayLines }).map((_, i) =>
                    // Highlight line number red when selected command is wrong.
                    (() => {
                      const isWrongLineSelection =
                        i < lineConfigs.length &&
                        !!selectedCommands[i] &&
                        selectedCommands[i] !== lineConfigs[i].expected;
                      const showWrongState =
                        (isRunning || errorLine !== -1) && isWrongLineSelection;
                      return (
                        <div
                          key={i}
                          className={`h-[26px] transition-all ${activeLine === i ? `scale-110 pr-1 font-black ${showWrongState ? "text-rose-700" : "text-emerald-700"}` : ""}`}
                        >
                          {i + 1}
                        </div>
                      );
                    })(),
                  )}
                </div>

                <div className="relative flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950/80">
                  <div className="absolute inset-0 z-10 overflow-hidden whitespace-pre p-5 pt-5">
                    {lineConfigs.map((line, i) => {
                      const selected = selectedCommands[i];
                      const isActive = activeLine === i;
                      const isWrongSelection =
                        !!selected && selected !== line.expected;
                      const showWrongState =
                        (isRunning || errorLine !== -1) && isWrongSelection;

                      return (
                        <div
                          key={i}
                          className="relative flex h-[26px] items-center"
                        >
                          {isActive && (
                            <motion.div
                              layoutId="lineHighlightDasar"
                              className={`absolute inset-0 -mx-5 -my-1 border-l-4 z-0 ${
                                showWrongState || errorLine === i
                                  ? "border-rose-500 bg-rose-100/70 dark:bg-rose-500/10"
                                  : isRunning
                                    ? "border-emerald-500 bg-emerald-100/70 dark:bg-emerald-500/10"
                                    : "border-sky-300 bg-sky-50/70 dark:border-sky-500/40 dark:bg-slate-800/50"
                              }`}
                            />
                          )}

                          <div className="relative z-10 whitespace-pre font-mono text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                            <span>{renderCodePrefix(i)}</span>
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => {
                                setOpenSelectorLine(i);
                                setActiveLine(i);
                                setFeedback(
                                  getLineGuideMessage(i, selectedCommands[i]),
                                );
                              }}
                              className={`rounded border px-1.5 py-0.5 font-mono text-[13px] transition-all ${selected ? "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-700 dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-slate-700" : "border-transparent italic text-slate-400 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"} ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selected ?? "_____"}
                            </button>
                            <span className="text-slate-500 dark:text-slate-400">
                              {line.after}
                            </span>
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
                      <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                        {lineConfigs[openSelectorLine].choices.map((choice) => (
                          <button
                            key={`${openSelectorLine}-${choice}`}
                            type="button"
                            onClick={() =>
                              handleSelectCommand(openSelectorLine, choice)
                            }
                            className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${COMMAND_DETAILS[choice]?.color || COMMAND_DETAILS.default.color}`}
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
                    DASHBOARD DIGITAL
                  </h2>
                </div>
                <span
                  className={`rounded-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${isRunning ? "bg-emerald-500 text-white" : errorLine !== -1 ? "bg-rose-500 text-white" : "bg-slate-700 text-slate-300"}`}
                >
                  {isRunning ? "RUNNING" : errorLine !== -1 ? "ERROR" : "IDLE"}
                </span>
              </div>

              <motion.div
                animate={
                  errorLine !== -1 ? { x: [0, -4, 4, -2, 2, 0] } : { x: 0 }
                }
                transition={
                  errorLine !== -1
                    ? { duration: 0.35, repeat: Infinity, ease: "linear" }
                    : { duration: 0.2 }
                }
                className="relative flex flex-1 flex-col overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,#1e293b_0%,#020617_58%)]" />
                <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(to_right,rgba(148,163,184,.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.2)_1px,transparent_1px)] [background-size:30px_30px]" />

                <div
                  className={`relative z-10 flex-1 px-5 pt-2 ${showSuccessCard ? "min-h-[286px]" : "min-h-[320px]"}`}
                >
                  <div className="absolute inset-x-5 bottom-10 z-10 h-30 rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-950 shadow-2xl" />

                  <div className="absolute left-1/2 top-4 z-30 h-40 w-40 -translate-x-1/2 rounded-full border border-cyan-400/30 bg-slate-950/70 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
                    <div className="absolute inset-3 rounded-full border border-slate-700" />
                    {Array.from({ length: 9 }).map((_, index) => {
                      const angle = -120 + index * 30;
                      return (
                        <div
                          key={`tick-${index}`}
                          className="absolute left-1/2 top-1/2 h-[2px] w-[76px] origin-left -translate-y-1/2"
                          style={{ transform: `rotate(${angle}deg)` }}
                        >
                          <span className="absolute right-0 top-1/2 h-2 w-[2px] -translate-y-1/2 bg-cyan-300/55" />
                        </div>
                      );
                    })}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Kecepatan
                        </p>
                        <p className="mt-1 text-3xl font-black leading-none text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]">
                          {labPreview.umur ?? "--"}
                        </p>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-cyan-300">
                          KM/H
                        </p>
                      </div>
                    </div>

                    <motion.div
                      animate={{
                        rotate: isSpeedBroken
                          ? [speedometerAngle, speedometerAngle + 360]
                          : speedometerAngle,
                      }}
                      transition={{
                        ...(isSpeedBroken
                          ? {
                              duration: 0.55,
                              repeat: Infinity,
                              ease: "linear",
                            }
                          : {
                              type: "spring",
                              stiffness: 90,
                              damping: 14,
                            }),
                      }}
                      className="absolute left-1/2 top-1/2 h-[3px] w-[62px] origin-left -translate-y-1/2 bg-gradient-to-r from-rose-400 to-orange-300 shadow-[0_0_10px_rgba(251,146,60,0.45)]"
                    />
                    <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300" />
                  </div>

                  <AnimatePresence>
                    {isModeChaos && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1, rotate: 360 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{
                          opacity: { duration: 0.2 },
                          scale: { duration: 0.2 },
                          rotate: {
                            duration: 2.4,
                            repeat: Infinity,
                            ease: "linear",
                          },
                        }}
                        className="pointer-events-none absolute left-1/2 top-24 z-40 h-48 w-48 -translate-x-1/2 -translate-y-1/2"
                      >
                        {MODE_OPTIONS.map((mode, index) => {
                          const angle = (360 / MODE_OPTIONS.length) * index;
                          return (
                            <div
                              key={`mode-chaos-${mode}`}
                              className="absolute left-1/2 top-1/2"
                              style={{ transform: `rotate(${angle}deg)` }}
                            >
                              <span className="absolute -translate-y-[86px] rounded-md border border-rose-300/70 bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-900 shadow-md">
                                {mode}
                              </span>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div
                    animate={
                      isTripGlitch
                        ? {
                            x: [0, -3, 4, -5, 2, 0],
                            y: [0, 2, -2, 1, -1, 0],
                            rotate: [0, -0.6, 0.6, -0.4, 0.3, 0],
                          }
                        : { x: 0, y: 0, rotate: 0 }
                    }
                    transition={
                      isTripGlitch
                        ? { duration: 0.18, repeat: Infinity, ease: "linear" }
                        : { duration: 0.2 }
                    }
                    className="absolute left-6 right-6 bottom-[64px] z-20 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2"
                  >
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400">
                      <span>Trip Odometer</span>
                      <span className="text-sky-300">Number</span>
                    </div>
                    <motion.p
                      animate={
                        isTripGlitch
                          ? {
                              textShadow: [
                                "0 0 0px rgba(56,189,248,0)",
                                "2px 0 0 rgba(244,114,182,0.9)",
                                "-2px 0 0 rgba(34,211,238,0.9)",
                                "0 0 0px rgba(56,189,248,0)",
                              ],
                            }
                          : { textShadow: "0 0 0px rgba(56,189,248,0)" }
                      }
                      transition={
                        isTripGlitch
                          ? { duration: 0.22, repeat: Infinity, ease: "linear" }
                          : { duration: 0.2 }
                      }
                      className="mt-1 font-mono text-3xl font-black tracking-wider text-sky-300"
                    >
                      {isTripGlitch
                        ? "###.#"
                        : labPreview.tinggi !== null
                          ? labPreview.tinggi.toFixed(1)
                          : "---.-"}
                      <span className="ml-1 text-[10px] text-slate-400">
                        KM
                      </span>
                    </motion.p>
                  </motion.div>

                  <div className="absolute bottom-4 left-8 z-20 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Gear
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-300/70 bg-amber-100 text-sm font-black text-amber-900">
                      {labPreview.inisial || "-"}
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Mode
                    </span>
                    <span className="rounded-md border border-rose-300/70 bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-900">
                      {labPreview.mode || "-"}
                    </span>
                  </div>

                  <div className="absolute right-8 bottom-4 z-20 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Ready
                    </span>
                    <motion.div
                      animate={
                        isReadyDisco
                          ? {
                              backgroundColor: [
                                "#ef4444",
                                "#f59e0b",
                                "#22c55e",
                                "#06b6d4",
                                "#3b82f6",
                                "#a855f7",
                                "#ef4444",
                              ],
                              boxShadow: [
                                "0 0 6px #ef4444",
                                "0 0 8px #f59e0b",
                                "0 0 8px #22c55e",
                                "0 0 8px #06b6d4",
                                "0 0 8px #3b82f6",
                                "0 0 8px #a855f7",
                                "0 0 6px #ef4444",
                              ],
                            }
                          : {}
                      }
                      transition={
                        isReadyDisco
                          ? { duration: 0.6, repeat: Infinity, ease: "linear" }
                          : { duration: 0.2 }
                      }
                      className={`h-3 w-3 rounded-full ${!isReadyDisco && (labPreview.aktif ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-slate-600")}`}
                    />
                  </div>
                </div>
              </motion.div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
