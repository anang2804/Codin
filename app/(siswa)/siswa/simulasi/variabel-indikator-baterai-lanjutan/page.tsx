"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BatteryCharging,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Play,
  RotateCcw,
  Smartphone,
  Terminal,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIMULASI_SLUG = "variabel-indikator-baterai-lanjutan";

type CommandChoice =
  | "int"
  | "float"
  | "char"
  | "boolean"
  | "string"
  | "+"
  | "-"
  | "*"
  | "/"
  | ">"
  | ">="
  | "<"
  | "<="
  | "==";

type ChallengeData = {
  statusBaterai: string;
  dayaSekarang: number;
  targetPenuh: number;
  modeHemat: boolean;
};

type LineConfig = {
  before: string;
  middle?: string;
  after: string;
  expected: CommandChoice;
  choices: CommandChoice[];
  expectedSecond?: CommandChoice;
  choicesSecond?: CommandChoice[];
};

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
    statusBaterai: "MENGISI",
    dayaSekarang: 42.5,
    targetPenuh: 100.0,
    modeHemat: false,
  };
}

const COMMAND_DETAILS: Record<
  string,
  { title: string; desc: string; color: string }
> = {
  int: {
    title: "INT",
    desc: "Tipe data bilangan bulat",
    color: "bg-emerald-50 border-emerald-200",
  },
  float: {
    title: "FLOAT",
    desc: "Tipe data bilangan desimal",
    color: "bg-sky-50 border-sky-200",
  },
  char: {
    title: "CHAR",
    desc: "Tipe data satu karakter",
    color: "bg-lime-50 border-lime-200",
  },
  boolean: {
    title: "BOOLEAN",
    desc: "Tipe data true atau false",
    color: "bg-violet-50 border-violet-200",
  },
  string: {
    title: "STRING",
    desc: "Tipe data teks/kumpulan karakter",
    color: "bg-rose-50 border-rose-200",
  },
  "+": {
    title: "PLUS (+)",
    desc: "Operator penjumlahan",
    color: "bg-sky-50 border-sky-200",
  },
  "-": {
    title: "MINUS (-)",
    desc: "Operator pengurangan",
    color: "bg-lime-50 border-lime-200",
  },
  "*": {
    title: "KALI (*)",
    desc: "Operator perkalian",
    color: "bg-violet-50 border-violet-200",
  },
  "/": {
    title: "BAGI (/)",
    desc: "Operator pembagian",
    color: "bg-emerald-50 border-emerald-200",
  },
  ">": {
    title: "PEMBANDING (>)",
    desc: "Mengecek nilai lebih besar dari",
    color: "bg-lime-50 border-lime-200",
  },
  ">=": {
    title: "PEMBANDING (>=)",
    desc: "Mengecek nilai lebih besar atau sama dengan",
    color: "bg-lime-50 border-lime-200",
  },
  "<": {
    title: "PEMBANDING (<)",
    desc: "Mengecek nilai lebih kecil dari",
    color: "bg-emerald-50 border-emerald-200",
  },
  "<=": {
    title: "PEMBANDING (<=)",
    desc: "Mengecek nilai lebih kecil atau sama dengan",
    color: "bg-emerald-50 border-emerald-200",
  },
  "==": {
    title: "PEMBANDING (==)",
    desc: "Mengecek apakah dua nilai sama",
    color: "bg-rose-50 border-rose-200",
  },
  default: {
    title: "SIAP MENULIS",
    desc: "Lengkapi token tipe data, ekspresi, dan pembanding.",
    color: "bg-slate-50 border-slate-200",
  },
};

export default function VariabelIndikatorBateraiLanjutanPage() {
  const [challenge, setChallenge] = useState<ChallengeData>(() =>
    createChallenge(),
  );
  const [selectedCommands, setSelectedCommands] = useState<
    Partial<Record<string, CommandChoice>>
  >({});
  const [openSelectorLine, setOpenSelectorLine] = useState<{
    line: number;
    slot: 1 | 2;
  } | null>(null);
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
  const [batteryPreview, setBatteryPreview] = useState<{
    statusBaterai: string | null;
    dayaSekarang: number | null;
    targetPenuh: number | null;
    modeHemat: boolean | null;
    butuhDaya: number | null;
    pengisianSelesai: boolean | null;
  }>({
    statusBaterai: null,
    dayaSekarang: null,
    targetPenuh: null,
    modeHemat: null,
    butuhDaya: null,
    pengisianSelesai: null,
  });

  const butuhDaya = challenge.targetPenuh - challenge.dayaSekarang;
  const pengisianSelesai = challenge.dayaSekarang >= challenge.targetPenuh;

  const lineConfigs: LineConfig[] = [
    {
      before: "",
      after: ` statusBaterai = \"${challenge.statusBaterai}\";`,
      expected: "string",
      choices: shuffle([
        "string",
        "char",
        "int",
        "float",
        "boolean",
        "+",
        "-",
        "<",
      ]),
    },
    {
      before: "",
      after: ` dayaSekarang = ${challenge.dayaSekarang.toFixed(1)};`,
      expected: "float",
      choices: shuffle([
        "float",
        "int",
        "string",
        "boolean",
        "+",
        "-",
        "*",
        "==",
      ]),
    },
    {
      before: "",
      after: ` targetPenuh = ${challenge.targetPenuh.toFixed(1)};`,
      expected: "float",
      choices: shuffle(["float", "int", "string", "char", "/", "-", "*", "<="]),
    },
    {
      before: "",
      after: ` modeHemat = ${challenge.modeHemat};`,
      expected: "boolean",
      choices: shuffle(["boolean", "string", "float", "int", "+", "==", "*"]),
    },
    {
      before: "",
      middle: "  butuhDaya = targetPenuh ",
      after: " dayaSekarang;",
      expected: "float",
      choices: shuffle([
        "float",
        "boolean",
        "int",
        "string",
        "char",
        "<",
        ">",
        "==",
      ]),
      expectedSecond: "-",
      choicesSecond: shuffle(["-", "+", "*", "/", "<", ">", "<=", ">="]),
    },
    {
      before: "",
      middle: "  pengisianSelesai = dayaSekarang ",
      after: " targetPenuh;",
      expected: "boolean",
      choices: shuffle([
        "boolean",
        "float",
        "int",
        "string",
        "char",
        "-",
        "+",
        "*",
      ]),
      expectedSecond: ">=",
      choicesSecond: shuffle(["<", ">", ">=", "<=", "==", "-", "+", "/"]),
    },
  ];

  const keyFor = (lineIndex: number, slot: 1 | 2) => `${lineIndex}-${slot}`;

  const currentChoice =
    activeLine !== -1 ? selectedCommands[keyFor(activeLine, 1)] : undefined;
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
      if (!response.ok)
        throw new Error(data.error || "Gagal menyimpan progress simulasi");
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

  const handleSelectCommand = (
    lineIndex: number,
    slot: 1 | 2,
    command: CommandChoice,
  ) => {
    if (isRunning) return;
    setSelectedCommands((prev) => ({
      ...prev,
      [keyFor(lineIndex, slot)]: command,
    }));
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
    setBatteryPreview({
      statusBaterai: null,
      dayaSekarang: null,
      targetPenuh: null,
      modeHemat: null,
      butuhDaya: null,
      pengisianSelesai: null,
    });
    if (regenerateChallenge) {
      setChallenge(createChallenge());
      setSelectedCommands({});
      setOpenSelectorLine(null);
    }
  };

  const feedbackHints: Record<CommandChoice, string> = {
    int: "Pastikan token ini mendeklarasikan nilai bulat (angka tanpa desimal).",
    float:
      "Gunakan float untuk nilai desimal seperti daya sekarang dan target penuh.",
    char: "Char digunakan untuk satu karakter, bukan untuk teks status lengkap.",
    boolean: "Boolean digunakan untuk menyimpan hasil logika true atau false.",
    string: "String digunakan untuk teks status baterai seperti MENGISI.",
    "+": "Perhatikan operasi penjumlahan untuk menambah nilai.",
    "-": "Gunakan operasi pengurangan untuk menghitung selisih butuh daya.",
    "*": "Operator ini dipakai untuk perkalian nilai.",
    "/": "Operator ini dipakai saat pembagian nilai.",
    ">": "Gunakan pembanding untuk mengecek nilai lebih besar dari batas.",
    ">=": "Gunakan pembanding untuk mengecek nilai lebih besar atau sama dengan batas.",
    "<": "Gunakan pembanding untuk mengecek nilai lebih kecil dari target.",
    "<=": "Gunakan pembanding untuk mengecek nilai lebih kecil atau sama dengan batas.",
    "==": "Gunakan pembanding ini jika ingin mengecek dua nilai sama persis.",
  };

  const executeStep = (index: number) => {
    if (index >= lineConfigs.length) {
      setIsRunning(false);
      setActiveLine(lineConfigs.length - 1);
      setShowSuccessCard(true);
      setFeedback(
        "Berhasil! Semua token sudah sesuai.\n\nSimulasi indikator baterai menampilkan status, daya saat ini, target penuh, mode hemat, sisa daya yang dibutuhkan, dan status pengisian selesai.\n\nUrutan konsep yang dipakai: string -> float -> float -> boolean -> float -> boolean.",
      );
      return;
    }

    setActiveLine(index);
    const chosen = selectedCommands[keyFor(index, 1)];
    const expected = lineConfigs[index].expected;

    if (!chosen) {
      setIsRunning(false);
      setErrorLine(index);
      setFeedback(
        `Baris ${index + 1} belum lengkap.\n\nLengkapi terlebih dahulu token pada baris ini sebelum melanjutkan simulasi.\n\nPetunjuk: baca kebutuhan tipe data atau operasi pada baris tersebut, lalu pilih token yang paling sesuai.`,
      );
      return;
    }

    if (chosen !== expected) {
      setIsRunning(false);
      setErrorLine(index);
      setFeedback(
        `Baris ${index + 1} belum tepat.\n\n${feedbackHints[expected]}\n\nPetunjuk: pahami fungsi tokennya dulu, lalu pilih operator atau tipe data yang paling sesuai.`,
      );
      return;
    }

    const expectedSecond = lineConfigs[index].expectedSecond;
    if (expectedSecond) {
      const chosenSecond = selectedCommands[keyFor(index, 2)];
      if (!chosenSecond) {
        setIsRunning(false);
        setErrorLine(index);
        setFeedback(
          `Baris ${index + 1} belum lengkap.\n\nToken operator pada baris ini belum dipilih.\n\nPetunjuk: pilih operator yang paling sesuai dengan ekspresi pada baris tersebut.`,
        );
        return;
      }
      if (chosenSecond !== expectedSecond) {
        setIsRunning(false);
        setErrorLine(index);
        setFeedback(
          `Baris ${index + 1} belum tepat.\n\n${feedbackHints[expectedSecond]}\n\nPetunjuk: cek kembali operator pada ekspresi di baris ini.`,
        );
        return;
      }
    }

    if (index === 0)
      setBatteryPreview((prev) => ({
        ...prev,
        statusBaterai: challenge.statusBaterai,
      }));
    if (index === 1)
      setBatteryPreview((prev) => ({
        ...prev,
        dayaSekarang: challenge.dayaSekarang,
      }));
    if (index === 2)
      setBatteryPreview((prev) => ({
        ...prev,
        targetPenuh: challenge.targetPenuh,
      }));
    if (index === 3)
      setBatteryPreview((prev) => ({
        ...prev,
        modeHemat: challenge.modeHemat,
      }));
    if (index === 4)
      setBatteryPreview((prev) => ({
        ...prev,
        butuhDaya,
      }));
    if (index === 5)
      setBatteryPreview((prev) => ({
        ...prev,
        pengisianSelesai,
      }));

    setFeedback(
      `Baris ${index + 1} benar.\n\nToken "${expected}" sudah sesuai dan berhasil dibaca sistem indikator baterai.`,
    );
    timerRef.current = setTimeout(() => executeStep(index + 1), 850);
  };

  const startRunning = () => {
    resetSim(false);
    setIsRunning(true);
    timerRef.current = setTimeout(() => executeStep(0), 250);
  };

  const totalDisplayLines = Math.max(lineConfigs.length, 11);
  const batteryPercent = Math.max(
    0,
    Math.min(
      100,
      ((batteryPreview.dayaSekarang ?? 0) /
        (batteryPreview.targetPenuh ?? 100)) *
        100,
    ),
  );
  const chargingDone = batteryPreview.pengisianSelesai === true;

  const processTone =
    errorLine !== -1
      ? {
          panel: "bg-rose-50/95 border-rose-200",
          divider: "border-rose-200",
          title: "text-rose-600",
          body: "text-rose-700 bg-rose-100/60",
          icon: <AlertTriangle size={13} className="text-rose-500" />,
        }
      : isRunning
        ? {
            panel: "bg-emerald-50/95 border-emerald-200",
            divider: "border-emerald-200",
            title: "text-emerald-700",
            body: "text-emerald-900 bg-emerald-100/60",
            icon: (
              <Activity size={13} className="animate-pulse text-emerald-600" />
            ),
          }
        : showSuccessCard
          ? {
              panel: "bg-emerald-50/95 border-emerald-200",
              divider: "border-emerald-200",
              title: "text-emerald-700",
              body: "text-emerald-900 bg-emerald-100/60",
              icon: <CheckCircle2 size={12} className="text-emerald-500" />,
            }
          : {
              panel: "bg-card border-border",
              divider: "border-border",
              title: "text-muted-foreground",
              body: "text-foreground bg-muted",
              icon: (
                <CheckCircle2 size={12} className="text-muted-foreground" />
              ),
            };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-lime-50 via-emerald-50 to-rose-50 text-foreground">
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
            Indikator Baterai Smartphone
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
            className={`rounded-2xl border p-3 transition-all duration-300 ${processTone.panel}`}
          >
            <div
              className={`flex items-center gap-2 border-b pb-2 ${processTone.divider}`}
            >
              {processTone.icon}
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${processTone.title}`}
              >
                CATATAN PROSES
              </span>
            </div>
            <div
              className={`mt-2 rounded-lg px-3 py-2 text-[11px] leading-snug whitespace-pre-line transition-all duration-300 ${processTone.body}`}
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
                    Indikator Baterai Smartphone
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  Ayo bantu sistem indikator baterai smartphone membaca status
                  pengisian.
                  <br />
                  Lengkapi tipe data, ekspresi, dan pembanding untuk menghitung
                  sisa daya dan menentukan apakah pengisian sudah selesai.
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
                    Berhasil! Level lanjutan selesai
                  </h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                    Tipe data, ekspresi, dan pembanding sudah digunakan dengan
                    tepat pada setiap baris algoritma.
                    <br />
                    Sistem indikator baterai berhasil menghitung sisa daya dan
                    status pengisian secara otomatis.
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
                    ALGORITMA LANJUTAN
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
                      const selected = selectedCommands[keyFor(i, 1)];
                      const selectedSecond = selectedCommands[keyFor(i, 2)];
                      const isActive = activeLine === i;
                      const isCorrect = selected === line.expected;
                      const isWrong = errorLine === i;

                      let highlightClass =
                        "border-emerald-200 bg-emerald-50/30";
                      if (isWrong) {
                        highlightClass =
                          "border-l-4 border-red-600 bg-red-100/50";
                      } else if (isActive && isRunning && isCorrect) {
                        highlightClass =
                          "border-l-4 border-green-600 bg-green-100/60";
                      } else if (isActive && isRunning) {
                        highlightClass =
                          "border-l-4 border-emerald-500 bg-emerald-50";
                      } else if (isActive) {
                        highlightClass =
                          "border-l-4 border-emerald-200 bg-emerald-50/30";
                      }

                      return (
                        <div
                          key={i}
                          className="relative flex h-[26px] items-center"
                        >
                          {isActive && (
                            <motion.div
                              layoutId="lineHighlightBattery"
                              className={`absolute inset-0 -mx-5 -my-1 z-0 ${highlightClass}`}
                            />
                          )}
                          <div className="relative z-10 whitespace-pre font-bold text-slate-900">
                            <span>{line.before}</span>
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => {
                                setOpenSelectorLine({ line: i, slot: 1 });
                                setActiveLine(i);
                              }}
                              className={`rounded px-1.5 py-0.5 transition-all ${selected ? "text-slate-900 hover:bg-emerald-50" : "italic text-slate-300 hover:bg-slate-100"} ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selected ?? "_____"}
                            </button>
                            {line.middle ? (
                              <>
                                <span>{line.middle}</span>
                                <button
                                  type="button"
                                  disabled={isRunning}
                                  onClick={() => {
                                    setOpenSelectorLine({ line: i, slot: 2 });
                                    setActiveLine(i);
                                  }}
                                  className={`rounded px-1.5 py-0.5 transition-all ${selectedSecond ? "text-slate-900 hover:bg-emerald-50" : "italic text-slate-300 hover:bg-slate-100"} ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                  {selectedSecond ?? "_____"}
                                </button>
                              </>
                            ) : null}
                            <span>{line.after}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {openSelectorLine !== null && !isRunning && (
                    <div className="absolute bottom-4 left-5 right-5 z-30 rounded-xl border border-emerald-200 bg-card px-3 py-2 shadow-lg">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        PILIH TOKEN BARIS {openSelectorLine.line + 1}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {(openSelectorLine.slot === 1
                          ? lineConfigs[openSelectorLine.line].choices
                          : (lineConfigs[openSelectorLine.line].choicesSecond ??
                            lineConfigs[openSelectorLine.line].choices)
                        ).map((choice) => (
                          <button
                            key={`${openSelectorLine.line}-${openSelectorLine.slot}-${choice}`}
                            type="button"
                            onClick={() =>
                              handleSelectCommand(
                                openSelectorLine.line,
                                openSelectorLine.slot,
                                choice,
                              )
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

            <aside className="relative flex w-[340px] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900/80 px-5 py-3">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-200">
                  INDIKATOR BATERAI
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Live
                  </span>
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${isRunning ? "animate-pulse bg-emerald-500" : errorLine !== -1 ? "bg-rose-500" : "bg-slate-400"}`}
                  />
                </div>
              </div>

              <div className="relative flex flex-1 flex-col overflow-hidden p-3">
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(148,163,184,.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.2)_1px,transparent_1px)] [background-size:24px_24px]" />

                <div className="relative flex flex-1 flex-col overflow-hidden rounded-[24px] border border-emerald-200/60 bg-gradient-to-b from-emerald-50 via-lime-50 to-white p-4">
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.85),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(167,243,208,0.45),transparent_40%)]" />

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <Smartphone size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Status Baterai
                      </span>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-white px-2 py-1 text-[9px] font-black text-emerald-700">
                      {batteryPreview.statusBaterai ?? "-"}
                    </span>
                  </div>

                  <div className="relative z-10 mt-8 flex flex-1 items-center justify-center">
                    <div className="relative">
                      <div className="absolute -right-3 top-1/2 h-6 w-2 -translate-y-1/2 rounded-r-md bg-slate-300" />
                      <div className="h-20 w-[250px] rounded-xl border-4 border-slate-700 bg-white p-2 shadow-inner">
                        <motion.div
                          className="h-full rounded-md bg-gradient-to-r from-emerald-400 to-lime-500"
                          animate={{ width: `${Math.max(4, batteryPercent)}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      {!chargingDone &&
                        batteryPreview.dayaSekarang !== null && (
                          <motion.div
                            className="absolute inset-0 rounded-xl border border-emerald-300/50"
                            animate={{ opacity: [0.15, 0.45, 0.15] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                          />
                        )}
                    </div>
                  </div>

                  <div className="relative z-10 mt-3 rounded-full border border-white/80 bg-white/85 px-3 py-2 text-[9px] shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600">
                        Daya:{" "}
                        <b className="text-slate-800">
                          {batteryPreview.dayaSekarang !== null
                            ? `${batteryPreview.dayaSekarang.toFixed(1)}%`
                            : "-"}
                        </b>
                      </span>
                      <span className="text-slate-600">
                        Target:{" "}
                        <b className="text-slate-800">
                          {batteryPreview.targetPenuh !== null
                            ? `${batteryPreview.targetPenuh.toFixed(1)}%`
                            : "-"}
                        </b>
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[8px]">
                      <span className="text-slate-500">
                        Butuh{" "}
                        {batteryPreview.butuhDaya !== null
                          ? `${batteryPreview.butuhDaya.toFixed(1)}%`
                          : "-"}
                      </span>
                      <span
                        className={`font-black ${chargingDone ? "text-emerald-700" : "text-slate-700"}`}
                      >
                        {batteryPreview.pengisianSelesai === null
                          ? "Belum cek"
                          : batteryPreview.pengisianSelesai
                            ? "Pengisian Selesai"
                            : "Masih Mengisi"}
                      </span>
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
