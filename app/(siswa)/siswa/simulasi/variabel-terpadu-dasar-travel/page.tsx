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

const SIMULASI_SLUG = "variabel-terpadu-dasar-travel";

type CommandChoice = "Number" | "String" | "Boolean" | "Array" | "Object";

type ChallengeData = {
  namaLengkap: string;
  kelasPenerbangan: "E" | "B" | "F" | "P";
  nomorKursi: number;
  beratBagasi: number;
  sudahCheckIn: boolean;
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
    desc: "Pilih tipe data yang tepat untuk setiap variabel perjalanan.",
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
    namaLengkap: "Kadek Surya Wibawa",
    kelasPenerbangan: "P",
    nomorKursi: 17,
    beratBagasi: 21.2,
    sudahCheckIn: true,
  };
}

export default function VariabelTerpaduDasarTravelPage() {
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

  const [preview, setPreview] = useState<{
    namaLengkap: string;
    kelasPenerbangan: string;
    nomorKursi: number | null;
    beratBagasi: number | null;
    sudahCheckIn: boolean | null;
  }>({
    namaLengkap: "",
    kelasPenerbangan: "",
    nomorKursi: null,
    beratBagasi: null,
    sudahCheckIn: null,
  });

  const lineConfigs: LineConfig[] = [
    {
      before: `let namaLengkap = "${challenge.namaLengkap}"; // tipe data: `,
      after: "",
      expected: "String",
      choices: shuffle(["Number", "String", "Boolean", "Array", "Object"]),
    },
    {
      before: `let kelasPenerbangan = '${challenge.kelasPenerbangan}';             // tipe data: `,
      after: "",
      expected: "String",
      choices: shuffle(["Number", "String", "Boolean", "Array", "Object"]),
    },
    {
      before: `let nomorKursi = ${challenge.nomorKursi};                    // tipe data: `,
      after: "",
      expected: "Number",
      choices: shuffle(["Number", "String", "Boolean", "Array", "Object"]),
    },
    {
      before: `let beratBagasi = ${challenge.beratBagasi.toFixed(1)};                 // tipe data: `,
      after: "",
      expected: "Number",
      choices: shuffle(["Number", "String", "Boolean", "Array", "Object"]),
    },
    {
      before: `let sudahCheckIn = ${challenge.sudahCheckIn};                // tipe data: `,
      after: "",
      expected: "Boolean",
      choices: shuffle(["Number", "String", "Boolean", "Array", "Object"]),
    },
  ];

  const feedbackHints: Record<CommandChoice, string> = {
    Number:
      "Cek kembali apakah nilainya berupa angka (bisa bulat atau desimal).",
    String: "Cek apakah variabel ini berisi teks/karakter dalam tanda kutip.",
    Boolean: "Pastikan variabel ini bertipe kondisi true/false.",
    Array: "Array dipakai untuk kumpulan nilai dalam tanda kurung siku [].",
    Object: "Object dipakai untuk pasangan key-value dalam kurung kurawal {}.",
  };

  const currentChoice =
    activeLine !== -1 ? selectedCommands[activeLine] : undefined;
  const currentDesc = currentChoice
    ? COMMAND_DETAILS[currentChoice]
    : COMMAND_DETAILS.default;

  const isNameGlitch = errorLine === 0;
  const isClassGlitch = errorLine === 1;
  const isSeatGlitch = errorLine === 2;
  const isBagGlitch = errorLine === 3;
  const isCheckinDisco = errorLine === 4;

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
      return `Variabel namaLengkap memiliki nilai "Kadek Surya Wibawa", maka bertipe data ${token}`;
    }
    if (lineIndex === 1) {
      return `Variabel kelasPenerbangan memiliki nilai 'P', maka bertipe data ${token}`;
    }
    if (lineIndex === 2) {
      return `Variabel nomorKursi memiliki nilai 17, maka bertipe data ${token}`;
    }
    if (lineIndex === 3) {
      return `Variabel beratBagasi memiliki nilai 21.2, maka bertipe data ${token}`;
    }
    if (lineIndex === 4) {
      return `Variabel sudahCheckIn memiliki nilai true, maka bertipe data ${token}`;
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
    setPreview({
      namaLengkap: "",
      kelasPenerbangan: "",
      nomorKursi: null,
      beratBagasi: null,
      sudahCheckIn: null,
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
      setActiveLine(-1);
      setShowSuccessCard(true);
      setFeedback(
        "Berhasil! Semua tipe data sudah sesuai.\n\nSistem travel berhasil menampilkan data penumpang dan check-in dengan benar.\n\nUrutan konsep yang dipakai: String -> String -> Number -> Number -> Boolean.",
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
      setPreview((prev) => ({ ...prev, namaLengkap: challenge.namaLengkap }));
    }
    if (index === 1) {
      setPreview((prev) => ({
        ...prev,
        kelasPenerbangan: challenge.kelasPenerbangan,
      }));
    }
    if (index === 2) {
      setPreview((prev) => ({ ...prev, nomorKursi: challenge.nomorKursi }));
    }
    if (index === 3) {
      setPreview((prev) => ({ ...prev, beratBagasi: challenge.beratBagasi }));
    }
    if (index === 4) {
      setPreview((prev) => ({ ...prev, sudahCheckIn: challenge.sudahCheckIn }));
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
          <span className={varClass}>namaLengkap</span>{" "}
          <span className={opClass}>=</span>{" "}
          <span className={stringClass}>"{challenge.namaLengkap}"</span>
          <span className={opClass}>;</span>{" "}
          <span className={commentClass}>// tipe data: </span>
        </>
      );
    }

    if (lineIndex === 1) {
      return (
        <>
          <span className={kwClass}>let</span>{" "}
          <span className={varClass}>kelasPenerbangan</span>{" "}
          <span className={opClass}>=</span>{" "}
          <span className={stringClass}>'{challenge.kelasPenerbangan}'</span>
          <span className={opClass}>;</span>{" "}
          <span className={commentClass}>// tipe data: </span>
        </>
      );
    }

    if (lineIndex === 2) {
      return (
        <>
          <span className={kwClass}>let</span>{" "}
          <span className={varClass}>nomorKursi</span>{" "}
          <span className={opClass}>=</span>{" "}
          <span className={numberClass}>{challenge.nomorKursi}</span>
          <span className={opClass}>;</span>{" "}
          <span className={commentClass}>// tipe data: </span>
        </>
      );
    }

    if (lineIndex === 3) {
      return (
        <>
          <span className={kwClass}>let</span>{" "}
          <span className={varClass}>beratBagasi</span>{" "}
          <span className={opClass}>=</span>{" "}
          <span className={numberClass}>
            {challenge.beratBagasi.toFixed(1)}
          </span>
          <span className={opClass}>;</span>{" "}
          <span className={commentClass}>// tipe data: </span>
        </>
      );
    }

    return (
      <>
        <span className={kwClass}>let</span>{" "}
        <span className={varClass}>sudahCheckIn</span>{" "}
        <span className={opClass}>=</span>{" "}
        <span className={booleanClass}>{String(challenge.sudahCheckIn)}</span>
        <span className={opClass}>;</span>{" "}
        <span className={commentClass}>// tipe data: </span>
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
              panel: "bg-card border-border",
              divider: "border-border",
              title: "text-muted-foreground",
              body: "text-foreground bg-muted",
              icon: (
                <CheckCircle2 size={12} className="text-muted-foreground" />
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
              Tiket & Paspor
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

        <div className="relative flex min-w-0 flex-1 flex-col bg-transparent">
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
                    Tiket & Paspor Perjalanan
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  Ayo bantu sistem bandara menerbitkan tiket digital! ✈️
                  Lengkapi tipe data dan status check-in agar dokumen perjalanan
                  nama, kelas, kursi, dan bagasi penumpang tampil dengan akurat.
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
                    Tipe data sudah dipilih dengan tepat pada setiap data
                    perjalanan.
                    <br />
                    Tiket dan paspor digital berhasil menampilkan dokumen
                    perjalanan dengan benar.
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
                              layoutId="lineHighlightTravel"
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

            <aside className="relative flex w-[360px] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-[#020617] shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-1.5 text-emerald-400">
                    <Activity size={14} />
                  </div>
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    TRAVEL PREVIEW
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
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,#0f172a_0%,#020617_58%)]" />
                <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(to_right,rgba(148,163,184,.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.2)_1px,transparent_1px)] [background-size:30px_30px]" />

                <div className="relative z-10 flex-1 px-4 pt-2">
                  <div className="absolute inset-x-5 bottom-4 z-10 h-[162px] rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-950 shadow-2xl" />

                  <motion.div
                    animate={{ y: [0, -2, 0], rotateX: [0, 0.6, 0] }}
                    transition={{
                      duration: 3.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute left-1/2 top-0 z-20 w-[244px] -translate-x-1/2 [transform-style:preserve-3d]"
                  >
                    <div className="pointer-events-none absolute -inset-x-3 -bottom-6 h-8 rounded-full bg-black/45 blur-xl" />
                    <div className="relative rounded-[26px] border border-slate-500 bg-gradient-to-b from-slate-500 via-slate-700 to-slate-900 p-2.5 shadow-[0_20px_38px_rgba(2,6,23,0.7)] [transform:perspective(900px)_rotateX(2deg)]">
                      <div className="pointer-events-none absolute left-3 top-12 h-20 w-1 rounded-full bg-slate-400/25" />
                      <div className="pointer-events-none absolute right-3 top-12 h-20 w-1 rounded-full bg-slate-400/25" />
                      <div className="pointer-events-none absolute left-1/2 top-1 z-20 h-1.5 w-20 -translate-x-1/2 rounded-full bg-slate-400/60" />
                      <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-2 w-2 -translate-x-1/2 rounded-full bg-slate-300 shadow-[0_0_6px_rgba(148,163,184,0.7)]" />
                      <motion.div
                        animate={{
                          opacity: [0.35, 1, 0.35],
                          scale: [0.95, 1.05, 0.95],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="pointer-events-none absolute right-4 top-3 z-20 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                      />
                      <div className="relative rounded-[16px] border border-cyan-400/35 bg-slate-950/90 p-2 shadow-[inset_0_0_30px_rgba(34,211,238,0.1)]">
                        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(148,163,184,.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.2)_1px,transparent_1px)] [background-size:24px_24px]" />
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white/8 to-transparent" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/30 to-transparent" />
                        <motion.div
                          animate={{ x: [-50, 320] }}
                          transition={{
                            duration: 5.2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="pointer-events-none absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        />

                        <p className="relative text-[8px] font-black uppercase tracking-[0.18em] text-cyan-300">
                          E-TICKET / PASSPORT
                        </p>

                        <motion.p
                          animate={
                            isNameGlitch
                              ? {
                                  x: [0, -2, 3, -3, 2, 0],
                                  textShadow: [
                                    "0 0 0px rgba(0,0,0,0)",
                                    "2px 0 0 rgba(244,114,182,0.9)",
                                    "-2px 0 0 rgba(34,211,238,0.9)",
                                    "0 0 0px rgba(0,0,0,0)",
                                  ],
                                }
                              : { x: 0, textShadow: "0 0 0px rgba(0,0,0,0)" }
                          }
                          transition={
                            isNameGlitch
                              ? {
                                  duration: 0.2,
                                  repeat: Infinity,
                                  ease: "linear",
                                }
                              : { duration: 0.2 }
                          }
                          className="relative mt-1.5 rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-[12px] font-black text-white"
                        >
                          {preview.namaLengkap || "-"}
                        </motion.p>

                        <div className="relative mt-2.5 grid grid-cols-2 gap-2">
                          <motion.div
                            animate={
                              isClassGlitch
                                ? { rotate: [0, -6, 6, -4, 4, 0] }
                                : { rotate: 0 }
                            }
                            transition={
                              isClassGlitch
                                ? {
                                    duration: 0.22,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }
                                : { duration: 0.2 }
                            }
                            className="rounded-lg border border-amber-300/70 bg-amber-100 p-1.5 text-center"
                          >
                            <p className="text-[8px] font-black uppercase text-amber-900">
                              Kelas
                            </p>
                            <p className="text-lg font-black text-amber-900">
                              {preview.kelasPenerbangan || "-"}
                            </p>
                          </motion.div>

                          <motion.div
                            animate={
                              isSeatGlitch
                                ? {
                                    y: [0, -2, 2, -1, 1, 0],
                                    x: [0, 2, -2, 1, -1, 0],
                                  }
                                : { y: 0, x: 0 }
                            }
                            transition={
                              isSeatGlitch
                                ? {
                                    duration: 0.18,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }
                                : { duration: 0.2 }
                            }
                            className="rounded-lg border border-emerald-300/60 bg-emerald-100 p-1.5 text-center"
                          >
                            <p className="text-[8px] font-black uppercase text-emerald-900">
                              Kursi
                            </p>
                            <p className="text-lg font-black text-emerald-900">
                              {isSeatGlitch
                                ? "##"
                                : preview.nomorKursi !== null
                                  ? preview.nomorKursi
                                  : "-"}
                            </p>
                          </motion.div>
                        </div>

                        <motion.div
                          animate={
                            isBagGlitch
                              ? {
                                  x: [0, -4, 4, -3, 3, 0],
                                  rotate: [0, -0.8, 0.8, -0.4, 0.4, 0],
                                }
                              : { x: 0, rotate: 0 }
                          }
                          transition={
                            isBagGlitch
                              ? {
                                  duration: 0.2,
                                  repeat: Infinity,
                                  ease: "linear",
                                }
                              : { duration: 0.2 }
                          }
                          className="relative mt-2.5 rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1.5"
                        >
                          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-400">
                            <span>Timbangan Bagasi</span>
                            <span className="text-sky-300">Float</span>
                          </div>
                          <p className="mt-1 font-mono text-lg font-black tracking-wider text-sky-300">
                            {isBagGlitch
                              ? "###.#"
                              : preview.beratBagasi !== null
                                ? preview.beratBagasi.toFixed(1)
                                : "---.-"}
                            <span className="ml-1 text-[9px] text-slate-400">
                              KG
                            </span>
                          </p>
                        </motion.div>

                        <div className="relative mt-2.5 flex items-center justify-end gap-2 rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1.5">
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                            Check-In
                          </span>
                          <motion.div
                            animate={
                              isCheckinDisco
                                ? {
                                    backgroundColor: [
                                      "#ef4444",
                                      "#f59e0b",
                                      "#22c55e",
                                      "#06b6d4",
                                      "#a855f7",
                                      "#ef4444",
                                    ],
                                    boxShadow: [
                                      "0 0 8px #ef4444",
                                      "0 0 8px #f59e0b",
                                      "0 0 8px #22c55e",
                                      "0 0 8px #06b6d4",
                                      "0 0 8px #a855f7",
                                      "0 0 8px #ef4444",
                                    ],
                                  }
                                : {}
                            }
                            transition={
                              isCheckinDisco
                                ? {
                                    duration: 0.6,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }
                                : { duration: 0.2 }
                            }
                            className={`rounded-md px-2 py-0.5 text-[9px] font-black ${
                              !isCheckinDisco
                                ? preview.sudahCheckIn
                                  ? "bg-emerald-500 text-white shadow-[0_0_10px_#34d399]"
                                  : "bg-slate-700 text-slate-200"
                                : "text-white"
                            }`}
                          >
                            {preview.sudahCheckIn === null
                              ? "PENDING"
                              : preview.sudahCheckIn
                                ? "SUDAH CHECK-IN"
                                : "BELUM CHECK-IN"}
                          </motion.div>
                        </div>
                      </div>
                      <div className="mt-1.5 rounded-lg border border-slate-600/70 bg-slate-900/80 px-2.5 py-1 text-[7px] font-black tracking-[0.14em] text-slate-400">
                        HDMI • USB-C • LAN
                      </div>
                    </div>

                    <div className="mx-auto mt-1 w-fit rounded-md border border-slate-500 bg-slate-800/80 px-2 py-0.5 text-[7px] font-black tracking-[0.16em] text-slate-300">
                      AEROTERM KIOSK
                    </div>
                    <div className="mx-auto mt-0.5 h-3 w-12 rounded-md border border-slate-500 bg-gradient-to-b from-slate-600 to-slate-900" />
                    <div className="mx-auto mt-0.5 flex h-2.5 w-24 items-center justify-center rounded-full border border-slate-600 bg-gradient-to-b from-slate-700 to-slate-900 shadow-lg">
                      <div className="h-[2px] w-14 rounded-full bg-slate-500/80" />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
