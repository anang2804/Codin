"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  Activity,
  Database,
  CheckCircle2,
  BookOpen,
  Flag,
  Lightbulb,
  Terminal,
  Edit3,
  AlertTriangle,
  Cpu,
  ArrowLeft,
  Lock,
  LockOpen,
  BatteryFull,
  SignalHigh,
  Wifi,
  Phone,
  MessageCircle,
  Camera,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const EXPECTED_SOLUTION = [
  "start",
  "input pin",
  "if pin = benar then",
  "output hp_terbuka",
  "else",
  "output pin_salah",
  "end if",
  "end",
] as const;

const INITIAL_TEMPLATE = [
  "start",
  "input pin",
  "_____ pin = benar",
  "output hp_terbuka",
  "_____",
  "_____ pin_salah",
  "end if",
  "end",
] as const;

const COMMAND_GLOSSARY: Record<string, string> = {
  input:
    "INPUT digunakan untuk membaca data awal, yaitu PIN yang dimasukkan pengguna.",
  output:
    "OUTPUT digunakan untuk menampilkan hasil akhir, seperti status HP terbuka atau PIN salah.",
  if: "IF digunakan untuk memeriksa kondisi apakah PIN benar.",
  else: "ELSE adalah jalur alternatif saat kondisi IF tidak terpenuhi.",
  start: "START menandai awal algoritma dijalankan.",
  end: "END menandai algoritma selesai dieksekusi.",
};

const COMMAND_DETAILS = {
  START: {
    title: "START / END",
    desc: "Menandai awal dan akhir alur program.",
    icon: <Flag className="text-emerald-500" size={20} />,
    color: "bg-emerald-50 border-emerald-100",
  },
  LOGIC: {
    title: "INPUT / OUTPUT",
    desc: "INPUT membaca PIN, OUTPUT menampilkan status login HP.",
    icon: <Database className="text-blue-500" size={20} />,
    color: "bg-blue-50 border-blue-100",
  },
  PROCESS: {
    title: "IF / ELSE",
    desc: "Membandingkan PIN untuk menentukan akses HP terbuka atau ditolak.",
    icon: <Cpu className="text-emerald-600" size={20} />,
    color: "bg-emerald-100 border-emerald-200",
  },
  DEFAULT: {
    title: "SIAP MENULIS",
    desc: "Lengkapi bagian yang kosong sesuai urutan logika: input → proses → output.",
    icon: <Edit3 className="text-muted-foreground" size={20} />,
    color: "bg-slate-50 border-slate-200",
  },
};

type PinValue = "benar" | "salah" | null;

type SimulationState = {
  pinValue: PinValue;
  pinDigitsEntered: number;
  activePinKey: number | null;
  phoneUnlocked: boolean;
  accessMessage: string | null;
  isOutputShown: boolean;
  feedback: string;
  isProcessing: boolean;
};

const SIMULASI_SLUG = "login-hp";

export default function LoginHPSimulation() {
  const [code, setCode] = useState("");
  const [activeLine, setActiveLine] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [errorLine, setErrorLine] = useState(-1);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [hasTried, setHasTried] = useState(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);

  const [simState, setSimState] = useState<SimulationState>({
    pinValue: null,
    pinDigitsEntered: 0,
    activePinKey: null,
    phoneUnlocked: false,
    accessMessage: null,
    isOutputShown: false,
    feedback: "Sistem siap menjalankan algoritma.",
    isProcessing: false,
  });

  const simDataRef = useRef<SimulationState>(simState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const displayRef = useRef<HTMLDivElement | null>(null);

  const linesArray = code.split("\n");

  const updateSimData = (newData: Partial<SimulationState>) => {
    simDataRef.current = { ...simDataRef.current, ...newData };
    setSimState((prev) => ({ ...prev, ...newData }));
  };

  const normalizeCode = (line: string): string =>
    line.trim().toLowerCase().replace(/\s+/g, " ");

  const generateEducationalFeedback = (typedLine: string, lineIdx: number) => {
    const trimmed = typedLine.trim().toLowerCase();
    const firstWord = trimmed.split(" ")[0];
    const expectedLine = EXPECTED_SOLUTION[lineIdx] ?? "";
    const expectedCommand = expectedLine.split(" ")[0]?.toLowerCase() ?? "";

    if (!trimmed || trimmed.includes("_____")) {
      return `Baris ${lineIdx + 1} algoritma belum lengkap.\n\nLengkapi bagian yang kosong sesuai template.`;
    }

    if (lineIdx === 2) {
      if (firstWord === "if" && !trimmed.includes("pin = benar")) {
        return `Baris ${lineIdx + 1} command IF sudah benar, tapi kondisi belum tepat.\n\nGunakan kondisi pengecekan PIN yang sesuai.`;
      }
      if (firstWord === "output") {
        return `Baris ${lineIdx + 1} salah konteks.\n\nTahap ini harus memeriksa kondisi dulu, bukan menampilkan hasil.`;
      }
      if (firstWord !== "if") {
        return `Baris ${lineIdx + 1} salah.\n\nPetunjuk: gunakan command IF untuk pengecekan PIN.`;
      }
    }

    if (lineIdx === 4) {
      if (trimmed !== "else") {
        return `Baris ${lineIdx + 1} salah.\n\nPetunjuk: tulis ELSE untuk jalur alternatif.`;
      }
    }

    if (
      firstWord === expectedCommand &&
      normalizeCode(trimmed) !== normalizeCode(expectedLine)
    ) {
      return `Baris ${lineIdx + 1} command sudah benar, tapi penulisannya belum lengkap.\n\nLengkapi sesuai pola template.`;
    }

    if (COMMAND_GLOSSARY[firstWord]) {
      return `Baris ${lineIdx + 1} salah.\n\n${COMMAND_GLOSSARY[firstWord]}`;
    }

    return `Baris ${lineIdx + 1} salah.\n\nPetunjuk: sesuaikan baris ini dengan template algoritma.`;
  };

  const getActiveDescription = () => {
    const lineContent = linesArray[activeLine]?.trim().toLowerCase() || "";
    if (lineContent.includes("start") || lineContent.includes("end"))
      return COMMAND_DETAILS.START;
    if (lineContent.startsWith("input") || lineContent.startsWith("output"))
      return COMMAND_DETAILS.LOGIC;
    if (lineContent.startsWith("if") || lineContent.startsWith("else"))
      return COMMAND_DETAILS.PROCESS;
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
    const resetState: SimulationState = {
      pinValue: null,
      pinDigitsEntered: 0,
      activePinKey: null,
      phoneUnlocked: false,
      accessMessage: null,
      isOutputShown: false,
      feedback: "Sistem siap menjalankan algoritma.",
      isProcessing: false,
    };
    setSimState(resetState);
    simDataRef.current = resetState;

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
    const lineParsed = normalizeCode(lineRaw);
    const solution = normalizeCode(EXPECTED_SOLUTION[index]);

    if (lineParsed !== solution) {
      setIsRunning(false);
      setErrorLine(index);
      setShowSuccessCard(false);
      updateSimData({ feedback: generateEducationalFeedback(lineRaw, index) });
      return;
    }

    if (lineParsed === "start") {
      updateSimData({
        feedback: "Sistem: Memulai proses login HP...",
        pinDigitsEntered: 0,
        activePinKey: null,
        accessMessage: null,
        isOutputShown: false,
        phoneUnlocked: false,
      });
    }

    if (lineParsed === "input pin") {
      const pinValue: PinValue = Math.random() > 0.45 ? "benar" : "salah";
      for (let i = 0; i < 4; i += 1) {
        const pressedKey = Math.floor(Math.random() * 10);
        updateSimData({
          activePinKey: pressedKey,
          pinDigitsEntered: i + 1,
          accessMessage: null,
          isOutputShown: false,
          phoneUnlocked: false,
        });
        await new Promise((resolve) => setTimeout(resolve, 180));
        updateSimData({ activePinKey: null });
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      updateSimData({
        pinValue,
        activePinKey: null,
        feedback: `INPUT: pin = ${pinValue}`,
      });
    }

    if (
      lineParsed === "if pin = benar" ||
      lineParsed === "if pin = benar then"
    ) {
      updateSimData({
        isProcessing: true,
        feedback: "PROSES: Memeriksa kecocokan PIN...",
      });
      await new Promise((resolve) => setTimeout(resolve, 900));

      const isPinCorrect = simDataRef.current.pinValue === "benar";
      updateSimData({
        isProcessing: false,
        feedback: isPinCorrect
          ? "PROSES: PIN benar, jalur akses terbuka dipilih."
          : "PROSES: PIN salah, jalur akses ditolak dipilih.",
      });

      if (!isPinCorrect) {
        const elseIdx = EXPECTED_SOLUTION.indexOf("else");
        if (elseIdx !== -1) {
          timerRef.current = setTimeout(() => {
            void executeStep(elseIdx);
          }, 900);
          return;
        }
      }
    }

    if (
      lineParsed === "output hp_terbuka" ||
      lineParsed === 'output "hp terbuka"' ||
      lineParsed === "output hp terbuka"
    ) {
      updateSimData({
        phoneUnlocked: true,
        accessMessage: "hp_terbuka",
        isOutputShown: true,
        feedback: "OUTPUT: hp_terbuka",
      });
    }

    if (lineParsed === "else" && simDataRef.current.pinValue === "benar") {
      const endIfIdx = EXPECTED_SOLUTION.indexOf("end if");
      if (endIfIdx !== -1) {
        timerRef.current = setTimeout(() => {
          void executeStep(endIfIdx);
        }, 900);
        return;
      }
    }

    if (
      lineParsed === "output pin_salah" ||
      lineParsed === 'output "pin salah"' ||
      lineParsed === "output pin salah"
    ) {
      updateSimData({
        phoneUnlocked: false,
        accessMessage: "pin_salah",
        isOutputShown: true,
        feedback: "OUTPUT: pin_salah",
      });
    }

    if (lineParsed === "end") {
      setShowSuccessCard(true);
      updateSimData({
        feedback:
          "Berhasil! Algoritma berjalan dengan benar: input → proses → output.",
      });
    }

    timerRef.current = setTimeout(() => {
      void executeStep(index + 1);
    }, 1400);
  };

  const startRunning = () => {
    resetSim();
    setShowSuccessCard(false);
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
  const totalDisplayLines = Math.max(
    linesArray.length,
    INITIAL_TEMPLATE.length,
    10,
  );

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans overflow-hidden">
      <header className="bg-background border-b border-border px-6 py-3 flex justify-between items-center z-40 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/siswa/simulasi")}
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
                Login HP
              </h1>
            </div>
            <span className="text-[8px] text-emerald-600 font-bold tracking-widest uppercase italic bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Dasar
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetSim}
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
                <h3 className="text-xs font-black text-foreground uppercase tracking-tight">
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
                  ? "text-rose-700 bg-rose-100/60"
                  : "text-foreground bg-muted"
              }`}
            >
              {simState.feedback}
            </div>
          </div>

          <div className="mt-auto p-4 bg-primary/10 border border-primary/20 rounded-2xl">
            <div className="flex items-center justify-between text-[9px] font-black text-primary uppercase mb-2">
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
                    Login HP dengan PIN
                  </h2>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed max-w-4xl font-medium">
                  Ayo bantu sistem keamanan HP memeriksa akses! 📱
                  <br />
                  Lengkapi struktur percabangan agar sistem dapat memvalidasi
                  PIN.
                </p>
              </div>
            </div>
          </section>

          <AnimatePresence>
            {showSuccessCard && (
              <motion.section
                key="success-card"
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
                    Simulasi login HP berjalan dengan benar.
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
                    ALGORITMA LOGIN HP
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
                      : "SIAP MENULIS"}
                </div>
              </div>

              <div className="relative flex-1 flex font-mono text-[13px] leading-[26px] overflow-hidden">
                <div
                  id="line-gutter"
                  className="w-12 bg-muted/30 text-muted-foreground text-right pr-4 pt-5 select-none border-r border-border overflow-hidden shrink-0"
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

                <div className="relative flex-1 bg-card overflow-hidden">
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
                    className="absolute inset-0 w-full h-full bg-transparent p-5 pt-5 outline-none resize-none z-20 font-mono transition-all text-transparent caret-emerald-600 selection:bg-indigo-100"
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
                  <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    VISUALISASI
                  </h2>
                </div>
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    errorLine !== -1
                      ? "bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]"
                      : simState.isProcessing
                        ? "bg-emerald-500 animate-pulse shadow-[0_0_10px_#22c55e]"
                        : "bg-slate-700"
                  }`}
                />
              </div>

              <div className="flex-1 min-h-[230px] md:min-h-[260px] p-4 md:p-6 flex flex-col items-center justify-center relative bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)] overflow-hidden">
                <div className="relative w-[280px] h-[470px]">
                  <div className="absolute -right-1 top-24 w-1 h-14 rounded-l bg-slate-500/60" />
                  <div className="absolute -left-1 top-20 w-1 h-10 rounded-r bg-slate-500/50" />
                  <div className="absolute -left-1 top-34 w-1 h-14 rounded-r bg-slate-500/50" />

                  <div className="relative w-full h-full rounded-[2.2rem] p-[7px] bg-gradient-to-b from-slate-300/30 via-slate-500/20 to-slate-700/30 shadow-[0_25px_60px_rgba(0,0,0,0.55)] border border-slate-600/40">
                    <motion.div
                      animate={
                        simState.isOutputShown && !simState.phoneUnlocked
                          ? { x: [0, -5, 5, -4, 4, 0] }
                          : { x: 0 }
                      }
                      transition={{ duration: 0.35 }}
                      className={`relative h-full w-full rounded-[1.9rem] overflow-hidden border ${
                        simState.isOutputShown
                          ? simState.phoneUnlocked
                            ? "border-emerald-300/40"
                            : "border-rose-300/40"
                          : "border-slate-700/80"
                      } bg-black`}
                    >
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 rounded-full bg-black z-20 border border-slate-800" />

                      <div
                        className={`absolute inset-0 ${
                          simState.phoneUnlocked
                            ? "bg-[linear-gradient(160deg,#0ea5e9_0%,#14b8a6_40%,#22c55e_100%)]"
                            : "bg-[linear-gradient(160deg,#1e293b_0%,#0f172a_35%,#111827_100%)]"
                        }`}
                      />

                      <div className="absolute top-10 left-4 right-4 flex items-center justify-between text-[10px] text-white/90 font-bold z-20">
                        <span>09:41</span>
                        <div className="flex items-center gap-1.5">
                          <SignalHigh size={11} />
                          <Wifi size={11} />
                          <BatteryFull size={12} />
                        </div>
                      </div>

                      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_50%)]" />

                      {!simState.isOutputShown && (
                        <>
                          <div className="absolute top-20 left-0 right-0 flex flex-col items-center z-20">
                            <p className="text-[11px] font-black text-white/70 uppercase tracking-[0.25em]">
                              Selasa, 18 Maret
                            </p>
                            <p className="text-5xl font-black tracking-tight text-white mt-1">
                              09:41
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-white/80">
                              <Lock size={16} />
                              <span className="text-[11px] font-bold uppercase tracking-wider">
                                Masukkan PIN
                              </span>
                            </div>
                          </div>

                          <div className="absolute bottom-16 left-5 right-5 z-20">
                            <div className="rounded-2xl border border-white/20 bg-black/20 backdrop-blur-[2px] p-4">
                              <div className="mb-3 flex justify-center gap-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                  <span
                                    key={i}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                                      i < simState.pinDigitsEntered
                                        ? "bg-white"
                                        : "bg-white/30"
                                    }`}
                                  />
                                ))}
                              </div>

                              <div className="grid grid-cols-3 gap-2.5">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                                  <div
                                    key={digit}
                                    className={`h-10 rounded-full border flex items-center justify-center text-[14px] font-black transition-all ${
                                      simState.activePinKey === digit
                                        ? "border-white bg-white text-slate-900 scale-95"
                                        : "border-white/35 bg-white/10 text-white"
                                    }`}
                                  >
                                    {digit}
                                  </div>
                                ))}
                                <div className="h-10" />
                                <div
                                  className={`h-10 rounded-full border flex items-center justify-center text-[14px] font-black transition-all ${
                                    simState.activePinKey === 0
                                      ? "border-white bg-white text-slate-900 scale-95"
                                      : "border-white/35 bg-white/10 text-white"
                                  }`}
                                >
                                  0
                                </div>
                                <div className="h-10" />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {simState.isOutputShown && (
                        <div className="absolute inset-0 z-20 p-5 pt-14">
                          <div className="h-full rounded-2xl border border-white/25 bg-black/15 backdrop-blur-[2px] p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[11px] text-white/70 font-bold uppercase tracking-widest">
                                  {simState.phoneUnlocked ? "Home" : "Login"}
                                </p>
                                <p className="text-sm text-white font-black mt-0.5">
                                  {simState.accessMessage}
                                </p>
                              </div>
                              {simState.phoneUnlocked ? (
                                <LockOpen
                                  size={22}
                                  className="text-emerald-200"
                                />
                              ) : (
                                <Lock size={22} className="text-rose-200" />
                              )}
                            </div>

                            {simState.phoneUnlocked ? (
                              <div className="mt-6 grid grid-cols-4 gap-3">
                                {[Phone, MessageCircle, Camera, Settings].map(
                                  (Icon, idx) => (
                                    <div
                                      key={idx}
                                      className="h-12 rounded-2xl bg-white/25 border border-white/35 flex items-center justify-center"
                                    >
                                      <Icon size={18} className="text-white" />
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : (
                              <div className="mt-6 rounded-xl border border-rose-300/35 bg-rose-500/20 p-3 text-center">
                                <p className="text-sm font-black text-rose-100">
                                  pin_salah
                                </p>
                                <p className="text-[11px] text-rose-100/90 mt-1">
                                  Coba masukkan PIN yang benar.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-white/70 z-20" />
                    </motion.div>
                  </div>
                </div>
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
}
