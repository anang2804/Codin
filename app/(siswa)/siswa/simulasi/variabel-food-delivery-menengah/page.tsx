"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bike,
  BookOpen,
  CheckCircle2,
  House,
  Lightbulb,
  MapPin,
  Play,
  RotateCcw,
  Store,
  Terminal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIMULASI_SLUG = "variabel-food-delivery-menengah";

// Hitung posisi pada cubic Bezier curve
function cubicBezier(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number,
): number {
  const mt = 1 - t;
  return (
    mt * mt * mt * p0 +
    3 * mt * mt * t * p1 +
    3 * mt * t * t * p2 +
    t * t * t * p3
  );
}

// Dapatkan posisi X dan Y pada SVG path
function getPositionOnPath(progress: number) {
  // SVG path: M50,45 C130,30 180,80 260,112
  // Viewbox: 0 0 320 160
  const x = cubicBezier(progress, 50, 130, 180, 260);
  const y = cubicBezier(progress, 45, 30, 80, 112);
  return { x, y };
}

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
  | "<="
  | "==";

type ChallengeData = {
  resto: string;
  jarakKM: number;
  ongkirPerKM: number;
  kodePromo: string;
};

type LineConfig = {
  before: string;
  after: string;
  expected: CommandChoice;
  choices: CommandChoice[];
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
    resto: "Ayam Geprek Mantap",
    jarakKM: 4.5,
    ongkirPerKM: 2500.5,
    kodePromo: "S",
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
    desc: "Tipe data untuk satu karakter",
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

export default function VariabelFoodDeliveryMenengahPage() {
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
  const [orderPreview, setOrderPreview] = useState<{
    resto: string | null;
    jarakKM: number | null;
    ongkirPerKM: number | null;
    kodePromo: string | null;
    totalOngkir: number | null;
    gratisOngkir: boolean | null;
  }>({
    resto: null,
    jarakKM: null,
    ongkirPerKM: null,
    kodePromo: null,
    totalOngkir: null,
    gratisOngkir: null,
  });

  const totalOngkir = challenge.jarakKM * challenge.ongkirPerKM;
  const gratisOngkir = totalOngkir > 10000.0;

  const lineConfigs: LineConfig[] = [
    {
      before: "",
      after: ` resto = \"${challenge.resto}\";`,
      expected: "string",
      choices: shuffle([
        "string",
        "char",
        "int",
        "float",
        "boolean",
        "+",
        "*",
        ">",
      ]),
    },
    {
      before: "",
      after: ` jarakKM = ${challenge.jarakKM};`,
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
      after: ` ongkirPerKM = ${challenge.ongkirPerKM};`,
      expected: "float",
      choices: shuffle(["float", "int", "string", "char", "/", "-", "*", "<="]),
    },
    {
      before: "",
      after: ` kodePromo = '${challenge.kodePromo}';`,
      expected: "char",
      choices: shuffle([
        "char",
        "string",
        "float",
        "boolean",
        "int",
        "+",
        "==",
        "*",
      ]),
    },
    {
      before: "float totalOngkir = jarakKM ",
      after: " ongkirPerKM;",
      expected: "*",
      choices: shuffle([
        "*",
        "+",
        "-",
        "/",
        "float",
        "int",
        "boolean",
        "string",
      ]),
    },
    {
      before: "boolean gratisOngkir = totalOngkir ",
      after: " 10000.0;",
      expected: ">",
      choices: shuffle([">", ">=", "<=", "==", "-", "+", "float", "char"]),
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
  };

  const resetSim = (regenerateChallenge: boolean) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setFeedback("Sistem siap menjalankan algoritma.");
    setOrderPreview({
      resto: null,
      jarakKM: null,
      ongkirPerKM: null,
      kodePromo: null,
      totalOngkir: null,
      gratisOngkir: null,
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
      "Gunakan float untuk nilai desimal seperti jarak dan ongkir per kilometer.",
    char: "Char digunakan untuk satu karakter, cocok untuk kode promo seperti 'S'.",
    boolean: "Boolean digunakan untuk menyimpan hasil logika true atau false.",
    string:
      "String digunakan untuk teks atau kumpulan karakter seperti nama restoran.",
    "+": "Perhatikan operasi penjumlahan untuk menggabungkan dua nilai.",
    "-": "Token ini dipakai saat operasi pengurangan nilai.",
    "*": "Perhatikan operasi perkalian untuk menghitung total ongkir.",
    "/": "Token ini dipakai saat operasi pembagian nilai.",
    ">": "Gunakan pembanding untuk mengecek nilai lebih besar dari batas.",
    ">=": "Gunakan pembanding untuk mengecek nilai lebih besar atau sama dengan batas.",
    "<=": "Gunakan pembanding untuk mengecek nilai lebih kecil atau sama dengan batas.",
    "==": "Gunakan pembanding ini jika ingin mengecek dua nilai sama persis.",
  };

  const executeStep = (index: number) => {
    if (index >= lineConfigs.length) {
      setIsRunning(false);
      setActiveLine(lineConfigs.length - 1);
      setShowSuccessCard(true);
      setFeedback(
        "Berhasil! Semua token sudah sesuai.\n\nSimulasi food delivery menampilkan data dengan benar dari nama restoran, jarak, ongkir per kilometer, total ongkir, hingga status gratis ongkir.\n\nUrutan konsep yang dipakai: string -> float -> float -> char -> * -> >.",
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

    if (index === 0)
      setOrderPreview((prev) => ({ ...prev, resto: challenge.resto }));
    if (index === 1)
      setOrderPreview((prev) => ({ ...prev, jarakKM: challenge.jarakKM }));
    if (index === 2)
      setOrderPreview((prev) => ({
        ...prev,
        ongkirPerKM: challenge.ongkirPerKM,
      }));
    if (index === 3)
      setOrderPreview((prev) => ({ ...prev, kodePromo: challenge.kodePromo }));
    if (index === 4) setOrderPreview((prev) => ({ ...prev, totalOngkir }));
    if (index === 5) setOrderPreview((prev) => ({ ...prev, gratisOngkir }));

    setFeedback(
      `Baris ${index + 1} benar.\n\nToken "${expected}" sudah sesuai dan berhasil dibaca sistem food delivery.`,
    );
    timerRef.current = setTimeout(() => executeStep(index + 1), 850);
  };

  const startRunning = () => {
    resetSim(false);
    setIsRunning(true);
    timerRef.current = setTimeout(() => executeStep(0), 250);
  };

  const totalDisplayLines = Math.max(lineConfigs.length, 11);
  const progressPercent = (Math.max(0, Math.min(6, activeLine + 1)) / 6) * 100;

  // Hitung posisi rider pada Bezier path (SVG viewBox: 0 0 320 160)
  const pathProgress = progressPercent / 100;
  const pathPos = getPositionOnPath(pathProgress);
  // Container scales SVG viewBox to actual size, so use percentage from viewBox
  const riderXPercent = (pathPos.x / 320) * 100;
  const riderYPercent = (pathPos.y / 160) * 100;

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
            Aplikasi Pesan Antar Makanan
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
                    Pesan Antar Makanan
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  Ayo bantu aplikasi makanan menghitung pesanan! 🛵
                  <br />
                  Lengkapi tipe data dan ekspresi untuk mendapatkan total
                  ongkir, lalu tentukan secara otomatis apakah pelanggan berhak
                  mendapatkan gratis ongkir.
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
                    Tipe data dan ekspresi sudah digunakan dengan tepat pada
                    setiap baris algoritma.
                    <br />
                    Aplikasi food delivery berhasil menghitung ongkir dengan
                    benar.
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
                    ALGORITMA MENENGAH
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
                              layoutId="lineHighlightFoodDelivery"
                              className={`absolute inset-0 -mx-5 -my-1 z-0 ${highlightClass}`}
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
                  FOOD DELIVERY APP
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

                <div className="relative mx-auto w-full max-w-[286px] rounded-[26px] border border-slate-700 bg-slate-950 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                  <div className="pointer-events-none absolute left-1/2 top-2 h-1.5 w-20 -translate-x-1/2 rounded-full bg-slate-700" />

                  <div className="relative overflow-hidden rounded-[20px] border border-emerald-200/80 bg-gradient-to-b from-emerald-50 via-lime-50 to-white p-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                          Pesanan Aktif
                        </p>
                        <p className="mt-1 text-[12px] font-black text-slate-800">
                          {orderPreview.resto ?? "Memuat restoran..."}
                        </p>
                      </div>
                      <motion.span
                        className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white ${
                          errorLine === 3
                            ? "bg-rose-600 shadow-sm shadow-rose-300"
                            : "bg-emerald-600"
                        }`}
                        animate={
                          errorLine === 3
                            ? {
                                rotate: [0, -12, 12, -8, 8, 0],
                                scale: [1, 1.06, 1],
                              }
                            : { rotate: 0, scale: 1 }
                        }
                        transition={
                          errorLine === 3
                            ? {
                                duration: 0.55,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }
                            : { duration: 0.2 }
                        }
                      >
                        Promo {orderPreview.kodePromo ?? "-"}
                      </motion.span>
                    </div>

                    <div className="relative mt-2.5 h-28 overflow-hidden rounded-2xl border border-emerald-200 bg-[#f0fdf4]">
                      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,#fdba7440_1px,transparent_1px),linear-gradient(to_bottom,#fdba7440_1px,transparent_1px)] [background-size:18px_18px]" />

                      {errorLine === 0 ? (
                        <>
                          <div className="absolute left-5 top-6 flex flex-col items-center gap-1">
                            <motion.div
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity }}
                              className="text-2xl"
                            >
                              🔥
                            </motion.div>
                            <span className="text-[10px] font-black text-red-600">
                              TERBAKAR!
                            </span>
                          </div>
                          <svg
                            className="pointer-events-none absolute inset-0 h-full w-full"
                            viewBox="0 0 320 160"
                            preserveAspectRatio="none"
                          >
                            <path
                              d="M50,45 C130,30 180,80 260,112"
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="4"
                              strokeDasharray="8 7"
                              opacity="0.5"
                            />
                          </svg>
                        </>
                      ) : (
                        <>
                          <div className="absolute left-5 top-6 flex items-center gap-1 text-emerald-700">
                            <Store size={13} />
                            <span className="text-[10px] font-black">
                              Resto
                            </span>
                          </div>
                          <svg
                            className="pointer-events-none absolute inset-0 h-full w-full"
                            viewBox="0 0 320 160"
                            preserveAspectRatio="none"
                          >
                            <path
                              d="M50,45 C130,30 180,80 260,112"
                              fill="none"
                              stroke={errorLine === 2 ? "#f59e0b" : "#22c55e"}
                              strokeWidth="4"
                              strokeDasharray="8 7"
                              opacity={errorLine === 2 ? "0.9" : "0.7"}
                            />
                          </svg>
                          {errorLine === 2 && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-amber-300 bg-amber-100/95 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-amber-800"
                            >
                              Tarif/KM tidak valid
                            </motion.div>
                          )}
                        </>
                      )}

                      <div className="absolute bottom-6 right-5 flex items-center gap-1 text-emerald-700">
                        <House size={13} />
                        <span className="text-[10px] font-black">Rumah</span>
                      </div>

                      <motion.div
                        className="absolute z-20"
                        style={{
                          width: "32px",
                          height: "32px",
                          left: `${riderXPercent}%`,
                          top: `${riderYPercent}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                        animate={
                          errorLine === 1
                            ? {
                                transform: [
                                  "translate(-50%, -50%)",
                                  "translate(-50%, -30%) rotateZ(45deg)",
                                  "translate(-50%, -10%) rotateZ(90deg)",
                                  "translate(-50%, 10%) rotateZ(180deg)",
                                ],
                              }
                            : {
                                transform: "translate(-50%, -50%)",
                              }
                        }
                        transition={
                          errorLine === 1
                            ? { duration: 0.8, ease: "easeIn" }
                            : { duration: 0.45 }
                        }
                      >
                        <div
                          className={`rounded-full border p-1 shadow-md transition-all w-full h-full flex items-center justify-center ${
                            errorLine === 0
                              ? "border-red-400 bg-red-100 text-red-600"
                              : errorLine === 1
                                ? "border-orange-400 bg-orange-100 text-orange-600 opacity-70"
                                : "border-emerald-300 bg-white text-emerald-600"
                          }`}
                        >
                          <Bike size={14} />
                        </div>
                      </motion.div>
                    </div>

                    <motion.div
                      className="relative mx-auto mt-2.5 w-[92%] rounded-xl border bg-white p-2.5 text-[10px]"
                      animate={
                        errorLine === 2 || errorLine === 4 || errorLine === 5
                          ? {
                              x: [-2, 2, -2, 2, 0],
                              boxShadow: [
                                "0 0 0 0 rgba(239, 68, 68, 0)",
                                errorLine === 2
                                  ? "0 0 10px 3px rgba(245, 158, 11, 0.35)"
                                  : errorLine === 4
                                    ? "0 0 10px 3px rgba(244, 63, 94, 0.35)"
                                    : "0 0 10px 3px rgba(220, 38, 38, 0.35)",
                              ],
                            }
                          : { x: 0 }
                      }
                      transition={
                        errorLine === 2 || errorLine === 4 || errorLine === 5
                          ? { duration: 0.6, repeat: 1 }
                          : { duration: 0.3 }
                      }
                      style={{
                        borderColor:
                          errorLine === 2
                            ? "rgb(245, 158, 11)"
                            : errorLine === 4
                              ? "rgb(244, 63, 94)"
                              : errorLine === 5
                                ? "rgb(220, 38, 38)"
                                : "rgb(203, 213, 225)",
                        backgroundColor:
                          errorLine === 2
                            ? "rgb(255, 251, 235)"
                            : errorLine === 4
                              ? "rgb(255, 241, 242)"
                              : errorLine === 5
                                ? "rgb(254, 242, 242)"
                                : "white",
                      }}
                    >
                      {errorLine === 2 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-[9px] font-black uppercase tracking-wide text-amber-800 shadow-sm">
                          Tarif per km bermasalah
                        </div>
                      )}
                      {errorLine === 4 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full border border-rose-300 bg-rose-100 px-3 py-1 text-[9px] font-black uppercase tracking-wide text-rose-700 shadow-sm">
                          Kalkulasi total error
                        </div>
                      )}
                      {errorLine === 5 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full border border-red-300 bg-red-100 px-3 py-1 text-[9px] font-black uppercase tracking-wide text-red-700 shadow-sm">
                          Validasi gratis ongkir gagal
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span
                          className={`${errorLine === 2 ? "text-amber-700" : errorLine === 4 ? "text-rose-700" : errorLine === 5 ? "text-red-700" : "text-slate-500"}`}
                        >
                          Jarak
                        </span>
                        <span
                          className={`font-black ${errorLine === 2 ? "text-amber-800" : errorLine === 4 ? "text-rose-700" : errorLine === 5 ? "text-red-700" : "text-slate-800"}`}
                        >
                          {orderPreview.jarakKM !== null
                            ? `${orderPreview.jarakKM.toFixed(1)} km`
                            : "-"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span
                          className={`${errorLine === 2 ? "text-amber-700" : errorLine === 4 ? "text-rose-700" : errorLine === 5 ? "text-red-700" : "text-slate-500"}`}
                        >
                          Ongkir per km
                        </span>
                        <span
                          className={`font-black ${errorLine === 2 ? "text-amber-800" : errorLine === 4 ? "text-rose-700" : errorLine === 5 ? "text-red-700" : "text-slate-800"}`}
                        >
                          {errorLine === 2
                            ? "Rp --/km"
                            : orderPreview.ongkirPerKM !== null
                              ? `Rp ${orderPreview.ongkirPerKM.toFixed(1)}`
                              : "-"}
                        </span>
                      </div>
                      <div
                        className={`mt-2 border-t border-dashed pt-2 ${errorLine === 2 ? "border-amber-200" : errorLine === 4 ? "border-rose-200" : errorLine === 5 ? "border-red-200" : "border-slate-200"}`}
                      />
                      <div className="flex items-center justify-between">
                        <span
                          className={`${errorLine === 2 ? "text-amber-700" : errorLine === 4 ? "text-rose-700" : errorLine === 5 ? "text-red-700" : "text-slate-500"}`}
                        >
                          Total ongkir
                        </span>
                        {errorLine === 4 ? (
                          <motion.span
                            className="font-black text-rose-700"
                            animate={{
                              opacity: [1, 0.45, 1],
                              x: [0, -1, 1, 0],
                            }}
                            transition={{ duration: 0.35, repeat: Infinity }}
                          >
                            Rp 9#.#0?
                          </motion.span>
                        ) : (
                          <span
                            className={`font-black ${errorLine === 2 ? "text-amber-800" : "text-slate-900"}`}
                          >
                            {errorLine === 2
                              ? "Tidak bisa dihitung"
                              : orderPreview.totalOngkir !== null
                                ? `Rp ${orderPreview.totalOngkir.toFixed(2)}`
                                : "-"}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className={`flex items-center gap-1 ${errorLine === 2 ? "text-amber-700" : errorLine === 4 ? "text-rose-700" : errorLine === 5 ? "text-red-700" : "text-slate-500"}`}
                        >
                          <MapPin size={11} /> Gratis ongkir
                        </span>
                        {errorLine === 5 ? (
                          <motion.span
                            className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase text-red-700"
                            animate={{
                              scale: [1, 1.08, 1],
                              opacity: [1, 0.65, 1],
                            }}
                            transition={{ duration: 0.45, repeat: Infinity }}
                          >
                            Status invalid
                          </motion.span>
                        ) : (
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                              errorLine === 2
                                ? "bg-amber-100 text-amber-800"
                                : errorLine === 4
                                  ? "bg-rose-100 text-rose-700"
                                  : orderPreview.gratisOngkir === true
                                    ? "bg-lime-100 text-lime-800"
                                    : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {errorLine === 2
                              ? "Butuh tarif"
                              : errorLine === 4
                                ? "Hitung ulang"
                                : orderPreview.gratisOngkir === null
                                  ? "Belum cek"
                                  : orderPreview.gratisOngkir
                                    ? "Aktif"
                                    : "Tidak"}
                          </span>
                        )}
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
