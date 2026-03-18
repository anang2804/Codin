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
  CupSoda,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const EXPECTED_SOLUTION = [
  "start",
  "input buah1",
  "input buah2",
  "proses: jus = buah1 + buah2",
  "output jus",
  "end",
] as const;

const INITIAL_TEMPLATE = [
  "start",
  "_____ buah1",
  "_____ buah2",
  "proses: jus = buah1 + buah2",
  "_____ jus",
  "end",
] as const;

const COMMAND_GLOSSARY: Record<string, string> = {
  input:
    "INPUT digunakan untuk membaca data dari bahan mentah (buah) sebelum masuk ke proses blender.",
  output:
    "OUTPUT digunakan untuk menampilkan hasil akhir pemrosesan, yaitu jus yang sudah jadi.",
  proses:
    "PROSES menandakan tahap transformasi data, dari bahan mentah menjadi hasil olahan.",
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
    icon: <Edit3 className="text-slate-400" size={20} />,
    color: "bg-slate-50 border-slate-200",
  },
};

const SIMULASI_SLUG = "mesin-jus-blender";
const FRUIT_OPTIONS = ["apel", "mangga", "jeruk"] as const;
const FRUIT_TYPES = {
  apel: { color: "#ef4444", name: "Apel", icon: "🍎" },
  mangga: { color: "#fbbf24", name: "Mangga", icon: "🥭" },
  jeruk: { color: "#f97316", name: "Jeruk", icon: "🍊" },
} as const;

const FOREIGN_OBJECTS = [
  { name: "Batu", icon: "🪨", color: "#6b7280" },
  { name: "Sendok", icon: "🥄", color: "#94a3b8" },
  { name: "Baut", icon: "🔩", color: "#64748b" },
] as const;

const toTitle = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

type SimData = {
  buah1: string;
  buah2: string;
  jus: string;
};

const BlenderSimulation = () => {
  const [code, setCode] = useState<string>("");
  const [activeLine, setActiveLine] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorLine, setErrorLine] = useState<number>(-1);
  const [showSuccessCard, setShowSuccessCard] = useState<boolean>(false);
  const [hasTried, setHasTried] = useState<boolean>(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState<boolean>(false);

  const [buah1, setBuah1] = useState<string>("");
  const [buah2, setBuah2] = useState<string>("");
  const [jus, setJus] = useState<string>("");
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
  const [foreignObject, setForeignObject] = useState<
    (typeof FOREIGN_OBJECTS)[number] | null
  >(null);
  const [feedback, setFeedback] = useState<string>(
    "Sistem siap menjalankan algoritma.",
  );

  const simDataRef = useRef<SimData>({
    buah1: "",
    buah2: "",
    jus: "",
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const displayRef = useRef<HTMLDivElement | null>(null);

  const linesArray = code.split("\n");

  const updateSimData = (newData: Partial<SimData>) => {
    simDataRef.current = { ...simDataRef.current, ...newData };
  };

  const generateEducationalFeedback = (
    typedLine: string,
    lineIdx: number,
  ): string => {
    const trimmed = typedLine.trim().toLowerCase();
    const expectedLine = EXPECTED_SOLUTION[lineIdx] ?? "";
    const firstWord = trimmed.split(" ")[0];

    if (!trimmed || trimmed.includes("_____")) {
      return `Baris ${lineIdx + 1} Algoritma belum lengkap.\n\nLengkapi terlebih dahulu bagian yang kosong sesuai template yang tersedia.\n\nPetunjuk: gunakan urutan input → proses → output dengan benar.`;
    }

    if (COMMAND_GLOSSARY[firstWord]) {
      return `Baris ${lineIdx + 1} salah, periksa input/output.\n\n${COMMAND_GLOSSARY[firstWord]}`;
    }

    return `Baris ${lineIdx + 1} salah, periksa input/output.\n\nSeharusnya baris ini mendekati: "${expectedLine}".`;
  };

  const getActiveDescription = (): CommandDetail => {
    const lineContent = linesArray[activeLine]?.trim().toLowerCase() || "";
    if (lineContent.includes("start") || lineContent.includes("end")) {
      return COMMAND_DETAILS.START;
    }
    if (lineContent.startsWith("input") || lineContent.startsWith("output")) {
      return COMMAND_DETAILS.INPUT_OUTPUT;
    }
    if (lineContent.includes("proses")) {
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

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isRunning) return;
    setCode(e.target.value);
    setErrorLine(-1);
    setShowSuccessCard(false);

    const cursorPosition = e.target.selectionStart;
    const currentLines = e.target.value
      .substring(0, cursorPosition)
      .split("\n");
    setActiveLine(currentLines.length - 1);
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (displayRef.current) {
      displayRef.current.scrollTop = e.currentTarget.scrollTop;
    }
    const gutter = document.getElementById("line-gutter");
    if (gutter) {
      gutter.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const resetSim = () => {
    setIsRunning(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setBuah1("");
    setBuah2("");
    setJus("");
    setBlenderActive(false);
    setJusKeluar(false);
    setLiquidLevel(0);
    setGlassLevel(0);
    setMixedColor("rgba(255,255,255,0.05)");
    setIsPouring(false);
    setBlenderBroken(false);
    setIsLeaking(false);
    setIsOverheating(false);
    setForeignObject(null);
    setFeedback("Sistem siap menjalankan algoritma.");
    updateSimData({ buah1: "", buah2: "", jus: "" });

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
    const solution = EXPECTED_SOLUTION[index];

    if (lineParsed !== solution) {
      setIsRunning(false);
      setErrorLine(index);
      setShowSuccessCard(false);
      const isInputLine = index === 1 || index === 2;
      const hasWrongContent =
        lineParsed !== "" && !lineParsed.includes("_____");

      if (isInputLine && hasWrongContent) {
        const usedProses = lineParsed.startsWith("proses");
        const usedOutputInsteadInput = lineParsed.startsWith("output");

        if (usedProses) {
          // Real world scenario: blender spins empty → overheating → broken
          setBlenderBroken(true);
          setIsOverheating(true);
          setBlenderActive(true);
          setIsLeaking(false);
          setForeignObject(null);
          setIsPouring(false);
          setLiquidLevel(0);
          setMixedColor("linear-gradient(to top, #f97316, #dc2626)");
          setFeedback(
            `Baris ${index + 1} salah: Tidak ada input! Blender beroperasi tanpa beban dan overheating, mesin rusak dari operasi idle.`,
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
              ? `Baris ${index + 1} salah: Kamu menuliskan langkah yang kurang tepat pada bagian ini. Akibatnya, proses tidak dapat berjalan dengan benar dan blender tidak berfungsi sebagaimana mestinya.`
              : `Baris ${index + 1} salah. Benda asing (${randomObject.name}) masuk ke blender, mesin rusak, dan cairan bocor dari retakan!`,
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

    if (lineParsed === "start") {
      setBlenderBroken(false);
      setIsLeaking(false);
      setIsOverheating(false);
      setForeignObject(null);
      setFeedback("Sistem: Memulai proses blender...");
    }

    if (lineParsed === "input buah1") {
      const picked =
        FRUIT_OPTIONS[Math.floor(Math.random() * FRUIT_OPTIONS.length)];
      setBuah1(picked);
      setBlenderBroken(false);
      setIsLeaking(false);
      setIsOverheating(false);
      setForeignObject(null);
      setLiquidLevel(25);
      setMixedColor(FRUIT_TYPES[picked].color);
      updateSimData({ buah1: picked });
      setFeedback(`INPUT: Membaca buah1 = \"${toTitle(picked)}\"`);
    }

    if (lineParsed === "input buah2") {
      const firstFruit = simDataRef.current.buah1;
      const availableSecondFruits = FRUIT_OPTIONS.filter(
        (fruit) => fruit !== firstFruit,
      );
      const picked =
        availableSecondFruits[
          Math.floor(Math.random() * availableSecondFruits.length)
        ] ?? FRUIT_OPTIONS[0];
      setBuah2(picked);
      setBlenderBroken(false);
      setIsLeaking(false);
      setIsOverheating(false);
      setForeignObject(null);
      setLiquidLevel(50);
      updateSimData({ buah2: picked });
      setFeedback(`INPUT: Membaca buah2 = \"${toTitle(picked)}\"`);
    }

    if (lineParsed === "proses: jus = buah1 + buah2") {
      setBlenderActive(true);
      setFeedback("PROSES: Blender sedang mencampur buah...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const dataBuah1 =
        FRUIT_TYPES[simDataRef.current.buah1 as keyof typeof FRUIT_TYPES];
      const dataBuah2 =
        FRUIT_TYPES[simDataRef.current.buah2 as keyof typeof FRUIT_TYPES];
      if (dataBuah1 && dataBuah2) {
        setMixedColor(
          `linear-gradient(to top, ${dataBuah1.color}, ${dataBuah2.color})`,
        );
      }
      setLiquidLevel(75);
      setBlenderActive(false);
    }

    if (lineParsed === "output jus") {
      const hasilJus = `${toTitle(simDataRef.current.buah1)} + ${toTitle(simDataRef.current.buah2)}`;
      setJus(hasilJus);
      updateSimData({ jus: hasilJus });
      setIsPouring(true);
      await new Promise((resolve) => setTimeout(resolve, 900));
      setLiquidLevel(10);
      setGlassLevel(85);
      setJusKeluar(true);
      setIsPouring(false);
      setFeedback(`OUTPUT: Jus ${hasilJus} keluar ke gelas.`);
    }

    if (lineParsed === "end") {
      setShowSuccessCard(true);
      setFeedback(
        "Berhasil! Algoritma berjalan dengan benar.\n\nBlender menerima input, memproses data, dan menghasilkan output sesuai urutan.\n\nStruktur yang kamu gunakan: input → proses → output.\n\nAlgoritma ini sudah sesuai dengan konsep dasar pemrograman.",
      );
    }

    timerRef.current = setTimeout(() => {
      void executeStep(index + 1);
    }, 1200);
  };

  const startRunning = () => {
    resetSim();
    setIsRunning(true);
    void executeStep(0);
  };

  const renderLineContent = (
    userLine = "",
    lineIndex: number,
  ): React.ReactNode[] => {
    const templateLine = INITIAL_TEMPLATE[lineIndex] || "";
    const maxLength = Math.max(userLine.length, templateLine.length);
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < maxLength; i += 1) {
      const uChar = userLine[i];
      const tChar = templateLine[i];

      if (uChar !== undefined) {
        elements.push(
          <span key={i} className="text-slate-900 font-bold">
            {uChar}
          </span>,
        );
      } else if (tChar !== undefined) {
        elements.push(
          <span
            key={i}
            className="text-slate-300 select-none italic font-medium"
          >
            {tChar}
          </span>,
        );
      }
    }

    return elements;
  };

  const currentDesc = getActiveDescription();
  const buah1Data = buah1
    ? FRUIT_TYPES[buah1 as keyof typeof FRUIT_TYPES]
    : null;
  const buah2Data = buah2
    ? FRUIT_TYPES[buah2 as keyof typeof FRUIT_TYPES]
    : null;
  const totalDisplayLines = Math.max(
    linesArray.length,
    INITIAL_TEMPLATE.length,
    10,
  );

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-40 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              window.location.href = "/siswa/simulasi";
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
          >
            <ArrowLeft size={14} /> Kembali
          </button>

          <div className="w-px h-6 bg-slate-200" />

          <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-emerald-100 shadow-lg">
            <Terminal size={20} />
          </div>

          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-lg font-black tracking-tighter text-slate-800 uppercase italic leading-none">
                Blender Jus
              </h1>
            </div>
            <span className="text-[8px] text-emerald-600 font-bold tracking-widest uppercase italic bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Sedang
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetSim}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0] border border-[#e2e8f0] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
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
                ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                : "bg-gradient-to-br from-[#16a34a] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-white"
            }`}
          >
            <Play size={14} fill={isRunning ? "none" : "white"} /> Jalankan
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-72 bg-white border-r border-slate-200 p-5 flex flex-col gap-6 shrink-0 z-20 overflow-y-auto">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-600/60" />
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-wrap">
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
                <div className="p-2 bg-white/90 rounded-xl shadow-sm">
                  {currentDesc.icon}
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                  {currentDesc.title}
                </h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {currentDesc.desc}
              </p>
            </motion.div>
          </AnimatePresence>

          <div
            className={`p-3 rounded-2xl border transition-all duration-300 ${
              errorLine !== -1
                ? "bg-rose-50/95 border-rose-200"
                : "bg-white border-slate-200"
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
                  className={jusKeluar ? "text-emerald-500" : "text-slate-500"}
                />
              )}
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  errorLine !== -1 ? "text-rose-600" : "text-slate-500"
                }`}
              >
                CATATAN PROSES
              </span>
            </div>

            <div
              className={`mt-2 rounded-lg px-3 py-2 text-[11px] leading-snug ${
                errorLine !== -1
                  ? "text-rose-700 bg-rose-100/60"
                  : "text-slate-700 bg-slate-100/80"
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
            <p className="text-[10px] font-bold text-slate-500 italic leading-tight">
              {activeLine !== -1
                ? `Menganalisis baris ke-${activeLine + 1}`
                : "Editor siap digunakan"}
            </p>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
          <section className="px-6 pt-4 pb-2">
            <div className="bg-[#ecfdf5] border border-emerald-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
              <div className="bg-white p-2 rounded-xl shadow-sm text-emerald-600">
                <Lightbulb size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded uppercase tracking-widest">
                    MISI
                  </span>
                  <h2 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">
                    Rancang Algoritma Blender Buah
                  </h2>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed max-w-4xl font-medium">
                  Ayo bantu blender membuat jus! 🥤 Lengkapi pseudocode agar
                  blender dapat membaca dua buah, memprosesnya, dan menghasilkan
                  jus.
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
                <div className="bg-white border border-emerald-200 rounded-2xl px-4 py-3 shadow-sm">
                  <h3 className="text-sm font-black text-emerald-700 tracking-tight">
                    🎉 Berhasil! Algoritma benar
                  </h3>
                  <p className="mt-1 text-[12px] text-slate-600 leading-relaxed font-medium">
                    Algoritma berjalan sesuai urutan input → proses → output.
                    <br />
                    Blender berhasil menghasilkan jus dengan benar.
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="flex-1 flex gap-5 px-6 pb-6 overflow-hidden">
            <section className="flex-1 min-w-[500px] bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
              <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
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
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic font-mono">
                    ALGORITMA BLENDER
                  </span>
                </div>
                <div
                  className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${
                    isRunning
                      ? "bg-rose-500 text-white"
                      : errorLine !== -1
                        ? "bg-red-500 text-white border-red-600 shadow-sm"
                        : "bg-white text-slate-400 border-slate-200"
                  }`}
                >
                  {isRunning
                    ? "RUNNING"
                    : errorLine !== -1
                      ? "ERROR"
                      : "SIAP MENULIS"}
                </div>
              </div>

              <div className="relative flex-1 flex font-mono text-[13px] leading-[26px] overflow-hidden">
                <div
                  id="line-gutter"
                  className="w-12 bg-slate-50/30 text-slate-300 text-right pr-4 pt-5 select-none border-r border-slate-100 overflow-hidden shrink-0"
                >
                  {Array.from({ length: totalDisplayLines }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-[26px] transition-all ${
                        activeLine === i
                          ? "text-emerald-600 font-black scale-110 pr-1"
                          : ""
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                <div className="relative flex-1 bg-white overflow-hidden">
                  <div
                    ref={displayRef}
                    className="absolute inset-0 p-5 pt-5 pointer-events-none whitespace-pre overflow-hidden z-10"
                  >
                    {INITIAL_TEMPLATE.map((_, i) => {
                      const userText = linesArray[i] || "";
                      const isActive = activeLine === i;
                      return (
                        <div
                          key={i}
                          className="relative h-[26px] flex items-center"
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
                            className={`relative z-10 whitespace-pre ${
                              isRunning && activeLine > i ? "opacity-30" : ""
                            }`}
                          >
                            {renderLineContent(userText, i)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={handleCodeChange}
                    onScroll={handleScroll}
                    readOnly={isRunning}
                    spellCheck={false}
                    className="absolute inset-0 w-full h-full bg-transparent p-5 pt-5 outline-none resize-none z-20 font-mono transition-all text-transparent caret-emerald-600 selection:bg-emerald-100"
                    style={{ lineHeight: "26px" }}
                  />
                </div>
              </div>
            </section>

            <aside className="w-[380px] bg-[#020617] rounded-3xl flex flex-col shrink-0 min-h-0 overflow-hidden shadow-2xl border border-slate-800 relative">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center px-6">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                    <Activity size={14} />
                  </div>
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
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

              <div className="flex-1 min-h-[230px] md:min-h-[260px] p-4 md:p-6 flex flex-col items-center justify-center relative bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)] overflow-hidden">
                <div className="absolute top-2 left-2 md:top-3 md:left-3 z-50 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-700 rounded-lg px-2 py-1">
                    <div
                      className="w-3 h-3 rounded-full border border-white/40"
                      style={{ backgroundColor: buah1Data?.color ?? "#64748b" }}
                    />
                    <span className="text-[9px] font-black text-slate-200 uppercase tracking-wide">
                      Buah1: {buah1Data?.name ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-700 rounded-lg px-2 py-1">
                    <div
                      className="w-3 h-3 rounded-sm rotate-45 border border-white/40"
                      style={{ backgroundColor: buah2Data?.color ?? "#64748b" }}
                    />
                    <span className="text-[9px] font-black text-slate-200 uppercase tracking-wide">
                      Buah2: {buah2Data?.name ?? "-"}
                    </span>
                  </div>
                </div>

                <motion.div
                  animate={
                    errorLine !== -1 ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }
                  }
                  transition={
                    errorLine !== -1
                      ? { duration: 0.35, repeat: Infinity, ease: "linear" }
                      : { duration: 0.2 }
                  }
                  className="relative flex flex-col items-center scale-90 md:scale-95"
                >
                  <div className="relative w-36 h-48 z-20">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-700 rounded-t-2xl z-30 shadow-lg border-b border-slate-600" />

                    <div className="absolute inset-0 bg-white/10 border-2 border-white/20 rounded-b-xl rounded-t-lg backdrop-blur-md overflow-hidden shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] flex flex-col justify-end">
                      <motion.div
                        animate={{
                          height: `${liquidLevel}%`,
                          background: mixedColor,
                        }}
                        transition={{ duration: 1.1, ease: "easeInOut" }}
                        className="w-full relative origin-bottom"
                      >
                        {blenderActive && (
                          <motion.div
                            animate={{
                              rotate: [0, 360],
                              scale: [1, 1.1, 1],
                              y: [0, -5, 0],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.25,
                              ease: "linear",
                            }}
                            className="absolute inset-0 flex items-center justify-center opacity-50"
                          >
                            <Blend
                              size={56}
                              className="text-white drop-shadow-lg"
                            />
                          </motion.div>
                        )}

                        {blenderActive &&
                          [...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ y: -60, opacity: 0, scale: 0.5 }}
                              transition={{
                                repeat: Infinity,
                                duration: Math.random() + 0.5,
                                delay: i * 0.2,
                              }}
                              className="absolute bottom-0 w-2 h-2 bg-white/40 rounded-full"
                              style={{ left: `${20 + i * 15}%` }}
                            />
                          ))}

                        {isOverheating &&
                          [...Array(8)].map((_, i) => (
                            <motion.div
                              key={`spark-${i}`}
                              animate={{
                                x: (Math.random() - 0.5) * 80,
                                y: -100 + Math.random() * 40,
                                opacity: 0,
                                scale: 0,
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8 + Math.random() * 0.4,
                                delay: i * 0.1,
                              }}
                              className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                              style={{
                                backgroundColor:
                                  Math.random() > 0.5 ? "#fbbf24" : "#f97316",
                                boxShadow:
                                  Math.random() > 0.5
                                    ? "0 0 6px #fbbf24"
                                    : "0 0 6px #f97316",
                              }}
                            />
                          ))}
                      </motion.div>

                      <AnimatePresence>
                        {!!buah1 && liquidLevel < 30 && (
                          <motion.div
                            key="buah1-drop"
                            initial={{ y: -250, opacity: 0, rotate: -20 }}
                            animate={{ y: 90, opacity: 1, rotate: 0 }}
                            className="absolute left-10 w-12 h-12 flex items-center justify-center text-4xl filter drop-shadow-md"
                          >
                            {
                              FRUIT_TYPES[buah1 as keyof typeof FRUIT_TYPES]
                                ?.icon
                            }
                          </motion.div>
                        )}
                        {!!buah2 && liquidLevel < 60 && (
                          <motion.div
                            key="buah2-drop"
                            initial={{ y: -250, opacity: 0, rotate: 20 }}
                            animate={{ y: 70, opacity: 1, rotate: 0 }}
                            className="absolute right-10 w-12 h-12 flex items-center justify-center text-4xl filter drop-shadow-md"
                          >
                            {
                              FRUIT_TYPES[buah2 as keyof typeof FRUIT_TYPES]
                                ?.icon
                            }
                          </motion.div>
                        )}

                        {blenderBroken && foreignObject && (
                          <motion.div
                            key={`foreign-${foreignObject.name}-${errorLine}`}
                            initial={{ y: -260, opacity: 0, rotate: -18 }}
                            animate={{ y: 78, opacity: 1, rotate: 6 }}
                            exit={{ opacity: 0 }}
                            className="absolute left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center text-4xl filter drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]"
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
                          <div className="absolute top-6 left-9 w-[2px] h-20 bg-rose-300/80 rotate-[16deg]" />
                          <div className="absolute top-12 left-12 w-[2px] h-14 bg-rose-300/70 -rotate-[10deg]" />
                          <div className="absolute top-8 right-10 w-[2px] h-16 bg-rose-300/80 rotate-[20deg]" />
                        </motion.div>
                      )}

                      <AnimatePresence>
                        {blenderBroken && isLeaking && (
                          <>
                            <motion.div
                              key="crack-leak-stream"
                              initial={{ height: 0, opacity: 0, scaleX: 0.7 }}
                              animate={{
                                height: 78,
                                opacity: [0.35, 0.9, 0.45],
                                scaleX: [0.8, 1.15, 0.9],
                              }}
                              exit={{ height: 0, opacity: 0, scaleX: 0.7 }}
                              transition={{
                                height: { duration: 0.45, ease: "easeOut" },
                                opacity: {
                                  repeat: Infinity,
                                  duration: 1.05,
                                  ease: "easeInOut",
                                },
                                scaleX: {
                                  repeat: Infinity,
                                  duration: 0.9,
                                  ease: "easeInOut",
                                },
                              }}
                              className="absolute top-[62px] right-[30px] w-[5px] rounded-full blur-[0.4px]"
                              style={{
                                background:
                                  "linear-gradient(to bottom, rgba(186,230,253,0.95), rgba(56,189,248,0.92), rgba(2,132,199,0.9))",
                              }}
                            />

                            {[0, 0.28, 0.56].map((delay, idx) => (
                              <motion.div
                                key={`crack-leak-drip-${idx}`}
                                initial={{ y: 0, opacity: 0, scale: 0.7 }}
                                animate={{
                                  y: [0, 10, 22, 34],
                                  opacity: [0, 0.95, 0.95, 0],
                                  scale: [0.65, 0.9, 1, 0.85],
                                }}
                                exit={{ opacity: 0 }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 1,
                                  delay,
                                  ease: "easeIn",
                                }}
                                className="absolute top-[136px] right-[27px] w-2.5 h-2.5 rounded-full bg-sky-300"
                              />
                            ))}
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="absolute top-12 -right-8 w-10 h-28 border-8 border-slate-700 rounded-r-3xl z-10 shadow-lg" />
                  </div>

                  <div className="w-44 h-20 bg-gradient-to-b from-slate-700 to-slate-900 rounded-t-xl rounded-b-[2rem] border-t-4 border-slate-600 shadow-2xl relative z-40 flex flex-col items-center justify-center gap-2">
                    <div className="flex gap-4">
                      <div
                        className={`w-3 h-3 rounded-full border border-slate-800 ${isRunning ? "bg-emerald-500 shadow-[0_0_8px_emerald]" : "bg-slate-800"}`}
                      />
                      <div
                        className={`w-3 h-3 rounded-full border border-slate-800 ${blenderActive ? "bg-amber-500 shadow-[0_0_8px_amber]" : "bg-slate-800"}`}
                      />
                      <div
                        className={`w-3 h-3 rounded-full border border-slate-800 ${errorLine !== -1 ? "bg-rose-500 shadow-[0_0_8px_rose]" : "bg-slate-800"}`}
                      />
                    </div>
                    <div className="w-24 h-6 bg-slate-950/50 rounded-full border border-slate-800 shadow-inner flex items-center px-1">
                      <motion.div
                        animate={{ x: blenderActive ? 65 : 0 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="w-6 h-4 bg-slate-600 rounded-full border border-slate-500 shadow-md"
                      />
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
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 120, opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="absolute top-[55%] right-[22%] w-3 z-30 rounded-full"
                      style={{ background: mixedColor }}
                    />
                  )}
                </AnimatePresence>

                <div className="absolute bottom-4 right-6 md:bottom-8 md:right-12 w-24 h-28 md:w-28 md:h-32 border-x-4 border-b-4 border-white/20 rounded-b-[2rem] rounded-t-md bg-white/5 overflow-hidden z-40 shadow-xl backdrop-blur-sm">
                  <motion.div
                    animate={{ height: `${glassLevel}%` }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                    className="absolute bottom-0 left-0 right-0 origin-bottom"
                    style={{ background: mixedColor }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <CupSoda size={48} className="text-white" />
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
                      className="absolute bottom-6 right-20 h-3 rounded-full blur-[0.6px] bg-sky-400/70 z-20"
                    />
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {blenderActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute bg-emerald-600 text-white px-5 py-2.5 rounded-full text-[10px] font-black flex items-center gap-3 shadow-2xl border border-emerald-400 uppercase tracking-widest z-50"
                    >
                      <Cpu size={16} className="animate-spin" /> Blender Aktif
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <footer className="bg-white px-6 py-2 border-t border-slate-200 flex justify-between items-center text-[10px] font-medium text-slate-500 z-30 shrink-0 select-none">
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
          <span className="hidden md:inline font-bold text-slate-400 uppercase tracking-tighter">
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

export default BlenderSimulation;
