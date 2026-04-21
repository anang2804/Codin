"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  RotateCcw,
  BookOpen,
  Trash2,
  ArrowDown,
  Terminal,
  HelpCircle,
  ArrowLeft,
  Zap,
  Lightbulb,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MarkCompletedButton from "@/components/MarkCompletedButton";

// --- Konfigurasi Simbol ---
const SYMBOL_TYPES = {
  TERMINATOR: {
    id: "TERMINATOR",
    label: "Start / End",
    color: "bg-green-500",
    shape: "w-10 h-5 rounded-full border-2 border-green-600",
    group: "terminator",
  },
  IO: {
    id: "IO",
    label: "Input / Output",
    color: "bg-blue-500",
    shape: "w-8 h-6 rounded-none transform skew-x-12",
    group: "io",
  },
  PROCESS: {
    id: "PROCESS",
    label: "Proses",
    color: "bg-orange-500",
    shape: "w-9 h-6 rounded-none border-2 border-orange-600",
    group: "process",
  },
  DECISION: {
    id: "DECISION",
    label: "Keputusan",
    color: "bg-amber-500",
    shape: "w-6 h-6 rotate-45",
    group: "decision",
  },
};

type SymbolTypeKey = keyof typeof SYMBOL_TYPES;

const SYMBOL_MEANINGS: Record<SymbolTypeKey, { title: string; desc: string }> =
  {
    TERMINATOR: {
      title: "START / END",
      desc: "Menandai titik awal atau akhir algoritma pada flowchart.",
    },
    IO: {
      title: "INPUT / OUTPUT",
      desc: "Digunakan untuk membaca masukan atau menampilkan hasil proses.",
    },
    PROCESS: {
      title: "PROSES",
      desc: "Menunjukkan langkah pengolahan atau instruksi yang dijalankan sistem.",
    },
    DECISION: {
      title: "KEPUTUSAN",
      desc: "Mengecek kondisi dan membagi alur ke cabang YA atau TIDAK.",
    },
  };

const SYMBOL_MEANING_STYLES: Record<
  SymbolTypeKey,
  { card: string; title: string; desc: string; icon: string }
> = {
  TERMINATOR: {
    card: "border-emerald-200 bg-emerald-50/80",
    title: "text-emerald-800",
    desc: "text-emerald-700",
    icon: "text-emerald-600/80",
  },
  IO: {
    card: "border-sky-200 bg-sky-50/80",
    title: "text-sky-800",
    desc: "text-sky-700",
    icon: "text-sky-600/80",
  },
  PROCESS: {
    card: "border-orange-200 bg-orange-50/80",
    title: "text-orange-800",
    desc: "text-orange-700",
    icon: "text-orange-600/80",
  },
  DECISION: {
    card: "border-amber-200 bg-amber-50/80",
    title: "text-amber-800",
    desc: "text-amber-700",
    icon: "text-amber-600/80",
  },
};

// --- Struktur Alur Skeleton Bercabang ---
const FLOWCHART_STRUCTURE = {
  start: {
    id: "s1",
    group: "terminator",
    placeholder: "START",
    width: "w-56",
  },
  input: {
    id: "s2",
    group: "io",
    placeholder: "INPUT: WARNA LAMPU",
    width: "w-56",
  },
  decision: {
    id: "s4",
    group: "decision",
    placeholder: "APAKAH WARNA LAMPU = MERAH?",
    width: "w-64",
  },
  branchYa: {
    id: "s5a",
    group: "io",
    placeholder: "OUTPUT: KENDARAAN BERHENTI",
    width: "w-full",
  },
  branchTidak: {
    id: "s5b",
    group: "io",
    placeholder: "OUTPUT: KENDARAAN MELAJU",
    width: "w-full",
  },
  end: { id: "s6", group: "terminator", placeholder: "END", width: "w-56" },
};

export default function TrafficLogicPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Record<string, any>>({});
  const [lightColor, setLightColor] = useState("red");
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState("idle");
  const [feedback, setFeedback] = useState("");
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [selectedSymbolType, setSelectedSymbolType] =
    useState<SymbolTypeKey | null>(null);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [lightPhase, setLightPhase] = useState<"red" | "yellow" | "green">(
    "red",
  );
  const logEndRef = useRef<HTMLDivElement>(null);
  const simRunIdRef = useRef<number>(0);

  const [carAPosition, setCarAPosition] = useState(2);
  const [isHardLocked, setIsHardLocked] = useState(true);
  const [hardwareBroken, setHardwareBroken] = useState(false);

  const addLog = (msg: string) => {
    setLogMessages((prev) => [...prev, msg]);
    setTimeout(
      () => logEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  };

  const handleDragStart = (e: React.DragEvent, typeKey: string) => {
    setDraggedType(typeKey);
    setSelectedSymbolType(typeKey as SymbolTypeKey);
  };

  const handleDrop = (
    e: React.DragEvent,
    slotId: string,
    expectedGroup: string,
  ) => {
    e.preventDefault();
    if (!draggedType) return;

    const selectedType = draggedType as SymbolTypeKey;
    const symbolInfo = SYMBOL_TYPES[selectedType];
    setSelectedSymbolType(selectedType);

    setWorkspace({
      ...workspace,
      [slotId]: { ...symbolInfo },
    });
    setFeedback("");
    setDraggedType(null);
    // Reset simulasi agar bisa langsung jalankan ulang
    simRunIdRef.current += 1;
    setIsSimulating(false);
    setActiveStep(null);
    setSimulationStatus("idle");
    setHardwareBroken(false);
    setCarAPosition(2);
    setIsHardLocked(true);
    setLightColor("red");
    setLightPhase("red");
    setLogMessages(["Simbol diubah. Tekan Jalankan untuk mencoba lagi."]);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const selectedMeaning = selectedSymbolType
    ? SYMBOL_MEANINGS[selectedSymbolType]
    : {
        title: "SIAP MENYUSUN",
        desc: "Pilih atau drag simbol dari Bank Simbol untuk melihat arti simbolnya.",
      };

  const selectedMeaningStyle = selectedSymbolType
    ? SYMBOL_MEANING_STYLES[selectedSymbolType]
    : {
        card: "border-border bg-muted/40",
        title: "text-foreground",
        desc: "text-muted-foreground",
        icon: "text-emerald-600/70",
      };

  const removeSymbol = (slotId: string) => {
    const newWorkspace = { ...workspace };
    delete newWorkspace[slotId];
    setWorkspace(newWorkspace);
    // Reset simulasi agar bisa langsung jalankan ulang
    simRunIdRef.current += 1;
    setIsSimulating(false);
    setActiveStep(null);
    setSimulationStatus("idle");
    setHardwareBroken(false);
    setCarAPosition(2);
    setIsHardLocked(true);
    setLightColor("red");
    setLightPhase("red");
    setLogMessages(["Simbol dihapus. Susun kembali flowchart kamu ya."]);
  };

  const resetSim = () => {
    simRunIdRef.current += 1;
    setIsSimulating(false);
    setActiveStep(null);
    setSimulationStatus("idle");
    setFeedback("");
    setCarAPosition(2);
    setIsHardLocked(true);
    setLightColor("red");
    setLightPhase("red");
    setHardwareBroken(false);
    setLogMessages([]);
  };

  const triggerExplosion = (msg: string) => {
    setHardwareBroken(true);
    setSimulationStatus("error");
    setFeedback("Hmm... ada langkah yang perlu diperiksa.");
    addLog("Hmm... sepertinya ada yang perlu diperiksa.");
    addLog("Sistem mencoba membaca alur flowchart,");
    addLog("tetapi simbol yang digunakan di posisi ini belum sesuai.");
    addLog(msg);
    addLog("Coba periksa kembali simbol yang kamu gunakan ya.");
  };

  const checkStepValidity = (stepId: string, expectedGroup: string) => {
    const placed = workspace[stepId];
    if (!placed) return { valid: false, error: "Langkah ini belum diisi!" };

    if (placed.group !== expectedGroup) {
      let explanation = "";

      if (expectedGroup === "terminator") {
        explanation = `Di posisi ini, kamu perlu meletakkan simbol Start/End (bentuk lonjong hijau) ya. Simbol "${placed.label}" tidak bisa digunakan di sini.`;
      } else if (expectedGroup === "io") {
        explanation = `Di posisi ini dibutuhkan simbol Input/Output (jajaran genjang biru). Simbol "${placed.label}" belum tepat untuk langkah ini.`;
      } else if (expectedGroup === "process") {
        explanation = `Posisi ini memerlukan simbol Proses (kotak oranye). Simbol "${placed.label}" biasanya digunakan untuk tujuan yang berbeda.`;
      } else if (expectedGroup === "decision") {
        explanation = `Di sini kamu perlu simbol Keputusan (belah ketupat kuning) karena ada pilihan Ya/Tidak. Simbol "${placed.label}" belum cocok untuk posisi ini.`;
      }

      return {
        valid: false,
        error: explanation,
      };
    }
    return { valid: true };
  };

  const runSimulation = async () => {
    const totalSlots = Object.keys(FLOWCHART_STRUCTURE).length;
    const filledSlots = Object.keys(workspace).length;

    if (filledSlots < totalSlots) {
      setLogMessages([
        "Algoritma belum lengkap.",
        "Sistem masih menunggu langkah berikutnya sebelum simulasi dapat dijalankan.",
        "Lengkapi flowchart terlebih dahulu ya.",
      ]);
      setFeedback(
        "Flowchart belum lengkap. Isi semua kotak yang masih kosong dulu ya.",
      );
      return;
    }

    resetSim();
    setIsSimulating(true);
    setSimulationStatus("running");
    const runId = simRunIdRef.current;
    setLogMessages([
      "Baik, kita mulai menjalankan algoritmanya.",
      "Sistem sedang membaca alur flowchart...",
    ]);

    setActiveStep("s1");
    await new Promise((r) => setTimeout(r, 600));
    if (simRunIdRef.current !== runId) return;
    addLog("Oke, titik awal ditemukan.");
    const checkStart = checkStepValidity("s1", "terminator");
    if (!checkStart.valid) {
      triggerExplosion(checkStart.error || "");
      return;
    }

    setActiveStep("s2");
    await new Promise((r) => setTimeout(r, 700));
    if (simRunIdRef.current !== runId) return;
    addLog("Sistem membaca warna lampu lalu lintas.");
    const checkInput = checkStepValidity("s2", "io");
    if (!checkInput.valid) {
      triggerExplosion(checkInput.error || "");
      return;
    }

    setActiveStep("s4");
    await new Promise((r) => setTimeout(r, 700));
    if (simRunIdRef.current !== runId) return;
    addLog("Sekarang sistem memeriksa kondisi warna lampu.");
    const checkDecision = checkStepValidity("s4", "decision");
    if (!checkDecision.valid) {
      triggerExplosion(checkDecision.error || "");
      return;
    }

    setActiveStep("s5a");
    await new Promise((r) => setTimeout(r, 700));
    if (simRunIdRef.current !== runId) return;
    addLog("Lampu merah terdeteksi.");
    addLog("Kendaraan harus berhenti terlebih dahulu.");
    const checkBranchYa = checkStepValidity("s5a", "io");
    if (!checkBranchYa.valid) {
      triggerExplosion(checkBranchYa.error || "");
      return;
    }

    setActiveStep("s6");
    await new Promise((r) => setTimeout(r, 700));
    if (simRunIdRef.current !== runId) return;
    addLog("Algoritma mencapai titik akhir.");
    const checkEnd = checkStepValidity("s6", "terminator");
    if (!checkEnd.valid) {
      triggerExplosion(checkEnd.error || "");
      return;
    }

    executeVisualSim(runId);
  };

  const executeVisualSim = (runId: number) => {
    setLightPhase("yellow");
    addLog("Lampu kuning menyala, kendaraan bersiap berhenti.");
    setTimeout(() => {
      if (simRunIdRef.current !== runId) return;
      setLightPhase("green");
      setLightColor("green");
      setIsHardLocked(false);
      addLog("Lampu tidak berwarna merah.");
      addLog("Kendaraan dapat melaju melewati persimpangan.");
      setTimeout(() => {
        if (simRunIdRef.current !== runId) return;
        setCarAPosition(140);
        setSimulationStatus("success");
        setFeedback("Simulasi berhasil! Flowchart kamu sudah benar.");
        addLog("Simulasi selesai dijalankan.");
      }, 400);
      setTimeout(() => {
        if (simRunIdRef.current === runId) setActiveStep(null);
      }, 1500);
    }, 1200);
  };

  const renderSlot = (slotData: any) => {
    const isCurrent = activeStep === slotData.id;
    const isError = isCurrent && simulationStatus === "error";

    return (
      <div
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, slotData.id, slotData.group)}
        className={`relative ${slotData.width} h-9 rounded-xl flex items-center transition-all border-2 shrink-0
          ${
            workspace[slotData.id]
              ? "bg-card border-border shadow-md"
              : "bg-card/70 border-dashed border-border hover:bg-primary/10 hover:border-primary/40"
          }
          ${
            isCurrent ? "ring-4 ring-blue-500/20 border-blue-400 shadow-lg" : ""
          }
          ${isError ? "ring-2 ring-red-400/50 border-red-400 bg-red-50" : ""}
        `}
      >
        {workspace[slotData.id] ? (
          <motion.div
            drag="x"
            dragConstraints={{ left: -20, right: 20 }}
            className="flex items-center gap-2 w-full px-3 cursor-move h-full overflow-hidden"
          >
            <div
              className={`${workspace[slotData.id].shape} ${workspace[slotData.id].color} shrink-0 shadow-sm pointer-events-none`}
            ></div>
            <span
              className={`text-[11px] font-bold uppercase leading-tight truncate pointer-events-none flex-1 min-w-0 ${
                isError ? "text-red-700" : "text-foreground"
              }`}
            >
              {slotData.placeholder}
            </span>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => removeSymbol(slotData.id)}
              className="ml-auto shrink-0 text-muted-foreground hover:text-red-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center w-full pointer-events-none px-3 text-center overflow-hidden">
            <span className="text-[11px] font-medium text-muted-foreground truncate">
              {slotData.placeholder}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans text-sm">
      {/* Header */}
      <header className="bg-background border-b border-border px-6 py-3 flex justify-between items-center z-40 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
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
                Logika Lalu Lintas
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
          <MarkCompletedButton
            simulasiSlug="traffic-logic"
            canMarkComplete={simulationStatus === "success"}
          />
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 ${
              isSimulating
                ? "cursor-not-allowed border border-border bg-muted text-muted-foreground"
                : "bg-gradient-to-br from-[#16a34a] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-white"
            }`}
          >
            <Play size={14} fill={isSimulating ? "none" : "white"} /> Jalankan
          </button>
        </div>
      </header>

      <main className="flex flex-1 min-h-0 overflow-hidden">
        {/* PANEL KIRI */}
        <aside className="w-72 border-r border-border bg-card flex flex-col z-20 shrink-0 shadow-sm overflow-y-auto">
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className={selectedMeaningStyle.icon} />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Deskripsi Perintah
              </h2>
            </div>

            <div
              className={`mt-4 rounded-2xl border p-4 shadow-sm transition-all duration-200 ${selectedMeaningStyle.card}`}
            >
              <h3
                className={`text-xs font-black uppercase tracking-tight ${selectedMeaningStyle.title}`}
              >
                {selectedMeaning.title}
              </h3>
              <p
                className={`mt-2 text-[11px] leading-relaxed ${selectedMeaningStyle.desc}`}
              >
                {selectedMeaning.desc}
              </p>
            </div>
          </div>

          <div
            className={`p-3 rounded-2xl border transition-all duration-300 m-3 mt-2 ${
              simulationStatus === "error"
                ? "bg-rose-50/95 border-rose-200"
                : "bg-card border-border"
            }`}
          >
            <div
              className={`flex items-center gap-2 pb-2 border-b ${
                simulationStatus === "error"
                  ? "border-rose-200"
                  : "border-border"
              }`}
            >
              <HelpCircle
                size={12}
                className={
                  simulationStatus === "error"
                    ? "text-rose-500"
                    : "text-muted-foreground"
                }
              />
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  simulationStatus === "error"
                    ? "text-rose-600"
                    : "text-muted-foreground"
                }`}
              >
                CATATAN PROSES
              </span>
            </div>

            <div
              className={`mt-2 rounded-lg px-3 py-2 text-[11px] leading-snug ${
                simulationStatus === "error"
                  ? "text-rose-700 bg-rose-100/60"
                  : "text-foreground bg-muted"
              }`}
            >
              {feedback || "Sistem siap menjalankan algoritma."}
            </div>
          </div>

          <div className="p-2 overflow-y-auto">
            <h2 className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5 text-center">
              BANK SIMBOL
            </h2>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(SYMBOL_TYPES).map(([key, data]) => (
                <div
                  key={key}
                  draggable={!isSimulating}
                  onDragStart={(e) => handleDragStart(e, key)}
                  className={`flex flex-col items-center p-1 bg-card border border-border rounded-lg transition-all shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 group ${
                    isSimulating ? "opacity-50 grayscale" : ""
                  }`}
                >
                  <div
                    className={`${data.shape} ${data.color} mb-0.5 shadow-sm group-hover:scale-105 transition-transform scale-75`}
                  ></div>
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter text-center leading-tight">
                    {data.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl m-3">
            <div className="flex items-center justify-between text-[9px] font-black text-emerald-600/60 uppercase mb-2">
              <span>Status Fokus</span>
              <Activity size={10} />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground italic leading-tight">
              {activeStep !== null
                ? `Menganalisis langkah ${String(activeStep).toUpperCase()}`
                : "Editor siap digunakan"}
            </p>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* MISI BANNER */}
          <section className="px-6 pb-2 pt-4 shrink-0">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
              <div className="bg-background p-2 rounded-xl shadow-sm text-primary shrink-0">
                <Lightbulb size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded uppercase tracking-widest">
                    MISI
                  </span>
                  <h2 className="text-[15px] font-black text-foreground uppercase tracking-tight">
                    Logika Lalu Lintas
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] text-muted-foreground leading-relaxed font-medium">
                  Susun diagram alir yang menunjukkan bagaimana sistem membaca
                  warna lampu lalu lintas dan menentukan apakah kendaraan harus
                  berhenti atau dapat melaju.
                </p>
              </div>
            </div>
          </section>

          <div
            className={`relative flex min-h-0 flex-1 gap-5 overflow-x-hidden overflow-y-auto px-6 pb-6 transition-all duration-300 ${
              simulationStatus === "success" ? "pt-24" : "pt-0"
            }`}
          >
            <AnimatePresence>
              {simulationStatus === "success" && (
                <motion.section
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  className="pointer-events-none absolute left-6 right-6 top-2 z-30"
                >
                  <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
                    <h3 className="text-sm font-black tracking-tight text-emerald-700">
                      Berhasil! Flowchart kamu sudah tepat
                    </h3>
                    <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                      Sistem berhasil membaca alur dari Start sampai End.
                      <br />
                      Keputusan dan output sudah sesuai untuk logika lalu
                      lintas.
                    </p>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* PANEL TENGAH: WORKSPACE */}
            <section className="relative flex min-w-[500px] flex-1 flex-col overflow-auto rounded-3xl border border-emerald-100 bg-white py-4 shadow-sm z-10">
              <div
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(#64748b 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              ></div>

              <div className="relative flex flex-col items-center gap-1">
                <div>{renderSlot(FLOWCHART_STRUCTURE.start)}</div>
                <ArrowDown className="text-muted-foreground/60" size={14} />

                <div>{renderSlot(FLOWCHART_STRUCTURE.input)}</div>
                <ArrowDown className="text-muted-foreground/60" size={14} />

                <div>{renderSlot(FLOWCHART_STRUCTURE.decision)}</div>

                {/* Cabang Ya / Tidak */}
                <div className="flex w-full gap-4 relative items-start mt-1">
                  <div className="flex-1 flex flex-col items-center min-w-0">
                    <div className="flex items-center w-full mb-1.5">
                      <div className="h-[2px] bg-border flex-1"></div>
                      <span className="px-2 text-[10px] font-black text-blue-500 uppercase">
                        Ya
                      </span>
                    </div>
                    <div className="w-full">
                      {renderSlot(FLOWCHART_STRUCTURE.branchYa)}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center min-w-0">
                    <div className="flex items-center w-full mb-1.5">
                      <span className="px-2 text-[10px] font-black text-muted-foreground uppercase">
                        Tidak
                      </span>
                      <div className="h-[2px] bg-border flex-1"></div>
                    </div>
                    <div className="w-full">
                      {renderSlot(FLOWCHART_STRUCTURE.branchTidak)}
                    </div>
                  </div>
                </div>

                <div className="flex w-full justify-around mt-0.5">
                  <ArrowDown size={14} className="text-muted-foreground/60" />
                  <ArrowDown size={14} className="text-muted-foreground/60" />
                </div>

                <div>{renderSlot(FLOWCHART_STRUCTURE.end)}</div>
              </div>
            </section>

            {/* PANEL KANAN: SIMULATOR VISUAL */}
            <aside className="relative flex w-[380px] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-2xl z-20">
              {/* Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center px-5">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                    <Activity size={14} />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Simulation Preview
                  </span>
                </div>
                <div
                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-colors ${
                    isSimulating
                      ? "bg-emerald-600 text-white"
                      : hardwareBroken
                        ? "bg-red-600 text-white"
                        : "bg-background/20 text-muted-foreground border border-border/60"
                  }`}
                >
                  {isSimulating ? "Active" : hardwareBroken ? "Error" : "Idle"}
                </div>
              </div>

              {/* Simulation Area */}
              <div className="flex-1 bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)] relative overflow-hidden flex items-center justify-center">
                {/* Road horizontal */}
                <div
                  className="absolute w-full h-24 bg-[#1e293b] border-y-4 border-slate-900/60"
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                >
                  {/* Road dashes */}
                  <div className="absolute top-1/2 -translate-y-1/2 w-full flex gap-6 px-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-1.5 w-8 bg-slate-500/40 rounded-full shrink-0"
                      />
                    ))}
                  </div>
                </div>

                {/* Traffic Light */}
                <div
                  className="absolute left-[30%] z-30"
                  style={{ top: "calc(50% - 120px)" }}
                >
                  <div
                    className={`bg-[#0a050a] px-2 py-2 rounded-2xl border-2 shadow-2xl flex flex-col gap-1.5 items-center transition-all ${
                      hardwareBroken
                        ? "border-red-500 rotate-6"
                        : "border-slate-700"
                    }`}
                  >
                    {/* Red */}
                    <div
                      className={`w-6 h-6 rounded-full transition-all duration-500 ${
                        hardwareBroken
                          ? "bg-red-900 animate-ping"
                          : lightPhase === "red"
                            ? "bg-red-500 shadow-[0_0_16px_#ef4444]"
                            : "bg-red-950/30"
                      }`}
                    />
                    {/* Yellow */}
                    <div
                      className={`w-6 h-6 rounded-full transition-all duration-500 ${
                        hardwareBroken
                          ? "bg-amber-900"
                          : lightPhase === "yellow"
                            ? "bg-amber-400 shadow-[0_0_16px_#fbbf24]"
                            : "bg-amber-950/30"
                      }`}
                    />
                    {/* Green */}
                    <div
                      className={`w-6 h-6 rounded-full transition-all duration-500 ${
                        hardwareBroken
                          ? "bg-green-900"
                          : lightPhase === "green"
                            ? "bg-emerald-400 shadow-[0_0_16px_#34d399]"
                            : "bg-green-950/30"
                      }`}
                    />
                  </div>
                  <div className="w-2 h-12 bg-slate-700 mx-auto rounded-b-lg" />
                </div>

                {/* Explosion */}
                <AnimatePresence>
                  {hardwareBroken && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.5, 1.2], opacity: 1 }}
                      className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                    >
                      <div className="relative">
                        <Zap
                          size={120}
                          className="text-yellow-400 fill-yellow-400 filter blur-sm absolute inset-0 animate-pulse"
                        />
                        <Zap
                          size={100}
                          className="text-orange-500 fill-orange-500"
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-black text-2xl uppercase tracking-tighter drop-shadow-lg">
                          BOOM!
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Car */}
                <motion.div
                  animate={{ left: `${carAPosition}%` }}
                  initial={{ left: "2%" }}
                  transition={{
                    duration: isHardLocked ? 0.3 : 2.5,
                    ease: "easeInOut",
                  }}
                  className="absolute z-30 flex flex-col items-start gap-1"
                  style={{ top: "calc(50% - 16px)" }}
                >
                  <div className="bg-[#3b82f6] px-2 py-0.5 rounded shadow-xl border border-blue-400/50 ml-2 mb-0.5">
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">
                      Mobil A
                    </span>
                  </div>
                  <div className="w-20 h-10 bg-[#3b82f6] rounded-xl shadow-2xl relative flex items-center justify-end border-b-[5px] border-[#1d4ed8]">
                    <div className="w-7 h-6 bg-[#93c5fd] rounded-lg mr-2 opacity-40 shadow-inner" />
                    <div className="absolute -bottom-2 left-3 w-5 h-5 bg-slate-950 rounded-full border-[3px] border-slate-900 shadow-xl" />
                    <div className="absolute -bottom-2 right-3 w-5 h-5 bg-slate-950 rounded-full border-[3px] border-slate-900 shadow-xl" />
                  </div>
                </motion.div>
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
            Workspace siap menerima flowchart
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground font-medium">
            MODE: DRAG & DROP FLOWCHART
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
