"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  Activity,
  Database,
  CheckCircle2,
  Monitor,
  BookOpen,
  Flag,
  Lightbulb,
  Terminal,
  Split,
  Edit3,
  AlertTriangle,
  Cpu,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// --- Konfigurasi Solusi Utama (Kunci Jawaban) ---
const EXPECTED_SOLUTION = [
  "start",
  "input sensor",
  "if sensor = aktif",
  "print pintu_terbuka",
  "else",
  "print pintu_tertutup",
  "end",
];

// --- Template Awal (Ghost Template) dengan Placeholder ---
const INITIAL_TEMPLATE = [
  "start",
  "_____ sensor",
  "if sensor = aktif",
  "_____ pintu_terbuka",
  "_____",
  "print pintu_tertutup",
  "end",
];

// --- Kamus Penjelasan Perintah untuk Pesan Kesalahan Edukatif ---
const COMMAND_GLOSSARY: Record<string, string> = {
  input:
    "INPUT biasanya digunakan untuk mengambil data dari perangkat luar (seperti sensor gerak atau keyboard) agar data tersebut bisa diproses oleh sistem.",
  print:
    "PRINT biasanya digunakan untuk menampilkan hasil, memberikan informasi kepada pengguna, atau mengirimkan perintah aksi ke perangkat keluaran (seperti mesin penggerak pintu).",
  if: "Struktur IF digunakan untuk memeriksa sebuah kondisi. Jika kondisi tersebut terpenuhi (benar), maka perintah di dalamnya akan dijalankan.",
  else: "Bagian ELSE adalah jalur alternatif. Bagian ini hanya akan dijalankan jika kondisi pada bagian IF ternyata tidak terpenuhi (salah).",
  start: "START menandakan titik awal di mana alur algoritma mulai bekerja.",
  end: "END digunakan untuk menutup sebuah blok keputusan atau menandai selesainya seluruh instruksi dalam program.",
};

const COMMAND_DETAILS = {
  START: {
    title: "START / END",
    desc: "Menandai awal dan akhir dari sebuah alur program.",
    icon: <Flag className="text-emerald-500" size={20} />,
    color: "bg-emerald-50 border-emerald-100",
  },
  LOGIC: {
    title: "INPUT & PRINT",
    desc: "Gunakan INPUT untuk membaca sensor dan PRINT untuk menggerakkan pintu.",
    icon: <Database className="text-blue-500" size={20} />,
    color: "bg-blue-50 border-blue-100",
  },
  BRANCH: {
    title: "IF / ELSE",
    desc: "Logika keputusan untuk menentukan alur berdasarkan kondisi sensor.",
    icon: <Split className="text-amber-500" size={20} />,
    color: "bg-amber-100 border-amber-200",
  },
  DEFAULT: {
    title: "SIAP MENULIS",
    desc: "Lengkapi bagian yang kosong sesuai urutan logika: input → proses → output.",
    icon: <Edit3 className="text-slate-400" size={20} />,
    color: "bg-slate-50 border-slate-200",
  },
};

const SIMULASI_SLUG = "pintu-otomatis";

const PintuOtomatisSimulation = () => {
  const [code, setCode] = useState("");
  const [activeLine, setActiveLine] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [errorLine, setErrorLine] = useState(-1);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [hasTried, setHasTried] = useState(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);

  const [simState, setSimState] = useState({
    sensorValue: "none",
    doorOpen: false,
    personVisible: false,
    feedback: "Sistem siap menjalankan algoritma.",
    isProcessing: false,
  });

  // useRef digunakan agar logika eksekusi (timeout) selalu mendapatkan nilai terbaru
  const simDataRef = useRef({
    sensorValue: "none",
    doorOpen: false,
    personVisible: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const displayRef = useRef<HTMLDivElement | null>(null);

  const linesArray = code.split("\n");

  // Sinkronisasi Ref dengan State agar visual tetap update
  const updateSimData = (newData: Partial<typeof simDataRef.current>) => {
    simDataRef.current = { ...simDataRef.current, ...newData };
    setSimState((prev) => ({ ...prev, ...newData }));
  };

  const generateEducationalFeedback = (typedLine: string, lineIdx: number) => {
    const trimmed = typedLine.trim().toLowerCase();
    const firstWord = trimmed.split(" ")[0];
    const expectedLine = EXPECTED_SOLUTION[lineIdx] ?? "";
    const expectedCommand = expectedLine.split(" ")[0];

    if (!trimmed || trimmed.includes("_____")) {
      return `Baris ${lineIdx + 1} algoritma belum lengkap.\n\nLengkapi bagian yang kosong sesuai urutan logika.`;
    }

    if (lineIdx === 1) {
      if (firstWord === "input" && !trimmed.includes("sensor")) {
        return `Baris ${lineIdx + 1} command sudah mendekati benar, tapi variabelnya belum tepat.\n\nGunakan variabel yang mewakili data dari sensor.`;
      }
      if (firstWord === "output") {
        return `Baris ${lineIdx + 1} salah konteks.\n\nDi tahap ini sistem harus membaca data dulu, bukan menampilkan hasil.`;
      }
      if (firstWord !== "input") {
        return `Baris ${lineIdx + 1} salah.\n\nPetunjuk: gunakan command untuk membaca data sensor.`;
      }
    }

    if (lineIdx === 2) {
      if (firstWord === "if") {
        return `Baris ${lineIdx + 1} command IF sudah benar, tapi kondisinya belum lengkap.\n\nLengkapi dengan kondisi sensor aktif/tidak aktif.`;
      }
      return `Baris ${lineIdx + 1} salah.\n\nPetunjuk: pastikan struktur IF sesuai template.`;
    }

    if (lineIdx === 3) {
      if (firstWord === "print" && !trimmed.includes("pintu_terbuka")) {
        return `Baris ${lineIdx + 1} command PRINT sudah benar, tapi output belum tepat untuk kondisi ini.`;
      }
      if (firstWord !== "print") {
        return `Baris ${lineIdx + 1} salah.\n\nPetunjuk: gunakan format PRINT untuk output status pintu.`;
      }
    }

    if (lineIdx === 4) {
      if (trimmed !== "else") {
        return `Baris ${lineIdx + 1} salah.\n\nPetunjuk: tulis ELSE untuk jalur alternatif.`;
      }
    }

    if (lineIdx === 5) {
      if (firstWord === "print" && !trimmed.includes("pintu_tertutup")) {
        return `Baris ${lineIdx + 1} command PRINT sudah benar, tapi output belum tepat untuk jalur ELSE.`;
      }
      if (firstWord !== "print") {
        return `Baris ${lineIdx + 1} salah.\n\nPetunjuk: gunakan format PRINT untuk output status pintu.`;
      }
    }

    if (firstWord === expectedCommand && trimmed !== expectedLine) {
      return `Baris ${lineIdx + 1} command sudah benar, tapi penulisannya belum lengkap.\n\nLengkapi sesuai template di editor.`;
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
    if (lineContent.includes("if") || lineContent.includes("else"))
      return COMMAND_DETAILS.BRANCH;
    if (lineContent.includes("input") || lineContent.includes("print"))
      return COMMAND_DETAILS.LOGIC;
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

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isRunning) return;
    setCode(e.target.value);
    setErrorLine(-1);
    setShowSuccessCard(false);
    const cursorPosition = e.target.selectionStart;
    const currentLines = e.target.value.substr(0, cursorPosition).split("\n");
    setActiveLine(currentLines.length - 1);
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (displayRef.current)
      displayRef.current.scrollTop = e.currentTarget.scrollTop;
    const gutter = document.getElementById("line-gutter");
    if (gutter) gutter.scrollTop = e.currentTarget.scrollTop;
  };

  const resetSim = () => {
    setIsRunning(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    updateSimData({
      sensorValue: "none",
      doorOpen: false,
      personVisible: false,
    });
    setSimState((prev) => ({
      ...prev,
      feedback: "Sistem siap menjalankan algoritma.",
      isProcessing: false,
    }));
    if (timerRef.current) clearTimeout(timerRef.current);
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

    // --- Validasi ---
    if (lineParsed !== solution) {
      setIsRunning(false);
      setErrorLine(index);
      setShowSuccessCard(false);

      if (index === 1 && lineParsed.startsWith("output")) {
        updateSimData({
          doorOpen: true,
          personVisible: false,
          sensorValue: "none",
        });
        setSimState((prev) => ({
          ...prev,
          isProcessing: false,
          feedback:
            "PROSES TIDAK VALID: Perintah output dijalankan sebelum data sensor dibaca.",
        }));
        return;
      }

      setSimState((prev) => ({
        ...prev,
        feedback: generateEducationalFeedback(lineRaw, index),
      }));
      return;
    }

    // --- Simulasi Visual ---
    if (lineParsed.includes("start")) {
      setSimState((prev) => ({
        ...prev,
        feedback: "Sistem: Memulai proses pintu otomatis...",
      }));
    } else if (lineParsed.includes("input")) {
      const willDetect = Math.random() > 0.4; // 60% kemungkinan ada orang
      updateSimData({
        personVisible: willDetect,
        sensorValue: willDetect ? "aktif" : "mati",
      });
      setSimState((prev) => ({
        ...prev,
        feedback: `INPUT: Sensor mendeteksi status "${willDetect ? "aktif" : "mati"}"`,
      }));
    } else if (lineParsed.startsWith("if")) {
      setSimState((prev) => ({
        ...prev,
        isProcessing: true,
        feedback: "PROSES: Mengevaluasi data sensor...",
      }));
      await new Promise((r) => setTimeout(r, 800));
      const match = simDataRef.current.sensorValue === "aktif";
      setSimState((prev) => ({
        ...prev,
        isProcessing: false,
        feedback: match
          ? "PROSES: Kondisi benar, jalur buka pintu dipilih."
          : "PROSES: Kondisi salah, jalur tutup pintu dipilih.",
      }));

      if (!match) {
        const elseIdx = EXPECTED_SOLUTION.indexOf("else");
        if (elseIdx !== -1) {
          timerRef.current = setTimeout(() => executeStep(elseIdx), 1000);
          return;
        }
      }
    } else if (lineParsed.includes("print")) {
      if (lineParsed.includes("terbuka")) {
        updateSimData({ doorOpen: true });
        setSimState((prev) => ({
          ...prev,
          feedback: "OUTPUT: Pintu otomatis terbuka.",
        }));
      } else if (lineParsed.includes("tertutup")) {
        updateSimData({ doorOpen: false });
        setSimState((prev) => ({
          ...prev,
          feedback: "OUTPUT: Pintu tetap tertutup.",
        }));
      }
    } else if (lineParsed.includes("else")) {
      // Jika sensor aktif, maka kita sudah menjalankan blok IF, jadi lompat ke END
      if (simDataRef.current.sensorValue === "aktif") {
        const endIdx = EXPECTED_SOLUTION.indexOf("end");
        if (endIdx !== -1) {
          timerRef.current = setTimeout(() => executeStep(endIdx), 800);
          return;
        }
      }
    } else if (lineParsed === "end" && index === EXPECTED_SOLUTION.length - 1) {
      setShowSuccessCard(true);
      setSimState((prev) => ({
        ...prev,
        feedback:
          "Berhasil! Algoritma berjalan dengan benar: input → proses → output.",
      }));
    }

    timerRef.current = setTimeout(() => executeStep(index + 1), 1600);
  };

  const startRunning = () => {
    resetSim();
    setShowSuccessCard(false);
    setIsRunning(true);
    executeStep(0);
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

  const currentDesc = getActiveDescription();
  const totalDisplayLines = Math.max(
    linesArray.length,
    INITIAL_TEMPLATE.length,
    10,
  );

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-40 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/siswa/simulasi")}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
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
                Pintu Otomatis
              </h1>
            </div>
            <span className="text-[8px] text-emerald-600 font-bold tracking-widest uppercase italic bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Menengah
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
        {/* PANEL KIRI - DESKRIPSI */}
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
                    simState.doorOpen ? "text-emerald-500" : "text-slate-500"
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

        {/* WORKSPACE - EDITOR */}
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
                    Koneksi Sensor & Pintu
                  </h2>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed max-w-4xl font-medium">
                  Sistem pintu otomatis menggunakan sensor gerak untuk
                  mendeteksi orang yang mendekat. Namun algoritma yang digunakan
                  belum lengkap. Lengkapi pseudocode agar pintu dapat terbuka
                  ketika sensor aktif dan tetap tertutup ketika tidak ada
                  deteksi.
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
                    Sistem pintu otomatis berjalan dengan benar.
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="flex-1 flex gap-5 px-6 pb-6 overflow-hidden">
            {/* PANEL TENGAH - EDITOR GHOST TEMPLATE */}
            <section className="flex-1 min-w-[500px] bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
              <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${isRunning ? "bg-rose-500 animate-pulse" : errorLine !== -1 ? "bg-red-500 shadow-[0_0_5px_red]" : "bg-emerald-500"}`}
                  ></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic font-mono">
                    ALGORITMA PINTU OTOMATIS
                  </span>
                </div>
                <div
                  className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${isRunning ? "bg-rose-500 text-white" : errorLine !== -1 ? "bg-red-500 text-white border-red-600 shadow-sm" : "bg-white text-slate-400 border-slate-200"}`}
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
                      className={`h-[26px] transition-all ${activeLine === i ? "text-emerald-600 font-black scale-110 pr-1" : ""}`}
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
                    {INITIAL_TEMPLATE.map((tLine, i) => {
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
                              className={`absolute inset-0 -mx-5 border-l-4 z-0 ${isRunning ? "bg-emerald-50 border-emerald-500" : errorLine === i ? "bg-red-50 border-red-500" : "bg-emerald-50/30 border-emerald-200"}`}
                            />
                          )}
                          <div
                            className={`relative z-10 whitespace-pre ${isRunning && activeLine > i ? "opacity-30" : ""}`}
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

            {/* PANEL KANAN - SIMULASI */}
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
                      : simState.isProcessing
                        ? "bg-emerald-500 animate-pulse shadow-[0_0_10px_#22c55e]"
                        : "bg-slate-700"
                  }`}
                />
              </div>

              <div className="flex-1 min-h-[230px] md:min-h-[260px] p-4 md:p-6 flex flex-col items-center justify-center relative bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)] overflow-hidden">
                {/* Sensor Infrared UI */}
                <div className="absolute top-20 w-64 h-4 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center shadow-lg">
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${simState.sensorValue === "aktif" ? "bg-rose-500 shadow-[0_0_15px_#ef4444]" : "bg-slate-900"}`}
                  ></div>
                  <div className="ml-2 text-[8px] font-black text-slate-500 uppercase tracking-widest tracking-tighter">
                    Infrared Detector
                  </div>
                </div>

                {/* Pintu Otomatis UI */}
                <div className="relative w-72 h-80 bg-slate-900/50 border-4 border-slate-800 rounded-t-lg overflow-hidden shadow-2xl">
                  {/* Pintu Kiri */}
                  <motion.div
                    animate={{ x: simState.doorOpen ? "-90%" : "0%" }}
                    transition={{ duration: 0.8 }}
                    className="absolute left-0 top-0 w-1/2 h-full bg-slate-700 border-r border-slate-600 z-10 flex items-center justify-end p-2"
                  >
                    <div className="w-1 h-12 bg-slate-600 rounded-full shadow-lg"></div>
                  </motion.div>
                  {/* Pintu Kanan */}
                  <motion.div
                    animate={{ x: simState.doorOpen ? "90%" : "0%" }}
                    transition={{ duration: 0.8 }}
                    className="absolute right-0 top-0 w-1/2 h-full bg-slate-700 border-l border-slate-600 z-10 flex items-center justify-start p-2"
                  >
                    <div className="w-1 h-12 bg-slate-600 rounded-full shadow-lg"></div>
                  </motion.div>
                  <div className="absolute inset-0 bg-slate-950 flex items-center justify-center opacity-30">
                    <Monitor className="text-emerald-500/10" size={100} />
                  </div>
                </div>
                <div className="w-full h-8 bg-slate-800 rounded-b-xl border-t-2 border-slate-700 shadow-xl"></div>

                {/* Animasi Orang (Hanya muncul jika Sensor Aktif) */}
                <motion.div
                  initial={{ opacity: 0, y: 150 }}
                  animate={{
                    opacity: simState.personVisible ? 1 : 0,
                    y: simState.personVisible ? 60 : 150,
                  }}
                  transition={{ duration: 0.8 }}
                  className="absolute z-30"
                >
                  <div className="flex flex-col items-center">
                    {/* Kepala dengan wajah */}
                    <div className="relative w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full border-3 border-amber-300 mb-1 z-10 shadow-2xl">
                      {/* Mata */}
                      <div className="absolute top-5 left-3 w-2 h-2 bg-slate-800 rounded-full"></div>
                      <div className="absolute top-5 right-3 w-2 h-2 bg-slate-800 rounded-full"></div>
                      {/* Mulut */}
                      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-4 h-2 border-b-2 border-slate-800 rounded-b-lg"></div>
                    </div>

                    {/* Badan */}
                    <div className="relative w-16 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-t-2xl rounded-b-lg shadow-2xl overflow-hidden">
                      {/* Detail baju - kerah */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-white/20 rounded-b-full"></div>
                      {/* Tombol baju */}
                      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white/40 rounded-full"></div>
                      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white/40 rounded-full"></div>
                      <div className="absolute top-14 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white/40 rounded-full"></div>

                      {/* Tangan kiri */}
                      <div className="absolute -left-2 top-2 w-3 h-16 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full shadow-lg"></div>
                      {/* Tangan kanan */}
                      <div className="absolute -right-2 top-2 w-3 h-16 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full shadow-lg"></div>
                    </div>

                    {/* Kaki */}
                    <div className="flex gap-2 mt-1">
                      <div className="w-5 h-8 bg-gradient-to-b from-slate-700 to-slate-800 rounded-b-lg shadow-lg"></div>
                      <div className="w-5 h-8 bg-gradient-to-b from-slate-700 to-slate-800 rounded-b-lg shadow-lg"></div>
                    </div>
                  </div>
                </motion.div>

                {/* Bubble Processing */}
                <AnimatePresence>
                  {simState.isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute bg-emerald-600 text-white px-5 py-2.5 rounded-full text-[10px] font-black flex items-center gap-3 shadow-2xl border border-emerald-400 uppercase tracking-widest z-50"
                    >
                      <Cpu size={16} className="animate-spin" /> Menganalisis...
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white px-6 py-2 border-t border-slate-200 flex justify-between items-center text-[10px] font-medium text-slate-500 z-30 shrink-0 select-none">
        <div className="flex gap-2 items-center">
          <span
            className={`w-2 h-2 rounded-full transition-all duration-300 ${isRunning ? "bg-emerald-500 animate-pulse" : errorLine !== -1 ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" : "bg-slate-300"}`}
          ></span>
          <span className="uppercase tracking-wider font-bold">
            STATUS SISTEM •{" "}
            {isRunning
              ? "Algoritma sedang dijalankan"
              : errorLine !== -1
                ? "Pemeriksaan logika diperlukan"
                : "Sistem siap menjalankan algoritma."}
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

export default PintuOtomatisSimulation;
