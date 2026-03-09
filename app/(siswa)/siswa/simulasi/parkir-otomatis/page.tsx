"use client";

import React, { useState, useRef } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ================== KONSTANTA DAN SOLUSI ==================

const EXPECTED_SOLUTION = [
  "start",
  "input kendaraan",
  "input kapasitas",
  "if kapasitas > 0",
  "print parkir_tersedia",
  "else",
  "print parkir_penuh",
  "end",
];

const INITIAL_TEMPLATE = [
  "start",
  "______ kendaraan",
  "______ kapasitas",
  "______ kapasitas > 0",
  "______ parkir_tersedia",
  "else",
  "______ parkir_penuh",
  "end",
];

const COMMAND_GLOSSARY: Record<string, string> = {
  input:
    "INPUT biasanya digunakan untuk mengambil data dari perangkat luar (seperti sensor kendaraan atau database slot parkir) agar data tersebut bisa diproses oleh sistem.",
  print:
    "PRINT biasanya digunakan untuk menampilkan hasil, memberikan informasi, atau mengirimkan perintah aksi ke perangkat keluaran (seperti papan display dan sistem gerbang parkir).",
  if: "Struktur IF digunakan untuk memeriksa sebuah kondisi. Jika kondisi tersebut terpenuhi (benar), maka perintah di dalamnya akan dijalankan.",
  else: "Bagian ELSE adalah jalur alternatif. Bagian ini hanya akan dijalankan jika kondisi pada bagian IF ternyata tidak terpenuhi (salah).",
  start: "START menandakan titik awal di mana alur algoritma mulai bekerja.",
  end: "END digunakan untuk menutup sebuah blok keputusan atau menandai selesainya seluruh instruksi dalam program.",
};

const COMMAND_DETAILS = {
  START: {
    title: "START / END",
    desc: "Menandai awal dan akhir dari sebuah alur program parkir otomatis.",
    icon: <Flag className="text-emerald-500" size={20} />,
    color: "bg-emerald-50 border-emerald-100",
  },
  LOGIC: {
    title: "INPUT & PRINT",
    desc: "Gunakan INPUT untuk membaca data sensor kendaraan dan kapasitas. PRINT untuk menampilkan status parkir.",
    icon: <Database className="text-blue-500" size={20} />,
    color: "bg-blue-50 border-blue-100",
  },
  BRANCH: {
    title: "IF / ELSE",
    desc: "Logika keputusan untuk menentukan apakah kendaraan dapat masuk berdasarkan kapasitas parkir.",
    icon: <Split className="text-amber-500" size={20} />,
    color: "bg-amber-100 border-amber-200",
  },
  DEFAULT: {
    title: "READY TO TYPE",
    desc: "Lengkapi bagian ______ pada editor untuk menyelesaikan misi parkir otomatis.",
    icon: <Edit3 className="text-slate-400" size={20} />,
    color: "bg-slate-50 border-slate-200",
  },
};

// ================== TIPE DATA ==================

type SimulationState = {
  kendaraan: string;
  kapasitas: number | null;
  gerbangTerbuka: boolean;
  mobilMasuk: boolean;
  statusParkir: "idle" | "tersedia" | "penuh";
  feedback: string;
};

// ================== KOMPONEN UTAMA ==================

const CAR_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f43f5e",
  "#a78bfa",
];

function genOccupied(): boolean[] {
  // slot 0 (A1) always free - reserved for new car; others random
  return Array.from({ length: 10 }, (_, i) => i > 0 && Math.random() > 0.45);
}

export default function SimulasiParkirOtomatis() {
  const [code, setCode] = useState("");
  const [preOccupied, setPreOccupied] = useState<boolean[]>(() =>
    genOccupied(),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [activeLine, setActiveLine] = useState<number>(-1);
  const [errorLine, setErrorLine] = useState<number>(-1);
  const [hasTried, setHasTried] = useState(false);

  const [simState, setSimState] = useState<SimulationState>({
    kendaraan: "",
    kapasitas: null,
    gerbangTerbuka: false,
    mobilMasuk: false,
    statusParkir: "idle",
    feedback: "Workspace siap menerima algoritma",
  });

  const displayRef = useRef<HTMLDivElement>(null);
  const simDataRef = useRef<SimulationState>(simState);
  const preOccupiedRef = useRef<boolean[]>(preOccupied);

  const applyPreOccupied = (occ: boolean[]) => {
    preOccupiedRef.current = occ;
    setPreOccupied(occ);
  };

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
    if (line.includes("if") || line.includes("else"))
      return COMMAND_DETAILS.BRANCH;
    return COMMAND_DETAILS.DEFAULT;
  })();

  // ================== FUNGSI HELPER ==================

  const normalizeCode = (line: string): string => {
    return line.trim().toLowerCase().replace(/\s+/g, " ");
  };

  const markAsTried = () => {
    setHasTried(true);
  };

  const emptySimState: SimulationState = {
    kendaraan: "",
    kapasitas: null,
    gerbangTerbuka: false,
    mobilMasuk: false,
    statusParkir: "idle",
    feedback: "Workspace siap menerima algoritma",
  };

  const resetSim = () => {
    setCode("");
    const newOcc = genOccupied();
    applyPreOccupied(newOcc);
    setActiveLine(-1);
    setErrorLine(-1);
    setIsRunning(false);
    setHasTried(false);
    setSimState(emptySimState);
    simDataRef.current = emptySimState;
  };

  const updateSimData = (updates: Partial<SimulationState>) => {
    simDataRef.current = { ...simDataRef.current, ...updates };
    setSimState((prev) => ({ ...prev, ...updates }));
  };

  const generateEducationalFeedback = (
    lineIndex: number,
    userLine: string,
  ): string => {
    const trimmed = userLine.trim().toLowerCase();
    const firstWord = trimmed.split(" ")[0];

    // ── Baris kosong / belum diisi ──
    if (trimmed === "" || trimmed.includes("_")) {
      const hints: Record<number, string> = {
        1: "Petunjuk: Gunakan perintah INPUT untuk membaca data dari sensor kendaraan.\n\nContoh: input kendaraan",
        2: "Petunjuk: Gunakan perintah INPUT untuk membaca jumlah slot parkir dari database.\n\nContoh: input kapasitas",
        3: "Petunjuk: Gunakan perintah IF untuk memeriksa apakah masih ada slot parkir tersedia.\n\nContoh: if kapasitas > 0",
        4: "Petunjuk: Gunakan perintah PRINT untuk menampilkan status bahwa parkir masih tersedia.\n\nContoh: print parkir_tersedia",
        5: "Petunjuk: Tulis kata kunci ELSE sebagai jalur alternatif jika parkir sudah penuh.\n\nContoh: else",
        6: "Petunjuk: Gunakan perintah PRINT untuk menampilkan status bahwa parkir sudah penuh.\n\nContoh: print parkir_penuh",
      };
      return (
        `Hmm... baris ini sepertinya masih kosong atau belum selesai diisi 👀\n\n` +
        (hints[lineIndex] ??
          "Coba perhatikan template yang tersedia di editor.")
      );
    }

    // ── Deteksi per baris ──

    // Baris 1: input kendaraan
    if (lineIndex === 1) {
      if (firstWord !== "input") {
        if (COMMAND_GLOSSARY[firstWord]) {
          return (
            `Hmm... perintah "${firstWord.toUpperCase()}" bukan yang tepat untuk baris ini 🤔\n\n` +
            `${COMMAND_GLOSSARY[firstWord]}\n\n` +
            `Di sini kita perlu membaca data dari sensor kendaraan.\n` +
            `Gunakan perintah INPUT, bukan ${firstWord.toUpperCase()}.`
          );
        }
        return (
          `Hmm... perintah "${firstWord}" tidak dikenali oleh sistem 🤔\n\n` +
          `Di baris ini, sistem perlu mengambil data dari sensor kendaraan.\n\n` +
          `Petunjuk: Gunakan perintah INPUT diikuti nama variabelnya.\n` +
          `Contoh: input kendaraan`
        );
      }
      // Perintah sudah "input", cek variabelnya
      if (!trimmed.includes("kendaraan")) {
        const parts = trimmed.split(" ").slice(1).join(" ");
        return (
          `Hmm... sepertinya ada yang kurang tepat di baris ini 🤔\n\n` +
          `Perintah INPUT sudah benar, tetapi nama variabel${parts ? ` "${parts}"` : ""} tidak dikenali.\n\n` +
          `Sistem sedang mencoba membaca data dari sensor kendaraan.\n` +
          `Pastikan nama variabelnya ditulis: kendaraan`
        );
      }
    }

    // Baris 2: input kapasitas
    if (lineIndex === 2) {
      if (firstWord !== "input") {
        if (COMMAND_GLOSSARY[firstWord]) {
          return (
            `Hmm... perintah "${firstWord.toUpperCase()}" bukan yang tepat untuk baris ini 🤔\n\n` +
            `${COMMAND_GLOSSARY[firstWord]}\n\n` +
            `Di sini kita perlu membaca jumlah slot parkir yang tersedia.\n` +
            `Gunakan perintah INPUT, bukan ${firstWord.toUpperCase()}.`
          );
        }
        return (
          `Hmm... perintah "${firstWord}" tidak dikenali oleh sistem 🤔\n\n` +
          `Di baris ini, sistem perlu membaca data kapasitas parkir.\n\n` +
          `Petunjuk: Gunakan perintah INPUT diikuti nama variabelnya.\n` +
          `Contoh: input kapasitas`
        );
      }
      if (!trimmed.includes("kapasitas")) {
        const parts = trimmed.split(" ").slice(1).join(" ");
        return (
          `Hmm... sepertinya ada yang kurang tepat di baris ini 🤔\n\n` +
          `Perintah INPUT sudah benar, tetapi nama variabel${parts ? ` "${parts}"` : ""} tidak dikenali.\n\n` +
          `Sistem sedang mencoba membaca jumlah slot parkir dari database.\n` +
          `Pastikan nama variabelnya ditulis: kapasitas`
        );
      }
    }

    // Baris 3: if kapasitas > 0
    if (lineIndex === 3) {
      if (firstWord !== "if") {
        if (COMMAND_GLOSSARY[firstWord]) {
          return (
            `Hmm... perintah "${firstWord.toUpperCase()}" bukan yang tepat untuk baris ini 🤔\n\n` +
            `${COMMAND_GLOSSARY[firstWord]}\n\n` +
            `Di sini kita perlu memeriksa kondisi kapasitas parkir.\n` +
            `Gunakan perintah IF untuk pengambilan keputusan.`
          );
        }
        return (
          `Hmm... perintah "${firstWord}" tidak dikenali oleh sistem 🤔\n\n` +
          `Di baris ini, sistem perlu memeriksa apakah masih ada slot parkir.\n\n` +
          `Petunjuk: Gunakan struktur IF untuk pengecekan kondisi.\n` +
          `Contoh: if kapasitas > 0`
        );
      }
      // Perintah IF sudah benar — cek isi kondisinya
      const afterIf = trimmed.replace(/^if\s*/, "");
      if (!afterIf.includes("kapasitas")) {
        const varUsed = afterIf.split(/[\s><=!]/)[0];
        return (
          `Hmm... sepertinya ada yang kurang tepat di baris ini 🤔\n\n` +
          `Perintah IF sudah benar, tetapi sistem sedang mencoba memeriksa\n` +
          `kondisi kapasitas parkir, dan nama variabel${varUsed ? ` "${varUsed}"` : ""} tidak dikenali.\n\n` +
          `Coba periksa kembali penulisan variabel tersebut.\n` +
          `Pastikan sama dengan variabel yang digunakan sebelumnya: kapasitas`
        );
      }
      if (!afterIf.includes(">")) {
        const op = afterIf.match(/[><=!]+/)?.[0];
        return (
          `Hmm... operator kondisi pada baris ini kurang tepat 🤔\n\n` +
          `Variabel "kapasitas" sudah benar, tetapi operator${op ? ` "${op}"` : ""} yang digunakan\n` +
          `tidak sesuai untuk memeriksa apakah slot parkir masih tersedia.\n\n` +
          `Petunjuk: Gunakan operator ">" untuk mengecek apakah kapasitas lebih dari 0.\n` +
          `Contoh: if kapasitas > 0`
        );
      }
      if (!afterIf.includes("0")) {
        return (
          `Hmm... kondisi pada baris ini belum lengkap 🤔\n\n` +
          `Variabel "kapasitas" dan operator ">" sudah benar,\n` +
          `tetapi nilai yang dibandingkan belum dituliskan.\n\n` +
          `Petunjuk: Bandingkan kapasitas dengan angka 0 untuk mengecek apakah ada slot yang tersisa.\n` +
          `Contoh: if kapasitas > 0`
        );
      }
    }

    // Baris 4: print parkir_tersedia
    if (lineIndex === 4) {
      if (firstWord !== "print") {
        if (COMMAND_GLOSSARY[firstWord]) {
          return (
            `Hmm... perintah "${firstWord.toUpperCase()}" bukan yang tepat untuk baris ini 🤔\n\n` +
            `${COMMAND_GLOSSARY[firstWord]}\n\n` +
            `Di sini kita perlu menampilkan status bahwa parkir masih tersedia.\n` +
            `Gunakan perintah PRINT.`
          );
        }
        return (
          `Hmm... perintah "${firstWord}" tidak dikenali oleh sistem 🤔\n\n` +
          `Di baris ini, sistem perlu menampilkan status parkir ke papan display.\n\n` +
          `Petunjuk: Gunakan perintah PRINT untuk menampilkan output.\n` +
          `Contoh: print parkir_tersedia`
        );
      }
      const afterPrint = trimmed.replace(/^print\s*/, "");
      if (afterPrint !== "parkir_tersedia") {
        return (
          `Hmm... perintah PRINT sudah benar, tetapi nilai output tidak sesuai 🤔\n\n` +
          `Sistem sedang berada di blok IF (kapasitas > 0),\n` +
          `sehingga perlu menampilkan bahwa parkir masih tersedia.\n\n` +
          `Coba periksa kembali penulisan output-nya.\n` +
          `Yang diharapkan: parkir_tersedia${afterPrint ? `, bukan "${afterPrint}"` : ""}`
        );
      }
    }

    // Baris 5: else
    if (lineIndex === 5) {
      return (
        `Hmm... sepertinya ada yang kurang tepat di baris ini 🤔\n\n` +
        `Di sini dibutuhkan kata kunci ELSE sebagai jalur alternatif\n` +
        `ketika kondisi IF tidak terpenuhi (kapasitas = 0).\n\n` +
        `Petunjuk: Cukup tulis: else`
      );
    }

    // Baris 6: print parkir_penuh
    if (lineIndex === 6) {
      if (firstWord !== "print") {
        if (COMMAND_GLOSSARY[firstWord]) {
          return (
            `Hmm... perintah "${firstWord.toUpperCase()}" bukan yang tepat untuk baris ini 🤔\n\n` +
            `${COMMAND_GLOSSARY[firstWord]}\n\n` +
            `Di sini kita perlu menampilkan status bahwa parkir sudah penuh.\n` +
            `Gunakan perintah PRINT.`
          );
        }
        return (
          `Hmm... perintah "${firstWord}" tidak dikenali oleh sistem 🤔\n\n` +
          `Di baris ini (blok ELSE), sistem perlu menampilkan status parkir penuh.\n\n` +
          `Petunjuk: Gunakan perintah PRINT untuk menampilkan output.\n` +
          `Contoh: print parkir_penuh`
        );
      }
      const afterPrint = trimmed.replace(/^print\s*/, "");
      if (afterPrint !== "parkir_penuh") {
        return (
          `Hmm... perintah PRINT sudah benar, tetapi nilai output tidak sesuai 🤔\n\n` +
          `Sistem sedang berada di blok ELSE (kapasitas = 0),\n` +
          `sehingga perlu menampilkan bahwa parkir sudah penuh.\n\n` +
          `Coba periksa kembali penulisan output-nya.\n` +
          `Yang diharapkan: parkir_penuh${afterPrint ? `, bukan "${afterPrint}"` : ""}`
        );
      }
    }

    // Fallback umum
    if (COMMAND_GLOSSARY[firstWord]) {
      return (
        `Hmm... perintah "${firstWord.toUpperCase()}" sudah dikenali, tetapi penulisannya kurang sesuai 🤔\n\n` +
        `${COMMAND_GLOSSARY[firstWord]}\n\n` +
        `Coba perhatikan lagi penulisan lengkapnya ya! 😊`
      );
    }

    return (
      `Hmm... sepertinya ada yang kurang tepat di baris ini 🤔\n\n` +
      `Perintah "${firstWord || "..."}" tidak dikenali oleh sistem.\n\n` +
      `Pastikan menggunakan perintah pseudocode yang sesuai:\n` +
      `start, input, if, print, else, end`
    );
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
      setIsRunning(false);
      setErrorLine(step);
      updateSimData({ feedback: generateEducationalFeedback(step, userLine) });
      return false;
    }

    // Eksekusi berdasarkan baris
    switch (step) {
      case 0: // start
        updateSimData({ feedback: "Sistem: Memulai proses..." });
        break;

      case 1: // input kendaraan
        updateSimData({
          kendaraan: "detected",
          feedback: 'INPUT: Sensor mendeteksi kendaraan → "terdeteksi"',
        });
        break;

      case 2: // input kapasitas
        const freeSlots = preOccupiedRef.current.filter(
          (o, idx) => idx > 0 && !o,
        ).length;
        updateSimData({
          kapasitas: freeSlots,
          feedback: `INPUT: Membaca kapasitas parkir... tersisa ${freeSlots} slot`,
        });
        break;

      case 3: // if kapasitas > 0
        updateSimData({
          feedback: "IF: Mengevaluasi kondisi kapasitas > 0...",
        });
        await new Promise((resolve) => setTimeout(resolve, 800));
        const condition =
          simDataRef.current.kapasitas !== null &&
          simDataRef.current.kapasitas > 0;
        updateSimData({
          feedback: condition
            ? "Hasil: BENAR! (Ada slot parkir tersedia)"
            : "Hasil: SALAH. (Kapasitas = 0, parkir penuh)",
        });
        break;

      case 4: // print parkir_tersedia
        if (
          simDataRef.current.kapasitas !== null &&
          simDataRef.current.kapasitas > 0
        ) {
          updateSimData({
            gerbangTerbuka: true,
            statusParkir: "tersedia",
            feedback: "PRINT: Membuka gerbang parkir.",
          });
          await new Promise((resolve) => setTimeout(resolve, 800));
          updateSimData({
            mobilMasuk: true,
            feedback: "PRINT: Kendaraan dipersilakan masuk ke area parkir.",
          });
        }
        break;

      case 5: // else
        if (
          simDataRef.current.kapasitas === null ||
          simDataRef.current.kapasitas === 0
        ) {
          updateSimData({
            feedback: "ELSE: Kapasitas = 0, masuk blok else...",
          });
        }
        break;

      case 6: // print parkir_penuh
        if (
          simDataRef.current.kapasitas === null ||
          simDataRef.current.kapasitas === 0
        ) {
          updateSimData({
            gerbangTerbuka: false,
            statusParkir: "penuh",
            feedback: "PRINT: Menahan gerbang tetap tertutup. Parkir penuh.",
          });
        }
        break;

      case 7: // end
        updateSimData({
          feedback: "Berhasil! Algoritma dijalankan tanpa error.",
        });
        break;
    }

    return true;
  };

  const startRunning = async () => {
    const lines = code.split("\n");

    setIsRunning(true);
    setActiveLine(-1);
    setErrorLine(-1);
    const freshState: SimulationState = {
      kendaraan: "",
      kapasitas: null,
      gerbangTerbuka: false,
      mobilMasuk: false,
      statusParkir: "idle",
      feedback: "Sistem: Memulai proses...",
    };
    simDataRef.current = freshState;
    setSimState(freshState);

    for (let i = 0; i < lines.length; i++) {
      const success = await executeStep(i);
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
                Sistem Parkir Otomatis
              </h1>
            </div>
            <span className="text-[8px] text-red-600 font-bold tracking-widest uppercase italic bg-red-50 px-2 py-0.5 rounded border border-red-200">
              Sulit
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
                    Sistem Parkir Otomatis
                  </h2>
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed max-w-4xl font-medium">
                  Sistem parkir otomatis menggunakan sensor untuk mendeteksi
                  kendaraan yang datang ke area parkir. Namun sistem juga harus
                  memeriksa apakah tempat parkir masih tersedia atau sudah
                  penuh. Lengkapi algoritma pseudocode agar sistem dapat
                  menentukan apakah kendaraan boleh masuk atau harus menunggu
                  ketika parkiran penuh.
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
                    PARKING_SYSTEM.ALGO
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

              {/* Area Simulasi - Top Down Parking View */}
              <div
                className="h-[420px] overflow-hidden relative"
                style={{
                  background:
                    "linear-gradient(180deg, #1a1f2e 0%, #141824 100%)",
                }}
              >
                {/* ── Area Parkir (Top Down) ── */}
                <div className="absolute top-3 left-4 right-4">
                  {/* Atap gedung parkir */}
                  <div className="bg-slate-700/40 rounded-t-lg px-3 py-1.5 border-t border-x border-slate-600/50 text-center">
                    <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">
                      Area Parkir
                    </span>
                  </div>
                  {/* Lantai parkir */}
                  <div className="bg-slate-700/20 border-x border-b border-slate-600/50 rounded-b-lg px-3 py-3">
                    {/* Baris parkir A */}
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[8px] text-slate-600 font-bold w-3">
                        A
                      </span>
                      <div className="flex gap-1.5 flex-1">
                        {[0, 1, 2, 3, 4].map((i) => {
                          const slotIdx = i;
                          const isOccupied = preOccupied[slotIdx];
                          const isNewCar = simState.mobilMasuk && i === 0;
                          const carColor = CAR_COLORS[slotIdx];
                          return (
                            <motion.div
                              key={`a${i}`}
                              className={`flex-1 h-10 rounded-sm border flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 ${
                                isNewCar
                                  ? "border-emerald-500/80 bg-emerald-900/40"
                                  : isOccupied
                                    ? "border-slate-400/40 bg-slate-700/50"
                                    : "border-slate-500/50 bg-slate-800/60"
                              }`}
                              style={{ borderTopWidth: 2 }}
                            >
                              <div className="absolute inset-x-0 top-0 h-px bg-white/5"></div>
                              {isNewCar ? (
                                <motion.div
                                  initial={{ y: -20, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  transition={{ delay: 0.8, duration: 0.5 }}
                                >
                                  <svg
                                    width="20"
                                    height="32"
                                    viewBox="0 0 22 34"
                                  >
                                    <rect
                                      x="1"
                                      y="3"
                                      width="20"
                                      height="28"
                                      rx="3"
                                      fill="#3b82f6"
                                    />
                                    <rect
                                      x="3"
                                      y="5"
                                      width="16"
                                      height="8"
                                      rx="2"
                                      fill="#93c5fd"
                                      opacity="0.6"
                                    />
                                    <rect
                                      x="3"
                                      y="22"
                                      width="16"
                                      height="6"
                                      rx="1"
                                      fill="#1d4ed8"
                                      opacity="0.5"
                                    />
                                    <rect
                                      x="0"
                                      y="6"
                                      width="2"
                                      height="5"
                                      rx="1"
                                      fill="#374151"
                                    />
                                    <rect
                                      x="20"
                                      y="6"
                                      width="2"
                                      height="5"
                                      rx="1"
                                      fill="#374151"
                                    />
                                    <rect
                                      x="0"
                                      y="23"
                                      width="2"
                                      height="5"
                                      rx="1"
                                      fill="#374151"
                                    />
                                    <rect
                                      x="20"
                                      y="23"
                                      width="2"
                                      height="5"
                                      rx="1"
                                      fill="#374151"
                                    />
                                  </svg>
                                </motion.div>
                              ) : isOccupied ? (
                                <svg width="20" height="32" viewBox="0 0 22 34">
                                  <rect
                                    x="1"
                                    y="3"
                                    width="20"
                                    height="28"
                                    rx="3"
                                    fill={carColor}
                                    opacity="0.85"
                                  />
                                  <rect
                                    x="3"
                                    y="5"
                                    width="16"
                                    height="8"
                                    rx="2"
                                    fill="white"
                                    opacity="0.25"
                                  />
                                  <rect
                                    x="0"
                                    y="6"
                                    width="2"
                                    height="5"
                                    rx="1"
                                    fill="#374151"
                                  />
                                  <rect
                                    x="20"
                                    y="6"
                                    width="2"
                                    height="5"
                                    rx="1"
                                    fill="#374151"
                                  />
                                  <rect
                                    x="0"
                                    y="23"
                                    width="2"
                                    height="5"
                                    rx="1"
                                    fill="#374151"
                                  />
                                  <rect
                                    x="20"
                                    y="23"
                                    width="2"
                                    height="5"
                                    rx="1"
                                    fill="#374151"
                                  />
                                </svg>
                              ) : (
                                <span className="text-[8px] text-slate-600 font-mono">{`A${i + 1}`}</span>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Jalan tengah area parkir */}
                    <div className="h-4 flex items-center px-3">
                      <div className="w-full border-b border-dashed border-slate-600/50"></div>
                    </div>
                    {/* Baris parkir B */}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[8px] text-slate-600 font-bold w-3">
                        B
                      </span>
                      <div className="flex gap-1.5 flex-1">
                        {[0, 1, 2, 3, 4].map((i) => {
                          const slotIdx = 5 + i;
                          const isOccupied = preOccupied[slotIdx];
                          const carColor = CAR_COLORS[slotIdx];
                          return (
                            <div
                              key={`b${i}`}
                              className={`flex-1 h-10 rounded-sm border flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 ${
                                isOccupied
                                  ? "border-slate-400/40 bg-slate-700/50"
                                  : "border-slate-500/50 bg-slate-800/60"
                              }`}
                              style={{ borderBottomWidth: 2 }}
                            >
                              <div className="absolute inset-x-0 bottom-0 h-px bg-white/5"></div>
                              {isOccupied ? (
                                <svg width="20" height="32" viewBox="0 0 22 34">
                                  <rect
                                    x="1"
                                    y="3"
                                    width="20"
                                    height="28"
                                    rx="3"
                                    fill={carColor}
                                    opacity="0.85"
                                  />
                                  <rect
                                    x="3"
                                    y="5"
                                    width="16"
                                    height="8"
                                    rx="2"
                                    fill="white"
                                    opacity="0.25"
                                  />
                                  <rect
                                    x="0"
                                    y="6"
                                    width="2"
                                    height="5"
                                    rx="1"
                                    fill="#374151"
                                  />
                                  <rect
                                    x="20"
                                    y="6"
                                    width="2"
                                    height="5"
                                    rx="1"
                                    fill="#374151"
                                  />
                                  <rect
                                    x="0"
                                    y="23"
                                    width="2"
                                    height="5"
                                    rx="1"
                                    fill="#374151"
                                  />
                                  <rect
                                    x="20"
                                    y="23"
                                    width="2"
                                    height="5"
                                    rx="1"
                                    fill="#374151"
                                  />
                                </svg>
                              ) : (
                                <span className="text-[8px] text-slate-600 font-mono">{`B${i + 1}`}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Jalan masuk ── */}
                <div className="absolute bottom-0 left-0 right-0 h-[162px]">
                  {/* Aspal */}
                  <div className="absolute inset-0 bg-slate-600/25"></div>
                  {/* Kerb kiri & kanan */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-slate-700/40 border-r border-slate-600/50"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-700/40 border-l border-slate-600/50"></div>
                  {/* Marka tengah */}
                  <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 border-l-2 border-dashed border-yellow-400/40"></div>

                  {/* ── Gerbang ── */}
                  <div className="absolute top-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0">
                    {/* Tiang kiri & kanan + palang */}
                    <div className="flex items-end gap-0 relative">
                      {/* Tiang kiri */}
                      <div className="w-4 h-12 bg-gradient-to-b from-slate-400 to-slate-600 rounded-t shadow-lg border border-slate-500/50"></div>
                      {/* Palang horizontal */}
                      <motion.div
                        animate={{
                          rotate: simState.gerbangTerbuka ? -75 : 0,
                          scaleX: simState.gerbangTerbuka ? 0.95 : 1,
                        }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="absolute left-4 top-[5px] origin-left z-10"
                        style={{ width: 96 }}
                      >
                        <div
                          className="h-3 rounded-r-full shadow-lg flex items-center overflow-hidden"
                          style={{
                            background: simState.gerbangTerbuka
                              ? "linear-gradient(90deg,#22c55e,#16a34a)"
                              : "linear-gradient(90deg,#ef4444,#b91c1c)",
                          }}
                        >
                          {[...Array(8)].map((_, k) => (
                            <div
                              key={k}
                              className="h-full w-2.5 shrink-0 bg-white/20"
                            ></div>
                          ))}
                        </div>
                        {/* Lampu ujung palang */}
                        <div
                          className={`absolute right-0 top-0 w-3 h-3 rounded-full shadow-lg -translate-y-0 translate-x-0 ${simState.gerbangTerbuka ? "bg-emerald-400 shadow-emerald-400/70" : "bg-rose-400 shadow-rose-400/70"}`}
                          style={{
                            boxShadow: simState.gerbangTerbuka
                              ? "0 0 8px #4ade80"
                              : "0 0 8px #f87171",
                          }}
                        ></div>
                      </motion.div>
                      {/* Tiang kanan */}
                      <div className="w-4 h-12 bg-gradient-to-b from-slate-400 to-slate-600 rounded-t shadow-lg border border-slate-500/50 ml-24"></div>
                    </div>
                    {/* Sensor loop di jalan */}
                    <div className="w-24 h-3 border-2 border-dashed border-yellow-500/60 rounded mt-1"></div>
                  </div>

                  {/* ── Mobil (top-down) ── */}
                  <AnimatePresence mode="wait">
                    {simState.kendaraan === "detected" &&
                      !simState.mobilMasuk && (
                        <motion.div
                          key="car-wait"
                          initial={{ y: 80, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -40, opacity: 0 }}
                          transition={{ duration: 0.6 }}
                          className="absolute bottom-6 left-1/2 -translate-x-1/2"
                        >
                          <svg width="34" height="54" viewBox="0 0 34 54">
                            <rect
                              x="2"
                              y="4"
                              width="30"
                              height="46"
                              rx="5"
                              fill="#3b82f6"
                            />
                            <rect
                              x="5"
                              y="7"
                              width="24"
                              height="14"
                              rx="3"
                              fill="#93c5fd"
                              opacity="0.65"
                            />
                            <rect
                              x="5"
                              y="34"
                              width="24"
                              height="10"
                              rx="2"
                              fill="#1d4ed8"
                              opacity="0.5"
                            />
                            <rect
                              x="0"
                              y="9"
                              width="3"
                              height="8"
                              rx="1.5"
                              fill="#1f2937"
                            />
                            <rect
                              x="31"
                              y="9"
                              width="3"
                              height="8"
                              rx="1.5"
                              fill="#1f2937"
                            />
                            <rect
                              x="0"
                              y="37"
                              width="3"
                              height="8"
                              rx="1.5"
                              fill="#1f2937"
                            />
                            <rect
                              x="31"
                              y="37"
                              width="3"
                              height="8"
                              rx="1.5"
                              fill="#1f2937"
                            />
                            {/* Lampu depan */}
                            <rect
                              x="4"
                              y="4"
                              width="8"
                              height="4"
                              rx="1"
                              fill="#fef08a"
                              opacity="0.9"
                            />
                            <rect
                              x="22"
                              y="4"
                              width="8"
                              height="4"
                              rx="1"
                              fill="#fef08a"
                              opacity="0.9"
                            />
                            {/* Lampu belakang merah */}
                            <rect
                              x="4"
                              y="47"
                              width="8"
                              height="4"
                              rx="1"
                              fill="#fca5a5"
                              opacity="0.9"
                            />
                            <rect
                              x="22"
                              y="47"
                              width="8"
                              height="4"
                              rx="1"
                              fill="#fca5a5"
                              opacity="0.9"
                            />
                            <circle
                              cx="17"
                              cy="27"
                              r="6"
                              fill="#1e40af"
                              opacity="0.4"
                            />
                          </svg>
                          {/* Efek headlight */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-5 bg-yellow-200/20 blur-md rounded-full -translate-y-2"></div>
                        </motion.div>
                      )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Logic Log */}
              <div
                className={`p-4 border-t h-32 flex flex-col gap-2 shrink-0 transition-all duration-300 ${
                  errorLine !== -1
                    ? "bg-rose-50 border-rose-200 shadow-inner"
                    : "bg-black/40 border-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 shrink-0">
                  {errorLine !== -1 ? (
                    <AlertTriangle size={14} className="text-rose-500" />
                  ) : (
                    <CheckCircle2
                      size={12}
                      className={
                        simState.gerbangTerbuka
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
                  {simState.feedback}
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
