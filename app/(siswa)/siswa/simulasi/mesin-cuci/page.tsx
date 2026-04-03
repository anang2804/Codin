"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  Activity,
  CheckCircle2,
  BookOpen,
  Flag,
  Lightbulb,
  Terminal,
  Edit3,
  AlertTriangle,
  Cpu,
  ArrowLeft,
  GlassWater,
  Blend,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const EXPECTED_SOLUTION = [
  "INPUT pakaian_kotor",
  "INPUT air",
  "INPUT deterjen",
  "PROCESS isi_air",
  "PROCESS tambah_deterjen",
  "PROCESS cuci_pakaian",
  "PROCESS bilas_pakaian",
  "PROCESS peras_pakaian",
  "OUTPUT pakaian_bersih",
] as const;

const INITIAL_TEMPLATE = [
  "_____ pakaian_kotor",
  "_____ air",
  "_____ deterjen",
  "_____ isi_air",
  "_____ tambah_deterjen",
  "_____ cuci_pakaian",
  "_____ bilas_pakaian",
  "_____ peras_pakaian",
  "_____ pakaian_bersih",
] as const;

const BLANK_LINE_SUFFIX: Record<number, string> = {
  0: "pakaian_kotor",
  1: "air",
  2: "deterjen",
  3: "isi_air",
  4: "tambah_deterjen",
  5: "cuci_pakaian",
  6: "bilas_pakaian",
  7: "peras_pakaian",
  8: "pakaian_bersih",
};

type CommandChoice = "INPUT" | "PROCESS" | "OUTPUT";

const COMMAND_GLOSSARY: Record<string, string> = {
  input:
    "INPUT digunakan untuk membaca data awal yang dibutuhkan mesin cuci sebelum proses dijalankan.",
  output:
    "OUTPUT digunakan untuk menampilkan hasil akhir pemrosesan, yaitu pakaian_bersih.",
  process:
    "PROCESS menandakan tahap transformasi utama, dari pakaian_kotor menjadi pakaian_bersih.",
  proses:
    "PROCESS menandakan tahap transformasi utama, dari pakaian_kotor menjadi pakaian_bersih.",
  start: "START menandai awal algoritma dijalankan.",
  end: "END menandai algoritma selesai dieksekusi.",
};

type CommandDetail = {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
};

const COMMAND_DETAILS: Record<string, CommandDetail> = {
  START: {
    title: "START / END",
    desc: "Menandai awal dan akhir algoritma.",
    icon: <Flag className="text-emerald-500" size={20} />,
    color: "bg-emerald-50 border-emerald-100",
  },
  INPUT_OUTPUT: {
    title: "INPUT / OUTPUT",
    desc: "INPUT Menampilkan data yang dimasukkan, OUTPUT Menampilkan hasil akhir.",
    icon: <GlassWater className="text-lime-600" size={20} />,
    color: "bg-lime-50 border-lime-100",
  },
  PROCESS: {
    title: "PROSES",
    desc: "Mengolah data menjadi hasil.",
    icon: <Blend className="text-emerald-600" size={20} />,
    color: "bg-emerald-100 border-emerald-200",
  },
  DEFAULT: {
    title: "SIAP MENULIS",
    desc: "Lengkapi bagian yang kosong sesuai urutan logika: input → proses → output.",
    icon: <Edit3 className="text-muted-foreground" size={20} />,
    color: "bg-slate-50 border-slate-200",
  },
};

const SIMULASI_SLUG = "mesin-cuci-lanjutan";
const CLOTHES_OPTIONS = ["seragam", "kaos", "celana"] as const;
const DETERGEN_OPTIONS = ["deterjen cair", "deterjen bubuk"] as const;
const ITEM_TYPES = {
  pakaian_kotor: { color: "#94a3b8", name: "Pakaian Kotor", icon: "👕" },
  air: { color: "#38bdf8", name: "Air", icon: "💧" },
  deterjen: { color: "#c084fc", name: "Deterjen", icon: "🧴" },
} as const;

const FOREIGN_OBJECTS = [
  { name: "Batu", icon: "🪨", color: "#6b7280" },
  { name: "Sendok", icon: "🥄", color: "#94a3b8" },
  { name: "Baut", icon: "🔩", color: "#64748b" },
] as const;

const DRUM_BUBBLE_LEFTS = [16, 28, 40, 52, 64, 76] as const;
const OVERHEAT_SPARKS = [
  { x: -30, y: -84, duration: 0.85, delay: 0 },
  { x: -22, y: -74, duration: 0.92, delay: 0.08 },
  { x: -12, y: -66, duration: 0.82, delay: 0.16 },
  { x: 6, y: -79, duration: 0.88, delay: 0.24 },
  { x: 16, y: -70, duration: 0.9, delay: 0.32 },
  { x: 28, y: -62, duration: 0.84, delay: 0.4 },
] as const;

const STEP_ADVANCE_DELAY_MS = 1800;
const PROCESS_SUBSTEP_DELAY_MS = 1100;
const OUTPUT_DELAY_MS = 1300;

const toTitle = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

type SimData = {
  pakaian_kotor: string;
  air: string;
  deterjen: string;
  pakaian_bersih: string;
};

type WashPhase =
  | "idle"
  | "input_clothes"
  | "input_water"
  | "input_detergent"
  | "fill"
  | "detergent"
  | "wash"
  | "rinse"
  | "spin"
  | "output";

const DirtyLaundryIcon = ({
  emoji,
  className = "",
}: {
  emoji: string;
  className?: string;
}) => (
  <span
    className={`relative inline-flex items-center justify-center ${className}`}
  >
    <span className="saturate-50 brightness-90 contrast-95">{emoji}</span>
    <span
      className="absolute rounded-full bg-amber-900/75"
      style={{ width: "0.26em", height: "0.26em", top: "26%", left: "22%" }}
    />
    <span
      className="absolute rounded-full bg-stone-800/65"
      style={{ width: "0.2em", height: "0.2em", bottom: "24%", right: "24%" }}
    />
    <span
      className="absolute rounded-full bg-yellow-900/55"
      style={{ width: "0.14em", height: "0.14em", top: "52%", left: "56%" }}
    />
  </span>
);

const MesinCuciSimulation = () => {
  const [selectedCommands, setSelectedCommands] = useState<
    Partial<Record<number, CommandChoice>>
  >({});
  const [openSelectorLine, setOpenSelectorLine] = useState<number | null>(null);
  const [code, setCode] = useState<string>(INITIAL_TEMPLATE.join("\n"));
  const [activeLine, setActiveLine] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorLine, setErrorLine] = useState<number>(-1);
  const [showSuccessCard, setShowSuccessCard] = useState<boolean>(false);
  const [hasTried, setHasTried] = useState<boolean>(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState<boolean>(false);

  const [pakaianKotor, setPakaianKotor] = useState<string>("");
  const [airInput, setAirInput] = useState<string>("");
  const [deterjenInput, setDeterjenInput] = useState<string>("");
  const [pakaianBersih, setPakaianBersih] = useState<string>("");
  const [blenderActive, setBlenderActive] = useState<boolean>(false);
  const [jusKeluar, setJusKeluar] = useState<boolean>(false);
  const [liquidLevel, setLiquidLevel] = useState<number>(0);
  const [glassLevel, setGlassLevel] = useState<number>(0);
  const [mixedColor, setMixedColor] = useState<string>(
    "rgba(255,255,255,0.05)",
  );
  const [isPouring, setIsPouring] = useState<boolean>(false);
  const [blenderBroken, setBlenderBroken] = useState<boolean>(false);
  const [isLeaking, setIsLeaking] = useState<boolean>(false);
  const [isOverheating, setIsOverheating] = useState<boolean>(false);
  const [washPhase, setWashPhase] = useState<WashPhase>("idle");
  const [foamLevel, setFoamLevel] = useState<number>(0);
  const [foreignObject, setForeignObject] = useState<
    (typeof FOREIGN_OBJECTS)[number] | null
  >(null);
  const [feedback, setFeedback] = useState<string>(
    "Sistem siap menjalankan algoritma.",
  );

  const simDataRef = useRef<SimData>({
    pakaian_kotor: "",
    air: "",
    deterjen: "",
    pakaian_bersih: "",
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const linesArray = code.split("\n");

  const getLineText = (lineIndex: number): string => {
    const suffix = BLANK_LINE_SUFFIX[lineIndex];
    if (!suffix) return INITIAL_TEMPLATE[lineIndex] || "";

    const command = selectedCommands[lineIndex] ?? "_____";
    return `${command} ${suffix}`;
  };

  const updateSimData = (newData: Partial<SimData>) => {
    simDataRef.current = { ...simDataRef.current, ...newData };
  };

  const generateEducationalFeedback = (
    typedLine: string,
    lineIdx: number,
  ): string => {
    const trimmed = typedLine.trim().toLowerCase();
    const firstWord = trimmed.split(" ")[0];

    if (!trimmed || trimmed.includes("_____")) {
      return `Baris ${lineIdx + 1} Algoritma belum lengkap.\n\nLengkapi terlebih dahulu bagian yang kosong sesuai template yang tersedia.\n\nPetunjuk: gunakan urutan input → proses → output dengan benar.`;
    }

    if (COMMAND_GLOSSARY[firstWord]) {
      return `Baris ${lineIdx + 1} salah.\n\n${COMMAND_GLOSSARY[firstWord]}`;
    }

    if (lineIdx >= 3 && lineIdx <= 7) {
      return `Baris ${lineIdx + 1} salah.\n\nPetunjuk: ikuti urutan langkah process dari atas ke bawah sesuai template.`;
    }

    if (lineIdx >= 0 && lineIdx <= 2) {
      return `Baris ${lineIdx + 1} salah.\n\nPetunjuk: pastikan format INPUT dan nama variabel sesuai template.`;
    }

    if (lineIdx === 8) {
      return `Baris ${lineIdx + 1} salah.\n\nPetunjuk: gunakan format OUTPUT untuk menampilkan hasil akhir.`;
    }

    return `Baris ${lineIdx + 1} salah.\n\nPetunjuk: sesuaikan baris ini dengan struktur IPO pada template.`;
  };

  const getActiveDescription = (): CommandDetail => {
    const lineContent = linesArray[activeLine]?.trim().toLowerCase() || "";
    if (lineContent.includes("start") || lineContent.includes("end")) {
      return COMMAND_DETAILS.START;
    }
    if (lineContent.startsWith("input") || lineContent.startsWith("output")) {
      return COMMAND_DETAILS.INPUT_OUTPUT;
    }
    if (lineContent.includes("proses") || lineContent.includes("process")) {
      return COMMAND_DETAILS.PROCESS;
    }
    return COMMAND_DETAILS.DEFAULT;
  };

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

  useEffect(() => {
    const newCode = INITIAL_TEMPLATE.map((_, i) => getLineText(i)).join("\n");
    setCode(newCode);
  }, [selectedCommands]);

  const handleSelectCommand = (lineIndex: number, command: CommandChoice) => {
    if (isRunning) return;
    setSelectedCommands((prev) => ({ ...prev, [lineIndex]: command }));
    setOpenSelectorLine(null);
    setActiveLine(lineIndex);
    setErrorLine(-1);
    setShowSuccessCard(false);
  };

  const resetSim = (clearEditor: boolean = true) => {
    setIsRunning(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setPakaianKotor("");
    setAirInput("");
    setDeterjenInput("");
    setPakaianBersih("");
    setBlenderActive(false);
    setJusKeluar(false);
    setLiquidLevel(0);
    setGlassLevel(0);
    setMixedColor("rgba(255,255,255,0.05)");
    setIsPouring(false);
    setBlenderBroken(false);
    setIsLeaking(false);
    setIsOverheating(false);
    setWashPhase("idle");
    setFoamLevel(0);
    setForeignObject(null);
    setFeedback("Sistem siap menjalankan algoritma.");
    updateSimData({
      pakaian_kotor: "",
      air: "",
      deterjen: "",
      pakaian_bersih: "",
    });

    if (clearEditor) {
      setSelectedCommands({});
      setOpenSelectorLine(null);
      setCode(INITIAL_TEMPLATE.join("\n"));
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
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

  const executeStep = async (index: number): Promise<void> => {
    if (index >= EXPECTED_SOLUTION.length || code.trim() === "") {
      setIsRunning(false);
      setActiveLine(-1);
      return;
    }

    setActiveLine(index);

    const lineRaw = linesArray[index] || "";
    const lineParsed = lineRaw.trim().toLowerCase();
    const solution = EXPECTED_SOLUTION[index]?.toLowerCase();

    if (lineParsed !== solution) {
      setIsRunning(false);
      setErrorLine(index);
      setShowSuccessCard(false);
      const isInputLine = index === 0 || index === 1 || index === 2;
      const hasWrongContent =
        lineParsed !== "" && !lineParsed.includes("_____");

      if (isInputLine && hasWrongContent) {
        const usedProcess =
          lineParsed.startsWith("process") || lineParsed.startsWith("proses");
        const usedOutputInsteadInput = lineParsed.startsWith("output");

        if (usedProcess) {
          setBlenderBroken(true);
          setIsOverheating(true);
          setBlenderActive(true);
          setIsLeaking(false);
          setForeignObject(null);
          setIsPouring(false);
          setLiquidLevel(0);
          setMixedColor("linear-gradient(to top, #f97316, #dc2626)");
          setFeedback(
            `Baris ${index + 1} salah: Tidak ada input. Mesin cuci berputar tanpa beban, motor overheat, dan sistem gagal berjalan.`,
          );
        } else {
          const randomObject =
            FOREIGN_OBJECTS[Math.floor(Math.random() * FOREIGN_OBJECTS.length)];
          setForeignObject(randomObject);
          setBlenderBroken(true);
          setIsOverheating(false);
          setIsLeaking(true);
          setBlenderActive(false);
          setIsPouring(false);
          setLiquidLevel((prev) => Math.max(prev, 45));
          setMixedColor("linear-gradient(to top, #38bdf8, #7dd3fc)");
          setFeedback(
            usedOutputInsteadInput
              ? `Baris ${index + 1} salah: OUTPUT belum boleh dipanggil sebelum INPUT selesai.`
              : `Baris ${index + 1} salah. Objek asing (${randomObject.name}) masuk ke tabung, mesin cuci error dan bocor.`,
          );
        }
      } else {
        setBlenderBroken(false);
        setIsLeaking(false);
        setIsOverheating(false);
        setForeignObject(null);
        const eduFeedback = generateEducationalFeedback(lineRaw, index);
        setFeedback(eduFeedback);
      }
      return;
    }

    if (lineParsed === "input pakaian_kotor") {
      const picked =
        CLOTHES_OPTIONS[Math.floor(Math.random() * CLOTHES_OPTIONS.length)];
      setPakaianKotor(picked);
      setBlenderBroken(false);
      setIsLeaking(false);
      setIsOverheating(false);
      setWashPhase("input_clothes");
      setFoamLevel(0);
      setForeignObject(null);
      setLiquidLevel(0);
      setMixedColor("rgba(255,255,255,0.05)");
      updateSimData({ pakaian_kotor: picked });
      setFeedback(`INPUT: Membaca pakaian_kotor = \"${toTitle(picked)}\"`);
    }

    if (lineParsed === "input air") {
      setAirInput("air bersih");
      setBlenderBroken(false);
      setIsLeaking(false);
      setIsOverheating(false);
      setWashPhase("input_water");
      setForeignObject(null);
      setLiquidLevel(0);
      setMixedColor("rgba(255,255,255,0.05)");
      updateSimData({ air: "air bersih" });
      setFeedback('INPUT: Membaca air = "Air Bersih"');
    }

    if (lineParsed === "input deterjen") {
      const picked =
        DETERGEN_OPTIONS[Math.floor(Math.random() * DETERGEN_OPTIONS.length)];
      setDeterjenInput(picked);
      setBlenderBroken(false);
      setIsLeaking(false);
      setIsOverheating(false);
      setWashPhase("input_detergent");
      setFoamLevel(0);
      setForeignObject(null);
      setLiquidLevel(0);
      setMixedColor("rgba(255,255,255,0.05)");
      updateSimData({ deterjen: picked });
      setFeedback(`INPUT: Membaca deterjen = \"${toTitle(picked)}\"`);
    }

    const processStep = lineParsed.startsWith("process ")
      ? lineParsed.replace("process ", "")
      : "";

    if (
      processStep === "isi_air" ||
      processStep === "tambah_deterjen" ||
      processStep === "cuci_pakaian" ||
      processStep === "bilas_pakaian" ||
      processStep === "peras_pakaian"
    ) {
      setBlenderActive(true);
      const stepLabelMap: Record<string, string> = {
        isi_air: "Mengisi air ke tabung",
        tambah_deterjen: "Menambahkan deterjen",
        cuci_pakaian: "Mencuci pakaian",
        bilas_pakaian: "Membilas pakaian",
        peras_pakaian: "Memeras pakaian",
      };

      if (processStep === "isi_air") {
        setWashPhase("fill");
        setLiquidLevel(94);
        setMixedColor("linear-gradient(to top, #93c5fd, #38bdf8)");
      }

      if (processStep === "tambah_deterjen") {
        setWashPhase("detergent");
        setFoamLevel(62);
        setLiquidLevel(78);
        setMixedColor("linear-gradient(to top, #93c5fd, #c084fc)");
      }

      if (processStep === "cuci_pakaian") {
        setWashPhase("wash");
        setFoamLevel(55);
        setLiquidLevel(74);
        setMixedColor("linear-gradient(to top, #60a5fa, #6366f1)");
      }

      if (processStep === "bilas_pakaian") {
        setWashPhase("rinse");
        setFoamLevel(22);
        setLiquidLevel(64);
        setMixedColor("linear-gradient(to top, #7dd3fc, #bfdbfe)");
      }

      if (processStep === "peras_pakaian") {
        setWashPhase("spin");
        setFoamLevel(6);
      }

      setFeedback(`PROCESS: ${stepLabelMap[processStep]}`);
      await new Promise((resolve) =>
        setTimeout(resolve, PROCESS_SUBSTEP_DELAY_MS),
      );
      if (processStep === "peras_pakaian") {
        setLiquidLevel(22);
      }
      setBlenderActive(false);
    }

    if (lineParsed === "output pakaian_bersih") {
      const hasilPakaian = `${toTitle(simDataRef.current.pakaian_kotor)} bersih`;
      setPakaianBersih(hasilPakaian);
      updateSimData({ pakaian_bersih: hasilPakaian });
      setIsPouring(true);
      setWashPhase("output");
      setFoamLevel(0);
      await new Promise((resolve) => setTimeout(resolve, OUTPUT_DELAY_MS));
      setLiquidLevel(10);
      setGlassLevel(85);
      setJusKeluar(true);
      setIsPouring(false);
      setWashPhase("idle");
      setShowSuccessCard(true);
      setFeedback(`OUTPUT: ${hasilPakaian} berhasil dihasilkan.`);
    }

    timerRef.current = setTimeout(() => {
      void executeStep(index + 1);
    }, STEP_ADVANCE_DELAY_MS);
  };

  const startRunning = () => {
    resetSim(false);
    setIsRunning(true);
    void executeStep(0);
  };

  const currentDesc = getActiveDescription();
  const pakaianData = ITEM_TYPES.pakaian_kotor;
  const airData = ITEM_TYPES.air;
  const deterjenData = ITEM_TYPES.deterjen;
  const totalDisplayLines = Math.max(INITIAL_TEMPLATE.length, 12);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans overflow-hidden">
      <header className="bg-background border-b border-border px-6 py-3 flex justify-between items-center z-40 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              window.location.href = "/siswa/simulasi";
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
          >
            <ArrowLeft size={14} /> Kembali
          </button>

          <div className="w-px h-6 bg-border" />

          <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-emerald-100 shadow-lg">
            <Terminal size={20} />
          </div>

          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-lg font-black tracking-tighter text-foreground uppercase italic leading-none">
                Mesin Cuci
              </h1>
            </div>
            <span className="text-[8px] text-emerald-600 font-bold tracking-widest uppercase italic bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Lanjutan
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => resetSim()}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-muted text-foreground hover:bg-muted/80 border border-border rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
          >
            <RotateCcw size={14} /> Reset
          </button>

          <button
            onClick={markAsTried}
            disabled={hasTried || isSavingCompletion}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-95 disabled:opacity-50 ${
              hasTried
                ? "bg-[#d1fae5] text-[#0f766e] border-2 border-[#86efac] shadow-sm"
                : "bg-[#e6f7f1] text-[#0f766e] border border-[#a7f3d0] hover:bg-[#d1fae5] shadow-sm hover:shadow-md"
            }`}
          >
            <CheckCircle2 size={14} /> {hasTried ? "Selesai" : "Tandai Selesai"}
          </button>

          <button
            onClick={startRunning}
            disabled={isRunning}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 ${
              isRunning
                ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                : "bg-gradient-to-br from-[#16a34a] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-white"
            }`}
          >
            <Play size={14} fill={isRunning ? "none" : "white"} /> Jalankan
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-72 bg-card border-r border-border p-5 flex flex-col gap-6 shrink-0 z-20 overflow-y-auto">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-600/60" />
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-wrap">
              Deskripsi Perintah
            </h2>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentDesc.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-5 rounded-3xl border ${currentDesc.color} shadow-sm transition-all duration-300`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-background/90 rounded-xl shadow-sm">
                  {currentDesc.icon}
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                  {currentDesc.title}
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                {currentDesc.desc}
              </p>
            </motion.div>
          </AnimatePresence>

          <div
            className={`p-3 rounded-2xl border transition-all duration-300 ${
              errorLine !== -1
                ? "bg-rose-50/95 border-rose-200"
                : "bg-card border-border"
            }`}
          >
            <div
              className={`flex items-center gap-2 pb-2 border-b ${
                errorLine !== -1 ? "border-rose-200" : "border-slate-200"
              }`}
            >
              {errorLine !== -1 ? (
                <AlertTriangle size={13} className="text-rose-500" />
              ) : (
                <CheckCircle2
                  size={12}
                  className={
                    jusKeluar ? "text-emerald-500" : "text-muted-foreground"
                  }
                />
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
                  ? "text-rose-700 bg-rose-100/60"
                  : "text-foreground bg-muted"
              }`}
            >
              {feedback}
            </div>
          </div>

          <div className="mt-auto p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
            <div className="flex items-center justify-between text-[9px] font-black text-emerald-600/60 uppercase mb-2">
              <span>Status Fokus</span>
              <Activity size={10} />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground italic leading-tight">
              {activeLine !== -1
                ? `Menganalisis baris ke-${activeLine + 1}`
                : "Editor siap digunakan"}
            </p>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 bg-background">
          <section className="px-6 pt-4 pb-2">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
              <div className="bg-background p-2 rounded-xl shadow-sm text-primary">
                <Lightbulb size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded uppercase tracking-widest">
                    MISI
                  </span>
                  <h2 className="text-[15px] font-black text-foreground uppercase tracking-tight">
                    Rancang Algoritma Mesin Cuci
                  </h2>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed max-w-4xl font-medium">
                  Ayo bantu mesin cuci menyelesaikan tugasnya! 🧺
                  <br />
                  Lengkapi alur IPO agar mesin dapat membaca pakaian, air, dan
                  deterjen, melakukan pencucian, hingga menghasilkan
                  pakaian_bersih.
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
                <div className="bg-card border border-emerald-200 rounded-2xl px-4 py-3 shadow-sm">
                  <h3 className="text-sm font-black text-emerald-700 tracking-tight">
                    🎉 Berhasil! Algoritma benar
                  </h3>
                  <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed font-medium">
                    Algoritma berjalan sesuai urutan input → proses → output.
                    <br />
                    Mesin cuci berhasil menghasilkan pakaian_bersih dengan
                    benar.
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="flex-1 flex gap-5 px-6 pb-6 overflow-hidden">
            <section className="flex-1 min-w-[500px] bg-card rounded-3xl border border-border shadow-sm flex flex-col overflow-hidden relative">
              <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isRunning
                        ? "bg-rose-500 animate-pulse"
                        : errorLine !== -1
                          ? "bg-red-500 shadow-[0_0_5px_red]"
                          : "bg-emerald-500"
                    }`}
                  />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic font-mono">
                    ALGORITMA MESIN CUCI
                  </span>
                </div>
                <div
                  className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${
                    isRunning
                      ? "bg-rose-500 text-white"
                      : errorLine !== -1
                        ? "bg-red-500 text-white border-red-600 shadow-sm"
                        : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  {isRunning
                    ? "RUNNING"
                    : errorLine !== -1
                      ? "ERROR"
                      : "SIAP MENYUSUN"}
                </div>
              </div>

              <div className="relative flex-1 flex font-mono text-[12px] leading-[22px] overflow-hidden">
                <div
                  id="line-gutter"
                  className="w-12 bg-muted/30 text-muted-foreground/70 text-right pr-4 pt-5 select-none border-r border-border/60 overflow-hidden shrink-0"
                >
                  {Array.from({ length: totalDisplayLines }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-[22px] transition-all ${
                        activeLine === i
                          ? "text-emerald-600 font-black scale-110 pr-1"
                          : ""
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                <div className="relative flex-1 bg-card overflow-hidden">
                  <div className="absolute inset-0 p-4 pt-4 whitespace-pre overflow-hidden z-10">
                    {INITIAL_TEMPLATE.map((_, i) => {
                      const isActive = activeLine === i;
                      const suffix = BLANK_LINE_SUFFIX[i];
                      const selected = selectedCommands[i];
                      return (
                        <div
                          key={i}
                          className="relative h-[22px] flex items-center"
                        >
                          {isActive && (
                            <motion.div
                              layoutId="lineHighlight"
                              className={`absolute inset-0 -mx-5 border-l-4 z-0 ${
                                isRunning
                                  ? "bg-emerald-50 border-emerald-500"
                                  : errorLine === i
                                    ? "bg-red-50 border-red-500"
                                    : "bg-emerald-50/30 border-emerald-200"
                              }`}
                            />
                          )}

                          <div
                            className={`relative z-10 whitespace-pre text-slate-900 font-bold ${
                              isRunning && activeLine > i ? "opacity-30" : ""
                            }`}
                          >
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => {
                                setOpenSelectorLine(i);
                                setActiveLine(i);
                              }}
                              className={`rounded px-1 py-0 transition-all ${
                                selected
                                  ? "text-slate-900 hover:bg-emerald-50"
                                  : "text-slate-300 italic hover:bg-slate-100"
                              } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selected ?? "_____"}
                            </button>{" "}
                            <span className="text-slate-900 font-bold">
                              {suffix}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {openSelectorLine !== null && !isRunning && (
                    <div className="absolute left-4 right-4 bottom-4 z-30 bg-card border border-emerald-200 rounded-xl px-3 py-2 shadow-lg">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">
                        PILIH PERINTAH BARIS {openSelectorLine + 1}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "INPUT")
                          }
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wide rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          INPUT
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "PROCESS")
                          }
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wide rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        >
                          PROCESS
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "OUTPUT")
                          }
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wide rounded-lg border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
                        >
                          OUTPUT
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="w-[380px] bg-[#020617] rounded-3xl flex flex-col shrink-0 min-h-0 overflow-hidden shadow-2xl border border-slate-800 relative">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center px-6">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                    <Activity size={14} />
                  </div>
                  <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    VISUALISASI
                  </h2>
                </div>
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    errorLine !== -1
                      ? "bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]"
                      : blenderActive
                        ? "bg-emerald-500 animate-pulse shadow-[0_0_10px_#22c55e]"
                        : "bg-slate-700"
                  }`}
                />
              </div>

              <div className="flex-1 min-h-[230px] md:min-h-[260px] p-4 md:p-6 flex flex-col items-center justify-center relative bg-[radial-gradient(circle_at_center,_#111827_0%,_#020617_72%)] overflow-hidden">
                <motion.div
                  animate={
                    errorLine !== -1
                      ? { x: [0, -4, 4, -3, 3, 0], y: 0, rotate: 0 }
                      : blenderActive
                        ? {
                            x: 0,
                            y: [0, -1.2, 0, 1, 0],
                            rotate: [0, 0.2, 0, -0.2, 0],
                          }
                        : { x: 0, y: 0, rotate: 0 }
                  }
                  transition={
                    errorLine !== -1
                      ? { duration: 0.35, repeat: Infinity, ease: "linear" }
                      : blenderActive
                        ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.25 }
                  }
                  className="relative flex flex-col items-center scale-90 md:scale-95"
                >
                  <AnimatePresence>
                    {washPhase === "input_clothes" && (
                      <motion.div
                        initial={{ y: 0, opacity: 1 }}
                        animate={{ y: -60, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative flex flex-col items-center"
                      >
                        {/* Basket image */}
                        <div className="w-16 h-20 mb-2">
                          <img
                            src="/uploads/basket.png"
                            alt="Keranjang"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        {/* Dirty clothes icon */}
                        <motion.div
                          initial={{ y: 0, opacity: 0 }}
                          animate={{ y: -40, opacity: 1 }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="text-4xl"
                        >
                          <DirtyLaundryIcon
                            emoji={ITEM_TYPES.pakaian_kotor.icon}
                          />
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {(washPhase === "input_water" || washPhase === "fill") && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-[-78px] top-4 z-40 w-[196px] h-[102px]"
                      >
                        <div className="absolute left-0 top-[56px] w-3.5 h-3.5 rounded-full border border-cyan-200/70 bg-slate-700/95" />
                        <div className="absolute left-[3px] top-[58px] w-4 h-[2px] rounded-full bg-cyan-200/70" />

                        <div className="absolute right-3 top-0 w-14 h-8 rounded-md border-2 border-slate-500 bg-slate-800/90 shadow-md" />
                        <div className="absolute right-7 top-[-7px] w-6 h-3 rounded-full border border-slate-400 bg-slate-700/95" />
                        <div className="absolute right-2 top-[12px] w-6 h-3 rounded-r-full border-y-2 border-r-2 border-slate-500 bg-slate-800/90" />
                        <div className="absolute right-[1px] top-[12px] w-3 h-3 rounded-full border border-cyan-200/70 bg-slate-700/95" />

                        <svg
                          className="absolute inset-0"
                          width="196"
                          height="102"
                          viewBox="0 0 196 102"
                          fill="none"
                        >
                          <motion.path
                            d="M184 26 C 164 28, 144 34, 126 42 C 99 54, 66 58, 36 58 L 8 58"
                            stroke="rgba(148,163,184,0.92)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.75, ease: "easeOut" }}
                          />
                          <motion.path
                            d="M184 26 C 164 28, 144 34, 126 42 C 99 54, 66 58, 36 58 L 8 58"
                            stroke="rgba(56,189,248,0.7)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.85, ease: "easeOut" }}
                          />
                          <motion.path
                            d="M184 26 C 164 28, 144 34, 126 42 C 99 54, 66 58, 36 58 L 8 58"
                            stroke="rgba(186,230,253,0.95)"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeDasharray="8 10"
                            animate={{ strokeDashoffset: [0, -18] }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.9,
                              ease: "linear",
                            }}
                          />
                        </svg>

                        <motion.div
                          animate={
                            washPhase === "fill"
                              ? {
                                  y: [0, 10, 20],
                                  opacity: [0, 1, 0],
                                  scale: [0.9, 1, 0.8],
                                }
                              : { y: [0, 6, 13], opacity: [0, 1, 0] }
                          }
                          transition={{
                            repeat: Infinity,
                            duration: washPhase === "fill" ? 0.62 : 0.78,
                            ease: "easeIn",
                          }}
                          className="absolute left-[6px] top-[60px] w-2 h-2 rounded-full bg-sky-300"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {washPhase === "fill" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-[72px] top-[58px] z-30 w-[86px] h-[120px] pointer-events-none"
                      >
                        <motion.div
                          animate={{
                            opacity: [0.45, 0.9, 0.5],
                            scaleY: [0.92, 1.02, 0.96],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.7,
                            ease: "easeInOut",
                          }}
                          className="absolute left-1/2 -translate-x-1/2 top-0 w-[10px] h-[94px] rounded-b-full"
                          style={{
                            background:
                              "linear-gradient(to bottom, rgba(186,230,253,0.9), rgba(56,189,248,0.92), rgba(2,132,199,0.75))",
                          }}
                        />
                        <motion.div
                          animate={{
                            y: [0, 4, 9],
                            opacity: [0.25, 0.95, 0],
                            scale: [0.8, 1.08, 0.9],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.6,
                            ease: "easeIn",
                          }}
                          className="absolute left-1/2 -translate-x-1/2 top-[90px] w-[16px] h-[9px] rounded-full bg-sky-200/85"
                        />
                        <motion.div
                          animate={{ y: [0, 6, 12], opacity: [0, 0.9, 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.72,
                            delay: 0.16,
                            ease: "easeIn",
                          }}
                          className="absolute left-[34px] top-[88px] w-1.5 h-1.5 rounded-full bg-sky-300/90"
                        />
                        <motion.div
                          animate={{ y: [0, 6, 12], opacity: [0, 0.9, 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.72,
                            delay: 0.3,
                            ease: "easeIn",
                          }}
                          className="absolute right-[34px] top-[88px] w-1.5 h-1.5 rounded-full bg-cyan-200/90"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {washPhase === "input_detergent" && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="absolute -left-[84px] top-10 z-40 w-[150px] h-[118px]"
                      >
                        <div className="px-2.5 py-1.5 rounded-lg bg-violet-500/20 border border-violet-300/40 text-[10px] font-black text-violet-100 uppercase tracking-wide">
                          Siapkan Deterjen
                        </div>

                        <div className="absolute right-1 top-[42px] w-8 h-6 rounded-md border border-slate-500 bg-slate-800/90" />
                        <div className="absolute right-2 top-[44px] w-6 h-[2px] rounded-full bg-white/25" />

                        <motion.div
                          animate={{
                            rotate: [0, -16, -12, 0],
                            y: [0, -1, -2, 0],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.7,
                            ease: "easeInOut",
                          }}
                          className="absolute left-3 top-[42px] w-12 h-16 origin-bottom-right"
                        >
                          <div className="absolute left-3 -top-2 w-6 h-3 rounded-full border border-violet-300/60 bg-violet-500/80" />
                          <div className="absolute left-0 top-0 w-12 h-16 rounded-2xl border border-violet-300/70 bg-gradient-to-b from-violet-400/95 to-violet-700/90 shadow-md" />
                          <div className="absolute left-2 top-6 w-8 h-6 rounded-lg border border-violet-200/60 bg-white/25" />
                          <div className="absolute right-[-4px] top-4 w-3 h-2 rounded-r-full border border-violet-300/70 bg-violet-500/90" />
                        </motion.div>

                        <motion.div
                          animate={{
                            opacity: [0, 0.9, 0.9, 0],
                            height: [0, 10, 14, 0],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.7,
                            ease: "easeInOut",
                          }}
                          className="absolute left-[61px] top-[64px] w-[3px] rounded-full bg-violet-200/90"
                        />

                        <motion.div
                          animate={{
                            opacity: [0.4, 0.95, 0.5],
                            scale: [0.8, 1, 0.85],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.7,
                            ease: "easeInOut",
                          }}
                          className="absolute right-[11px] top-[51px] w-3 h-2 rounded-full bg-violet-200/70"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative w-56 h-60 z-20">
                    <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-slate-600 via-slate-700 to-slate-900 border border-slate-400/70 shadow-[0_20px_45px_rgba(2,6,23,0.55)]" />
                    <div className="absolute inset-x-5 top-2 h-3 rounded-full bg-white/10 blur-md" />
                    <div className="absolute inset-x-8 top-16 h-[1px] bg-white/10" />
                    <div className="absolute top-4 left-4 right-4 h-12 rounded-xl bg-slate-800/95 border border-slate-500/80 flex items-center justify-between px-3">
                      <div className="absolute inset-y-2 left-[42%] w-[1px] bg-white/10" />
                      <div className="flex gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${isRunning ? "bg-emerald-400" : "bg-slate-600"}`}
                        />
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${blenderActive ? "bg-cyan-400" : "bg-slate-600"}`}
                        />
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${errorLine !== -1 ? "bg-rose-400" : "bg-slate-600"}`}
                        />
                      </div>
                      <motion.div
                        animate={{
                          rotate:
                            blenderActive && washPhase === "wash"
                              ? [0, 360]
                              : blenderActive
                                ? 360
                                : 0,
                        }}
                        transition={{
                          repeat:
                            blenderActive && washPhase === "wash"
                              ? Infinity
                              : blenderActive
                                ? Infinity
                                : 0,
                          duration:
                            blenderActive && washPhase === "wash" ? 1.15 : 2.4,
                          ease: "linear",
                        }}
                        className="w-6 h-6 rounded-full border-2 border-slate-500/90"
                      />
                    </div>

                    <div className="absolute bottom-7 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full border-[3px] border-slate-300/85 bg-slate-800/75 overflow-hidden shadow-[inset_0_0_26px_rgba(0,0,0,0.35)]">
                      <div className="absolute inset-2 rounded-full border border-white/15 pointer-events-none" />
                      <div className="absolute inset-4 rounded-full border border-black/25 pointer-events-none" />

                      <motion.div
                        animate={{
                          x: [-10, 120],
                          rotate:
                            blenderActive && washPhase === "wash"
                              ? [0, 360]
                              : 0,
                        }}
                        transition={{
                          repeat: Infinity,
                          duration:
                            blenderActive && washPhase === "wash" ? 1.15 : 4.2,
                          ease: "easeInOut",
                          repeatType: "mirror",
                        }}
                        className="absolute -top-2 w-8 h-full bg-white/10 blur-sm pointer-events-none"
                      />

                      <motion.div
                        animate={{
                          height: `${liquidLevel}%`,
                          background: mixedColor,
                        }}
                        transition={{ duration: 1.1, ease: "easeInOut" }}
                        className="absolute bottom-0 left-0 right-0 origin-bottom"
                      />

                      {foamLevel > 0 && (
                        <>
                          <motion.div
                            animate={{
                              opacity: [0.55, 0.78, 0.62],
                              y: [0, -2, 0],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.45,
                              ease: "easeInOut",
                            }}
                            className="absolute left-0 right-0"
                            style={{
                              bottom: `${Math.max(liquidLevel - 10, 0)}%`,
                              height: `${foamLevel * 0.34}%`,
                              background:
                                "radial-gradient(circle at 18% 30%, rgba(255,255,255,0.78), rgba(255,255,255,0.34) 40%, transparent 70%), radial-gradient(circle at 52% 38%, rgba(255,255,255,0.72), rgba(255,255,255,0.3) 45%, transparent 74%), radial-gradient(circle at 84% 28%, rgba(255,255,255,0.7), rgba(255,255,255,0.28) 42%, transparent 72%)",
                            }}
                          />
                          {washPhase === "wash" && (
                            <motion.div
                              animate={{
                                opacity: [0.7, 1, 0.6],
                                scale: [0.8, 1.1, 0.9],
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 1.1,
                                ease: "easeInOut",
                              }}
                              className="absolute left-1/2 -translate-x-1/2 bottom-[18%] w-24 h-8 rounded-full bg-white/80 blur-[2px]"
                            />
                          )}
                        </>
                      )}

                      {blenderActive && (
                        <>
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{
                              repeat: Infinity,
                              duration:
                                washPhase === "spin"
                                  ? 0.55
                                  : washPhase === "wash"
                                    ? 1.15
                                    : 1.9,
                              ease: "linear",
                            }}
                            className="absolute inset-4 rounded-full border border-white/20 border-dashed"
                          />
                          <motion.div
                            animate={{ rotate: [360, 0] }}
                            transition={{
                              repeat: Infinity,
                              duration:
                                washPhase === "spin"
                                  ? 0.5
                                  : washPhase === "wash"
                                    ? 1.05
                                    : 1.8,
                              ease: "linear",
                            }}
                            className="absolute inset-7 rounded-full border border-cyan-200/20"
                          />
                        </>
                      )}

                      {blenderActive && (
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.2,
                            ease: "linear",
                          }}
                          className="absolute inset-0 flex items-center justify-center opacity-65"
                        >
                          <Blend
                            size={44}
                            className="text-white/75 drop-shadow-md"
                          />
                        </motion.div>
                      )}

                      {blenderActive &&
                        DRUM_BUBBLE_LEFTS.map((left, i) => (
                          <motion.div
                            key={`bubble-${left}`}
                            animate={{ y: -55, opacity: 0, scale: 0.6 }}
                            transition={{
                              repeat: Infinity,
                              duration: 1 + i * 0.06,
                              delay: i * 0.12,
                              ease: "easeOut",
                            }}
                            className="absolute bottom-4 w-2 h-2 bg-white/35 rounded-full"
                            style={{ left: `${left}%` }}
                          />
                        ))}

                      {isOverheating &&
                        OVERHEAT_SPARKS.map((spark, i) => (
                          <motion.div
                            key={`spark-${i}`}
                            animate={{
                              x: spark.x,
                              y: spark.y,
                              opacity: [0, 1, 0],
                              scale: [0.6, 1, 0],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: spark.duration,
                              delay: spark.delay,
                              ease: "easeOut",
                            }}
                            className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                            style={{
                              backgroundColor:
                                i % 2 === 0 ? "#fbbf24" : "#f97316",
                              boxShadow:
                                i % 2 === 0
                                  ? "0 0 5px #fbbf24"
                                  : "0 0 5px #f97316",
                            }}
                          />
                        ))}

                      <AnimatePresence>
                        {!!pakaianKotor &&
                          (washPhase === "wash" ||
                            washPhase === "rinse" ||
                            washPhase === "spin") && (
                            <motion.div
                              key="pakaian-drop"
                              initial={{ y: -120, opacity: 0, rotate: -20 }}
                              animate={{
                                y: 34,
                                opacity: 1,
                                rotate: 0,
                              }}
                              className="absolute left-9 w-10 h-10 flex items-center justify-center text-3xl"
                            >
                              <motion.div
                                animate={{
                                  rotate:
                                    blenderActive && washPhase === "wash"
                                      ? [0, 360]
                                      : 0,
                                }}
                                transition={{
                                  repeat:
                                    blenderActive && washPhase === "wash"
                                      ? Infinity
                                      : 0,
                                  duration:
                                    blenderActive && washPhase === "wash"
                                      ? 0.7
                                      : 0.7,
                                  ease: "linear",
                                }}
                                className="inline-block"
                              >
                                {washPhase === "wash" ? (
                                  <DirtyLaundryIcon
                                    emoji={ITEM_TYPES.pakaian_kotor.icon}
                                  />
                                ) : (
                                  <span>{ITEM_TYPES.pakaian_kotor.icon}</span>
                                )}
                              </motion.div>
                            </motion.div>
                          )}
                        {!!deterjenInput && washPhase === "detergent" && (
                          <motion.div
                            key="deterjen-drop"
                            initial={{ y: -120, opacity: 0, rotate: 20 }}
                            animate={{ y: 28, opacity: 1, rotate: 0 }}
                            className="absolute right-9 w-10 h-10 flex items-center justify-center text-3xl"
                          >
                            {ITEM_TYPES.deterjen.icon}
                          </motion.div>
                        )}

                        {blenderBroken && foreignObject && (
                          <motion.div
                            key={`foreign-${foreignObject.name}-${errorLine}`}
                            initial={{ y: -130, opacity: 0, rotate: -15 }}
                            animate={{ y: 42, opacity: 1, rotate: 8 }}
                            exit={{ opacity: 0 }}
                            className="absolute left-1/2 -translate-x-1/2 w-10 h-10 flex items-center justify-center text-3xl"
                            style={{ color: foreignObject.color }}
                          >
                            {foreignObject.icon}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {blenderBroken && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 pointer-events-none"
                        >
                          <div className="absolute top-8 left-9 w-[2px] h-14 bg-rose-300/80 rotate-[15deg]" />
                          <div className="absolute top-10 right-10 w-[2px] h-12 bg-rose-300/80 -rotate-[12deg]" />
                        </motion.div>
                      )}

                      <AnimatePresence>
                        {blenderBroken && isLeaking && (
                          <>
                            <motion.div
                              key="drum-leak-stream"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{
                                height: 52,
                                opacity: [0.4, 0.95, 0.5],
                              }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                height: { duration: 0.4, ease: "easeOut" },
                                opacity: {
                                  repeat: Infinity,
                                  duration: 0.95,
                                  ease: "easeInOut",
                                },
                              }}
                              className="absolute top-[86px] right-[18px] w-[4px] rounded-full"
                              style={{
                                background:
                                  "linear-gradient(to bottom, #bae6fd, #38bdf8, #0284c7)",
                              }}
                            />
                            {[0, 0.25, 0.5].map((delay, idx) => (
                              <motion.div
                                key={`drum-leak-drip-${idx}`}
                                initial={{ y: 0, opacity: 0, scale: 0.8 }}
                                animate={{
                                  y: [0, 10, 20],
                                  opacity: [0, 1, 0],
                                  scale: [0.7, 1, 0.85],
                                }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 0.95,
                                  delay,
                                  ease: "easeIn",
                                }}
                                className="absolute top-[133px] right-[15px] w-2 h-2 rounded-full bg-sky-300"
                              />
                            ))}
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {errorLine !== -1 && (
                    <>
                      <motion.div
                        key="hardware-error-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-rose-500/10 border-y border-rose-400/30 pointer-events-none"
                      />
                      <motion.div
                        key="hardware-error-badge"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-3 right-3 bg-rose-500/90 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-rose-300 z-50"
                      >
                        <AlertTriangle size={11} /> Error Logic
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isPouring && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: [0.2, 0.9, 0.45], x: [0, 3, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.85,
                        ease: "easeInOut",
                      }}
                      className="absolute top-[56%] right-[25%] z-30 text-2xl"
                    >
                      ✨
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute bottom-4 right-6 md:bottom-8 md:right-12 w-24 h-28 md:w-28 md:h-32 border-x-4 border-b-4 border-white/20 rounded-b-[2rem] rounded-t-md bg-white/5 overflow-hidden z-40 shadow-lg backdrop-blur-sm">
                  <motion.div
                    animate={{ height: `${jusKeluar ? 36 : glassLevel}%` }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="absolute bottom-0 left-0 right-0 origin-bottom"
                    style={{
                      background: jusKeluar
                        ? "linear-gradient(to top, rgba(255,255,255,0.88), rgba(220,252,231,0.7))"
                        : mixedColor,
                    }}
                  />
                  <motion.div
                    animate={{ x: [0, 14, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.4,
                      ease: "easeInOut",
                    }}
                    className="absolute top-0 left-2 w-3 h-full bg-white/10 blur-[1px]"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    {jusKeluar ? (
                      <div className="flex items-center gap-1.5 text-[22px] opacity-85">
                        <span>👕</span>
                        <span>👚</span>
                        <span>🧦</span>
                      </div>
                    ) : (
                      <span className="text-4xl opacity-55">🧺</span>
                    )}
                    {jusKeluar && (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: [0.6, 1, 0.72], y: [0, -2, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.35,
                          ease: "easeInOut",
                        }}
                        className="mt-1 text-[10px] font-black tracking-wide text-emerald-700"
                      >
                        PAKAIAN BERSIH
                      </motion.span>
                    )}
                  </div>
                  <div className="absolute top-0 left-2 w-2 h-full bg-white/10 skew-x-12" />
                </div>

                <div className="absolute bottom-0 w-full h-10 bg-slate-900 border-t-4 border-slate-800 shadow-2xl" />

                <AnimatePresence>
                  {blenderBroken && isLeaking && (
                    <motion.div
                      key="leak-puddle"
                      initial={{ width: 0, opacity: 0, scaleY: 0.6 }}
                      animate={{
                        width: [96, 122, 112],
                        opacity: [0.45, 0.9, 0.7],
                        scaleY: [0.75, 1, 0.88],
                      }}
                      exit={{ width: 0, opacity: 0, scaleY: 0.6 }}
                      transition={{
                        width: { duration: 0.45, ease: "easeOut" },
                        opacity: {
                          repeat: Infinity,
                          duration: 1.1,
                          ease: "easeInOut",
                        },
                        scaleY: {
                          repeat: Infinity,
                          duration: 1,
                          ease: "easeInOut",
                        },
                      }}
                      className="absolute bottom-6 right-20 h-2.5 rounded-full blur-[0.3px] bg-sky-400/65 z-20"
                    />
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {blenderActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute bg-emerald-600/95 text-white px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-2.5 shadow-lg border border-emerald-400 uppercase tracking-widest z-50"
                    >
                      <Cpu size={16} className="animate-spin" />
                      {washPhase === "fill" && "Isi Air"}
                      {washPhase === "input_clothes" && "Ambil Pakaian"}
                      {washPhase === "input_water" && "Pasang Selang Air"}
                      {washPhase === "input_detergent" && "Siapkan Deterjen"}
                      {washPhase === "detergent" && "Campur Deterjen"}
                      {washPhase === "wash" && "Cuci"}
                      {washPhase === "rinse" && "Bilas"}
                      {washPhase === "spin" && "Peras"}
                      {(washPhase === "idle" || washPhase === "output") &&
                        "Mesin Cuci Aktif"}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <footer className="bg-background px-6 py-2 border-t border-border flex justify-between items-center text-[10px] font-medium text-muted-foreground z-30 shrink-0 select-none">
        <div className="flex gap-2 items-center">
          <span
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isRunning
                ? "bg-emerald-500 animate-pulse"
                : errorLine !== -1
                  ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                  : "bg-slate-300"
            }`}
          />
          <span className="uppercase tracking-wider font-bold">
            STATUS SISTEM •
            {isRunning
              ? " Algoritma sedang dijalankan"
              : errorLine !== -1
                ? " Pemeriksaan logika diperlukan"
                : " Sistem siap menjalankan algoritma."}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline font-bold text-muted-foreground uppercase tracking-tighter">
            Bahasa: Pseudocode Indonesia
          </span>
          <span className="font-black tracking-tight text-emerald-700 uppercase italic">
            CODIN • Interactive Algorithm Learning • 2026
          </span>
        </div>
      </footer>
    </div>
  );
};

export default MesinCuciSimulation;
