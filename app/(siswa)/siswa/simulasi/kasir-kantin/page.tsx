"use client";

import React, { useState, useRef } from "react";
import {
  Play,
  RotateCcw,
  Utensils,
  Calculator,
  CheckCircle2,
  Database,
  Printer,
  Terminal,
  Edit3,
  BookOpen,
  Flag,
  Lightbulb,
  Monitor,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- TypeScript Interfaces ---
interface FoodItem {
  name: string;
  price: number;
  emoji: string;
}

interface SimulationState {
  food: FoodItem | null;
  drink: FoodItem | null;
  isCalculating: boolean;
  receiptPrinted: boolean;
  totalPrice: number;
  status: string;
}

// --- Konfigurasi Template Ghost Text ---
const GHOST_TEMPLATE = [
  "start",
  "input harga_makanan",
  "input harga_minuman",
  "hasil = harga_makanan + harga_minuman",
  "print hasil",
  "end",
];

// --- Pemetaan Deskripsi Perintah ---
const COMMAND_DETAILS = {
  START: {
    title: "START",
    desc: "Menandai titik awal algoritma. Setiap instruksi dimulai dari sini.",
    icon: <Flag className="text-emerald-500" size={20} />,
    color: "bg-emerald-50 border-emerald-100",
  },
  INPUT: {
    title: "INPUT",
    desc: "Menerima data dari pengguna untuk disimpan ke dalam variabel tertentu.",
    icon: <Database className="text-teal-500" size={20} />,
    color: "bg-teal-50 border-teal-100",
  },
  PROCESS: {
    title: "PROCESS",
    desc: "Melakukan perhitungan matematika atau pemrosesan data logika.",
    icon: <Calculator className="text-green-600" size={20} />,
    color: "bg-green-50 border-green-100",
  },
  OUTPUT: {
    title: "OUTPUT / PRINT",
    desc: "Menampilkan informasi atau hasil perhitungan kepada pengguna.",
    icon: <Printer className="text-emerald-600" size={20} />,
    color: "bg-emerald-50 border-emerald-100",
  },
  END: {
    title: "END",
    desc: "Menandakan akhir dari seluruh rangkaian instruksi algoritma.",
    icon: <CheckCircle2 className="text-emerald-700" size={20} />,
    color: "bg-emerald-100 border-emerald-200",
  },
  DEFAULT: {
    title: "PETUNJUK",
    desc: "Tulis kode algoritma di editor tengah berdasarkan misi yang diberikan.",
    icon: <Monitor className="text-slate-400" size={20} />,
    color: "bg-slate-50 border-slate-200",
  },
};

const KasirKantinSimulation = () => {
  const [code, setCode] = useState("");
  const [activeLine, setActiveLine] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [hasTried, setHasTried] = useState(false);
  const [errorLine, setErrorLine] = useState(-1);

  // State Simulasi Kasir
  const [simState, setSimState] = useState<SimulationState>({
    food: null,
    drink: null,
    isCalculating: false,
    receiptPrinted: false,
    totalPrice: 0,
    status: "Sistem Standby",
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const displayRef = useRef<HTMLDivElement | null>(null);

  const generateEducationalFeedback = (typedLine: string, lineIdx: number) => {
    const trimmed = typedLine.trim().toLowerCase();
    const firstWord = trimmed.split(" ")[0];
    const expectedLine = GHOST_TEMPLATE[lineIdx];

    let errorMsg = `Hmm... sepertinya ada yang kurang tepat di baris ${lineIdx + 1} 🤔\n\n`;

    // Deteksi masalah dan berikan petunjuk
    if (trimmed === "" || trimmed === expectedLine.toLowerCase()) {
      errorMsg += `Baris ini sepertinya masih kosong atau belum selesai kamu isi.\n\n`;

      if (expectedLine.includes("input")) {
        errorMsg += `Petunjuk: Gunakan perintah INPUT untuk menerima data dari pengguna.\n`;
        errorMsg += `INPUT membantu kita mengambil data yang dibutuhkan 📥`;
      } else if (expectedLine.includes("print")) {
        errorMsg += `Petunjuk: Gunakan perintah PRINT untuk menampilkan hasil.\n`;
        errorMsg += `PRINT membantu kita menampilkan informasi ke layar 📤`;
      } else if (expectedLine.includes("=")) {
        errorMsg += `Petunjuk: Gunakan operator = untuk menyimpan hasil perhitungan.\n`;
        errorMsg += `Operator = membantu kita menyimpan nilai ke variabel 💾`;
      } else {
        errorMsg += `Petunjuk: Coba perhatikan template yang sudah disediakan di editor 👀`;
      }
      return errorMsg;
    }

    // Beri feedback spesifik berdasarkan ekspektasi
    if (expectedLine.includes("input")) {
      errorMsg += `Petunjuk: Coba gunakan perintah INPUT untuk menerima data.\n\n`;
      errorMsg += `INPUT itu seperti "ambil data" dari pengguna.\n`;
      errorMsg += `Contoh: kalau mau ambil harga, pakai INPUT dengan nama variabelnya.`;
    } else if (expectedLine.includes("print")) {
      errorMsg += `Petunjuk: Coba gunakan perintah PRINT untuk menampilkan hasil.\n\n`;
      errorMsg += `PRINT itu seperti "tampilkan" informasi ke layar.\n`;
      errorMsg += `Contoh: kalau mau tampilkan total, pakai PRINT dengan nama variabelnya.`;
    } else if (expectedLine.includes("=")) {
      errorMsg += `Petunjuk: Coba gunakan operator = untuk menyimpan hasil perhitungan.\n\n`;
      errorMsg += `Operator = itu untuk "simpan nilai" ke dalam variabel.\n`;
      errorMsg += `Contoh: kalau mau jumlahkan dua nilai, simpan hasilnya ke variabel baru.`;
    } else {
      errorMsg += `Petunjuk: Perhatikan baik-baik perintah yang dibutuhkan ya! 👍\n\n`;
      errorMsg += `Coba lihat lagi template di editor untuk petunjuk lebih lanjut.`;
    }

    return errorMsg;
  };

  const getSystemStatusText = () => {
    if (isRunning) return "Algoritma sedang dijalankan";
    if (errorLine !== -1) return "Pemeriksaan logika diperlukan";
    return "Workspace siap menerima algoritma";
  };

  const getActiveDescription = () => {
    if (activeLine === -1) return COMMAND_DETAILS.DEFAULT;
    const lines = code.split("\n");
    const lineContent = lines[activeLine]?.trim().toLowerCase() || "";
    if (lineContent.includes("start")) return COMMAND_DETAILS.START;
    if (lineContent.includes("input")) return COMMAND_DETAILS.INPUT;
    if (lineContent.includes("=") || lineContent.includes("+"))
      return COMMAND_DETAILS.PROCESS;
    if (lineContent.includes("print")) return COMMAND_DETAILS.OUTPUT;
    if (lineContent.includes("end")) return COMMAND_DETAILS.END;
    return COMMAND_DETAILS.DEFAULT;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isRunning) return;
    setCode(e.target.value);
    setErrorLine(-1); // Reset error saat mengetik
    const cursorPosition = e.target.selectionStart;
    const linesUpToCursor = e.target.value
      .substr(0, cursorPosition)
      .split("\n");
    setActiveLine(linesUpToCursor.length - 1);
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (displayRef.current)
      displayRef.current.scrollTop = e.currentTarget.scrollTop;
    const lineNumbers = document.getElementById("line-gutter");
    if (lineNumbers) lineNumbers.scrollTop = e.currentTarget.scrollTop;
  };

  const resetSim = () => {
    setIsRunning(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setSimState({
      food: null,
      drink: null,
      isCalculating: false,
      receiptPrinted: false,
      totalPrice: 0,
      status: "Sistem Standby",
    });
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const executeStep = async (lineIndex: number): Promise<void> => {
    const lines = code.split("\n");
    if (lineIndex >= GHOST_TEMPLATE.length || code.trim() === "") {
      setIsRunning(false);
      setActiveLine(-1);
      return;
    }

    setActiveLine(lineIndex);
    const lineContent = lines[lineIndex]?.trim().toLowerCase() || "";
    const expectedLine = GHOST_TEMPLATE[lineIndex].toLowerCase();

    // --- VALIDASI: Cek apakah baris sesuai dengan template ---
    if (lineContent !== expectedLine) {
      setIsRunning(false);
      setErrorLine(lineIndex);
      setSimState((prev) => ({
        ...prev,
        status: generateEducationalFeedback(lines[lineIndex] || "", lineIndex),
      }));
      return;
    }

    // --- EKSEKUSI: Jalankan simulasi visual ---
    if (lineContent.includes("start")) {
      setSimState((prev) => ({ ...prev, status: "Memulai Alur" }));
    } else if (lineContent.includes("input")) {
      if (lineContent.includes("makanan")) {
        setSimState((prev) => ({
          ...prev,
          food: { name: "Makanan", price: 15000, emoji: "🍛" },
          status: "Input Makanan",
        }));
      } else if (lineContent.includes("minuman")) {
        setSimState((prev) => ({
          ...prev,
          drink: { name: "Minuman", price: 5000, emoji: "🍹" },
          status: "Input Minuman",
        }));
      }
    } else if (lineContent.includes("=") || lineContent.includes("+")) {
      setSimState((prev) => ({
        ...prev,
        isCalculating: true,
        status: "Menghitung...",
      }));
      await new Promise((r) => setTimeout(r, 1000));
      setSimState((prev) => ({
        ...prev,
        isCalculating: false,
        totalPrice: 20000,
      }));
    } else if (lineContent.includes("print")) {
      setSimState((prev) => ({
        ...prev,
        receiptPrinted: true,
        status: "Cetak Struk",
      }));
    } else if (lineContent.includes("end")) {
      setSimState((prev) => ({ ...prev, status: "Selesai" }));
    }

    timerRef.current = setTimeout(() => executeStep(lineIndex + 1), 1800);
  };

  const startRunning = () => {
    if (!code.trim()) return;
    resetSim();
    setIsRunning(true);
    executeStep(0);
  };

  const markAsTried = () => {
    setHasTried(true);
    // TODO: Simpan ke database/local storage jika diperlukan
    alert("Simulasi berhasil ditandai sebagai sudah dicoba! ✅");
  };

  const linesArray = code.split("\n");
  const totalDisplayLines = Math.max(
    linesArray.length,
    GHOST_TEMPLATE.length,
    10,
  );
  const currentDesc = getActiveDescription();
  const systemStatus = getSystemStatusText();

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      {/* Header CODIN */}
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
                Kasir Kantin
              </h1>
            </div>
            <span className="text-[8px] text-emerald-600 font-bold tracking-widest uppercase italic bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Mudah
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
            disabled={hasTried}
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
        {/* PANEL KIRI - DESKRIPSI (Dinamis) */}
        <aside className="w-72 bg-white border-r border-slate-200 p-5 flex flex-col gap-5 shrink-0 z-20 overflow-y-auto">
          <div className="flex items-center gap-2 px-1">
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
              className={`p-5 rounded-2xl border ${currentDesc.color} transition-all duration-300 shadow-sm`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/90 rounded-lg shadow-sm">
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

          <div className="mt-auto p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl">
            <div className="flex items-center justify-between text-[9px] font-black text-emerald-600/60 uppercase mb-2">
              <span>Info Editor</span>
              <Edit3 size={10} />
            </div>
            <p className="text-[10px] text-slate-500 italic leading-tight">
              {activeLine !== -1
                ? `Baris ${activeLine + 1} sedang fokus pengeditan.`
                : "Silakan klik editor untuk mulai mengetik."}
            </p>
          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
          {/* MISI CARD */}
          <section className="px-6 pt-5 pb-3">
            <div className="bg-[#ecfdf5] border border-emerald-100 rounded-2xl p-5 flex items-start gap-5 shadow-sm">
              <div className="bg-white p-2.5 rounded-xl shadow-sm text-emerald-600 border border-emerald-50">
                <Lightbulb size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded uppercase tracking-widest">
                    MISI
                  </span>
                  <h2 className="text-sm font-black text-slate-800">
                    Perbaiki Mesin Kasir Kantin
                  </h2>
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed max-w-4xl">
                  Mesin kasir di kantin sekolah tidak dapat menghitung total
                  harga makanan dan minuman pelanggan. Tulis algoritma{" "}
                  <strong>pseudocode</strong> untuk membantu kasir menghitung
                  total belanja pelanggan.
                </p>
              </div>
            </div>
          </section>

          {/* EDITOR & SIMULATOR */}
          <div className="flex-1 flex gap-4 px-6 pb-4 overflow-hidden">
            {/* EDITOR */}
            <section className="flex-1 min-w-[500px] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
              <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${isRunning ? "bg-rose-500 animate-pulse" : errorLine !== -1 ? "bg-red-500 shadow-[0_0_5px_red]" : "bg-emerald-500"}`}
                  ></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                    main.algo
                  </span>
                </div>
                <div
                  className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${isRunning ? "bg-rose-500 text-white" : errorLine !== -1 ? "bg-red-500 text-white border-red-600 shadow-sm" : "bg-white text-slate-400 border-slate-200"}`}
                >
                  {isRunning
                    ? "RUNNING"
                    : errorLine !== -1
                      ? "ERROR"
                      : "READY TO TYPE"}
                </div>
              </div>

              <div className="relative flex-1 flex font-mono text-[13px] leading-[24px] overflow-hidden">
                <div
                  id="line-gutter"
                  className="w-10 bg-slate-50/30 text-slate-300 text-right pr-3 pt-5 select-none border-r border-slate-100 overflow-hidden shrink-0"
                >
                  {Array.from({ length: totalDisplayLines }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-[24px] transition-all ${activeLine === i ? "text-emerald-600 font-black scale-110 pr-1" : ""}`}
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
                    {Array.from({ length: totalDisplayLines }).map((_, i) => {
                      const userText = linesArray[i] || "";
                      const templateText = GHOST_TEMPLATE[i] || "";
                      const isActive = activeLine === i;
                      const isError = errorLine === i;
                      const isLinePast = isRunning && activeLine > i;

                      return (
                        <div
                          key={i}
                          className="relative h-[24px] flex items-center"
                        >
                          {/* Highlight untuk baris aktif atau error */}
                          {isActive && !isError && (
                            <motion.div
                              layoutId="lineHighlight"
                              className={`absolute inset-0 -mx-5 border-l-4 z-0 ${isRunning ? "bg-emerald-50 border-emerald-500" : "bg-emerald-50/30 border-emerald-200"}`}
                            />
                          )}
                          {isError && (
                            <motion.div
                              layoutId="errorHighlight"
                              className="absolute inset-0 bg-red-50 -mx-5 border-l-4 border-red-500 z-0"
                            />
                          )}
                          <div
                            className={`relative z-10 whitespace-pre ${isLinePast ? "opacity-30" : ""}`}
                          >
                            {/* Render teks dengan ghost template */}
                            {Array.from({
                              length: Math.max(
                                userText.length,
                                templateText.length,
                              ),
                            }).map((_, charIdx) => {
                              const uChar = userText[charIdx];
                              const tChar = templateText[charIdx];
                              if (uChar !== undefined) {
                                // Tampilkan teks user (tanpa validasi real-time)
                                return (
                                  <span
                                    key={charIdx}
                                    className="text-slate-900 font-bold"
                                  >
                                    {uChar}
                                  </span>
                                );
                              }
                              // Tampilkan ghost text untuk bagian yang belum diisi
                              return (
                                <span
                                  key={charIdx}
                                  className="text-slate-300 select-none italic font-medium"
                                >
                                  {tChar}
                                </span>
                              );
                            })}
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
                    className={`absolute inset-0 w-full h-full bg-transparent p-5 pt-5 outline-none resize-none z-20 font-mono transition-all text-transparent caret-emerald-600 selection:bg-emerald-100 ${isRunning ? "cursor-not-allowed" : "cursor-text"}`}
                    style={{ lineHeight: "24px" }}
                  />
                </div>
              </div>
            </section>

            {/* SIMULASI */}
            <aside className="w-[380px] bg-[#020617] rounded-2xl flex flex-col shrink-0 overflow-hidden shadow-xl border border-slate-800">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                    <Activity size={14} />
                  </div>
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-wrap">
                    Simulasi
                  </h2>
                </div>
              </div>

              <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-hidden bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)]">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-center justify-center">
                  <Utensils size={360} className="text-white rotate-12" />
                </div>

                <div className="relative w-full max-w-sm aspect-square flex flex-col items-center justify-center scale-90">
                  <div className="absolute bottom-10 w-full h-28 bg-slate-800 rounded-t-[40px] border-x-4 border-t-4 border-slate-700 shadow-2xl z-0" />

                  <motion.div
                    animate={{
                      scale: activeLine >= 1 && activeLine <= 2 ? 1.05 : 1,
                      y: activeLine >= 1 && activeLine <= 2 ? -5 : 0,
                    }}
                    className="absolute bottom-28 w-56 h-6 bg-slate-700 rounded-full flex items-center justify-center border-b-4 border-slate-900 shadow-xl z-10"
                  />

                  <div className="absolute bottom-32 flex gap-8 z-20">
                    <AnimatePresence>
                      {simState.food && (
                        <motion.div
                          key="food"
                          initial={{ opacity: 0, y: -150, scale: 0.5 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className="filter drop-shadow-lg"
                        >
                          <span className="text-6xl">
                            {simState.food.emoji}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {simState.drink && (
                        <motion.div
                          key="drink"
                          initial={{ opacity: 0, y: -150, scale: 0.5 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className="filter drop-shadow-lg"
                        >
                          <span className="text-6xl">
                            {simState.drink.emoji}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="absolute -right-2 bottom-32 w-20 h-20 bg-slate-900 rounded-xl border-2 border-slate-700 shadow-2xl z-30 flex flex-col items-center">
                    <div className="w-full h-2 bg-emerald-500/20 rounded-t-xl overflow-hidden">
                      <div
                        className={`w-full h-full bg-emerald-400 ${isRunning ? "animate-pulse" : ""}`}
                      />
                    </div>
                    <AnimatePresence>
                      {simState.receiptPrinted && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 100, opacity: 1 }}
                          className="absolute top-2 left-2 right-2 bg-white rounded-sm shadow-xl p-2 flex flex-col gap-1 overflow-hidden"
                        >
                          <div className="text-[5px] text-emerald-800 font-black border-b border-slate-100 pb-0.5 mb-1 uppercase text-center">
                            Receipt
                          </div>
                          <div className="flex justify-between text-[4px] text-slate-500 font-bold uppercase tracking-tighter">
                            <span>Items</span>
                            <span>Price</span>
                          </div>
                          <div className="flex justify-between text-[4px] text-slate-800 font-bold">
                            <span>{simState.food?.name}</span>
                            <span>15.000</span>
                          </div>
                          <div className="flex justify-between text-[4px] text-slate-800 font-bold">
                            <span>{simState.drink?.name}</span>
                            <span>5.000</span>
                          </div>
                          <div className="mt-auto pt-1 border-t border-dashed border-slate-300 flex justify-between text-[6px] text-black font-black uppercase text-wrap">
                            <span>Total</span>
                            <span>20.000</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {simState.totalPrice > 0 && !simState.isCalculating && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute bottom-12 bg-white border-2 border-emerald-500 px-6 py-2 rounded-2xl text-emerald-600 font-mono text-lg font-black shadow-lg shadow-emerald-500/20 z-40"
                    >
                      Rp 20.000
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {simState.isCalculating && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-10 bg-emerald-600 text-white px-4 py-2 rounded-full text-[9px] font-black flex items-center gap-2 shadow-xl border border-emerald-500"
                      >
                        <Calculator size={12} className="animate-spin" />{" "}
                        CALCULATING...
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div
                className={`p-5 border-t h-44 flex flex-col gap-2 shrink-0 transition-all duration-300 ${errorLine !== -1 ? "bg-rose-50 border-rose-200 shadow-inner" : "bg-black/40 border-slate-800"}`}
              >
                <div className="flex items-center gap-2 shrink-0">
                  {errorLine !== -1 ? (
                    <Activity size={14} className="text-rose-500" />
                  ) : (
                    <CheckCircle2
                      size={12}
                      className={
                        simState.receiptPrinted
                          ? "text-emerald-500"
                          : "text-slate-600"
                      }
                    />
                  )}
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      errorLine !== -1 ? "text-rose-600" : "text-slate-500"
                    }`}
                  >
                    Logic Log
                  </span>
                </div>
                <div
                  className={`text-[11px] font-medium whitespace-pre-wrap leading-relaxed overflow-y-auto scrollbar-thin ${
                    errorLine !== -1
                      ? "text-rose-700"
                      : "text-emerald-400 font-mono"
                  }`}
                >
                  {simState.status}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* FOOTER CODIN (STATUS BAR) */}
      <footer className="bg-white px-6 py-2 border-t border-slate-200 flex justify-between items-center text-[10px] font-medium text-slate-500 z-30 shrink-0">
        <div className="flex gap-2 items-center">
          <span
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isRunning
                ? "bg-emerald-500 animate-pulse"
                : errorLine !== -1
                  ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                  : "bg-slate-300"
            }`}
          ></span>
          <span className="uppercase tracking-wider font-bold">
            STATUS SISTEM • {systemStatus}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">Bahasa: Pseudocode Indonesia</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="font-bold tracking-tight text-emerald-700 uppercase">
            CODIN • Interactive Algorithm Learning • 2026
          </span>
        </div>
      </footer>
    </div>
  );
};

export default KasirKantinSimulation;
