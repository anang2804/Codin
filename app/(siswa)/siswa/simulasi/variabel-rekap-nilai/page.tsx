"use client";

import { useEffect, useRef, useState } from "react";
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

const SIMULASI_SLUG = "variabel-rekap-nilai";

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
  | ">="
  | ">"
  | "<"
  | "<="
  | "=="
  | "!=";

type ChallengeData = {
  tugas: number;
  uts: number;
};

type LineConfig = {
  before: string;
  after: string;
  expected: CommandChoice;
  choices: CommandChoice[];
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
    tugas: 70,
    uts: 78,
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
  "+": {
    title: "PLUS (+)",
    desc: "Menjumlahkan dua nilai",
    color: "bg-sky-50 border-sky-200",
  },
  "-": {
    title: "MINUS (-)",
    desc: "Mengurangi nilai",
    color: "bg-amber-50 border-amber-200",
  },
  "*": {
    title: "KALI (*)",
    desc: "Mengalikan nilai",
    color: "bg-violet-50 border-violet-200",
  },
  "/": {
    title: "BAGI (/)",
    desc: "Membagi nilai",
    color: "bg-emerald-50 border-emerald-200",
  },
  "%": {
    title: "MODULUS (%)",
    desc: "Mengambil sisa hasil bagi",
    color: "bg-cyan-50 border-cyan-200",
  },
  "**": {
    title: "PANGKAT (**)",
    desc: "Memangkatkan nilai",
    color: "bg-indigo-50 border-indigo-200",
  },
  ">=": {
    title: "PEMBANDING (>=)",
    desc: "Mengecek lebih besar atau sama dengan",
    color: "bg-lime-50 border-lime-200",
  },
  ">": {
    title: "PEMBANDING (>)",
    desc: "Mengecek lebih besar dari",
    color: "bg-lime-50 border-lime-200",
  },
  "<": {
    title: "PEMBANDING (<)",
    desc: "Mengecek lebih kecil dari",
    color: "bg-orange-50 border-orange-200",
  },
  "<=": {
    title: "PEMBANDING (<=)",
    desc: "Mengecek lebih kecil atau sama dengan",
    color: "bg-orange-50 border-orange-200",
  },
  "==": {
    title: "PEMBANDING (==)",
    desc: "Mengecek apakah sama",
    color: "bg-rose-50 border-rose-200",
  },
  "!=": {
    title: "PEMBANDING (!=)",
    desc: "Mengecek apakah tidak sama",
    color: "bg-rose-50 border-rose-200",
  },
  default: {
    title: "SIAP MENULIS",
    desc: "Gabungkan variabel dengan operator aritmatika dan pembanding.",
    color: "bg-slate-50 border-slate-200",
  },
};

export default function VariabelTerpaduMenengahPage() {
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
  const [kasirPreview, setKasirPreview] = useState<{
    tugas: number | null;
    uts: number | null;
    total: number | null;
    rata: number | null;
    lulus: boolean | null;
  }>({
    tugas: null,
    uts: null,
    total: null,
    rata: null,
    lulus: null,
  });

  const total = challenge.tugas + challenge.uts;
  const rata = total / 2;
  const lulus = rata >= 75;

  const lineConfigs: LineConfig[] = [
    {
      before: `let tugas = ${challenge.tugas}; // tipe data: `,
      after: "",
      expected: "Number",
      choices: shuffle(["Number", "String", "Boolean", "Array", "Object"]),
    },
    {
      before: `let uts = ${challenge.uts}; // tipe data: `,
      after: "",
      expected: "Number",
      choices: shuffle(["Number", "String", "Boolean", "Array", "Object"]),
    },
    {
      before: "let total = tugas ",
      after: " uts;",
      expected: "+",
      choices: shuffle(["+", "-", "*", "/", "%", "**"]),
    },
    {
      before: "let rata = total ",
      after: " 2;",
      expected: "/",
      choices: shuffle(["+", "-", "*", "/", "%", "**"]),
    },
    {
      before: "let lulus = rata ",
      after: " 75;",
      expected: ">=",
      choices: shuffle(["==", "!=", ">", "<", ">=", "<="]),
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
    setKasirPreview({
      tugas: null,
      uts: null,
      total: null,
      rata: null,
      lulus: null,
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
    "+": "Perhatikan operasi penjumlahan untuk menggabungkan dua nilai.",
    "-": "Token ini dipakai saat operasi pengurangan nilai.",
    "*": "Token ini dipakai saat operasi perkalian nilai.",
    "/": "Perhatikan operasi pembagian saat menghitung rata-rata.",
    "%": "Operator ini menghasilkan sisa pembagian.",
    "**": "Operator ini digunakan untuk operasi pangkat.",
    ">=": "Gunakan pembanding untuk mengecek nilai lebih besar atau sama dengan batas.",
    ">": "Gunakan pembanding ini jika ingin mengecek lebih besar dari batas.",
    "<": "Gunakan pembanding ini jika ingin mengecek lebih kecil dari batas.",
    "<=": "Gunakan pembanding untuk mengecek nilai lebih kecil atau sama dengan batas.",
    "==": "Gunakan pembanding ini jika ingin mengecek dua nilai sama persis.",
    "!=": "Gunakan pembanding ini jika ingin mengecek dua nilai tidak sama.",
  };

  const executeStep = (index: number) => {
    if (index >= lineConfigs.length) {
      setIsRunning(false);
      setActiveLine(-1);
      setShowSuccessCard(true);
      setFeedback(
        "Berhasil! Semua token sudah sesuai.\n\nBuku rekap nilai berhasil menghitung total, rata-rata, dan status kelulusan dengan benar.\n\nUrutan konsep yang dipakai: Number -> Number -> + -> / -> >=.",
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
      setKasirPreview((prev) => ({ ...prev, tugas: challenge.tugas }));
    }
    if (index === 1) {
      setKasirPreview((prev) => ({ ...prev, uts: challenge.uts }));
    }
    if (index === 2) {
      setKasirPreview((prev) => ({ ...prev, total }));
    }
    if (index === 3) {
      setKasirPreview((prev) => ({ ...prev, rata }));
    }
    if (index === 4) {
      setKasirPreview((prev) => ({ ...prev, lulus }));
    }

    setFeedback(
      `Baris ${index + 1} benar.\n\nToken "${expected}" sudah sesuai dan berhasil dibaca sistem kasir.`,
    );
    timerRef.current = setTimeout(() => executeStep(index + 1), 850);
  };

  const startRunning = () => {
    resetSim(false);
    setIsRunning(true);
    timerRef.current = setTimeout(() => executeStep(0), 250);
  };

  const getLineGuideMessage = (lineIndex: number, selected?: CommandChoice) => {
    const token = selected ?? "___";

    if (lineIndex === 0) {
      return `Variabel tugas memiliki nilai 70, maka bertipe data ${token}`;
    }
    if (lineIndex === 1) {
      return `Variabel uts memiliki nilai 78, maka bertipe data ${token}`;
    }
    if (lineIndex === 2) {
      return `Variabel total merupakan hasil dari operasi antara tugas dan uts, maka operator yang digunakan adalah ${token}`;
    }
    if (lineIndex === 3) {
      return `Variabel rata digunakan untuk menghitung nilai rata-rata, maka operator yang digunakan adalah ${token}`;
    }
    if (lineIndex === 4) {
      return `Variabel lulus digunakan untuk menentukan apakah nilai memenuhi syarat (minimal 75), maka operator yang digunakan adalah ${token}`;
    }

    return "Sistem siap menjalankan algoritma.";
  };

  const totalDisplayLines = Math.max(lineConfigs.length, 10);
  const renderCodePrefix = (lineIndex: number) => {
    const kwClass = "text-violet-700 dark:text-violet-300";
    const varClass = "text-blue-700 dark:text-blue-300";
    const opClass = "text-slate-700 dark:text-slate-300";
    const numberClass = "text-orange-700 dark:text-orange-300";
    const commentClass = "text-slate-500 dark:text-slate-400";

    if (lineIndex === 0) {
      return (
        <>
          <span className={kwClass}>let</span>{" "}
          <span className={varClass}>tugas</span>{" "}
          <span className={opClass}>=</span>{" "}
          <span className={numberClass}>{challenge.tugas}</span>
          <span className={opClass}>;</span>{" "}
          <span className={commentClass}>// tipe data: </span>
        </>
      );
    }

    if (lineIndex === 1) {
      return (
        <>
          <span className={kwClass}>let</span>{" "}
          <span className={varClass}>uts</span>{" "}
          <span className={opClass}>=</span>{" "}
          <span className={numberClass}>{challenge.uts}</span>
          <span className={opClass}>;</span>{" "}
          <span className={commentClass}>// tipe data: </span>
        </>
      );
    }

    if (lineIndex === 2) {
      return (
        <>
          <span className={kwClass}>let</span>{" "}
          <span className={varClass}>total</span>{" "}
          <span className={opClass}>=</span>{" "}
          <span className={varClass}>tugas</span>{" "}
        </>
      );
    }

    if (lineIndex === 3) {
      return (
        <>
          <span className={kwClass}>let</span>{" "}
          <span className={varClass}>rata</span>{" "}
          <span className={opClass}>=</span>{" "}
          <span className={varClass}>total</span>{" "}
        </>
      );
    }

    return (
      <>
        <span className={kwClass}>let</span>{" "}
        <span className={varClass}>lulus</span>{" "}
        <span className={opClass}>=</span>{" "}
        <span className={varClass}>rata</span>{" "}
      </>
    );
  };

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
              panel:
                "border-emerald-300 bg-gradient-to-br from-emerald-100 via-sky-100 to-cyan-100 dark:border-emerald-700/70 dark:from-emerald-900/35 dark:via-sky-900/30 dark:to-cyan-900/30",
              divider: "border-emerald-300/90 dark:border-emerald-700/70",
              title: "text-emerald-800 dark:text-emerald-200",
              body: "bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/55 dark:text-emerald-100",
              icon: (
                <CheckCircle2
                  size={12}
                  className="text-emerald-600 dark:text-emerald-300"
                />
              ),
            };

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
              Buku Rekap Nilai
            </h1>
            <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
              Level Menengah
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
                    Rekap Nilai
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  Ayo bantu sistem rekap nilai siswa! 📝
                  <br />
                  Lengkapi tipe data dan ekspresi matematika untuk menghitung
                  total, rata-rata, dan menentukan status lulus secara otomatis.
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
                    Berhasil! Level menengah selesai
                  </h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                    Tipe data, ekspresi, dan pembanding sudah digunakan dengan
                    tepat pada setiap baris algoritma.
                    <br />
                    Buku rekap nilai berhasil menghitung total, rata-rata, dan
                    status kelulusan dengan benar.
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

              <div className="relative flex flex-1 overflow-hidden font-mono text-[13px] leading-[26px]">
                <div className="w-12 shrink-0 select-none overflow-hidden border-r border-border bg-muted/40 pt-5 pr-4 text-right text-muted-foreground dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                  {Array.from({ length: totalDisplayLines }).map((_, i) => {
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
                  })}
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
                              layoutId="lineHighlightMenengah"
                              className={`absolute inset-0 -mx-5 -my-1 border-l-4 z-0 ${
                                showWrongState || errorLine === i
                                  ? "border-rose-500 bg-rose-100/70 dark:bg-rose-500/10"
                                  : isRunning
                                    ? "border-emerald-500 bg-emerald-100/70 dark:bg-emerald-500/10"
                                    : "border-sky-300 bg-sky-50/70 dark:border-sky-500/40 dark:bg-slate-800/50"
                              }`}
                            />
                          )}
                          <div className="relative z-10 whitespace-pre font-mono text-[12px] font-semibold text-slate-900 dark:text-slate-100 lg:text-[13px]">
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
                              className={`rounded border px-1 py-0.5 font-mono text-[10px] transition-all lg:text-[11px] ${selected ? "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-700 dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-slate-700" : "border-transparent italic text-slate-400 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"} ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
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
                      <div className="grid grid-cols-4 gap-2">
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

            <aside className="relative flex w-[380px] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900/80 px-6 py-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-200">
                  MONITOR PENILAIAN
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Status
                  </span>
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${isRunning ? "animate-pulse bg-emerald-500" : errorLine !== -1 ? "bg-rose-500" : "bg-slate-400"}`}
                  />
                </div>
              </div>

              <div className="relative flex flex-1 flex-col gap-4 overflow-hidden p-5">
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(148,163,184,.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.2)_1px,transparent_1px)] [background-size:24px_24px]" />

                <div className="relative rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-100 to-amber-200 p-2 shadow-md overflow-hidden">
                  <div className="rounded-xl border border-amber-300/80 bg-amber-50 px-3 py-3 shadow-inner">
                    <div className="pointer-events-none absolute bottom-5 left-4 top-5 w-3 rounded bg-amber-300/80" />
                    <div className="pointer-events-none absolute bottom-6 left-5.5 top-6 flex w-[2px] flex-col justify-between">
                      {Array.from({ length: 7 }).map((_, idx) => (
                        <span
                          key={`ring-${idx}`}
                          className="h-2 w-2 -translate-x-1/2 rounded-full border border-amber-500/70 bg-amber-100"
                        />
                      ))}
                    </div>

                    <motion.div
                      className="relative ml-5 rounded-lg border border-sky-200 bg-[#fefefe] px-3 py-2 overflow-y-auto max-h-full"
                      animate={
                        errorLine !== -1
                          ? { x: [0, -3, 3, -2, 2, 0] }
                          : { x: 0 }
                      }
                      transition={
                        errorLine !== -1
                          ? { duration: 0.4, repeat: Infinity, ease: "linear" }
                          : { duration: 0.2 }
                      }
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_bottom,transparent_0,transparent_19px,rgba(148,163,184,.35)_20px)] [background-size:100%_20px]" />
                      <p className="relative text-center text-[10px] font-black uppercase tracking-widest text-sky-800">
                        BUKU REKAP NILAI
                      </p>
                      <div className="relative mt-2 space-y-1 font-mono text-[12px]">
                        <motion.p
                          className={`px-2 py-1 rounded transition-all relative ${
                            errorLine === 0
                              ? "text-slate-400 line-through"
                              : "text-slate-700"
                          }`}
                          animate={
                            errorLine === 0
                              ? {
                                  opacity: [1, 0.6, 1],
                                }
                              : { opacity: 1 }
                          }
                          transition={
                            errorLine === 0
                              ? {
                                  duration: 0.6,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }
                              : { duration: 0.2 }
                          }
                        >
                          {errorLine === 0 && (
                            <motion.span
                              className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-400/40 to-rose-500/0 pointer-events-none"
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                          )}
                          tugas .......... {kasirPreview.tugas ?? "-"}
                        </motion.p>
                        <motion.p
                          className={`px-2 py-1 rounded transition-all relative ${
                            errorLine === 1
                              ? "text-slate-400 line-through"
                              : "text-slate-700"
                          }`}
                          animate={
                            errorLine === 1
                              ? {
                                  opacity: [1, 0.6, 1],
                                }
                              : { opacity: 1 }
                          }
                          transition={
                            errorLine === 1
                              ? {
                                  duration: 0.6,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }
                              : { duration: 0.2 }
                          }
                        >
                          {errorLine === 1 && (
                            <motion.span
                              className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-400/40 to-rose-500/0 pointer-events-none"
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                          )}
                          uts ............ {kasirPreview.uts ?? "-"}
                        </motion.p>
                        <p className="text-slate-400">
                          -------------------------
                        </p>
                        <motion.p
                          className={`px-2 py-1 rounded transition-all relative ${
                            errorLine === 2
                              ? "text-slate-400 line-through"
                              : "text-slate-700"
                          }`}
                          animate={
                            errorLine === 2
                              ? {
                                  opacity: [1, 0.6, 1],
                                }
                              : { opacity: 1 }
                          }
                          transition={
                            errorLine === 2
                              ? {
                                  duration: 0.6,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }
                              : { duration: 0.2 }
                          }
                        >
                          {errorLine === 2 && (
                            <motion.span
                              className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-400/40 to-rose-500/0 pointer-events-none"
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                          )}
                          total .......... {kasirPreview.total ?? "-"}
                        </motion.p>
                        <motion.p
                          className={`px-2 py-1 rounded transition-all relative ${
                            errorLine === 3
                              ? "text-slate-400 line-through"
                              : "text-slate-700"
                          }`}
                          animate={
                            errorLine === 3
                              ? {
                                  opacity: [1, 0.6, 1],
                                }
                              : { opacity: 1 }
                          }
                          transition={
                            errorLine === 3
                              ? {
                                  duration: 0.6,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }
                              : { duration: 0.2 }
                          }
                        >
                          {errorLine === 3 && (
                            <motion.span
                              className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-400/40 to-rose-500/0 pointer-events-none"
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                          )}
                          rata ...........{" "}
                          {kasirPreview.rata !== null
                            ? kasirPreview.rata.toFixed(1)
                            : "-"}
                        </motion.p>
                        <motion.p
                          className={`px-2 py-1 rounded transition-all relative ${
                            errorLine === 4
                              ? "text-slate-400 line-through"
                              : "text-slate-700"
                          }`}
                          animate={
                            errorLine === 4
                              ? {
                                  opacity: [1, 0.6, 1],
                                }
                              : { opacity: 1 }
                          }
                          transition={
                            errorLine === 4
                              ? {
                                  duration: 0.6,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }
                              : { duration: 0.2 }
                          }
                        >
                          {errorLine === 4 && (
                            <motion.span
                              className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-400/40 to-rose-500/0 pointer-events-none"
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                          )}
                          lulus ..........{" "}
                          {kasirPreview.lulus === null
                            ? "-"
                            : String(kasirPreview.lulus)}
                        </motion.p>
                      </div>
                      <div className="relative mt-2 border-t border-dashed border-slate-300 pt-2 text-center text-[10px] font-bold text-slate-500">
                        HASIL EVALUASI SISWA
                      </div>
                    </motion.div>
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
