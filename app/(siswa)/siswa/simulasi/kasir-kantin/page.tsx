"use client";

import React, { useEffect, useRef, useState } from "react";
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
  Monitor,
  Utensils,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ================== KONSTANTA DAN SOLUSI ==================

const EXPECTED_SOLUTION = [
  "start",
  "input harga_makanan",
  "input harga_minuman",
  "proses hasil = harga_makanan + harga_minuman",
  "output hasil",
  "end",
] as const;

const INITIAL_TEMPLATE = [
  "start",
  "_____ harga_makanan",
  "_____ harga_minuman",
  "_____ hasil = harga_makanan + harga_minuman",
  "_____ hasil",
  "end",
] as const;

const BLANK_LINE_SUFFIX: Partial<Record<number, string>> = {
  1: "harga_makanan",
  2: "harga_minuman",
  3: "hasil = harga_makanan + harga_minuman",
  4: "hasil",
};

const BLANK_LINE_GHOST_COMMAND: Partial<Record<number, string>> = {
  1: "input",
  2: "input",
  3: "proses",
  4: "output",
};

type CommandChoice = "input" | "proses" | "output";

const COMMAND_DETAILS = {
  START: {
    title: "START",
    desc: "Menandai titik awal algoritma. Program akan mulai membaca instruksi dari baris ini.",
    icon: <Flag className="text-emerald-500" size={20} />,
    color: "bg-emerald-50 border-emerald-100",
  },
  INPUT: {
    title: "INPUT",
    desc: "Digunakan untuk mengambil data dari luar (seperti harga barang) untuk disimpan di memori.",
    icon: <Database className="text-teal-500" size={20} />,
    color: "bg-teal-50 border-teal-100",
  },
  PROCESS: {
    title: "PROCESS",
    desc: "Tahap pengolahan data, misalnya menjumlahkan harga makanan dan minuman menjadi total.",
    icon: <Calculator className="text-green-600" size={20} />,
    color: "bg-green-50 border-green-100",
  },
  OUTPUT: {
    title: "OUTPUT / PRINT",
    desc: "Menampilkan hasil akhir ke layar atau mencetak bukti transaksi seperti struk belanja.",
    icon: <Printer className="text-emerald-600" size={20} />,
    color: "bg-emerald-50 border-emerald-100",
  },
  END: {
    title: "END",
    desc: "Menandakan bahwa semua proses telah selesai dan sistem berhenti bekerja.",
    icon: <CheckCircle2 className="text-emerald-700" size={20} />,
    color: "bg-emerald-100 border-emerald-200",
  },
  DEFAULT: {
    title: "WORKSPACE",
    desc: "Klik bagian kosong (_____) lalu pilih INPUT, PROCESS, atau OUTPUT. Teks abu-abu adalah ghost text panduan.",
    icon: <Monitor className="text-muted-foreground" size={20} />,
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
  status: string;
};

// ================== KOMPONEN UTAMA ==================

const SIMULASI_SLUG = "kasir-kantin";

export default function SimulasiKasirKantin() {
  const [selectedCommands, setSelectedCommands] = useState<
    Partial<Record<number, CommandChoice>>
  >({});
  const [openSelectorLine, setOpenSelectorLine] = useState<number | null>(null);
  const [code, setCode] = useState(INITIAL_TEMPLATE.join("\n"));
  const [isRunning, setIsRunning] = useState(false);
  const [activeLine, setActiveLine] = useState<number>(-1);
  const [errorLine, setErrorLine] = useState<number>(-1);
  const [hasTried, setHasTried] = useState(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);
  const [logicLog, setLogicLog] = useState<string[]>([
    "Sistem siap menjalankan algoritma.",
  ]);

  const [simState, setSimState] = useState<SimulationState>({
    food: null,
    drink: null,
    isCalculating: false,
    receiptPrinted: false,
    totalPrice: 0,
    status: "Sistem Standby",
  });

  const logEndRef = useRef<HTMLDivElement>(null);
  const simDataRef = useRef<SimulationState>(simState);

  const linesArray = code.split("\n");
  const totalDisplayLines = Math.max(
    INITIAL_TEMPLATE.length,
    linesArray.length,
  );

  const currentDesc = (() => {
    if (activeLine === -1) return COMMAND_DETAILS.DEFAULT;
    const line = linesArray[activeLine]?.toLowerCase() || "";
    if (line.includes("start")) return COMMAND_DETAILS.START;
    if (line.includes("input")) return COMMAND_DETAILS.INPUT;
    if (line.includes("proses") || line.includes("process"))
      return COMMAND_DETAILS.PROCESS;
    if (line.includes("output") || line.includes("print"))
      return COMMAND_DETAILS.OUTPUT;
    if (line.includes("end")) return COMMAND_DETAILS.END;
    return COMMAND_DETAILS.DEFAULT;
  })();

  const getLineText = (lineIndex: number): string => {
    const suffix = BLANK_LINE_SUFFIX[lineIndex];
    if (!suffix) {
      return INITIAL_TEMPLATE[lineIndex] || "";
    }

    const command = selectedCommands[lineIndex] ?? "_____";
    return `${command} ${suffix}`;
  };

  const handleSelectCommand = (lineIndex: number, command: CommandChoice) => {
    if (isRunning) return;
    setSelectedCommands((prev) => ({ ...prev, [lineIndex]: command }));
    setOpenSelectorLine(null);
    setActiveLine(lineIndex);
    setErrorLine(-1);
  };

  useEffect(() => {
    const newCode = INITIAL_TEMPLATE.map((_, i) => getLineText(i)).join("\n");
    setCode(newCode);
  }, [selectedCommands]);

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

  const resetSim = () => {
    setSelectedCommands({});
    setOpenSelectorLine(null);
    setCode(INITIAL_TEMPLATE.join("\n"));
    setActiveLine(-1);
    setErrorLine(-1);
    setIsRunning(false);
    setHasTried(false);
    setLogicLog(["Sistem siap menjalankan algoritma."]);
    setSimState({
      food: null,
      drink: null,
      isCalculating: false,
      receiptPrinted: false,
      totalPrice: 0,
      status: "Sistem Standby",
    });
    simDataRef.current = {
      food: null,
      drink: null,
      isCalculating: false,
      receiptPrinted: false,
      totalPrice: 0,
      status: "Sistem Standby",
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
      if (!normalized.includes("proses") && !normalized.includes("process")) {
        return "Tahap ini adalah PROCESS. Gunakan perintah proses untuk mengolah data harga.";
      }
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
      if (!normalized.includes("output") && !normalized.includes("print")) {
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
      addLog(`ERROR: ${feedback}`);
      setActiveLine(-1);
      return false;
    }

    // Eksekusi berdasarkan baris
    switch (step) {
      case 0: // start
        updateSimData({ status: "Memulai Alur" });
        addLog("Sistem: Memulai proses kasir...");
        break;

      case 1: // input harga_makanan
        const foodItems = [
          { name: "Nasi Goreng", price: 15000, emoji: "🍛" },
          { name: "Mie Ayam", price: 12000, emoji: "🍜" },
          { name: "Soto Ayam", price: 13000, emoji: "🍲" },
        ];
        const randomFood =
          foodItems[Math.floor(Math.random() * foodItems.length)];
        updateSimData({ food: randomFood, status: "Input Makanan" });
        addLog(
          `INPUT: harga_makanan = ${randomFood.name} (Rp ${randomFood.price.toLocaleString("id-ID")})`,
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
        updateSimData({ drink: randomDrink, status: "Input Minuman" });
        addLog(
          `INPUT: harga_minuman = ${randomDrink.name} (Rp ${randomDrink.price.toLocaleString("id-ID")})`,
        );
        break;

      case 3: // hasil = harga_makanan + harga_minuman
        updateSimData({ isCalculating: true, status: "Menghitung Total..." });
        addLog("PROSES: Menghitung total harga...");
        await new Promise((resolve) => setTimeout(resolve, 800));
        const total =
          (simDataRef.current.food?.price || 0) +
          (simDataRef.current.drink?.price || 0);
        updateSimData({
          isCalculating: false,
          totalPrice: total,
          status: "Kalkulasi Selesai",
        });
        addLog(`PROSES: hasil = Rp ${total.toLocaleString("id-ID")}`);
        break;

      case 4: // output hasil
        updateSimData({ receiptPrinted: true, status: "Mencetak Struk" });
        addLog("OUTPUT: Mencetak struk pembayaran...");
        addLog(
          `OUTPUT: total_bayar = Rp ${simDataRef.current.totalPrice.toLocaleString("id-ID")}`,
        );
        break;

      case 5: // end
        updateSimData({ status: "Selesai" });
        addLog("Sukses: Algoritma selesai dijalankan.");
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
      status: "Menjalankan...",
    };
    setSimState({
      food: null,
      drink: null,
      isCalculating: false,
      receiptPrinted: false,
      totalPrice: 0,
      status: "Menjalankan...",
    });

    addLog("Sistem: Memulai eksekusi algoritma...");

    for (let i = 0; i < lines.length; i++) {
      const success = await executeStep(i);
      if (!success) {
        setIsRunning(false);
        return;
      }
    }

    setIsRunning(false);
    setActiveLine(-1);
    addLog("Sukses: Algoritma berhasil dijalankan.");
  };

  // ================== RENDER UI ==================

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* HEADER */}
      <header className="px-8 py-4 bg-background border-b border-border flex items-center justify-between shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => (window.location.href = "/siswa/simulasi")}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg transition-all"
          >
            <ArrowLeft size={14} /> Kembali
          </button>
          <div className="w-px h-6 bg-border"></div>
          <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-emerald-100 shadow-lg">
            <Terminal size={20} />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-lg font-black tracking-tighter text-foreground uppercase italic leading-none">
                Mesin Kasir Kantin
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
        {/* PANEL KIRI - DESKRIPSI */}
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

          <div className="mt-auto p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
            <div className="flex items-center justify-between text-[9px] font-black text-emerald-600/60 uppercase mb-2">
              <span>Info Baris</span>
              <Activity size={10} />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground italic leading-tight">
              {activeLine !== -1
                ? `Sedang fokus di baris ${activeLine + 1}`
                : "Klik editor untuk mulai"}
            </p>
          </div>
        </aside>

        {/* WORKSPACE - EDITOR */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          <section className="px-6 pt-5 pb-3">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 flex items-start gap-5 shadow-sm">
              <div className="bg-background p-2.5 rounded-xl shadow-sm text-primary">
                <Lightbulb size={24} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded uppercase tracking-widest">
                    MISI
                  </span>
                  <h2 className="text-sm font-black text-foreground uppercase tracking-tight">
                    Perbaiki Mesin Kasir Kantin
                  </h2>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed max-w-4xl font-medium">
                  Mesin kasir di kantin sekolah tidak dapat menghitung total
                  belanja pelanggan. Tulis algoritma <strong>pseudocode</strong>{" "}
                  untuk membantu kasir menghitung total harga makanan dan
                  minuman.
                </p>
              </div>
            </div>
          </section>

          <div className="flex-1 flex gap-5 px-6 pb-6 overflow-hidden">
            {/* PANEL TENGAH - EDITOR GHOST TEMPLATE */}
            <section className="flex-1 min-w-[500px] bg-card rounded-3xl border border-border shadow-sm flex flex-col overflow-hidden relative">
              <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${isRunning ? "bg-rose-500 animate-pulse" : errorLine !== -1 ? "bg-red-500 shadow-[0_0_5px_red]" : "bg-emerald-500"}`}
                  ></div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic font-mono">
                    main.algo
                  </span>
                </div>
                <div
                  className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${isRunning ? "bg-rose-500 text-white" : errorLine !== -1 ? "bg-red-500 text-white border-red-600 shadow-sm" : "bg-background text-muted-foreground border-border"}`}
                >
                  {isRunning
                    ? "RUNNING"
                    : errorLine !== -1
                      ? "ERROR"
                      : "READY TO CLICK"}
                </div>
              </div>

              <div className="relative flex-1 flex font-mono text-[13px] leading-[26px] overflow-hidden">
                <div
                  id="line-gutter"
                  className="w-12 bg-muted/30 text-muted-foreground/70 text-right pr-4 pt-5 select-none border-r border-border/60 overflow-hidden shrink-0"
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
                <div className="relative flex-1 bg-card overflow-hidden">
                  <div className="absolute inset-0 p-5 pt-5 whitespace-pre overflow-hidden z-10">
                    {INITIAL_TEMPLATE.map((_, i) => {
                      const isActive = activeLine === i;
                      const suffix = BLANK_LINE_SUFFIX[i];
                      const selected = selectedCommands[i];

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
                            className={`relative z-10 whitespace-pre text-slate-900 font-bold ${isRunning && activeLine > i ? "opacity-30" : ""}`}
                          >
                            {suffix ? (
                              <>
                                <button
                                  type="button"
                                  disabled={isRunning}
                                  onClick={() => {
                                    setOpenSelectorLine(i);
                                    setActiveLine(i);
                                  }}
                                  className={`rounded px-1.5 py-0.5 transition-all ${selected ? "text-slate-900 hover:bg-emerald-50" : "text-slate-300 italic hover:bg-slate-100"} ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                  {selected ??
                                    BLANK_LINE_GHOST_COMMAND[i] ??
                                    "_____"}
                                </button>{" "}
                                <span className="text-slate-900 font-bold">
                                  {suffix}
                                </span>
                              </>
                            ) : (
                              getLineText(i)
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {openSelectorLine !== null && !isRunning && (
                    <div className="absolute left-5 right-5 bottom-4 z-30 bg-card border border-emerald-200 rounded-xl px-3 py-2 shadow-lg">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">
                        PILIH PERINTAH BARIS {openSelectorLine + 1}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "input")
                          }
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wide rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          INPUT
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "proses")
                          }
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wide rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        >
                          PROCESS
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCommand(openSelectorLine, "output")
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

            {/* PANEL KANAN - HARDWARE VISUALIZATION */}
            <aside className="w-[380px] bg-[#020617] rounded-3xl flex flex-col shrink-0 overflow-hidden shadow-2xl border border-slate-800 relative">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center px-6">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                    <Activity size={14} />
                  </div>
                  <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Hardware Visualization
                  </h2>
                </div>
                <div
                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-colors ${isRunning ? "bg-emerald-600 text-white" : "bg-background/20 text-muted-foreground border border-border/60"}`}
                >
                  {isRunning ? "Active" : "Idle"}
                </div>
              </div>

              <div className="h-[420px] p-6 flex flex-col items-center justify-center relative overflow-hidden bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)]">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-center justify-center">
                  <Utensils size={360} className="text-white rotate-12" />
                </div>

                <div className="relative w-full max-w-sm aspect-square flex flex-col items-center justify-center scale-95">
                  {/* Cashier Table */}
                  <div className="absolute bottom-10 w-full h-28 bg-slate-800 rounded-t-[40px] border-x-4 border-t-4 border-slate-700 shadow-2xl z-0" />

                  {/* Moving Tray */}
                  <motion.div
                    animate={{
                      scale: activeLine >= 1 && activeLine <= 2 ? 1.05 : 1,
                      y: activeLine >= 1 && activeLine <= 2 ? -5 : 0,
                    }}
                    className="absolute bottom-28 w-56 h-6 bg-slate-700 rounded-full flex items-center justify-center border-b-4 border-slate-900 shadow-xl z-10"
                  />

                  {/* Interactive Food/Drink Icons */}
                  <div className="absolute bottom-32 flex gap-10 z-20">
                    <AnimatePresence>
                      {simState.food && (
                        <motion.div
                          key="food"
                          initial={{
                            opacity: 0,
                            y: -150,
                            scale: 0.5,
                            rotate: -20,
                          }}
                          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                          className="filter drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]"
                        >
                          <span className="text-7xl">
                            {simState.food.emoji}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {simState.drink && (
                        <motion.div
                          key="drink"
                          initial={{
                            opacity: 0,
                            y: -150,
                            scale: 0.5,
                            rotate: 20,
                          }}
                          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                          className="filter drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]"
                        >
                          <span className="text-7xl">
                            {simState.drink.emoji}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* POS / Receipt Machine */}
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
                          className="absolute top-2 left-2 right-2 bg-white rounded-sm shadow-xl p-2 flex flex-col gap-1 overflow-hidden z-40 border-t-2 border-dashed border-slate-200"
                        >
                          <div className="text-[5px] text-emerald-800 font-black border-b border-slate-100 pb-0.5 mb-1 uppercase text-center tracking-tighter">
                            Receipt #001
                          </div>
                          <div className="flex justify-between text-[4px] text-muted-foreground font-bold uppercase tracking-tighter">
                            <span>Items</span>
                            <span>Price</span>
                          </div>
                          {simState.food && (
                            <div className="flex justify-between text-[4px] text-slate-800 font-bold">
                              <span>Food</span>
                              <span>
                                {Math.round(simState.food.price / 1000)}k
                              </span>
                            </div>
                          )}
                          {simState.drink && (
                            <div className="flex justify-between text-[4px] text-slate-800 font-bold">
                              <span>Drink</span>
                              <span>
                                {Math.round(simState.drink.price / 1000)}k
                              </span>
                            </div>
                          )}
                          <div className="mt-auto pt-1 border-t border-dashed border-slate-300 flex justify-between text-[6px] text-black font-black uppercase">
                            <span>Total</span>
                            <span>
                              {Math.round(simState.totalPrice / 1000)}k
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Display Results */}
                  {simState.totalPrice > 0 && !simState.isCalculating && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute bottom-12 bg-white border-2 border-emerald-500 px-6 py-2 rounded-2xl text-emerald-600 font-mono text-lg font-black shadow-lg shadow-emerald-500/20 z-40"
                    >
                      Rp {simState.totalPrice.toLocaleString("id-ID")}
                    </motion.div>
                  )}

                  {/* Status Bubble */}
                  <AnimatePresence>
                    {simState.isCalculating && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-10 bg-emerald-600 text-white px-4 py-2 rounded-full text-[9px] font-black flex items-center gap-2 shadow-xl border border-emerald-500 uppercase"
                      >
                        <Calculator size={12} className="animate-spin" />{" "}
                        Calculating...
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* LOG BAR */}
              <div className="p-4 bg-black/40 border-t border-slate-800 flex items-center gap-4 shrink-0 px-6">
                <div className="flex items-center gap-2 shrink-0">
                  <CheckCircle2
                    size={12}
                    className={
                      simState.receiptPrinted
                        ? "text-emerald-500"
                        : "text-muted-foreground"
                    }
                  />
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    Logic Log:
                  </span>
                </div>
                <div className="text-[10px] font-mono text-emerald-400 truncate font-bold uppercase tracking-tight">
                  {simState.status}
                </div>
                {isRunning && (
                  <div className="w-1 h-3 bg-emerald-500 animate-pulse ml-auto" />
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="px-8 py-3 bg-background border-t border-border flex items-center justify-between shrink-0 text-[10px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="font-black uppercase tracking-widest">
            STATUS SISTEM
          </span>
          <span className="w-px h-3 bg-border"></span>
          <span className="font-medium italic">
            Workspace siap menerima algoritma
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground font-medium">
            BAHASA: PSEUDOCODE INDONESIA
          </span>
          <span className="w-px h-3 bg-border"></span>
          <span className="font-black text-emerald-600 uppercase tracking-wide italic">
            CODIN • INTERACTIVE ALGORITHM LEARNING
          </span>
        </div>
      </footer>
    </div>
  );
}
