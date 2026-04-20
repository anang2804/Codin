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
  | "Number"
  | "String"
  | "Boolean"
  | "Array"
  | "Object"
  | "+"
  | "-"
  | "*"
  | "/"
  | "%"
  | "**"
  | ">"
  | "!="
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
    dayaSekarang: 21.7,
    targetPenuh: 100,
    modeHemat: false,
  };
}

const COMMAND_DETAILS: Record<
  string,
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
    color: "bg-sky-50 border-sky-200",
  },
  Boolean: {
    title: "BOOLEAN",
    desc: "Digunakan untuk menyimpan nilai logika, yaitu benar (true) atau salah (false).",
    color: "bg-lime-50 border-lime-200",
  },
  Array: {
    title: "ARRAY",
    desc: "Digunakan untuk menyimpan kumpulan data dalam satu variabel.",
    color: "bg-violet-50 border-violet-200",
  },
  Object: {
    title: "OBJECT",
    desc: "Digunakan untuk menyimpan data yang memiliki beberapa atribut (pasangan nama dan nilai).",
    color: "bg-rose-50 border-rose-200",
  },
  "+": {
    title: "PENJUMLAHAN (+)",
    desc: "Penjumlahan (menambah nilai)",
    color: "bg-sky-50 border-sky-200",
  },
  "-": {
    title: "PENGURANGAN (-)",
    desc: "Pengurangan (mengurangi nilai)",
    color: "bg-lime-50 border-lime-200",
  },
  "*": {
    title: "PERKALIAN (*)",
    desc: "Perkalian (mengalikan nilai)",
    color: "bg-violet-50 border-violet-200",
  },
  "/": {
    title: "PEMBAGIAN (/)",
    desc: "Pembagian (membagi nilai)",
    color: "bg-emerald-50 border-emerald-200",
  },
  "%": {
    title: "SISA BAGI (%)",
    desc: "Sisa bagi (menghasilkan sisa dari pembagian)",
    color: "bg-emerald-50 border-emerald-200",
  },
  "**": {
    title: "PANGKAT (**)",
    desc: "Pangkat (menghitung perpangkatan)",
    color: "bg-violet-50 border-violet-200",
  },
  ">": {
    title: "LEBIH BESAR DARI (>)",
    desc: "Lebih besar dari",
    color: "bg-lime-50 border-lime-200",
  },
  "!=": {
    title: "TIDAK SAMA DENGAN (!=)",
    desc: "Tidak sama dengan",
    color: "bg-lime-50 border-lime-200",
  },
  ">=": {
    title: "LEBIH BESAR ATAU SAMA DENGAN (>=)",
    desc: "Lebih besar atau sama dengan",
    color: "bg-lime-50 border-lime-200",
  },
  "<": {
    title: "LEBIH KECIL DARI (<)",
    desc: "Lebih kecil dari",
    color: "bg-emerald-50 border-emerald-200",
  },
  "<=": {
    title: "LEBIH KECIL ATAU SAMA DENGAN (<=)",
    desc: "Lebih kecil atau sama dengan",
    color: "bg-emerald-50 border-emerald-200",
  },
  "==": {
    title: "SAMA DENGAN (==)",
    desc: "Sama dengan (membandingkan apakah nilainya sama)",
    color: "bg-rose-50 border-rose-200",
  },
  default: {
    title: "SIAP MENULIS",
    desc: "Lengkapi token tipe data dan operator.",
    color: "bg-slate-50 border-slate-200",
  },
};

function getLineGuideMessage(lineIndex: number) {
  switch (lineIndex) {
    case 0:
      return 'Variabel statusBaterai memiliki nilai "MENGISI", maka bertipe data _______';
    case 1:
      return "Variabel dayaSekarang memiliki nilai 21.7, maka bertipe data _______";
    case 2:
      return "Variabel targetPenuh memiliki nilai 100, maka bertipe data _______";
    case 3:
      return "Variabel modeHemat memiliki nilai false, maka bertipe data _______";
    case 4:
      return "Variabel butuhDaya digunakan untuk menghitung selisih antara targetPenuh dan dayaSekarang, maka operator yang digunakan adalah _______ dan hasilnya bertipe data _______";
    case 5:
      return "Variabel pengisianSelesai digunakan untuk mengecek apakah daya sudah mencapai atau melebihi target, maka operator yang digunakan adalah _______ dan hasilnya bertipe data _______";
    default:
      return "Sistem siap menjalankan algoritma.";
  }
}

function renderBatteryCodePrefix(lineIndex: number) {
  const keywordClass = "text-violet-700 dark:text-violet-300";
  const variableClass = "text-blue-700 dark:text-blue-300";
  const accentVariableClass = "text-violet-700 dark:text-violet-300";
  const numberClass = "text-orange-700 dark:text-orange-300";
  const stringClass = "text-emerald-700 dark:text-emerald-300";
  const commentClass = "text-slate-500 dark:text-slate-400";
  const operatorClass = "text-slate-700 dark:text-slate-300";

  switch (lineIndex) {
    case 0:
      return (
        <>
          <span className={keywordClass}>let</span>{" "}
          <span className={variableClass}>statusBaterai</span>
          <span className={operatorClass}> = </span>
          <span className={stringClass}>"MENGISI"</span>
          <span className={operatorClass}>; </span>
          <span className={commentClass}>// tipe data: </span>
        </>
      );
    case 1:
      return (
        <>
          <span className={keywordClass}>let</span>{" "}
          <span className={variableClass}>dayaSekarang</span>
          <span className={operatorClass}> = </span>
          <span className={numberClass}>21.7</span>
          <span className={operatorClass}>; </span>
          <span className={commentClass}>// tipe data: </span>
        </>
      );
    case 2:
      return (
        <>
          <span className={keywordClass}>let</span>{" "}
          <span className={variableClass}>targetPenuh</span>
          <span className={operatorClass}> = </span>
          <span className={numberClass}>100</span>
          <span className={operatorClass}>; </span>
          <span className={commentClass}>// tipe data: </span>
        </>
      );
    case 3:
      return (
        <>
          <span className={keywordClass}>let</span>{" "}
          <span className={variableClass}>modeHemat</span>
          <span className={operatorClass}> = </span>
          <span className={keywordClass}>false</span>
          <span className={operatorClass}>; </span>
          <span className={commentClass}>// tipe data: </span>
        </>
      );
    case 4:
      return (
        <>
          <span className={keywordClass}>let</span>{" "}
          <span className={variableClass}>butuhDaya</span>
          <span className={operatorClass}> = </span>
          <span className={accentVariableClass}>targetPenuh</span>
          <span className={operatorClass}> </span>
        </>
      );
    case 5:
      return (
        <>
          <span className={keywordClass}>let</span>{" "}
          <span className={variableClass}>pengisianSelesai</span>
          <span className={operatorClass}> = </span>
          <span className={accentVariableClass}>dayaSekarang</span>
          <span className={operatorClass}> </span>
        </>
      );
    default:
      return null;
  }
}

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
  const [chargingFlowActive, setChargingFlowActive] = useState(false);
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
      before: 'let statusBaterai = "MENGISI"; // tipe data: ',
      after: "",
      expected: "String",
      choices: shuffle(["String", "Number", "Boolean", "Array", "Object"]),
    },
    {
      before: "let dayaSekarang = 21.7; // tipe data: ",
      after: "",
      expected: "Number",
      choices: shuffle(["Number", "String", "Boolean", "Array", "Object"]),
    },
    {
      before: "let targetPenuh = 100; // tipe data: ",
      after: "",
      expected: "Number",
      choices: shuffle(["Number", "String", "Boolean", "Array", "Object"]),
    },
    {
      before: "let modeHemat = false; // tipe data: ",
      after: "",
      expected: "Boolean",
      choices: shuffle(["Boolean", "Number", "String", "Array", "Object"]),
    },
    {
      before: "let butuhDaya = targetPenuh ",
      middle: " dayaSekarang; // tipe data: ",
      after: "",
      expected: "-",
      choices: shuffle([
        "+",
        "-",
        "*",
        "/",
        "%",
        "**",
        ">",
        "!=",
        ">=",
        "<",
        "<=",
        "==",
      ]),
      expectedSecond: "Number",
      choicesSecond: shuffle([
        "Number",
        "String",
        "Boolean",
        "Array",
        "Object",
      ]),
    },
    {
      before: "let pengisianSelesai = dayaSekarang ",
      middle: " targetPenuh; // tipe data: ",
      after: "",
      expected: ">=",
      choices: shuffle([
        "+",
        "-",
        "*",
        "/",
        "%",
        "**",
        ">",
        "!=",
        ">=",
        "<",
        "<=",
        "==",
      ]),
      expectedSecond: "Boolean",
      choicesSecond: shuffle([
        "Number",
        "String",
        "Boolean",
        "Array",
        "Object",
      ]),
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
    setChargingFlowActive(false);
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

  const executeStep = (index: number) => {
    if (index >= lineConfigs.length) {
      setIsRunning(false);
      setActiveLine(lineConfigs.length - 1);
      setShowSuccessCard(true);
      setFeedback(
        "Berhasil! Semua token sudah sesuai.\n\nSimulasi indikator baterai menampilkan status, daya saat ini, target penuh, mode hemat, sisa daya yang dibutuhkan, dan status pengisian selesai.\n\nUrutan konsep yang dipakai: String -> Number -> Number -> Boolean -> Number -> Boolean.",
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
        `Baris ${index + 1} belum tepat.\n\nToken pada baris ini belum sesuai konteks algoritma.\n\nPetunjuk: baca ulang tujuan barisnya, lalu pilih token yang perannya paling tepat.`,
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
          `Baris ${index + 1} belum tepat.\n\nOperator pada ekspresi ini belum sesuai konteks perhitungan.\n\nPetunjuk: cek kembali hubungan antar nilai pada baris tersebut.`,
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
    if (index === 5) setChargingFlowActive(true);

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
  const statusBatteryWrong = errorLine === 0;
  const dayaSekarangWrong = errorLine === 1;
  const targetPenuhWrong = errorLine === 2;
  const modeHematWrong = errorLine === 3;
  const butuhDayaWrong = errorLine === 4;
  const pengisianSelesaiWrong = errorLine === 5;
  const visualErrorHint = statusBatteryWrong
    ? "Cek kembali isi status baterai"
    : dayaSekarangWrong
      ? "Periksa tipe data dayaSekarang"
      : targetPenuhWrong
        ? "Periksa nilai target penuh"
        : null;
  const visualBatteryPercent = chargingFlowActive ? 100 : batteryPercent;
  const modeHematOn = batteryPreview.modeHemat === true;
  const batteryFillClass = modeHematOn
    ? "bg-gradient-to-r from-orange-400 to-amber-500"
    : "bg-gradient-to-r from-emerald-400 to-lime-500";
  const displayBatteryLabel = dayaSekarangWrong
    ? "??%"
    : batteryPreview.dayaSekarang !== null
      ? `${chargingFlowActive ? "100" : batteryPreview.dayaSekarang.toFixed(1)}%`
      : "--%";
  const displayButuhDayaLabel = butuhDayaWrong
    ? "??%"
    : batteryPreview.butuhDaya !== null
      ? `${batteryPreview.butuhDaya.toFixed(1)}%`
      : "-";

  const processTone =
    errorLine !== -1
      ? {
          panel:
            "border-rose-300 bg-gradient-to-br from-rose-100 via-orange-100 to-amber-100 dark:border-rose-700/70 dark:from-rose-900/35 dark:via-orange-900/30 dark:to-amber-900/25",
          divider: "border-rose-300/90 dark:border-rose-700/70",
          title: "text-rose-800 dark:text-rose-200",
          body: "bg-rose-50/80 text-rose-900 dark:bg-rose-950/55 dark:text-rose-100",
          icon: (
            <AlertTriangle
              size={13}
              className="text-rose-600 dark:text-rose-400"
            />
          ),
        }
      : isRunning
        ? {
            panel:
              "border-emerald-300 bg-gradient-to-br from-emerald-100 via-sky-100 to-cyan-100 dark:border-emerald-700/70 dark:from-emerald-900/35 dark:via-sky-900/30 dark:to-cyan-900/30",
            divider: "border-emerald-300/90 dark:border-emerald-700/70",
            title: "text-emerald-800 dark:text-emerald-200",
            body: "bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/55 dark:text-emerald-100",
            icon: (
              <Activity
                size={13}
                className="animate-pulse text-emerald-600 dark:text-emerald-400"
              />
            ),
          }
        : showSuccessCard
          ? {
              panel:
                "border-emerald-300 bg-gradient-to-br from-emerald-100 via-sky-100 to-cyan-100 dark:border-emerald-700/70 dark:from-emerald-900/35 dark:via-sky-900/30 dark:to-cyan-900/30",
              divider: "border-emerald-300/90 dark:border-emerald-700/70",
              title: "text-emerald-800 dark:text-emerald-200",
              body: "bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/55 dark:text-emerald-100",
              icon: (
                <CheckCircle2
                  size={12}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              ),
            }
          : {
              panel:
                "border-emerald-300 bg-gradient-to-br from-emerald-100 via-sky-100 to-cyan-100 dark:border-emerald-700/70 dark:from-emerald-900/35 dark:via-sky-900/30 dark:to-cyan-900/30",
              divider: "border-emerald-300/90 dark:border-emerald-700/70",
              title: "text-emerald-800 dark:text-emerald-200",
              body: "bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/55 dark:text-emerald-100",
              icon: (
                <CheckCircle2
                  size={12}
                  className="text-emerald-600 dark:text-emerald-400"
                />
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
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black uppercase italic leading-none tracking-tighter">
              Indikator Baterai Smartphone
            </h1>
            <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
              Level Lanjutan
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
                  Ayo bantu sistem mengelola pengisian daya! 🔋 Hitung butuhDaya
                  yang diperlukan hingga penuh, dan pantau status
                  pengisianSelesai agar aliran listrik berhenti otomatis.
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

          <div className="relative flex flex-1 gap-5 overflow-hidden px-6 pb-6">
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

              <div className="relative flex flex-1 overflow-hidden font-mono text-[11px] leading-[21px]">
                <div className="w-10 shrink-0 select-none overflow-hidden border-r border-border bg-muted/30 pt-4 pr-3 text-right text-muted-foreground">
                  {Array.from({ length: totalDisplayLines }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-[21px] transition-all ${activeLine === i ? "scale-110 pr-1 font-black text-emerald-700" : ""}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                <div className="relative flex-1 overflow-hidden bg-card">
                  <div className="absolute inset-0 z-10 overflow-hidden whitespace-pre p-4 pt-4">
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
                          className="relative flex h-[21px] items-center"
                        >
                          {isActive && (
                            <motion.div
                              layoutId="lineHighlightBattery"
                              className={`absolute inset-0 -mx-4 -my-1 z-0 ${highlightClass}`}
                            />
                          )}
                          <div className="relative z-10 whitespace-pre font-bold text-slate-900 dark:text-slate-100">
                            {renderBatteryCodePrefix(i)}
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => {
                                setOpenSelectorLine({ line: i, slot: 1 });
                                setActiveLine(i);
                                setFeedback(getLineGuideMessage(i));
                              }}
                              className={`rounded-md border px-2 py-0.5 transition-all ${selected ? "border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-700 dark:bg-sky-900/35 dark:text-sky-200" : "border-transparent italic text-slate-300 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60"} ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selected ?? "_____"}
                            </button>
                            {line.middle ? (
                              <>
                                {i === 4 ? (
                                  <>
                                    <span className="text-slate-700 dark:text-slate-300">
                                      {" "}
                                    </span>
                                    <span className="text-violet-700 dark:text-violet-300">
                                      dayaSekarang
                                    </span>
                                    <span className="text-slate-700 dark:text-slate-300">
                                      ;{" "}
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400">
                                      // tipe data:
                                    </span>
                                  </>
                                ) : i === 5 ? (
                                  <>
                                    <span className="text-slate-700 dark:text-slate-300">
                                      {" "}
                                    </span>
                                    <span className="text-violet-700 dark:text-violet-300">
                                      targetPenuh
                                    </span>
                                    <span className="text-slate-700 dark:text-slate-300">
                                      ;{" "}
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400">
                                      // tipe data:
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-slate-700 dark:text-slate-300">
                                    {line.middle}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  disabled={isRunning}
                                  onClick={() => {
                                    setOpenSelectorLine({ line: i, slot: 2 });
                                    setActiveLine(i);
                                    setFeedback(getLineGuideMessage(i));
                                  }}
                                  className={`rounded-md border px-2 py-0.5 transition-all ${selectedSecond ? "border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-700 dark:bg-sky-900/35 dark:text-sky-200" : "border-transparent italic text-slate-300 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60"} ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
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
                            className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold tracking-normal ${COMMAND_DETAILS[choice]?.color || COMMAND_DETAILS.default.color}`}
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

                  <AnimatePresence>
                    {visualErrorHint && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute right-4 top-14 z-20 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[9px] font-black text-rose-700 shadow-sm"
                      >
                        {visualErrorHint}
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                      <motion.div
                        className={`absolute -right-3 top-1/2 h-6 w-2 -translate-y-1/2 rounded-r-md ${targetPenuhWrong ? "bg-rose-300" : "bg-slate-300"}`}
                        animate={
                          targetPenuhWrong
                            ? { opacity: [1, 0.4, 1] }
                            : { opacity: 1 }
                        }
                        transition={
                          targetPenuhWrong
                            ? { duration: 0.8, repeat: Infinity }
                            : { duration: 0.2 }
                        }
                      />

                      {statusBatteryWrong && (
                        <motion.div
                          className="absolute -right-3 top-1/2 h-6 w-2 -translate-y-1/2 rounded-r-md bg-rose-300"
                          animate={{ x: [0, 2, 0], opacity: [1, 0.5, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        />
                      )}

                      <div className="relative h-20 w-[250px] rounded-xl border-4 border-slate-700 bg-white p-2 shadow-inner">
                        <motion.div
                          className={`absolute bottom-1 top-1 w-[2px] ${targetPenuhWrong ? "bg-rose-500" : "bg-slate-400/60"}`}
                          animate={
                            targetPenuhWrong
                              ? {
                                  left: ["94%", "88%", "94%"],
                                  opacity: [1, 0.8, 1],
                                }
                              : { left: "94%", opacity: 0.65 }
                          }
                          transition={
                            targetPenuhWrong
                              ? {
                                  duration: 0.9,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }
                              : { duration: 0.2 }
                          }
                        />

                        {targetPenuhWrong && (
                          <motion.div
                            className="pointer-events-none absolute inset-y-1 right-1 w-[14%] rounded-r-md bg-rose-200/55"
                            animate={{ opacity: [0.2, 0.6, 0.2] }}
                            transition={{ duration: 0.9, repeat: Infinity }}
                          />
                        )}

                        <motion.div
                          className={`h-full rounded-md ${batteryFillClass}`}
                          animate={
                            dayaSekarangWrong
                              ? { width: ["24%", "82%", "36%", "70%", "51%"] }
                              : {
                                  width: `${Math.max(4, visualBatteryPercent)}%`,
                                }
                          }
                          transition={{
                            duration: dayaSekarangWrong
                              ? 1.0
                              : chargingFlowActive
                                ? 1.6
                                : 0.6,
                            ease: "easeInOut",
                            repeat: dayaSekarangWrong ? Infinity : 0,
                          }}
                        />

                        {chargingFlowActive && (
                          <motion.div
                            className="pointer-events-none absolute inset-y-2 w-12 rounded-md bg-white/30"
                            animate={{ x: [0, 185, 0], opacity: [0, 0.55, 0] }}
                            transition={{
                              duration: 1.3,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        )}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-black tracking-wide text-slate-700 shadow-sm">
                            {displayBatteryLabel}
                          </span>
                        </div>

                        {dayaSekarangWrong && (
                          <motion.div
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-rose-100/95 p-1 text-rose-600 shadow-sm"
                            animate={{
                              scale: [1, 1.12, 1],
                              opacity: [0.7, 1, 0.7],
                            }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                          >
                            <AlertTriangle size={12} />
                          </motion.div>
                        )}

                        {batteryPreview.statusBaterai === "MENGISI" && (
                          <motion.div
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-yellow-100/90 p-1 text-amber-500 shadow-sm"
                            animate={{
                              scale: [1, 1.12, 1],
                              opacity: [0.75, 1, 0.75],
                            }}
                            transition={{ duration: 0.9, repeat: Infinity }}
                          >
                            <Zap size={12} fill="currentColor" />
                          </motion.div>
                        )}

                        {pengisianSelesaiWrong && (
                          <motion.div
                            className="pointer-events-none absolute inset-1 rounded-md border-2 border-rose-400/80"
                            animate={{ opacity: [0.35, 0.95, 0.35] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                          />
                        )}
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
                    <div className="flex items-center justify-end gap-2">
                      <motion.span
                        className={`rounded-full border px-2 py-0.5 ${modeHematWrong ? "border-rose-300 bg-rose-100 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                        animate={
                          modeHematWrong
                            ? { scale: [1, 1.05, 1], opacity: [1, 0.65, 1] }
                            : { scale: 1, opacity: 1 }
                        }
                        transition={
                          modeHematWrong
                            ? { duration: 0.8, repeat: Infinity }
                            : { duration: 0.2 }
                        }
                      >
                        Hemat:{" "}
                        {batteryPreview.modeHemat === null
                          ? "-"
                          : batteryPreview.modeHemat
                            ? "ON"
                            : "OFF"}
                      </motion.span>
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
                      <motion.span
                        className={`flex items-center gap-1 ${butuhDayaWrong ? "font-black text-rose-700" : "text-slate-500"}`}
                        animate={
                          butuhDayaWrong
                            ? { opacity: [1, 0.45, 1], x: [0, 1, 0] }
                            : { opacity: 1, x: 0 }
                        }
                        transition={
                          butuhDayaWrong
                            ? { duration: 0.75, repeat: Infinity }
                            : { duration: 0.2 }
                        }
                      >
                        Butuh {displayButuhDayaLabel}
                        {butuhDayaWrong && <AlertTriangle size={10} />}
                      </motion.span>
                      <motion.span
                        className={`flex items-center gap-1 font-black ${pengisianSelesaiWrong ? "text-rose-700" : chargingDone ? "text-emerald-700" : "text-slate-700"}`}
                        animate={
                          pengisianSelesaiWrong
                            ? { opacity: [1, 0.45, 1], y: [0, -1, 0] }
                            : { opacity: 1, y: 0 }
                        }
                        transition={
                          pengisianSelesaiWrong
                            ? { duration: 0.75, repeat: Infinity }
                            : { duration: 0.2 }
                        }
                      >
                        {pengisianSelesaiWrong
                          ? "Status cek gagal"
                          : batteryPreview.pengisianSelesai === null
                            ? "Belum cek"
                            : batteryPreview.pengisianSelesai
                              ? "Pengisian Selesai"
                              : "Masih Mengisi"}
                        {pengisianSelesaiWrong && <AlertTriangle size={10} />}
                      </motion.span>
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
