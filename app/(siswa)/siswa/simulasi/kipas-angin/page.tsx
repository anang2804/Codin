"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  Activity,
  Database,
  Flag,
  Split,
  Edit3,
  Wind,
  Thermometer,
  Power,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const EXPECTED_SOLUTION = [
  "start",
  "input suhu",
  "if suhu > 30 then",
  "output kipas_nyala",
  "else",
  "output kipas_mati",
  "end if",
  "end",
];

const INITIAL_TEMPLATE = [
  "______",
  "______ suhu",
  "______ suhu > 30 THEN",
  "    ______ kipas_nyala",
  "______",
  "    ______ kipas_mati",
  "END ______",
  "______",
];

const COMMAND_GLOSSARY: Record<string, string> = {
  input:
    "INPUT digunakan untuk membaca data dari sensor atau perangkat masukan, misalnya sensor suhu ruangan.",
  output:
    "OUTPUT digunakan untuk menampilkan hasil keputusan sistem atau mengirim aksi ke perangkat, misalnya kipas menyala atau mati.",
  if: "IF digunakan untuk mengecek kondisi tertentu. Jika benar, blok perintah pada jalur IF akan dijalankan.",
  else: "ELSE adalah jalur alternatif yang dijalankan ketika kondisi pada IF bernilai salah.",
  start: "START menandai awal algoritma dijalankan.",
  end: "END menandai akhir algoritma atau penutupan struktur kontrol.",
};

const COMMAND_DETAILS = {
  START: {
    title: "START / END",
    desc: "Menandai awal dan akhir alur program kontrol kipas.",
    icon: <Flag className="text-emerald-500" size={20} />,
    color: "bg-emerald-50 border-emerald-100",
  },
  LOGIC: {
    title: "INPUT & OUTPUT",
    desc: "INPUT membaca suhu, OUTPUT memberi aksi kipas menyala atau mati.",
    icon: <Database className="text-blue-500" size={20} />,
    color: "bg-blue-50 border-blue-100",
  },
  BRANCH: {
    title: "IF / ELSE",
    desc: "Keputusan berdasarkan batas suhu: jika suhu > 30 maka kipas menyala.",
    icon: <Split className="text-amber-500" size={20} />,
    color: "bg-amber-100 border-amber-200",
  },
  DEFAULT: {
    title: "SIAP MENULIS",
    desc: "Lengkapi urutan logika sesuai template: input → keputusan → output.",
    icon: <Edit3 className="text-slate-400" size={20} />,
    color: "bg-slate-50 border-slate-200",
  },
};

type SimulationState = {
  suhu: number | null;
  kipasNyala: boolean;
  feedback: string;
  kondisi: "idle" | "panas" | "normal";
};

const SIMULASI_SLUG = "kipas-angin";
const STEP_DELAY_MS = 850;
const CONDITION_DELAY_MS = 950;

export default function SimulasiKipasAngin() {
  const [code, setCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeLine, setActiveLine] = useState(-1);
  const [errorLine, setErrorLine] = useState(-1);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [hasTried, setHasTried] = useState(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);

  const [simState, setSimState] = useState<SimulationState>({
    suhu: null,
    kipasNyala: false,
    feedback: "Sistem siap menjalankan algoritma.",
    kondisi: "idle",
  });

  const simDataRef = useRef<SimulationState>(simState);
  const displayRef = useRef<HTMLDivElement>(null);

  const linesArray = code.split("\n");
  const totalDisplayLines = Math.max(
    INITIAL_TEMPLATE.length,
    linesArray.length,
  );

  const currentDesc = (() => {
    if (activeLine === -1) return COMMAND_DETAILS.DEFAULT;
    const line = (linesArray[activeLine] || "").trim().toLowerCase();
    if (line.includes("start") || line.includes("end"))
      return COMMAND_DETAILS.START;
    if (line.includes("if") || line.includes("else"))
      return COMMAND_DETAILS.BRANCH;
    if (line.includes("input") || line.includes("output"))
      return COMMAND_DETAILS.LOGIC;
    return COMMAND_DETAILS.DEFAULT;
  })();

  useEffect(() => {
    let isActive = true;

    const fetchCompletionStatus = async () => {
      try {
        const response = await fetch(
          `/api/siswa/simulasi/check-completed?simulasi_slug=${SIMULASI_SLUG}`,
          { cache: "no-store" },
        );

        if (!response.ok) return;

        const data = await response.json();
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
    };
  }, []);

  const normalizeCode = (line: string) => {
    return line.trim().toLowerCase().replace(/\s+/g, " ");
  };

  const updateSimData = (updates: Partial<SimulationState>) => {
    simDataRef.current = { ...simDataRef.current, ...updates };
    setSimState((prev) => ({ ...prev, ...updates }));
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan progress simulasi");
      }

      setHasTried(true);
      toast.success("Simulasi ditandai selesai");
    } catch (error: any) {
      console.error("Error marking simulation as completed:", error);
      toast.error(error.message || "Gagal menyimpan progress simulasi");
    } finally {
      setIsSavingCompletion(false);
    }
  };

  const emptySimState: SimulationState = {
    suhu: null,
    kipasNyala: false,
    feedback: "Sistem siap menjalankan algoritma.",
    kondisi: "idle",
  };

  const resetSim = () => {
    setCode("");
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setIsRunning(false);
    setHasTried(false);
    setSimState(emptySimState);
    simDataRef.current = emptySimState;
  };

  const generateEducationalFeedback = (
    lineIndex: number,
    userLine: string,
  ): string => {
    const trimmed = userLine.trim().toLowerCase();
    const firstWord = trimmed.split(" ")[0];

    if (!trimmed || trimmed.includes("_")) {
      return `Baris ${lineIndex + 1} algoritma belum lengkap.\n\nLengkapi bagian yang kosong sesuai urutan logika.`;
    }

    if (COMMAND_GLOSSARY[firstWord]) {
      return `Baris ${lineIndex + 1} salah.\n\n${COMMAND_GLOSSARY[firstWord]}`;
    }

    if (lineIndex === 1) {
      return `Baris ${lineIndex + 1} salah.\n\nPetunjuk: gunakan INPUT untuk membaca suhu.`;
    }

    if (lineIndex === 2 || lineIndex === 4 || lineIndex === 6) {
      return `Baris ${lineIndex + 1} salah.\n\nPetunjuk: perhatikan struktur IF / ELSE / END IF.`;
    }

    if (lineIndex === 3 || lineIndex === 5) {
      return `Baris ${lineIndex + 1} salah.\n\nPetunjuk: gunakan OUTPUT untuk aksi kipas.`;
    }

    return `Baris ${lineIndex + 1} salah.\n\nPetunjuk: sesuaikan baris ini dengan template algoritma.`;
  };

  const executeStep = async (
    step: number,
    lines: string[],
  ): Promise<boolean> => {
    if (step >= lines.length) {
      return true;
    }

    setActiveLine(step);
    await new Promise((resolve) => setTimeout(resolve, STEP_DELAY_MS));

    const userLine = lines[step];
    const expectedLine = EXPECTED_SOLUTION[step];

    const normalizedUser = normalizeCode(userLine);
    const normalizedExpected = normalizeCode(expectedLine);

    if (normalizedUser !== normalizedExpected) {
      setIsRunning(false);
      setErrorLine(step);
      setShowSuccessCard(false);
      updateSimData({ feedback: generateEducationalFeedback(step, userLine) });
      return false;
    }

    switch (step) {
      case 0:
        updateSimData({
          feedback: "Sistem: Memulai kontrol kipas otomatis...",
        });
        break;

      case 1:
        const suhuValue = Math.floor(Math.random() * 13) + 24;
        updateSimData({
          suhu: suhuValue,
          feedback: `INPUT: Sensor membaca suhu ruangan = ${suhuValue}°C`,
        });
        break;

      case 2:
        updateSimData({
          feedback: "PROSES: Mengevaluasi kondisi suhu > 30...",
        });
        await new Promise((resolve) => setTimeout(resolve, CONDITION_DELAY_MS));
        updateSimData({
          kondisi:
            simDataRef.current.suhu !== null && simDataRef.current.suhu > 30
              ? "panas"
              : "normal",
          feedback:
            simDataRef.current.suhu !== null && simDataRef.current.suhu > 30
              ? "PROSES: Kondisi benar, jalur kipas_nyala dipilih."
              : "PROSES: Kondisi salah, jalur kipas_mati dipilih.",
        });
        break;

      case 3:
        if (simDataRef.current.suhu !== null && simDataRef.current.suhu > 30) {
          updateSimData({
            kipasNyala: true,
            feedback: "OUTPUT: Kipas menyala untuk menurunkan suhu.",
          });
        }
        break;

      case 4:
        if (
          !(simDataRef.current.suhu !== null && simDataRef.current.suhu > 30)
        ) {
          updateSimData({
            feedback: "PROSES: Menjalankan jalur alternatif (ELSE).",
          });
        }
        break;

      case 5:
        if (
          !(simDataRef.current.suhu !== null && simDataRef.current.suhu > 30)
        ) {
          updateSimData({
            kipasNyala: false,
            feedback: "OUTPUT: Kipas dimatikan karena suhu masih normal.",
          });
        }
        break;

      case 6:
        updateSimData({ feedback: "Struktur IF ditutup dengan END IF." });
        break;

      case 7:
        setShowSuccessCard(true);
        updateSimData({
          feedback:
            "Berhasil! Algoritma berjalan dengan benar: input → proses → output.",
        });
        break;
    }

    return true;
  };

  const startRunning = async () => {
    const lines = code
      .split("\n")
      .map((line) => line.replace(/\s+$/g, ""))
      .filter((line) => line.trim() !== "");

    if (lines.length !== EXPECTED_SOLUTION.length) {
      setErrorLine(-1);
      setShowSuccessCard(false);
      updateSimData({
        feedback:
          "Jumlah baris belum sesuai template. Pastikan semua langkah diisi tanpa menambah baris kosong di tengah.",
      });
      return;
    }

    setShowSuccessCard(false);
    setIsRunning(true);
    setActiveLine(-1);
    setErrorLine(-1);
    const freshState: SimulationState = {
      suhu: null,
      kipasNyala: false,
      feedback: "Sistem: Memulai proses...",
      kondisi: "idle",
    };
    simDataRef.current = freshState;
    setSimState(freshState);

    for (let i = 0; i < lines.length; i++) {
      const success = await executeStep(i, lines);
      if (!success) {
        setIsRunning(false);
        return;
      }
    }

    setIsRunning(false);
    setActiveLine(-1);
  };

  const renderLineContent = (userLine = "", lineIndex: number) => {
    const templateLine = INITIAL_TEMPLATE[lineIndex] || "";
    const maxLength = Math.max(userLine.length, templateLine.length);
    const elements = [];

    for (let i = 0; i < maxLength; i++) {
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

  return (
    <div className="flex flex-col h-screen bg-[#fafbfc] overflow-hidden">
      <header className="px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => (window.location.href = "/siswa/simulasi")}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ArrowLeft size={14} /> Kembali
          </button>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-emerald-100 shadow-lg">
            <Terminal size={20} />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-lg font-black tracking-tighter text-slate-800 uppercase italic leading-none">
                Kipas Angin Otomatis
              </h1>
            </div>
            <span className="text-[8px] text-red-600 font-bold tracking-widest uppercase italic bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Lanjutan
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
                  className={
                    simState.kipasNyala ? "text-emerald-500" : "text-slate-500"
                  }
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
              {simState.feedback}
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
          <section className="px-6 pt-5 pb-3">
            <div className="bg-[#ecfdf5] border border-emerald-100 rounded-2xl p-5 flex items-start gap-5 shadow-sm">
              <div className="bg-white p-2.5 rounded-xl shadow-sm text-emerald-600">
                <Lightbulb size={24} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded uppercase tracking-widest">
                    MISI
                  </span>
                  <h2 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">
                    Sistem Kipas Angin Otomatis
                  </h2>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed max-w-4xl font-medium">
                  Lengkapi pseudocode agar sistem membaca suhu ruangan, lalu
                  menentukan apakah kipas harus menyala atau mati berdasarkan
                  kondisi suhu.
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
                <div className="bg-white border border-emerald-200 rounded-2xl px-4 py-3 shadow-sm">
                  <h3 className="text-sm font-black text-emerald-700 tracking-tight">
                    🎉 Berhasil! Algoritma benar
                  </h3>
                  <p className="mt-1 text-[12px] text-slate-600 leading-relaxed font-medium">
                    Algoritma berjalan sesuai urutan input → proses → output.
                    <br />
                    Sistem kipas otomatis merespons suhu dengan benar.
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
                  ></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic font-mono">
                    FAN_SYSTEM.ALGO
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
                    value={code}
                    onChange={(e) => {
                      if (isRunning) return;
                      setCode(e.target.value);
                      setErrorLine(-1);
                      setShowSuccessCard(false);
                      const cursorPosition = e.target.selectionStart;
                      const linesUpToCursor = e.target.value
                        .substr(0, cursorPosition)
                        .split("\n");
                      setActiveLine(linesUpToCursor.length - 1);
                    }}
                    onScroll={(e) => {
                      if (displayRef.current)
                        displayRef.current.scrollTop =
                          e.currentTarget.scrollTop;
                      const lineGutter = document.getElementById("line-gutter");
                      if (lineGutter)
                        lineGutter.scrollTop = e.currentTarget.scrollTop;
                    }}
                    readOnly={isRunning}
                    spellCheck={false}
                    className="absolute inset-0 w-full h-full bg-transparent p-5 pt-5 outline-none resize-none z-20 font-mono transition-all text-transparent caret-emerald-600 selection:bg-indigo-100"
                    style={{ lineHeight: "26px" }}
                  />
                </div>
              </div>
            </section>

            <aside className="w-[380px] bg-[#020617] rounded-3xl border border-slate-800 shadow-2xl flex flex-col min-h-0 overflow-hidden shrink-0 relative">
              <div className="px-5 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#22c55e]"></div>
                  <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">
                    VISUALISASI
                  </span>
                </div>
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    errorLine !== -1
                      ? "bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]"
                      : isRunning
                        ? "bg-emerald-500 animate-pulse shadow-[0_0_10px_#22c55e]"
                        : "bg-slate-700"
                  }`}
                />
              </div>

              <div className="flex-1 relative bg-gradient-to-b from-slate-900 to-slate-950 p-6">
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-400/10 to-transparent"></div>

                <div className="relative h-full rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Thermometer size={16} />
                      <span className="text-[11px] font-bold uppercase tracking-wide">
                        Suhu Ruangan
                      </span>
                    </div>
                    <span
                      className={`text-xs font-black px-2 py-1 rounded-lg border ${
                        simState.suhu !== null && simState.suhu > 30
                          ? "bg-rose-500/20 text-rose-300 border-rose-400/40"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                      }`}
                    >
                      {simState.suhu !== null ? `${simState.suhu}°C` : "--°C"}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center justify-center">
                    <div className="relative w-52 h-52 flex items-center justify-center">
                      <div className="absolute inset-6 rounded-full border border-slate-700/70"></div>
                      <motion.div
                        animate={
                          simState.kipasNyala ? { rotate: 360 } : { rotate: 0 }
                        }
                        transition={
                          simState.kipasNyala
                            ? {
                                duration: 0.7,
                                ease: "linear",
                                repeat: Infinity,
                              }
                            : { duration: 0.4 }
                        }
                        className="relative w-28 h-28"
                      >
                        <div className="absolute left-1/2 top-1/2 w-3 h-10 -translate-x-1/2 -translate-y-full rounded-full bg-cyan-400/70"></div>
                        <div className="absolute left-1/2 top-1/2 w-3 h-10 -translate-x-1/2 rounded-full bg-cyan-400/70"></div>
                        <div className="absolute left-1/2 top-1/2 h-3 w-10 -translate-y-1/2 -translate-x-full rounded-full bg-cyan-400/70"></div>
                        <div className="absolute left-1/2 top-1/2 h-3 w-10 -translate-y-1/2 rounded-full bg-cyan-400/70"></div>
                        <div className="absolute left-1/2 top-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-200 border-4 border-slate-500 shadow-xl"></div>
                      </motion.div>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-3 rounded-full bg-slate-700"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2">
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1">
                        Kondisi
                      </p>
                      <p className="text-[11px] font-bold text-slate-200">
                        {simState.kondisi === "idle"
                          ? "Siap"
                          : simState.kondisi === "panas"
                            ? "Panas"
                            : "Normal"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2">
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1">
                        Status Kipas
                      </p>
                      <p
                        className={`text-[11px] font-bold flex items-center gap-1 ${
                          simState.kipasNyala
                            ? "text-emerald-300"
                            : "text-slate-300"
                        }`}
                      >
                        {simState.kipasNyala ? (
                          <Power size={12} />
                        ) : (
                          <Wind size={12} />
                        )}
                        {simState.kipasNyala ? "Menyala" : "Mati"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <footer className="px-8 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 text-[10px]">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="font-black uppercase tracking-widest">
            STATUS SISTEM
          </span>
          <span className="w-px h-3 bg-slate-300"></span>
          <span className="font-medium italic">
            Kontrol kipas berdasarkan logika suhu.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium">
            BAHASA: PSEUDOCODE INDONESIA
          </span>
          <span className="w-px h-3 bg-slate-300"></span>
          <span className="font-black text-emerald-600 uppercase tracking-wide italic">
            CODIN • INTERACTIVE ALGORITHM LEARNING
          </span>
        </div>
      </footer>
    </div>
  );
}
