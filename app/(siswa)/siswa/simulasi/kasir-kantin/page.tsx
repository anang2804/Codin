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
  Calculator,
  Printer,
  Monitor,
  Braces,
  Utensils,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ================== KONSTANTA DAN SOLUSI ==================

const EXPECTED_SOLUTION = [
  "let daftarBelanja = [",
  '  { nama: "Nasi Goreng", harga: 15000, jumlah: 2 },',
  '  { nama: "Es Teh", harga: 5000, jumlah: 1 }',
  "]; // tipe data: Array",
  "let totalHarga = 35000; // tipe data: Number",
  "let bayar = 50000; // tipe data: Number",
  "let kembalian = 15000; // tipe data: Number",
] as const;

const INITIAL_TEMPLATE = [
  "let daftarBelanja = [",
  '  { nama: "Nasi Goreng", harga: 15000, jumlah: 2 },',
  '  { nama: "Es Teh", harga: 5000, jumlah: 1 }',
  "]; // tipe data: _____",
  "let totalHarga = 35000; // tipe data: _____",
  "let bayar = 50000; // tipe data: _____",
  "let kembalian = 15000; // tipe data: _____",
] as const;

const CHOICE_PLACEHOLDER = "_____";

type CommandChoice = "Boolean" | "Number" | "String" | "Array" | "Object";

const COMMAND_DETAILS = {
  BOOLEAN: {
    title: "BOOLEAN",
    desc: "Digunakan untuk menyimpan nilai logika, yaitu benar (true) atau salah (false).",
    icon: <Flag className="text-violet-600" size={20} />,
    color: "bg-violet-50 border-violet-100",
  },
  NUMBER: {
    title: "NUMBER",
    desc: "Digunakan untuk menyimpan data berupa angka, baik bilangan bulat maupun desimal.",
    icon: <Calculator className="text-amber-600" size={20} />,
    color: "bg-amber-50 border-amber-100",
  },
  STRING: {
    title: "STRING",
    desc: "Digunakan untuk menyimpan data berupa teks atau kumpulan karakter.",
    icon: <Printer className="text-yellow-600" size={20} />,
    color: "bg-yellow-50 border-yellow-100",
  },
  ARRAY: {
    title: "ARRAY",
    desc: "Digunakan untuk menyimpan kumpulan data dalam satu variabel.",
    icon: <Braces className="text-sky-600" size={20} />,
    color: "bg-sky-50 border-sky-100",
  },
  OBJECT: {
    title: "OBJECT",
    desc: "Digunakan untuk menyimpan data yang memiliki beberapa atribut (pasangan nama dan nilai).",
    icon: <Database className="text-rose-600" size={20} />,
    color: "bg-rose-50 border-rose-100",
  },
  DEFAULT: {
    title: "SIAP MENULIS",
    desc: "Klik bagian kosong (_____) lalu pilih Boolean, Number, String, Array, atau Object. Teks abu-abu adalah ghost text panduan.",
    icon: <Monitor className="text-muted-foreground" size={20} />,
    color: "bg-slate-50 border-slate-200",
  },
};

const TYPE_OPTIONS: Array<{
  type: CommandChoice;
  label: string;
  className: string;
}> = [
  {
    type: "Boolean",
    label: "BOOLEAN",
    className:
      "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100",
  },
  {
    type: "Number",
    label: "NUMBER",
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
  {
    type: "String",
    label: "STRING",
    className: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
  },
  {
    type: "Array",
    label: "ARRAY",
    className: "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100",
  },
  {
    type: "Object",
    label: "OBJECT",
    className: "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100",
  },
];

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
  paidAmount: number;
  changeAmount: number;
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
  const [showSuccessCard, setShowSuccessCard] = useState(false);
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
    paidAmount: 0,
    changeAmount: 0,
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

    const selectedOnActiveLine = selectedCommands[activeLine];
    if (selectedOnActiveLine === "Boolean") return COMMAND_DETAILS.BOOLEAN;
    if (selectedOnActiveLine === "Number") return COMMAND_DETAILS.NUMBER;
    if (selectedOnActiveLine === "String") return COMMAND_DETAILS.STRING;
    if (selectedOnActiveLine === "Array") return COMMAND_DETAILS.ARRAY;
    if (selectedOnActiveLine === "Object") return COMMAND_DETAILS.OBJECT;

    return COMMAND_DETAILS.DEFAULT;
  })();

  const latestLog =
    logicLog[logicLog.length - 1] ?? "Sistem siap menjalankan algoritma.";
  const isErrorNote = latestLog.startsWith("ERROR:");
  const noteMessage = isErrorNote
    ? latestLog.replace(/^ERROR:\s*/, "")
    : latestLog;
  const activeLineNote = (() => {
    if (activeLine === 3) {
      return `Variabel daftarBelanja berisi kumpulan beberapa data barang, maka bertipe data _____`;
    }

    if (activeLine === 4) {
      return `Variabel totalHarga memiliki nilai 35000 yang digunakan untuk perhitungan, maka bertipe data _____`;
    }

    if (activeLine === 5) {
      return `Variabel bayar memiliki nilai 50000 sebagai jumlah uang pembayaran, maka bertipe data _____`;
    }

    if (activeLine === 6) {
      return `Variabel kembalian memiliki nilai 15000 sebagai hasil pengurangan dari pembayaran, maka bertipe data _____`;
    }

    return null;
  })();
  const showWrongTypeVisual = errorLine !== -1;
  const showTotalBubbleVisual = errorLine === 4;
  const showReceiptErrorVisual = errorLine === 5 || errorLine === 6;

  const getLineText = (lineIndex: number): string => {
    const template = INITIAL_TEMPLATE[lineIndex] || "";
    const command = selectedCommands[lineIndex] ?? CHOICE_PLACEHOLDER;
    return template.replace(CHOICE_PLACEHOLDER, command);
  };

  const handleSelectCommand = (lineIndex: number, command: CommandChoice) => {
    if (isRunning) return;
    setSelectedCommands((prev) => ({ ...prev, [lineIndex]: command }));
    setOpenSelectorLine(null);
    setActiveLine(lineIndex);
  };

  useEffect(() => {
    const newCode = INITIAL_TEMPLATE.map((_, i) => getLineText(i)).join("\n");
    setCode(newCode);
  }, [selectedCommands]);

  const renderCodeLine = (
    lineIndex: number,
    selected: CommandChoice | "_____",
  ) => {
    const isEmptyChoice = selected === CHOICE_PLACEHOLDER;
    const choiceClassName = isEmptyChoice
      ? "text-slate-400"
      : selected === "Array"
        ? "inline-flex items-center rounded-md border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] leading-none font-semibold text-violet-700"
        : "inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] leading-none font-semibold text-amber-700";

    const choiceButton = (
      <button
        type="button"
        disabled={isRunning}
        onClick={() => {
          setOpenSelectorLine(lineIndex);
          setActiveLine(lineIndex);
        }}
        className={`transition-all ${choiceClassName} ${isRunning ? "cursor-not-allowed opacity-80" : isEmptyChoice ? "cursor-pointer hover:text-slate-500" : "cursor-pointer hover:border-sky-400 hover:bg-sky-100"}`}
      >
        {selected}
      </button>
    );

    if (lineIndex === 0) {
      return (
        <>
          <span className="text-violet-600">let</span>{" "}
          <span className="text-blue-700">daftarBelanja</span>
          <span className="text-slate-700"> = </span>
          <span className="text-slate-700">[</span>
        </>
      );
    }

    if (lineIndex === 1) {
      return (
        <>
          <span className="text-slate-700"> </span>
          <span className="text-slate-700">{`{`}</span>{" "}
          <span className="text-blue-700">nama</span>
          <span className="text-slate-700">: </span>
          <span className="text-emerald-700">"Nasi Goreng"</span>
          <span className="text-slate-700">, </span>
          <span className="text-blue-700">harga</span>
          <span className="text-slate-700">: </span>
          <span className="text-orange-700">15000</span>
          <span className="text-slate-700">, </span>
          <span className="text-blue-700">jumlah</span>
          <span className="text-slate-700">: </span>
          <span className="text-orange-700">2</span>
          <span className="text-slate-700">{` },`}</span>
        </>
      );
    }

    if (lineIndex === 2) {
      return (
        <>
          <span className="text-slate-700"> </span>
          <span className="text-slate-700">{`{`}</span>{" "}
          <span className="text-blue-700">nama</span>
          <span className="text-slate-700">: </span>
          <span className="text-emerald-700">"Es Teh"</span>
          <span className="text-slate-700">, </span>
          <span className="text-blue-700">harga</span>
          <span className="text-slate-700">: </span>
          <span className="text-orange-700">5000</span>
          <span className="text-slate-700">, </span>
          <span className="text-blue-700">jumlah</span>
          <span className="text-slate-700">: </span>
          <span className="text-orange-700">1</span>
          <span className="text-slate-700">{` }`}</span>
        </>
      );
    }

    if (lineIndex === 3) {
      return (
        <>
          <span className="text-slate-700">]</span>
          <span className="text-slate-700">;</span>{" "}
          <span className="text-slate-400">// tipe data: </span>
          {choiceButton}
        </>
      );
    }

    if (lineIndex === 4) {
      return (
        <>
          <span className="text-violet-600">let</span>{" "}
          <span className="text-blue-700">totalHarga</span>
          <span className="text-slate-700"> = </span>
          <span className="text-orange-700">35000</span>
          <span className="text-slate-700">;</span>{" "}
          <span className="text-slate-400">// tipe data: </span>
          {choiceButton}
        </>
      );
    }

    if (lineIndex === 5) {
      return (
        <>
          <span className="text-violet-600">let</span>{" "}
          <span className="text-blue-700">bayar</span>
          <span className="text-slate-700"> = </span>
          <span className="text-orange-700">50000</span>
          <span className="text-slate-700">;</span>{" "}
          <span className="text-slate-400">// tipe data: </span>
          {choiceButton}
        </>
      );
    }

    return (
      <>
        <span className="text-violet-600">let</span>{" "}
        <span className="text-blue-700">kembalian</span>
        <span className="text-slate-700"> = </span>
        <span className="text-orange-700">15000</span>
        <span className="text-slate-700">;</span>{" "}
        <span className="text-slate-400">// tipe data: </span>
        {choiceButton}
      </>
    );
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
    setShowSuccessCard(false);
    setIsRunning(false);
    setHasTried(false);
    setLogicLog(["Sistem siap menjalankan algoritma."]);
    setSimState({
      food: null,
      drink: null,
      isCalculating: false,
      receiptPrinted: false,
      totalPrice: 0,
      paidAmount: 0,
      changeAmount: 0,
      status: "Sistem Standby",
    });
    simDataRef.current = {
      food: null,
      drink: null,
      isCalculating: false,
      receiptPrinted: false,
      totalPrice: 0,
      paidAmount: 0,
      changeAmount: 0,
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
      return `Baris ${lineIndex + 1} belum diisi.\n\nBagian ini masih kosong dan perlu dilengkapi.\n\nPetunjuk: Perhatikan tujuan dari baris tersebut, kemudian pilih jawaban yang sesuai.`;
    }

    if (lineIndex === 3) {
      if (!normalized.includes("array")) {
        return `Baris ${lineIndex + 1} belum tepat.\n\nBagian yang dipilih belum sesuai dengan fungsi pada baris ini.\n\nPetunjuk: Perhatikan tujuan dari baris tersebut, kemudian sesuaikan dengan jenis data atau proses yang dilakukan.`;
      }
    }

    if (lineIndex === 4 || lineIndex === 5 || lineIndex === 6) {
      if (!normalized.includes("number")) {
        return `Baris ${lineIndex + 1} belum tepat.\n\nBagian yang dipilih belum sesuai dengan fungsi pada baris ini.\n\nPetunjuk: Perhatikan tujuan dari baris tersebut, kemudian sesuaikan dengan jenis data atau proses yang dilakukan.`;
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
      setShowSuccessCard(false);
      const isTotalLineError = step === 4;
      const isReceiptLineError = step === 5 || step === 6;
      updateSimData({
        food: simDataRef.current.food ?? {
          name: "Nasi Goreng",
          price: 15000,
          emoji: "🍛",
        },
        drink: simDataRef.current.drink ?? {
          name: "Es Teh",
          price: 5000,
          emoji: "🍹",
        },
        isCalculating: false,
        receiptPrinted: isReceiptLineError,
        totalPrice: isTotalLineError || isReceiptLineError ? 35000 : 0,
        paidAmount: isReceiptLineError ? 50000 : 0,
        changeAmount: step === 6 ? 15000 : 0,
        status: "Data tumpah: tipe data tidak cocok",
      });
      const feedback = generateEducationalFeedback(step, userLine);
      addLog(`ERROR: ${feedback}`);
      setActiveLine(-1);
      return false;
    }

    // Eksekusi berdasarkan baris
    switch (step) {
      case 0:
        updateSimData({ status: "Membuka daftar belanja" });
        addLog("DATA: Membuka daftarBelanja...");
        break;

      case 1:
        updateSimData({
          food: { name: "Nasi Goreng", price: 15000, emoji: "🍛" },
          status: "Item 1 ditambahkan",
        });
        addLog('DATA: Item pertama = "Nasi Goreng" (2 porsi)');
        break;

      case 2:
        updateSimData({
          drink: { name: "Es Teh", price: 5000, emoji: "🍹" },
          status: "Item 2 ditambahkan",
        });
        addLog('DATA: Item kedua = "Es Teh" (1 gelas)');
        break;

      case 3:
        updateSimData({ status: "Array dikenali" });
        addLog("TIPE DATA: daftarBelanja = Array");
        break;

      case 4:
        updateSimData({ isCalculating: true, status: "Menghitung total" });
        addLog("PROSES: Menghitung totalHarga...");
        await new Promise((resolve) => setTimeout(resolve, 700));
        updateSimData({
          isCalculating: false,
          totalPrice: 35000,
          status: "Total harga siap",
        });
        addLog("TIPE DATA: totalHarga = Number");
        addLog("HASIL: totalHarga = 35000");
        break;

      case 5:
        updateSimData({
          receiptPrinted: true,
          paidAmount: 50000,
          status: "Pembayaran siap",
        });
        addLog("TIPE DATA: bayar = Number");
        addLog("DATA: bayar = 50000");
        break;

      case 6:
        updateSimData({ changeAmount: 15000, status: "Kembalian siap" });
        addLog("TIPE DATA: kembalian = Number");
        addLog("HASIL: kembalian = 15000");
        break;
    }

    return true;
  };

  const startRunning = async () => {
    const lines = code.split("\n");

    setIsRunning(true);
    setShowSuccessCard(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setLogicLog([]);
    simDataRef.current = {
      food: null,
      drink: null,
      isCalculating: false,
      receiptPrinted: false,
      totalPrice: 0,
      paidAmount: 0,
      changeAmount: 0,
      status: "Menjalankan...",
    };
    setSimState({
      food: null,
      drink: null,
      isCalculating: false,
      receiptPrinted: false,
      totalPrice: 0,
      paidAmount: 0,
      changeAmount: 0,
      status: "Menjalankan...",
    });

    addLog("Sistem: Memulai eksekusi algoritma...");

    for (let i = 0; i < lines.length; i++) {
      const success = await executeStep(i);
      if (!success) {
        setShowSuccessCard(false);
        setIsRunning(false);
        return;
      }
    }

    setIsRunning(false);
    setActiveLine(-1);
    updateSimData({ status: "Selesai" });
    addLog("Sukses: Algoritma berhasil dijalankan.");
    setShowSuccessCard(true);
  };

  // ================== RENDER UI ==================

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* HEADER */}
      <header className="z-40 flex shrink-0 items-center justify-between border-b border-emerald-100/80 bg-white/90 px-6 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/siswa/simulasi")}
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
              Mesin Kasir Kantin
            </h1>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Dasar
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetSim}
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

      <main className="flex-1 flex overflow-hidden">
        {/* PANEL KIRI - DESKRIPSI */}
        <aside className="w-72 bg-white border-r border-emerald-100 p-5 flex flex-col gap-6 shrink-0 z-20 overflow-y-auto">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-600/70" />
            <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.12em] text-wrap">
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
            className={`p-4 rounded-3xl border transition-all duration-300 ${
              isErrorNote
                ? "bg-rose-50/95 border-rose-200"
                : "bg-[#c8dde6] border-[#60d8bb]"
            }`}
          >
            <div
              className={`flex items-center gap-2 pb-2 border-b ${
                isErrorNote ? "border-rose-200" : "border-[#60d8bb]"
              }`}
            >
              {isErrorNote ? (
                <AlertTriangle size={13} className="text-rose-500" />
              ) : (
                <CheckCircle2 size={13} className="text-[#0b6e5d]" />
              )}
              <span
                className={`text-[10px] font-black uppercase tracking-[0.12em] ${
                  isErrorNote ? "text-rose-600" : "text-[#0b6e5d]"
                }`}
              >
                CATATAN PROSES
              </span>
            </div>

            <div
              className={`mt-3 whitespace-pre-line rounded-2xl px-3 py-2 text-[11px] leading-snug ${
                isErrorNote
                  ? "text-rose-700 bg-rose-100/60"
                  : "text-[#125f52] bg-[#d4e5e1]"
              }`}
            >
              {isErrorNote ? noteMessage : (activeLineNote ?? noteMessage)}
            </div>
          </div>

          <div className="mt-auto p-4 bg-emerald-100/40 border border-emerald-200 rounded-3xl">
            <div className="flex items-center justify-between text-[10px] font-black text-emerald-700 uppercase mb-2 tracking-[0.08em]">
              <span>Status Fokus</span>
              <Activity size={10} />
            </div>
            <p className="text-[11px] font-bold text-slate-600 italic leading-tight">
              {activeLine !== -1
                ? `Sedang fokus di baris ${activeLine + 1}`
                : "Editor siap digunakan"}
            </p>
          </div>
        </aside>

        {/* WORKSPACE - EDITOR */}
        <div className="relative flex-1 flex flex-col min-w-0 bg-background">
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

            <AnimatePresence>
              {showSuccessCard && (
                <motion.section
                  key="success-card"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="absolute left-6 right-6 top-[84px] z-20 px-0 pb-0"
                >
                  <div className="bg-card border border-emerald-200 rounded-2xl px-4 py-3 shadow-sm">
                    <h3 className="text-sm font-black text-emerald-700 tracking-tight">
                      🎉 Berhasil! Algoritma benar
                    </h3>
                    <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed font-medium">
                      Tipe data dan struktur variabel sudah sesuai.
                      <br />
                      Simulasi kasir kantin berjalan dengan benar.
                    </p>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </section>

          <div className="relative flex-1 flex gap-5 px-6 pb-6 overflow-hidden">
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

              <div className="relative flex-1 flex font-mono text-[11px] leading-[22px] overflow-hidden">
                <div
                  id="line-gutter"
                  className="w-12 bg-muted/30 text-muted-foreground/70 text-right pr-4 pt-5 select-none border-r border-border/60 overflow-hidden shrink-0"
                >
                  {Array.from({ length: totalDisplayLines }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-[22px] transition-all ${activeLine === i ? "text-emerald-600 font-black scale-110 pr-1" : ""}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="relative flex-1 bg-card overflow-hidden">
                  <div className="absolute inset-0 p-5 pt-5 whitespace-pre overflow-hidden z-10">
                    {INITIAL_TEMPLATE.map((_, i) => {
                      const isActive = activeLine === i;
                      const selected =
                        selectedCommands[i] ?? CHOICE_PLACEHOLDER;

                      return (
                        <div
                          key={i}
                          className="relative h-[22px] flex items-center"
                        >
                          {isActive && (
                            <motion.div
                              layoutId="lineHighlight"
                              className={`absolute inset-0 -mx-5 border-l-4 z-0 ${isRunning ? "bg-emerald-50 border-emerald-500" : errorLine === i ? "bg-red-50 border-red-500" : "bg-emerald-50/30 border-emerald-200"}`}
                            />
                          )}

                          <div
                            className={`relative z-10 whitespace-pre font-bold ${isRunning && activeLine > i ? "opacity-30" : ""}`}
                          >
                            {renderCodeLine(i, selected)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {openSelectorLine !== null && !isRunning && (
                    <div className="absolute left-5 right-5 bottom-4 z-30 bg-card border border-emerald-200 rounded-2xl px-3 py-3 shadow-lg">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">
                        PILIH PERINTAH BARIS {openSelectorLine + 1}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {TYPE_OPTIONS.map((option) => (
                          <button
                            key={option.type}
                            type="button"
                            onClick={() =>
                              handleSelectCommand(openSelectorLine, option.type)
                            }
                            className={`min-w-[92px] px-3 py-2 text-[10px] font-black uppercase tracking-wide rounded-xl border transition-all ${option.className}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* PANEL KANAN - HARDWARE VISUALIZATION */}
            <aside
              className={`w-[380px] rounded-3xl flex flex-col shrink-0 overflow-hidden shadow-2xl border relative ${
                showWrongTypeVisual
                  ? "bg-[#1f0a10] border-rose-900"
                  : "bg-[#020617] border-slate-800"
              }`}
            >
              <div
                className={`p-4 border-b flex justify-between items-center px-6 ${
                  showWrongTypeVisual
                    ? "border-rose-900 bg-rose-950/40"
                    : "border-slate-800 bg-slate-900/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg border ${
                      showWrongTypeVisual
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    <Activity size={14} />
                  </div>
                  <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Hardware Visualization
                  </h2>
                </div>
                <div
                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-colors ${
                    showWrongTypeVisual
                      ? "bg-rose-600 text-white"
                      : isRunning
                        ? "bg-emerald-600 text-white"
                        : "bg-background/20 text-muted-foreground border border-border/60"
                  }`}
                >
                  {showWrongTypeVisual
                    ? "Type Error"
                    : isRunning
                      ? "Active"
                      : "Idle"}
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
                      y: showWrongTypeVisual
                        ? 10
                        : activeLine >= 1 && activeLine <= 2
                          ? -5
                          : 0,
                    }}
                    className="absolute bottom-28 w-56 h-6 bg-slate-700 rounded-full flex items-center justify-center border-b-4 border-slate-900 shadow-xl z-10"
                  />

                  {showWrongTypeVisual && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 0.85, scale: 1 }}
                        className="absolute bottom-[86px] left-[86px] h-5 w-24 rounded-full bg-amber-700/45 blur-[1px] z-10"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 0.85, scale: 1 }}
                        className="absolute bottom-[84px] right-[86px] h-5 w-24 rounded-full bg-sky-500/40 blur-[1px] z-10"
                      />
                    </>
                  )}

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
                          animate={
                            showWrongTypeVisual
                              ? {
                                  opacity: 1,
                                  y: 58,
                                  x: -24,
                                  scale: 0.95,
                                  rotate: -32,
                                }
                              : { opacity: 1, y: 0, scale: 1, rotate: 0 }
                          }
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
                          animate={
                            showWrongTypeVisual
                              ? {
                                  opacity: 1,
                                  y: 58,
                                  x: 24,
                                  scale: 0.95,
                                  rotate: 34,
                                }
                              : { opacity: 1, y: 0, scale: 1, rotate: 0 }
                          }
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
                      {(simState.receiptPrinted || showReceiptErrorVisual) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 100, opacity: 1 }}
                          className={`absolute top-2 left-2 right-2 rounded-sm shadow-xl p-2 flex flex-col gap-1 overflow-hidden z-40 border-t-2 border-dashed ${
                            showReceiptErrorVisual
                              ? "bg-rose-50 border-rose-200"
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <div
                            className={`text-[5px] font-black border-b pb-0.5 mb-1 uppercase text-center tracking-tighter ${showReceiptErrorVisual ? "text-rose-700 border-rose-100" : "text-emerald-800 border-slate-100"}`}
                          >
                            Receipt #001
                          </div>
                          <div
                            className={`flex justify-between text-[4px] font-bold uppercase tracking-tighter ${showReceiptErrorVisual ? "text-rose-600" : "text-muted-foreground"}`}
                          >
                            <span>Info</span>
                            <span>Nilai</span>
                          </div>
                          <div
                            className={`flex justify-between text-[4px] font-bold ${showReceiptErrorVisual ? "text-rose-800" : "text-slate-800"}`}
                          >
                            <span>Total</span>
                            <span>
                              {Math.round(simState.totalPrice / 1000)}k
                            </span>
                          </div>
                          {simState.paidAmount > 0 && (
                            <div
                              className={`flex justify-between text-[4px] font-bold ${showReceiptErrorVisual ? "text-rose-800" : "text-slate-800"}`}
                            >
                              <span>Bayar</span>
                              <span>
                                {Math.round(simState.paidAmount / 1000)}k
                              </span>
                            </div>
                          )}
                          <div
                            className={`mt-auto pt-1 border-t border-dashed flex justify-between text-[6px] font-black uppercase ${showReceiptErrorVisual ? "border-rose-200 text-rose-900" : "border-slate-300 text-black"}`}
                          >
                            <span>Kembali</span>
                            <span>
                              {simState.changeAmount > 0
                                ? `${Math.round(simState.changeAmount / 1000)}k`
                                : "-"}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Display Results */}
                  {(simState.totalPrice > 0 || showTotalBubbleVisual) &&
                    !simState.isCalculating && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`absolute bottom-12 px-6 py-2 rounded-2xl font-mono text-lg font-black shadow-lg z-40 ${
                          showTotalBubbleVisual
                            ? "bg-rose-50 border-2 border-rose-500 text-rose-600 shadow-rose-500/20"
                            : "bg-white border-2 border-emerald-500 text-emerald-600 shadow-emerald-500/20"
                        }`}
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
    </div>
  );
}
