"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
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

const SIMULASI_SLUG = "variabel-data-siswa";

type CommandChoice = "int" | "short" | "long" | "float" | "double" | "char";

type StudentData = {
  umur: number;
  tinggi: number;
  jenisKelamin: "L" | "P" | "";
};

type FruitVisual = {
  emoji: string;
  left: number;
  top: number;
  scale: number;
  rotate: number;
};

type ChallengeData = {
  umur: number;
  tinggi: number;
  jenisKelamin: "L" | "P";
  studentVisuals: FruitVisual[];
};

const STUDENT_EMOJIS = ["🧑", "👧", "👦", "🧕", "👨", "👩"] as const;
const CHAR_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
const FLOAT_DECIMAL_FRUITS = [
  "0.1",
  "1.5",
  "2.7",
  "3.9",
  "4.2",
  "5.8",
] as const;
const SHORT_SMALL_NUMBER_FRUITS = [
  "7",
  "18",
  "42",
  "120",
  "512",
  "32000",
] as const;
const INT_WHOLE_NUMBER_FRUITS = ["1", "2", "3", "4", "5", "8"] as const;
const LONG_BIG_NUMBER_FRUITS = [
  "120000",
  "450000",
  "980000",
  "1500000",
  "2300000",
  "7800000",
] as const;

const MISMATCH_FRUIT_SCATTER = [
  { emoji: "🧑", left: 6, top: 68, rotate: -28 },
  { emoji: "👧", left: 20, top: 82, rotate: 22 },
  { emoji: "👦", left: 74, top: 80, rotate: -18 },
  { emoji: "👩", left: 88, top: 66, rotate: 30 },
] as const;

const MISMATCH_CHAR_SCATTER = [
  { emoji: "🧑", left: 8, top: 70, rotate: -20 },
  { emoji: "👧", left: 22, top: 83, rotate: 18 },
  { emoji: "👦", left: 76, top: 81, rotate: -16 },
  { emoji: "👨", left: 90, top: 68, rotate: 22 },
] as const;

const MISMATCH_LONG_SCATTER = [
  { emoji: "🧑", left: 6, top: 68, rotate: -10 },
  { emoji: "👩", left: 20, top: 82, rotate: 12 },
  { emoji: "👨", left: 74, top: 80, rotate: -8 },
  { emoji: "🧕", left: 88, top: 66, rotate: 10 },
] as const;

const MISMATCH_INT_SCATTER = [
  { emoji: "👦", left: 8, top: 70, rotate: -18 },
  { emoji: "👧", left: 22, top: 84, rotate: 15 },
  { emoji: "🧑", left: 76, top: 81, rotate: -15 },
  { emoji: "👩", left: 90, top: 68, rotate: 18 },
] as const;

const MISMATCH_SHORT_SCATTER = [
  { emoji: "👧", left: 10, top: 72, rotate: -18 },
  { emoji: "👦", left: 23, top: 84, rotate: 14 },
  { emoji: "🧑", left: 75, top: 82, rotate: -12 },
  { emoji: "👩", left: 89, top: 69, rotate: 15 },
] as const;

const MISMATCH_FLOAT_SCATTER = [
  { emoji: "🧑", left: 7, top: 69, rotate: -15 },
  { emoji: "👧", left: 22, top: 83, rotate: 12 },
  { emoji: "👨", left: 75, top: 81, rotate: -10 },
  { emoji: "👩", left: 90, top: 67, rotate: 14 },
] as const;

const MISMATCH_DOUBLE_SCATTER = [
  { emoji: "🧑", left: 8, top: 69, rotate: -14 },
  { emoji: "✨", left: 24, top: 82, rotate: 10 },
  { emoji: "👨", left: 74, top: 80, rotate: -9 },
  { emoji: "👩", left: 89, top: 66, rotate: 12 },
] as const;

const TOTAL_CODE_LINES = 3;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createChallenge(): ChallengeData {
  const umur = randomInt(15, 18);
  const tinggiBulat = randomInt(150, 175);
  const tinggiDesimal = randomInt(1, 9);
  const tinggi = Number(`${tinggiBulat}.${tinggiDesimal}`);
  const jenisKelamin = Math.random() > 0.5 ? "L" : "P";

  const studentVisuals = Array.from({ length: randomInt(5, 9) }).map(() => ({
    emoji: STUDENT_EMOJIS[randomInt(0, STUDENT_EMOJIS.length - 1)],
    left: randomInt(10, 78),
    top: randomInt(30, 76),
    scale: Number((Math.random() * 0.35 + 0.85).toFixed(2)),
    rotate: randomInt(-24, 24),
  }));

  return {
    umur,
    tinggi,
    jenisKelamin,
    studentVisuals,
  };
}

const COMMAND_DETAILS = {
  INT: {
    title: "INT",
    desc: "int: tipe data untuk menyimpan bilangan bulat",
    color: "bg-emerald-50 border-emerald-200",
  },
  SHORT: {
    title: "SHORT",
    desc: "short: angka bulat kecil",
    color: "bg-lime-50 border-lime-200",
  },
  LONG: {
    title: "LONG",
    desc: "long: tipe data untuk menyimpan bilangan bulat berukuran besar",
    color: "bg-green-50 border-green-200",
  },
  FLOAT: {
    title: "FLOAT",
    desc: "float: tipe data untuk menyimpan bilangan desimal",
    color: "bg-sky-50 border-sky-200",
  },
  DOUBLE: {
    title: "DOUBLE",
    desc: "double: angka desimal lebih detail",
    color: "bg-emerald-50 border-emerald-200",
  },
  CHAR: {
    title: "CHAR",
    desc: "char: tipe data untuk menyimpan satu karakter",
    color: "bg-rose-50 border-rose-200",
  },
  DEFAULT: {
    title: "SIAP MENULIS",
    desc: "Lengkapi tipe data variabel, lalu amati ekspresi sederhana yang terbentuk dari data.",
    color: "bg-slate-50 border-slate-200",
  },
} as const;

function getEducationalFeedback(
  typedLine: string,
  lineIdx: number,
  expectedLine: string,
  umur: number,
  tinggi: number,
  jenisKelamin: "L" | "P",
): string {
  const trimmed = typedLine.trim().toLowerCase();

  void expectedLine;

  if (!trimmed || trimmed.includes("_____")) {
    return `Baris ${lineIdx + 1} belum lengkap. Isi tipe data pada bagian kosong terlebih dahulu.`;
  }

  if (
    lineIdx === 0 &&
    (trimmed.startsWith("float") ||
      trimmed.startsWith("double") ||
      trimmed.startsWith("char"))
  ) {
    return `Baris 1 salah. umur bernilai ${umur} (bilangan bulat). Pilih tipe data yang paling sesuai untuk bilangan bulat.`;
  }

  if (
    lineIdx === 1 &&
    (trimmed.startsWith("int") ||
      trimmed.startsWith("short") ||
      trimmed.startsWith("long") ||
      trimmed.startsWith("char"))
  ) {
    return `Baris 2 salah. tinggi bernilai ${tinggi.toFixed(1)} (desimal). Pilih tipe data yang paling sesuai untuk angka desimal.`;
  }

  if (lineIdx === 2 && !trimmed.startsWith("char")) {
    return `Baris 3 salah. jenis_kelamin bernilai '${jenisKelamin}' (satu karakter). Pilih tipe data yang sesuai untuk satu karakter.`;
  }

  if (
    lineIdx === 0 &&
    (trimmed.startsWith("short") || trimmed.startsWith("long"))
  ) {
    return "Baris 1 masih belum tepat. Cermati kembali jenis nilai pada variabel umur.";
  }

  if (lineIdx === 1 && trimmed.startsWith("double")) {
    return "Baris 2 masih belum tepat. Fokus ke tipe data desimal yang diminta di simulasi ini.";
  }

  return `Baris ${lineIdx + 1} belum tepat. Cek lagi kecocokan tipe data dengan nilainya.`;
}

export default function VariabelDataSiswaPage() {
  const [selectedCommands, setSelectedCommands] = useState<
    Partial<Record<number, CommandChoice>>
  >({});
  const [openSelectorLine, setOpenSelectorLine] = useState<number | null>(null);
  const [activeLine, setActiveLine] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [errorLine, setErrorLine] = useState(-1);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [runVisualKey, setRunVisualKey] = useState(0);
  const [mismatchType, setMismatchType] = useState<
    "umur" | "tinggi" | "jenisKelamin" | null
  >(null);
  const [mismatchChoice, setMismatchChoice] = useState<CommandChoice | null>(
    null,
  );
  const [feedback, setFeedback] = useState(
    "Sistem siap menjalankan algoritma.",
  );
  const [hasTried, setHasTried] = useState(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeData>(() =>
    createChallenge(),
  );

  const [studentData, setStudentData] = useState<StudentData>({
    umur: 0,
    tinggi: 0,
    jenisKelamin: "",
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const blankLineSuffix: Record<number, string> = {
    0: `umur = ${challenge.umur};`,
    1: `tinggi = ${challenge.tinggi.toFixed(1)};`,
    2: `jenis_kelamin = '${challenge.jenisKelamin}';`,
  };
  const ghostCommandHints: Record<number, CommandChoice> = {
    0: "int",
    1: "float",
    2: "char",
  };

  const linesArray = Array.from({ length: TOTAL_CODE_LINES }).map((_, i) => {
    const selected = selectedCommands[i] ?? "_____";
    return `${selected} ${blankLineSuffix[i]}`;
  });

  const currentLine = linesArray[activeLine]?.trim().toLowerCase() || "";
  const currentDesc = currentLine.startsWith("int")
    ? COMMAND_DETAILS.INT
    : currentLine.startsWith("short")
      ? COMMAND_DETAILS.SHORT
      : currentLine.startsWith("long")
        ? COMMAND_DETAILS.LONG
        : currentLine.startsWith("float")
          ? COMMAND_DETAILS.FLOAT
          : currentLine.startsWith("double")
            ? COMMAND_DETAILS.DOUBLE
            : currentLine.startsWith("char")
              ? COMMAND_DETAILS.CHAR
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

  const triggerMismatchVisual = (
    type: "umur" | "tinggi" | "jenisKelamin",
    wrongChoice: CommandChoice | null,
  ) => {
    setMismatchType(type);
    setMismatchChoice(wrongChoice);
  };

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

  const handleSelectCommand = (lineIndex: number, command: CommandChoice) => {
    if (isRunning) return;
    setSelectedCommands((prev) => ({ ...prev, [lineIndex]: command }));
    setOpenSelectorLine(null);
    setActiveLine(lineIndex);
    setErrorLine(-1);
    setShowSuccessCard(false);
  };

  const resetSim = (regenerateChallenge: boolean) => {
    setIsRunning(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setMismatchType(null);
    setMismatchChoice(null);
    setFeedback("Sistem siap menjalankan algoritma.");
    setStudentData({ umur: 0, tinggi: 0, jenisKelamin: "" });
    if (regenerateChallenge) {
      setChallenge(createChallenge());
      setSelectedCommands({});
      setOpenSelectorLine(null);
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const executeStep = async (
    index: number,
    runChallenge: ChallengeData,
  ): Promise<void> => {
    if (index >= TOTAL_CODE_LINES) {
      setIsRunning(false);
      setActiveLine(-1);
      setShowSuccessCard(true);
      setFeedback(
        "Berhasil! Tipe data variabel benar, lalu ekspresi umur + 1 dapat dihitung dengan tepat.",
      );
      return;
    }

    setActiveLine(index);

    const lineSuffixByIndex = [
      `umur = ${runChallenge.umur};`,
      `tinggi = ${runChallenge.tinggi.toFixed(1)};`,
      `jenis_kelamin = '${runChallenge.jenisKelamin}';`,
    ] as const;

    const expectedSolutionByIndex = [
      `int umur = ${runChallenge.umur};`,
      `float tinggi = ${runChallenge.tinggi.toFixed(1)};`,
      `char jenis_kelamin = '${runChallenge.jenisKelamin}';`,
    ] as const;

    const lineParsed =
      `${selectedCommands[index] ?? "_____"} ${lineSuffixByIndex[index]}`
        .trim()
        .toLowerCase();
    const solution = expectedSolutionByIndex[index].toLowerCase();

    if (lineParsed !== solution) {
      setIsRunning(false);
      setErrorLine(index);
      setShowSuccessCard(false);
      triggerMismatchVisual(
        index === 0 ? "umur" : index === 1 ? "tinggi" : "jenisKelamin",
        selectedCommands[index] ?? null,
      );
      setFeedback(
        getEducationalFeedback(
          `${selectedCommands[index] ?? "_____"} ${lineSuffixByIndex[index]}`,
          index,
          expectedSolutionByIndex[index],
          runChallenge.umur,
          runChallenge.tinggi,
          runChallenge.jenisKelamin,
        ),
      );
      return;
    }

    if (index === 0) {
      setStudentData((prev) => ({ ...prev, umur: runChallenge.umur }));
      setFeedback(`Baris 1 benar: int umur = ${runChallenge.umur};`);
    }

    if (index === 1) {
      setStudentData((prev) => ({ ...prev, tinggi: runChallenge.tinggi }));
      setFeedback(
        `Baris 2 benar: float tinggi = ${runChallenge.tinggi.toFixed(1)};`,
      );
    }

    if (index === 2) {
      setStudentData((prev) => ({
        ...prev,
        jenisKelamin: runChallenge.jenisKelamin,
      }));
      setFeedback(
        `Baris 3 benar: char jenis_kelamin = '${runChallenge.jenisKelamin}';`,
      );
    }

    timerRef.current = setTimeout(() => {
      void executeStep(index + 1, runChallenge);
    }, 900);
  };

  const startRunning = () => {
    resetSim(false);
    setRunVisualKey((prev) => prev + 1);
    const runChallenge = createChallenge();
    setChallenge(runChallenge);
    setIsRunning(true);
    void executeStep(0, runChallenge);
  };

  const isJumlahMismatch = mismatchType === "umur";
  const isBeratMismatch = mismatchType === "tinggi";
  const isJenisKelaminMismatch = mismatchType === "jenisKelamin";
  const isMismatchVisual = mismatchType !== null;
  const isMismatchChar = mismatchChoice === "char";
  const isMismatchDouble = mismatchChoice === "double";
  const isMismatchLong = mismatchChoice === "long";
  const isMismatchInt = mismatchChoice === "int";
  const isMismatchShort = mismatchChoice === "short";
  const isMismatchFloat = mismatchChoice === "float";
  const isMismatchDecimalFamily =
    mismatchChoice === "float" || mismatchChoice === "double";
  const isMismatchIntegerFamily =
    mismatchChoice === "int" ||
    mismatchChoice === "short" ||
    mismatchChoice === "long";

  const mismatchScatter = (() => {
    if (isMismatchChar) return MISMATCH_CHAR_SCATTER;
    if (isMismatchLong) return MISMATCH_LONG_SCATTER;
    if (isMismatchShort) return MISMATCH_SHORT_SCATTER;
    if (isMismatchInt) return MISMATCH_INT_SCATTER;
    if (isMismatchDouble) return MISMATCH_DOUBLE_SCATTER;
    if (isMismatchFloat) return MISMATCH_FLOAT_SCATTER;
    return MISMATCH_FRUIT_SCATTER;
  })();

  const mismatchAccentClass = (() => {
    if (isMismatchChar) return "border-violet-300/70 bg-violet-500/20";
    if (isMismatchLong) return "border-amber-300/70 bg-amber-500/20";
    if (isMismatchShort) return "border-fuchsia-300/70 bg-fuchsia-500/20";
    if (isMismatchInt) return "border-orange-300/70 bg-orange-500/20";
    if (isMismatchDouble) return "border-lime-300/70 bg-lime-500/20";
    if (isMismatchFloat) return "border-emerald-300/70 bg-emerald-500/20";
    return "border-rose-400/60 bg-rose-500/20";
  })();

  const mismatchBarClass = (() => {
    if (isMismatchChar)
      return "bg-gradient-to-r from-violet-300 to-fuchsia-200";
    if (isMismatchLong) return "bg-gradient-to-r from-amber-300 to-yellow-200";
    if (isMismatchShort) return "bg-gradient-to-r from-fuchsia-300 to-pink-200";
    if (isMismatchInt) return "bg-gradient-to-r from-orange-300 to-amber-200";
    if (isMismatchDouble)
      return "bg-gradient-to-r from-lime-300 to-emerald-200";
    if (isMismatchFloat)
      return "bg-gradient-to-r from-emerald-300 to-green-200";
    return "bg-gradient-to-r from-rose-400 to-rose-200";
  })();

  const mismatchVisualEmoji = (() => {
    if (isMismatchChar) return "🔤";
    if (isMismatchLong) return "🧺";
    if (isMismatchShort) return "📏";
    if (isMismatchInt) return "🔢";
    if (isMismatchDouble) return "🎯";
    if (isMismatchFloat) return "💧";
    return "⚠️";
  })();

  const beratMismatchAnimation = (() => {
    if (!isBeratMismatch) return { scale: 1, y: 0, rotate: 0 };
    if (isMismatchLong) {
      return {
        scale: [1, 1.1, 0.96, 1],
        y: [0, 4, -2, 0],
        rotate: [0, -1, 1, 0],
      };
    }
    if (isMismatchDouble) {
      return {
        scale: [1, 1.02, 1.05, 1],
        y: [0, -1, 1, -1, 0],
        rotate: [0, 1.8, -1.8, 0],
      };
    }
    if (isMismatchFloat) {
      return {
        scale: [1, 1.03, 1],
        y: [0, -3, 3, 0],
        rotate: [0, 0.6, -0.6, 0],
      };
    }
    if (isMismatchChar) {
      return {
        scale: [1, 1.04, 0.98, 1],
        y: [0, -4, 2, 0],
        rotate: [0, 2, -2, 0],
      };
    }
    if (isMismatchShort) {
      return {
        scale: [1, 1.06, 0.94, 1],
        y: [0, -5, 3, -2, 0],
        rotate: [0, -2.5, 2.5, 0],
      };
    }
    return {
      scale: [1, 1.05, 0.98, 1],
      y: [0, -3, 2, 0],
      rotate: [0, -0.8, 0.8, 0],
    };
  })();

  const jumlahMismatchAnimation = (() => {
    if (!isMismatchVisual) return { rotate: 0, y: 0, scaleX: 1 };
    if (isMismatchLong) {
      return {
        rotate: [0, -2, 2, 0],
        y: [0, 6, 3, 0],
        scaleX: [1, 1.04, 0.98, 1],
      };
    }
    if (isMismatchDouble) {
      return {
        rotate: [0, -1, 1, -1, 1, 0],
        y: [0, -1, 1, -1, 0],
        scaleX: [1, 1.02, 0.98, 1],
      };
    }
    if (isMismatchFloat) {
      return {
        rotate: [0, -3, 3, -2, 2, 0],
        y: [0, -1, 2, -1, 0],
        scaleX: [1, 0.99, 1.01, 1],
      };
    }
    if (isMismatchChar) {
      return {
        rotate: [0, 5, -5, 3, -3, 0],
        y: [0, -2, 1, -2, 0],
        scaleX: [1, 1.01, 0.99, 1],
      };
    }
    if (isMismatchShort) {
      return {
        rotate: [0, -7, 7, -5, 5, 0],
        y: [0, -4, 1, -3, 0],
        scaleX: [1, 1.03, 0.97, 1],
      };
    }
    return {
      rotate: [0, -6, 6, -4, 4, 0],
      y: [0, -2, 0, 2, 0],
      scaleX: [1, 0.98, 1.02, 1],
    };
  })();

  const jumlahMismatchSymbol = (() => {
    if (isMismatchChar) return "🔠";
    if (isMismatchLong) return "📚";
    if (isMismatchShort) return "🔢";
    if (isMismatchInt) return "🔢";
    if (isMismatchDouble) return "📏";
    if (isMismatchFloat) return "📐";
    return "❓";
  })();

  const getMismatchScatterMotion = (baseRotate: number) => {
    if (isMismatchChar) {
      return {
        y: [0, -10, 5, -7, 0],
        x: [0, -8, 8, -4, 4, 0],
        rotate: [baseRotate, baseRotate + 120, baseRotate - 90, baseRotate],
        scale: [1, 1.16, 0.9, 1],
        opacity: [1, 0.9, 1],
      };
    }

    if (isMismatchLong) {
      return {
        y: [0, 18, 8, 14],
        x: [0, -2, 2, 0],
        rotate: [baseRotate, baseRotate + 5, baseRotate],
        scale: [1, 1.08, 0.93, 1],
        opacity: [1, 1, 0.95],
      };
    }

    if (isMismatchDouble) {
      return {
        y: [0, -4, 4, -3, 3, 0],
        x: [0, -5, 5, -4, 4, 0],
        rotate: [baseRotate, baseRotate + 16, baseRotate - 16, baseRotate],
        scale: [1, 1.04, 0.96, 1.02, 1],
        opacity: [0.95, 0.8, 1],
      };
    }

    if (isMismatchFloat) {
      return {
        y: [0, 4, -5, 4, 0],
        x: [0, -4, 4, -2, 2, 0],
        rotate: [baseRotate, baseRotate + 12, baseRotate - 12, baseRotate],
        scale: [1, 0.95, 1.06, 1],
        opacity: [0.95, 0.65, 0.95],
      };
    }

    if (isMismatchShort) {
      return {
        y: [0, -7, 6, -5, 0],
        x: [0, -9, 9, -6, 6, 0],
        rotate: [baseRotate, baseRotate + 20, baseRotate - 20, baseRotate],
        scale: [1, 1.15, 0.88, 1],
        opacity: [1, 0.88, 1],
      };
    }

    return {
      y: [0, -3, 3, 0],
      x: [0, -5, 5, 0],
      rotate: [baseRotate, baseRotate + 9, baseRotate],
      scale: [1, 1.05, 0.97, 1],
      opacity: [1, 1, 0.98],
    };
  };

  const totalDisplayLines = Math.max(TOTAL_CODE_LINES, 10);
  const ekspresiUmurTahunDepan =
    studentData.umur > 0 ? studentData.umur + 1 : null;
  const ekspresiPreview = ekspresiUmurTahunDepan
    ? `${studentData.umur} + 1 = ${ekspresiUmurTahunDepan}`
    : "umur + 1 = ?";

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

          <div>
            <h1 className="text-lg font-black uppercase italic leading-none tracking-tighter">
              Variabel Terpadu Siswa
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
              Deskripsi Konsep
            </h2>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentDesc.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-3xl border p-5 shadow-sm ${currentDesc.color}`}
            >
              <div className="mb-3 flex items-center gap-2">
                <Edit3 size={16} className="text-emerald-700" />
                <h3 className="text-xs font-black uppercase tracking-tight text-foreground">
                  {currentDesc.title}
                </h3>
              </div>
              <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">
                {currentDesc.desc}
              </p>
            </motion.div>
          </AnimatePresence>

          <div
            className={`rounded-2xl border p-3 transition-all duration-300 ${
              errorLine !== -1
                ? "border-rose-200 bg-rose-50/95"
                : "border-border bg-card"
            }`}
          >
            <div
              className={`flex items-center gap-2 border-b pb-2 ${
                errorLine !== -1 ? "border-rose-200" : "border-border"
              }`}
            >
              {errorLine !== -1 ? (
                <AlertTriangle size={13} className="text-rose-500" />
              ) : (
                <CheckCircle2 size={12} className="text-muted-foreground" />
              )}
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  errorLine !== -1 ? "text-rose-600" : "text-muted-foreground"
                }`}
              >
                CATATAN PROSES
              </span>
            </div>

            <div
              className={`mt-2 rounded-lg px-3 py-2 text-[11px] leading-snug ${
                errorLine !== -1
                  ? "bg-rose-100/60 text-rose-700"
                  : "bg-muted text-foreground"
              }`}
            >
              {feedback}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4">
            <div className="mb-2 flex items-center justify-between text-[9px] font-black uppercase text-emerald-700">
              <span>Preview Ekspresi</span>
              <Edit3 size={10} />
            </div>
            <p className="text-[10px] font-bold leading-tight text-muted-foreground">
              int umur_tahun_depan = umur + 1;
            </p>
            <p className="mt-1 text-[11px] font-black text-emerald-800">
              {ekspresiPreview}
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
                    MISI
                  </span>
                  <h2 className="text-[15px] font-black uppercase tracking-tight text-foreground">
                    Tipe Data, Variabel, dan Ekspresi
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  Susun deklarasi variabel untuk data siswa. Isi bagian kosong
                  agar tipe data variabel sesuai nilainya, lalu pahami ekspresi
                  sederhana `umur + 1`. Nilai acak saat ini: umur ={" "}
                  {challenge.umur}, tinggi = {challenge.tinggi.toFixed(1)},
                  jenis_kelamin = '{challenge.jenisKelamin}'.
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
                <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
                  <h3 className="text-sm font-black tracking-tight text-emerald-700">
                    Berhasil! Simulasi terpadu selesai
                  </h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                    Kunci benar: baris 1 int, baris 2 float, baris 3 char.
                    Ekspresi: umur + 1 = {ekspresiUmurTahunDepan ?? "?"}.
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
                    className={`h-2 w-2 rounded-full ${
                      isRunning
                        ? "animate-pulse bg-rose-500"
                        : errorLine !== -1
                          ? "bg-red-500"
                          : "bg-emerald-500"
                    }`}
                  />
                  <span className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">
                    ALGORITMA TERPADU
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
                          ? "scale-110 pr-1 font-black text-emerald-700"
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
                              className={`absolute inset-0 -mx-5 border-l-4 z-0 ${
                                isRunning
                                  ? "border-emerald-500 bg-emerald-50"
                                  : errorLine === i
                                    ? "border-red-500 bg-red-50"
                                    : "border-emerald-200 bg-emerald-50/30"
                              }`}
                            />
                          )}

                          <div className="relative z-10 whitespace-pre font-bold text-slate-900">
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
                              } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selected ?? ghostCommandHints[i] ?? "_____"}
                            </button>{" "}
                            <span className="text-slate-900">
                              {blankLineSuffix[i]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {openSelectorLine !== null && !isRunning && (
                    <div className="absolute bottom-4 left-5 right-5 z-30 rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-lg">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        PILIH TIPE DATA BARIS {openSelectorLine + 1}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "int")
                          }
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 hover:bg-emerald-100"
                        >
                          INT
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "short")
                          }
                          className="rounded-lg border border-lime-300 bg-lime-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-lime-700 hover:bg-lime-100"
                        >
                          SHORT
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "long")
                          }
                          className="rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-green-700 hover:bg-green-100"
                        >
                          LONG
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "float")
                          }
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 hover:bg-emerald-100"
                        >
                          FLOAT
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "double")
                          }
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 hover:bg-emerald-100"
                        >
                          DOUBLE
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "char")
                          }
                          className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-rose-700 hover:bg-rose-100"
                        >
                          CHAR
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="relative flex w-[380px] shrink-0 flex-col overflow-hidden rounded-3xl border border-emerald-400/40 bg-gradient-to-br from-[#0d2f1e] via-[#14532d] to-[#1f6f43] shadow-2xl">
              <div className="flex items-center justify-between border-b border-emerald-300/30 bg-emerald-900/20 px-6 py-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-emerald-100">
                  DASHBOARD SISWA
                </h2>
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    isMismatchVisual
                      ? "animate-pulse bg-rose-400"
                      : errorLine !== -1
                        ? "animate-pulse bg-rose-500"
                        : isRunning
                          ? "animate-pulse bg-emerald-500"
                          : "bg-slate-700"
                  }`}
                />
              </div>

              <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_#14532d_0%,_#0f2d1f_100%)] p-6">
                <div className="absolute -left-10 -top-8 h-32 w-32 rounded-full bg-emerald-300/20 blur-2xl" />
                <div className="absolute -right-10 top-8 h-28 w-28 rounded-full bg-lime-400/20 blur-2xl" />

                <motion.div
                  key={`siswa-visual-${runVisualKey}`}
                  animate={jumlahMismatchAnimation}
                  transition={{ duration: 0.55 }}
                  className="relative h-[270px] w-[310px]"
                >
                  <AnimatePresence>
                    {isMismatchVisual && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-40 pointer-events-none"
                      >
                        <div className="absolute left-8 top-5 h-9 w-9 rounded-full bg-emerald-300/25 blur-md" />
                        <div className="absolute right-8 top-6 h-8 w-8 rounded-full bg-lime-300/25 blur-md" />

                        {mismatchScatter.map((item, idx) => (
                          <motion.div
                            key={`scatter-${idx}`}
                            initial={{
                              y: -36,
                              opacity: 0,
                              rotate: 0,
                              scale: 0.7,
                            }}
                            animate={getMismatchScatterMotion(item.rotate)}
                            transition={{
                              duration: 0.62,
                              delay: idx * 0.06,
                              repeat: isMismatchVisual ? Infinity : 0,
                              repeatType: "mirror",
                            }}
                            className="absolute text-xl"
                            style={{
                              left: `${item.left}%`,
                              top: `${item.top}%`,
                            }}
                          >
                            {isMismatchChar ? (
                              <div className="relative inline-flex items-center justify-center">
                                <span>{item.emoji}</span>
                                <span className="absolute -right-2 -top-2 rounded-full bg-violet-200 px-1 text-[10px] font-black leading-none text-violet-900 shadow-sm">
                                  {CHAR_LABELS[idx % CHAR_LABELS.length]}
                                </span>
                              </div>
                            ) : isMismatchFloat ? (
                              <span className="relative inline-flex items-center justify-center">
                                <span>{item.emoji}</span>
                                <span className="absolute -right-3 -top-2 rounded-full border border-emerald-100/70 bg-emerald-400/35 px-1 text-[10px] font-black leading-none text-emerald-50 shadow-sm">
                                  {
                                    FLOAT_DECIMAL_FRUITS[
                                      idx % FLOAT_DECIMAL_FRUITS.length
                                    ]
                                  }
                                </span>
                              </span>
                            ) : isMismatchLong ? (
                              <span className="relative inline-flex items-center justify-center">
                                <span>{item.emoji}</span>
                                <span className="absolute -right-3 -top-2 rounded-full border border-amber-100/80 bg-amber-500/40 px-1 text-[10px] font-black leading-none text-amber-50 shadow-sm">
                                  {
                                    LONG_BIG_NUMBER_FRUITS[
                                      idx % LONG_BIG_NUMBER_FRUITS.length
                                    ]
                                  }
                                </span>
                              </span>
                            ) : isMismatchInt ? (
                              <span className="relative inline-flex items-center justify-center">
                                <span>{item.emoji}</span>
                                <span className="absolute -right-3 -top-2 rounded-full border border-orange-100/80 bg-orange-500/45 px-1 text-[10px] font-black leading-none text-orange-50 shadow-sm">
                                  {
                                    INT_WHOLE_NUMBER_FRUITS[
                                      idx % INT_WHOLE_NUMBER_FRUITS.length
                                    ]
                                  }
                                </span>
                              </span>
                            ) : isMismatchShort ? (
                              <span className="relative inline-flex items-center justify-center">
                                <span>{item.emoji}</span>
                                <span className="absolute -right-3 -top-2 rounded-full border border-fuchsia-100/80 bg-fuchsia-500/45 px-1 text-[10px] font-black leading-none text-fuchsia-50 shadow-sm">
                                  {
                                    SHORT_SMALL_NUMBER_FRUITS[
                                      idx % SHORT_SMALL_NUMBER_FRUITS.length
                                    ]
                                  }
                                </span>
                              </span>
                            ) : (
                              item.emoji
                            )}
                          </motion.div>
                        ))}

                        {isMismatchLong && (
                          <motion.div
                            initial={{ opacity: 0, scaleX: 0.9 }}
                            animate={{
                              opacity: [0.15, 0.45, 0.15],
                              scaleX: [0.95, 1.1, 0.95],
                            }}
                            transition={{ duration: 0.85, repeat: Infinity }}
                            className="absolute inset-x-8 bottom-8 h-6 rounded-full bg-black/30 blur-sm"
                          />
                        )}

                        {isMismatchChar && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{
                              opacity: [0.45, 0.95, 0.45],
                              y: [0, -5, 0],
                            }}
                            transition={{ duration: 0.95, repeat: Infinity }}
                            className="absolute left-[20%] top-[14%] rounded-md border border-violet-200/60 bg-violet-400/20 px-2 py-1 text-[10px] font-black tracking-wider text-violet-100"
                          >
                            CHAR: A/B/C...
                          </motion.div>
                        )}

                        {(isMismatchInt || isMismatchShort) && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.15, 0.4, 0.15] }}
                            transition={{ duration: 0.9, repeat: Infinity }}
                            className="absolute inset-x-10 top-[42%] h-12 rounded-lg border-2 border-dashed border-emerald-300/45"
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="absolute inset-x-3 top-4 rounded-2xl border border-emerald-200/30 bg-emerald-900/35 px-4 py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black tracking-[0.16em] text-emerald-100">
                        PAPAN ABSENSI
                      </p>
                      <p className="text-[9px] font-black tracking-[0.16em] text-emerald-200/80">
                        KELAS IX-A
                      </p>
                    </div>
                  </div>

                  <div className="absolute inset-x-3 bottom-3 top-[54px] rounded-2xl border border-emerald-200/35 bg-gradient-to-b from-[#1b4332]/70 via-[#14532d]/75 to-[#0f2d1f]/85 p-3 shadow-[0_18px_34px_rgba(0,0,0,0.45)]">
                    <div className="grid h-full grid-cols-3 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const avatar =
                          challenge.studentVisuals[
                            i % challenge.studentVisuals.length
                          ]?.emoji ?? "🧑";

                        return (
                          <motion.div
                            key={`student-card-${i}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`relative rounded-xl border p-1.5 ${
                              isMismatchVisual
                                ? "border-emerald-200/45 bg-slate-900/55"
                                : "border-emerald-200/30 bg-slate-900/45"
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100/15 text-sm">
                                {avatar}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-[8px] font-black tracking-wide text-emerald-100">
                                  SISWA {i + 1}
                                </p>
                                <p className="text-[8px] font-bold text-emerald-200/80">
                                  {studentData.jenisKelamin || "-"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-1 flex items-center justify-between text-[8px] font-black text-emerald-50/90">
                              <span>{studentData.umur || "-"} th</span>
                              <span>
                                {studentData.tinggi
                                  ? `${studentData.tinggi}`
                                  : "-"}
                              </span>
                            </div>

                            {isMismatchVisual && isMismatchChar && (
                              <span className="absolute -right-1 -top-1 rounded-full bg-violet-200 px-1 text-[8px] font-black text-violet-900">
                                {CHAR_LABELS[i % CHAR_LABELS.length]}
                              </span>
                            )}

                            {isMismatchVisual && isMismatchInt && (
                              <span className="absolute -right-1 -top-1 rounded-full bg-orange-300 px-1 text-[8px] font-black text-orange-900">
                                {
                                  INT_WHOLE_NUMBER_FRUITS[
                                    i % INT_WHOLE_NUMBER_FRUITS.length
                                  ]
                                }
                              </span>
                            )}

                            {isMismatchVisual && isMismatchFloat && (
                              <span className="absolute -right-1 -top-1 rounded-full bg-emerald-300 px-1 text-[8px] font-black text-emerald-900">
                                {
                                  FLOAT_DECIMAL_FRUITS[
                                    i % FLOAT_DECIMAL_FRUITS.length
                                  ]
                                }
                              </span>
                            )}

                            {isMismatchVisual && isMismatchLong && (
                              <span className="absolute -right-1 -top-1 rounded-full bg-amber-300 px-1 text-[8px] font-black text-amber-900">
                                {
                                  LONG_BIG_NUMBER_FRUITS[
                                    i % LONG_BIG_NUMBER_FRUITS.length
                                  ]
                                }
                              </span>
                            )}

                            {isMismatchVisual && isMismatchShort && (
                              <span className="absolute -right-1 -top-1 rounded-full bg-fuchsia-300 px-1 text-[8px] font-black text-fuchsia-900">
                                {
                                  SHORT_SMALL_NUMBER_FRUITS[
                                    i % SHORT_SMALL_NUMBER_FRUITS.length
                                  ]
                                }
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {isMismatchVisual && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0.2, 0.45, 0.2] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.7, repeat: Infinity }}
                          className={`absolute inset-0 rounded-[2rem] pointer-events-none ${
                            isMismatchFloat || isMismatchDouble
                              ? isMismatchDouble
                                ? "bg-lime-400/20"
                                : "bg-emerald-400/20"
                              : isMismatchChar
                                ? "bg-violet-400/20"
                                : isMismatchLong
                                  ? "bg-amber-400/20"
                                  : isMismatchInt || isMismatchShort
                                    ? isMismatchShort
                                      ? "bg-fuchsia-400/20"
                                      : "bg-orange-400/20"
                                    : "bg-rose-500/20"
                          }`}
                        />
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {isMismatchVisual &&
                        (isMismatchFloat || isMismatchDouble) && (
                          <>
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{
                                opacity: [0.2, 0.8, 0.2],
                                y: [0, 10, 0],
                              }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="absolute left-[28%] top-[24%] text-lg"
                            >
                              💧
                            </motion.div>
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{
                                opacity: [0.2, 0.8, 0.2],
                                y: [0, 12, 0],
                              }}
                              exit={{ opacity: 0 }}
                              transition={{
                                duration: 1.1,
                                repeat: Infinity,
                                delay: 0.25,
                              }}
                              className="absolute left-[62%] top-[22%] text-lg"
                            >
                              💧
                            </motion.div>
                          </>
                        )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
