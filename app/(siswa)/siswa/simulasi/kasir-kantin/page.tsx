"use client";

import React, { useState, useRef } from "react";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Terminal,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  Activity,
  Database,
  Flag,
  Calculator,
  Printer,
  Edit3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ================== KONSTANTA DAN SOLUSI ==================

const EXPECTED_SOLUTION = [
  "start",
  "input harga_makanan",
  "input harga_minuman",
  "hasil = harga_makanan + harga_minuman",
  "print hasil",
  "end",
];

const INITIAL_TEMPLATE = [
  "start",
  "______ harga_makanan",
  "______ harga_minuman",
  "______ = harga_makanan + harga_minuman",
  "______ hasil",
  "end",
];

const COMMAND_DETAILS = {
  START: {
    title: "START / END",
    desc: "Menandai awal dan akhir dari sebuah alur program kasir kantin.",
    icon: <Flag className="text-emerald-500" size={20} />,
    color: "bg-emerald-50 border-emerald-100",
  },
  LOGIC: {
    title: "INPUT & PRINT",
    desc: "Gunakan INPUT untuk membaca harga. PRINT untuk menampilkan total harga.",
    icon: <Database className="text-blue-500" size={20} />,
    color: "bg-blue-50 border-blue-100",
  },
  PROCESS: {
    title: "PROCESS (=)",
    desc: "Operasi perhitungan untuk menjumlahkan harga makanan dan minuman.",
    icon: <Calculator className="text-amber-500" size={20} />,
    color: "bg-amber-100 border-amber-200",
  },
  DEFAULT: {
    title: "READY TO TYPE",
    desc: "Lengkapi bagian ______ pada editor untuk menyelesaikan misi kasir kantin.",
    icon: <Edit3 className="text-slate-400" size={20} />,
    color: "bg-slate-50 border-slate-200",
  },
};

// ================== TIPE DATA ==================

interface FoodItem {
  name: string;
  price: number;
  emoji: string;
}

type SimulationState = {
  food: FoodItem | null;
  drink: FoodItem | null;
  isCalculating: boolean;
  receiptPrinted: boolean;
  totalPrice: number;
};

// ================== KOMPONEN UTAMA ==================

export default function SimulasiKasirKantin() {
  const [code, setCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeLine, setActiveLine] = useState<number>(-1);
  const [errorLine, setErrorLine] = useState<number>(-1);
  const [hasTried, setHasTried] = useState(false);
  const [logicLog, setLogicLog] = useState<string[]>([
    "Workspace siap menerima algoritma",
  ]);

  const [simState, setSimState] = useState<SimulationState>({
    food: null,
    drink: null,
    isCalculating: false,
    receiptPrinted: false,
    totalPrice: 0,
  });

  const logEndRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const simDataRef = useRef<SimulationState>(simState);

  const linesArray = code.split("\n");
  const totalDisplayLines = Math.max(
    INITIAL_TEMPLATE.length,
    linesArray.length,
  );

  const currentDesc = (() => {
    if (activeLine === -1) return COMMAND_DETAILS.DEFAULT;
    const line = linesArray[activeLine]?.toLowerCase() || "";
    if (line.includes("start") || line.includes("end"))
      return COMMAND_DETAILS.START;
    if (line.includes("input") || line.includes("print"))
      return COMMAND_DETAILS.LOGIC;
    if (line.includes("=") || line.includes("+"))
      return COMMAND_DETAILS.PROCESS;
    return COMMAND_DETAILS.DEFAULT;
  })();

  // ================== FUNGSI HELPER ==================

  const addLog = (message: string) => {
    setLogicLog((prev) => [...prev, message]);
    setTimeout(() => {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const normalizeCode = (line: string): string => {
    return line.trim().toLowerCase().replace(/\s+/g, " ");
  };

  const markAsTried = () => {
    setHasTried(true);
  };

  const resetSim = () => {
    setCode("");
    setActiveLine(-1);
    setErrorLine(-1);
    setIsRunning(false);
    setHasTried(false);
    setLogicLog(["Workspace siap menerima algoritma"]);
    setSimState({
      food: null,
      drink: null,
      isCalculating: false,
      receiptPrinted: false,
      totalPrice: 0,
    });
    simDataRef.current = {
      food: null,
      drink: null,
      isCalculating: false,
      receiptPrinted: false,
      totalPrice: 0,
    };
  };

  const updateSimData = (updates: Partial<SimulationState>) => {
    simDataRef.current = { ...simDataRef.current, ...updates };
    setSimState((prev) => ({ ...prev, ...updates }));
  };

  const generateEducationalFeedback = (
    lineIndex: number,
    userLine: string,
  ): string => {
    const normalized = normalizeCode(userLine);

    if (normalized === "" || normalized.includes("_")) {
      return "Hmm... sepertinya baris ini masih perlu dilengkapi. Coba periksa kembali perintah yang sesuai untuk langkah ini.";
    }

    if (lineIndex === 1) {
      if (!normalized.includes("input")) {
        return "Di sini kita perlu membaca data harga makanan. Perintah apa yang cocok untuk membaca data?";
      }
      if (!normalized.includes("harga_makanan")) {
        return "Kita sedang mencoba membaca harga makanan. Variabel apa yang seharusnya dibaca?";
      }
    }

    if (lineIndex === 2) {
      if (!normalized.includes("input")) {
        return "Kita perlu membaca data harga minuman. Perintah apa yang digunakan untuk membaca data?";
      }
      if (!normalized.includes("harga_minuman")) {
        return "Sistem perlu tahu harga minuman. Variabel mana yang harus dibaca?";
      }
    }

    if (lineIndex === 3) {
      if (!normalized.includes("hasil")) {
        return "Kita perlu menyimpan hasil perhitungan. Variabel apa yang seharusnya digunakan?";
      }
      if (!normalized.includes("=")) {
        return "Bagaimana cara menyimpan hasil perhitungan ke dalam variabel?";
      }
      if (!normalized.includes("+")) {
        return "Kita perlu menjumlahkan harga makanan dan minuman. Operator apa yang digunakan?";
      }
    }

    if (lineIndex === 4) {
      if (!normalized.includes("print")) {
        return "Setelah menghitung, kita perlu menampilkan hasilnya. Perintah apa yang cocok?";
      }
      if (!normalized.includes("hasil")) {
        return "Variabel apa yang perlu ditampilkan ke layar?";
      }
    }

    return "Ada yang kurang sesuai pada baris ini. Coba periksa kembali struktur perintahnya.";
  };

  // ================== EKSEKUSI ALGORITMA ==================

  const executeStep = async (step: number): Promise<boolean> => {
    const lines = code.split("\n");

    if (step >= lines.length) {
      return true;
    }

    setActiveLine(step);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const userLine = lines[step];
    const expectedLine = EXPECTED_SOLUTION[step];

    const normalizedUser = normalizeCode(userLine);
    const normalizedExpected = normalizeCode(expectedLine);

    if (normalizedUser !== normalizedExpected) {
      setErrorLine(step);
      const feedback = generateEducationalFeedback(step, userLine);
      addLog(`❌ ${feedback}`);
      setActiveLine(-1);
      return false;
    }

    // Eksekusi berdasarkan baris
    switch (step) {
      case 0: // start
        addLog("✅ Algoritma dimulai...");
        break;

      case 1: // input harga_makanan
        const foodItems = [
          { name: "Nasi Goreng", price: 15000, emoji: "🍛" },
          { name: "Mie Ayam", price: 12000, emoji: "🍜" },
          { name: "Soto Ayam", price: 13000, emoji: "🍲" },
        ];
        const randomFood =
          foodItems[Math.floor(Math.random() * foodItems.length)];
        updateSimData({ food: randomFood });
        addLog(
          `🍽️ Input harga makanan: ${randomFood.name} - Rp ${randomFood.price.toLocaleString("id-ID")}`,
        );
        break;

      case 2: // input harga_minuman
        const drinkItems = [
          { name: "Es Teh", price: 5000, emoji: "🍹" },
          { name: "Es Jeruk", price: 6000, emoji: "🧃" },
          { name: "Kopi", price: 7000, emoji: "☕" },
        ];
        const randomDrink =
          drinkItems[Math.floor(Math.random() * drinkItems.length)];
        updateSimData({ drink: randomDrink });
        addLog(
          `🥤 Input harga minuman: ${randomDrink.name} - Rp ${randomDrink.price.toLocaleString("id-ID")}`,
        );
        break;

      case 3: // hasil = harga_makanan + harga_minuman
        updateSimData({ isCalculating: true });
        addLog("🧮 Menghitung total harga...");
        await new Promise((resolve) => setTimeout(resolve, 800));
        const total =
          (simDataRef.current.food?.price || 0) +
          (simDataRef.current.drink?.price || 0);
        updateSimData({
          isCalculating: false,
          totalPrice: total,
        });
        addLog(`💰 Hasil: Rp ${total.toLocaleString("id-ID")}`);
        break;

      case 4: // print hasil
        updateSimData({ receiptPrinted: true });
        addLog("🧾 Mencetak struk pembayaran...");
        addLog(
          `📋 Total yang harus dibayar: Rp ${simDataRef.current.totalPrice.toLocaleString("id-ID")}`,
        );
        break;

      case 5: // end
        addLog("✅ Algoritma selesai dijalankan.");
        break;
    }

    return true;
  };

  const startRunning = async () => {
    const lines = code.split("\n");

    setIsRunning(true);
    setActiveLine(-1);
    setErrorLine(-1);
    setLogicLog([]);
    simDataRef.current = {
      food: null,
      drink: null,
      isCalculating: false,
      receiptPrinted: false,
      totalPrice: 0,
    };
    setSimState({
      food: null,
      drink: null,
      isCalculating: false,
      receiptPrinted: false,
      totalPrice: 0,
    });

    addLog("🚀 Memulai eksekusi algoritma...");

    for (let i = 0; i < lines.length; i++) {
      const success = await executeStep(i);
      if (!success) {
        setIsRunning(false);
        return;
      }
    }

    setIsRunning(false);
    setActiveLine(-1);
    addLog("🎉 Algoritma berhasil dijalankan!");
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

  // ================== RENDER UI ==================

  return (
    <div className="flex flex-col h-screen bg-[#fafbfc] overflow-hidden">
      {/* HEADER */}
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
                Mesin Kasir Kantin
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
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    Perbaiki Mesin Kasir Kantin
                  </h2>
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed max-w-4xl font-medium">
                  Mesin kasir kantin mengalami error dan tidak bisa menghitung
                  total harga. Tulis algoritma pseudocode untuk menghitung total
                  harga makanan dan minuman pelanggan di mesin kasir kantin.
                </p>
              </div>
            </div>
          </section>

          <div className="flex-1 flex gap-5 px-6 pb-6 overflow-hidden">
            {/* PANEL TENGAH - EDITOR GHOST TEMPLATE */}
            <section className="flex-1 min-w-[500px] bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
              <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${isRunning ? "bg-rose-500 animate-pulse" : errorLine !== -1 ? "bg-red-500 shadow-[0_0_5px_red]" : "bg-emerald-500"}`}
                  ></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic font-mono">
                    CASHIER_SYSTEM.ALGO
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
                    value={code}
                    onChange={(e) => {
                      if (isRunning) return;
                      setCode(e.target.value);
                      setErrorLine(-1);
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

            {/* PANEL KANAN - SIMULASI HARDWARE */}
            <section className="w-96 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
              <div className="px-5 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#22c55e]"></div>
                  <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">
                    Hardware Preview
                  </span>
                </div>
              </div>

              {/* Area Simulasi */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 h-[420px] overflow-hidden relative flex flex-col items-center justify-center gap-6">
                {/* Mesin Kasir */}
                <div className="relative">
                  {/* Monitor Kasir */}
                  <div className="w-72 h-48 bg-slate-700 rounded-2xl border-4 border-slate-600 shadow-2xl relative overflow-hidden">
                    {/* Screen */}
                    <div className="absolute inset-2 bg-gradient-to-br from-emerald-900 to-slate-900 rounded-lg flex flex-col p-4 font-mono text-xs">
                      <div className="text-emerald-400 mb-3 text-center font-bold border-b border-emerald-700 pb-2">
                        === KASIR KANTIN ===
                      </div>

                      <AnimatePresence mode="wait">
                        {!simState.food && !simState.drink && (
                          <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-slate-500 text-center my-auto"
                          >
                            Menunggu input...
                          </motion.div>
                        )}

                        {(simState.food || simState.drink) && (
                          <motion.div
                            key="items"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                          >
                            {simState.food && (
                              <div className="flex justify-between text-emerald-300">
                                <span>
                                  {simState.food.emoji} {simState.food.name}
                                </span>
                                <span>
                                  Rp{" "}
                                  {simState.food.price.toLocaleString("id-ID")}
                                </span>
                              </div>
                            )}
                            {simState.drink && (
                              <div className="flex justify-between text-emerald-300">
                                <span>
                                  {simState.drink.emoji} {simState.drink.name}
                                </span>
                                <span>
                                  Rp{" "}
                                  {simState.drink.price.toLocaleString("id-ID")}
                                </span>
                              </div>
                            )}

                            {simState.isCalculating && (
                              <div className="text-amber-400 text-center mt-4 animate-pulse">
                                Menghitung...
                              </div>
                            )}

                            {simState.totalPrice > 0 &&
                              !simState.isCalculating && (
                                <motion.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="mt-4 pt-3 border-t border-emerald-700"
                                >
                                  <div className="flex justify-between text-emerald-400 font-bold text-sm">
                                    <span>TOTAL:</span>
                                    <span>
                                      Rp{" "}
                                      {simState.totalPrice.toLocaleString(
                                        "id-ID",
                                      )}
                                    </span>
                                  </div>
                                </motion.div>
                              )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Stand */}
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-16 h-3 bg-slate-600 rounded-b-lg"></div>
                  </div>

                  {/* Receipt Printer */}
                  {simState.receiptPrinted && (
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-48"
                    >
                      <div className="bg-white text-slate-900 p-3 rounded-lg shadow-xl font-mono text-[9px] border-t-4 border-dashed border-slate-400">
                        <div className="text-center font-bold mb-1">
                          STRUK PEMBAYARAN
                        </div>
                        <div className="border-t border-dashed border-slate-300 my-1"></div>
                        {simState.food && (
                          <div className="flex justify-between">
                            <span>{simState.food.name}</span>
                            <span>
                              Rp {simState.food.price.toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                        {simState.drink && (
                          <div className="flex justify-between">
                            <span>{simState.drink.name}</span>
                            <span>
                              Rp {simState.drink.price.toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                        <div className="border-t border-dashed border-slate-300 my-1"></div>
                        <div className="flex justify-between font-bold">
                          <span>TOTAL</span>
                          <span>
                            Rp {simState.totalPrice.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="text-center mt-2 text-slate-500">
                          Terima kasih!
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Emoji Makanan & Minuman */}
                <div className="flex gap-8 mt-8">
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {simState.food ? simState.food.emoji : "🍽️"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">
                      {simState.food ? simState.food.name : "Makanan"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {simState.drink ? simState.drink.emoji : "🥤"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">
                      {simState.drink ? simState.drink.name : "Minuman"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logic Log */}
              <div className="border-t border-slate-700 flex flex-col overflow-hidden h-44">
                <div className="px-5 py-2 bg-slate-900 border-b border-slate-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full border border-slate-500"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    LOGIC LOG
                  </span>
                </div>
                <div
                  className={`flex-1 p-4 overflow-y-auto text-[11px] font-mono space-y-1 ${
                    errorLine !== -1
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-900 text-emerald-400"
                  }`}
                >
                  {logicLog.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                  <div ref={logEndRef}></div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="px-8 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 text-[10px]">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="font-black uppercase tracking-widest">
            STATUS SISTEM
          </span>
          <span className="w-px h-3 bg-slate-300"></span>
          <span className="font-medium italic">
            Workspace siap menerima algoritma
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
