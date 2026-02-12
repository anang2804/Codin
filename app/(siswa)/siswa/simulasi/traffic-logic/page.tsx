"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  RotateCcw,
  Info,
  Trash2,
  ArrowDown,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  Zap,
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

// --- Struktur Alur Skeleton Bercabang ---
const FLOWCHART_STRUCTURE = {
  start: {
    id: "s1",
    group: "terminator",
    placeholder: "START",
    width: "w-44",
  },
  input: {
    id: "s2",
    group: "io",
    placeholder: "INPUT: WARNA LAMPU",
    width: "w-44",
  },
  process: {
    id: "s3",
    group: "process",
    placeholder: "PROSES: BACA SENSOR",
    width: "w-44",
  },
  decision: {
    id: "s4",
    group: "decision",
    placeholder: "APAKAH WARNA LAMPU = MERAH?",
    width: "w-52",
  },
  branchYa: {
    id: "s5a",
    group: "io",
    placeholder: "OUTPUT: LAMPU = HIJAU",
    width: "w-44",
  },
  branchTidak: {
    id: "s5b",
    group: "io",
    placeholder: "OUTPUT: LAMPU TETAP",
    width: "w-44",
  },
  end: { id: "s6", group: "terminator", placeholder: "END", width: "w-44" },
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

  const [carAPosition, setCarAPosition] = useState(2);
  const [isHardLocked, setIsHardLocked] = useState(true);
  const [hardwareBroken, setHardwareBroken] = useState(false);

  const handleDragStart = (e: React.DragEvent, typeKey: string) => {
    if (isSimulating) {
      e.preventDefault();
      return;
    }
    setDraggedType(typeKey);
  };

  const handleDrop = (
    e: React.DragEvent,
    slotId: string,
    expectedGroup: string,
  ) => {
    e.preventDefault();
    if (!draggedType) return;

    const symbolInfo = SYMBOL_TYPES[draggedType as keyof typeof SYMBOL_TYPES];

    // Allow any symbol to be placed without validation
    setWorkspace({
      ...workspace,
      [slotId]: { ...symbolInfo },
    });
    setFeedback("");
    setDraggedType(null);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const removeSymbol = (slotId: string) => {
    if (isSimulating) return;
    const newWorkspace = { ...workspace };
    delete newWorkspace[slotId];
    setWorkspace(newWorkspace);
  };

  const resetSim = () => {
    setIsSimulating(false);
    setActiveStep(null);
    setSimulationStatus("idle");
    setFeedback("");
    setCarAPosition(2);
    setIsHardLocked(true);
    setLightColor("red");
    setHardwareBroken(false);
  };

  const triggerExplosion = (msg: string) => {
    setHardwareBroken(true);
    setSimulationStatus("error");
    setFeedback(`💥 KRITIS: ${msg}`);
  };

  const checkStepValidity = (stepId: string, expectedGroup: string) => {
    const placed = workspace[stepId];
    if (!placed) return { valid: false, error: "Langkah ini belum diisi!" };

    if (placed.group !== expectedGroup) {
      let explanation = "";

      if (expectedGroup === "terminator") {
        explanation = `Posisi ini membutuhkan simbol START/END (bulat hijau) karena menandai awal atau akhir alur. Simbol ${placed.label} tidak bisa digunakan di sini.`;
      } else if (expectedGroup === "io") {
        explanation = `Posisi ini membutuhkan simbol INPUT/OUTPUT (jajaran genjang biru) untuk menerima data atau menampilkan hasil. Simbol ${placed.label} tidak cocok untuk proses input/output.`;
      } else if (expectedGroup === "process") {
        explanation = `Posisi ini membutuhkan simbol PROSES (kotak orange) untuk melakukan aksi atau perhitungan. Simbol ${placed.label} bukan untuk proses eksekusi.`;
      } else if (expectedGroup === "decision") {
        explanation = `Posisi ini membutuhkan simbol KEPUTUSAN (belah ketupat kuning) untuk membuat pilihan Ya/Tidak. Simbol ${placed.label} tidak bisa digunakan untuk percabangan logika.`;
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
      setFeedback("⚠️ Alur belum lengkap! Isi semua kotak kerangka di kanvas.");
      return;
    }

    resetSim();
    setIsSimulating(true);
    setSimulationStatus("running");
    setFeedback("Menjalankan sistem...");

    // Validate from top to bottom: START
    setActiveStep("s1");
    await new Promise((r) => setTimeout(r, 600));
    const checkStart = checkStepValidity("s1", "terminator");
    if (!checkStart.valid) {
      triggerExplosion(checkStart.error || "Terjadi kesalahan pada START!");
      return;
    }

    // INPUT
    setActiveStep("s2");
    await new Promise((r) => setTimeout(r, 600));
    const checkInput = checkStepValidity("s2", "io");
    if (!checkInput.valid) {
      triggerExplosion(checkInput.error || "Terjadi kesalahan pada INPUT!");
      return;
    }

    // PROCESS
    setActiveStep("s3");
    await new Promise((r) => setTimeout(r, 600));
    const checkProcess = checkStepValidity("s3", "process");
    if (!checkProcess.valid) {
      triggerExplosion(checkProcess.error || "Terjadi kesalahan pada PROSES!");
      return;
    }

    // DECISION
    setActiveStep("s4");
    await new Promise((r) => setTimeout(r, 600));
    const checkDecision = checkStepValidity("s4", "decision");
    if (!checkDecision.valid) {
      triggerExplosion(
        checkDecision.error || "Terjadi kesalahan pada KEPUTUSAN!",
      );
      return;
    }

    // Branch YA (Output)
    setActiveStep("s5a");
    await new Promise((r) => setTimeout(r, 600));
    const checkBranchYa = checkStepValidity("s5a", "io");
    if (!checkBranchYa.valid) {
      triggerExplosion(
        checkBranchYa.error || "Terjadi kesalahan pada jalur YA!",
      );
      return;
    }

    // END
    setActiveStep("s6");
    await new Promise((r) => setTimeout(r, 600));
    const checkEnd = checkStepValidity("s6", "terminator");
    if (!checkEnd.valid) {
      triggerExplosion(checkEnd.error || "Terjadi kesalahan pada END!");
      return;
    }

    executeVisualSim();
  };

  const executeVisualSim = () => {
    setLightColor("green");
    setIsHardLocked(false);
    setTimeout(() => {
      setCarAPosition(140);
      setSimulationStatus("success");
      setFeedback("✅ LOGIKA BERHASIL! Lampu berubah Hijau, Mobil A melaju.");
    }, 300);

    setTimeout(() => setActiveStep(null), 1500);
  };

  const renderSlot = (slotData: any) => {
    const isCurrent = activeStep === slotData.id;
    const isError = isCurrent && simulationStatus === "error";

    return (
      <div
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, slotData.id, slotData.group)}
        className={`relative ${slotData.width} h-[40px] rounded-xl flex items-center transition-all border-2 shrink-0
          ${
            workspace[slotData.id]
              ? "bg-white border-white shadow-md"
              : "bg-slate-200/30 border-dashed border-slate-300 hover:bg-blue-50"
          }
          ${
            isCurrent ? "ring-4 ring-blue-500/30 border-blue-400 shadow-lg" : ""
          }
          ${isError ? "ring-red-500/50 border-red-500 bg-red-50" : ""}
        `}
      >
        {workspace[slotData.id] ? (
          <motion.div
            drag="x"
            dragConstraints={{ left: -20, right: 20 }}
            className="flex items-center gap-1.5 w-full px-2 cursor-move h-full overflow-hidden"
          >
            <div
              className={`${workspace[slotData.id].shape} ${workspace[slotData.id].color} scale-75 shrink-0 shadow-sm pointer-events-none`}
            ></div>
            <span
              className={`text-[9px] font-black uppercase leading-tight truncate pointer-events-none flex-1 min-w-0 ${
                isError ? "text-red-700" : "text-slate-700"
              }`}
            >
              {slotData.placeholder}
            </span>
            {!isSimulating && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => removeSymbol(slotData.id)}
                className="ml-auto shrink-0 text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            )}
          </motion.div>
        ) : (
          <div className="flex items-center justify-center w-full pointer-events-none px-1 text-center overflow-hidden">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">
              {slotData.placeholder}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans text-sm">
      {/* Header */}
      <header className="bg-white border-b px-3 py-1.5 flex justify-between items-center shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={16} className="text-gray-600" />
          </button>
          <div className="bg-[#10b981] p-1 rounded-lg text-white shadow-sm">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-[#1e293b] uppercase leading-none italic">
              Logika Lalu Lintas
            </h1>
            <span className="text-[8px] text-slate-400 font-bold tracking-widest uppercase italic">
              Mudah
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={resetSim}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
          >
            <RotateCcw size={12} /> RESET
          </button>
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-1 px-4 py-1 text-[10px] font-black text-white rounded-lg transition-all shadow-lg ${
              isSimulating
                ? "bg-slate-300"
                : "bg-[#10b981] hover:bg-[#059669] active:scale-95"
            }`}
          >
            <Play size={12} fill="currentColor" /> JALANKAN
          </button>
          <MarkCompletedButton simulasiSlug="traffic-logic" />
        </div>
      </header>

      <main className="flex flex-1 min-h-0 overflow-hidden">
        {/* PANEL KIRI: MATERI LENGKAP */}
        <aside className="w-44 border-r bg-white flex flex-col z-20 shrink-0 shadow-sm">
          <div className="p-2 border-b bg-slate-50/50 overflow-y-auto max-h-[30%]">
            <h2 className="text-[9px] font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Info size={10} className="text-blue-500" /> KOMPONEN
            </h2>
            <div className="space-y-1.5 text-justify">
              <p className="text-[10px] text-slate-600 leading-snug font-medium">
                Diagram alir (flowchart) adalah gambar yang menunjukkan urutan
                langkah dan keputusan dalam suatu sistem. Setiap langkah
                digambarkan dengan simbol yang berbeda, seperti Start, Input,
                Proses, Keputusan, dan Output.
              </p>
              <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100 shadow-sm">
                <p className="text-[10px] text-blue-800 font-bold leading-tight italic">
                  Tugas: Buatlah diagram alir yang menunjukkan bagaimana lampu
                  lalu lintas dapat berubah menjadi hijau.
                </p>
              </div>
            </div>
          </div>

          <div className="p-2 overflow-y-auto flex-1">
            <h2 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 text-center">
              BANK SIMBOL
            </h2>
            <div className="grid grid-cols-1 gap-1.5">
              {Object.entries(SYMBOL_TYPES).map(([key, data]) => (
                <div
                  key={key}
                  draggable={!isSimulating}
                  onDragStart={(e) => handleDragStart(e, key)}
                  className={`flex flex-col items-center p-1 bg-white border border-slate-100 rounded-lg transition-all shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 group ${
                    isSimulating
                      ? "opacity-50 grayscale cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div
                    className={`${data.shape} ${data.color} mb-0.5 shadow-sm group-hover:scale-105 transition-transform scale-75`}
                  ></div>
                  <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">
                    {data.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* PANEL TENGAH: WORKSPACE (FIXED SIZE + SLIDABLE CONTENT) */}
        <section className="flex-1 bg-[#f1f5f9]/40 relative overflow-hidden p-2 flex flex-col items-center z-10 border-r shadow-inner">
          <div
            className="absolute inset-0 opacity-[0.1] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          ></div>

          <div className="w-full max-w-[340px] flex flex-col items-center scale-[0.8] origin-top">
            <div className="">{renderSlot(FLOWCHART_STRUCTURE.start)}</div>
            <ArrowDown className="text-slate-300 my-1" size={16} />

            <div className="">{renderSlot(FLOWCHART_STRUCTURE.input)}</div>
            <ArrowDown className="text-slate-300 my-1" size={16} />

            <div className="">{renderSlot(FLOWCHART_STRUCTURE.process)}</div>
            <ArrowDown className="text-slate-300 my-1" size={16} />

            <div className="mb-2">
              {renderSlot(FLOWCHART_STRUCTURE.decision)}
            </div>

            <div className="flex w-full gap-4 relative items-start mb-4">
              <div className="flex-1 flex flex-col items-center min-w-0">
                <div className="flex items-center w-full mb-1">
                  <div className="h-[2px] bg-slate-300 flex-1"></div>
                  <span className="px-2 text-[9px] font-black text-blue-500 uppercase">
                    Ya
                  </span>
                </div>
                <div className="w-full">
                  {renderSlot(FLOWCHART_STRUCTURE.branchYa)}
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center min-w-0">
                <div className="flex items-center w-full mb-1">
                  <span className="px-2 text-[9px] font-black text-slate-400 uppercase">
                    Tidak
                  </span>
                  <div className="h-[2px] bg-slate-300 flex-1"></div>
                </div>
                <div className="w-full">
                  {renderSlot(FLOWCHART_STRUCTURE.branchTidak)}
                </div>
              </div>
            </div>

            <div className="flex w-full justify-around mb-1 opacity-20">
              <ArrowDown size={14} className="text-slate-500" />
              <ArrowDown size={14} className="text-slate-500" />
            </div>

            <div className="">{renderSlot(FLOWCHART_STRUCTURE.end)}</div>
          </div>
        </section>

        {/* PANEL KANAN: SIMULATOR VISUAL */}
        <aside className="w-[440px] bg-white flex flex-col z-20 shrink-0 shadow-2xl border-l">
          <div className="p-2 border-b bg-slate-50 flex items-center justify-between px-3 shrink-0">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">
              Simulation View
            </span>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)] ${
                  hardwareBroken
                    ? "bg-red-600 animate-ping"
                    : lightColor === "red"
                      ? "bg-red-500 animate-pulse"
                      : "bg-green-500"
                }`}
              ></div>
              <span
                className={`text-[10px] font-black uppercase tracking-tighter ${
                  hardwareBroken ? "text-red-600" : ""
                }`}
              >
                {hardwareBroken
                  ? "SYSTEM ERROR"
                  : lightColor === "red"
                    ? "STOP"
                    : "GO"}
              </span>
            </div>
          </div>

          <div className="flex-1 bg-[#1a0f1a] relative overflow-hidden flex items-center justify-center shadow-inner">
            <div className="absolute w-56 h-full bg-[#241724] border-x-4 border-slate-900/40 shadow-inner"></div>
            <div className="absolute h-56 w-full bg-[#241724] border-y-4 border-slate-900/40 shadow-inner"></div>

            {/* Efek Ledakan / Kerusakan */}
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

            <div className="absolute left-[18%] top-[20%] z-40">
              <div
                className={`bg-[#0a050a] p-2 rounded-2xl border-2 border-slate-800 shadow-2xl flex flex-col gap-2 scale-110 transition-all ${
                  hardwareBroken ? "rotate-12 translate-x-2 border-red-500" : ""
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full transition-all duration-300 ${
                    hardwareBroken
                      ? "bg-red-900 animate-ping"
                      : lightColor === "red"
                        ? "bg-red-500 shadow-[0_0_15px_#ef4444]"
                        : "bg-red-950/20"
                  }`}
                ></div>
                <div
                  className={`w-4 h-4 rounded-full mx-auto ${
                    hardwareBroken ? "bg-amber-900" : "bg-amber-950/20"
                  }`}
                ></div>
                <div
                  className={`w-5 h-5 rounded-full transition-all duration-300 ${
                    hardwareBroken
                      ? "bg-green-900"
                      : lightColor === "green"
                        ? "bg-[#10b981] shadow-[0_0_15px_#10b981]"
                        : "bg-green-950/20"
                  }`}
                ></div>
              </div>
              <div className="w-2 h-16 bg-gradient-to-b from-slate-800 to-slate-900 mx-auto -mt-1 rounded-b-xl opacity-40"></div>
            </div>

            <motion.div
              animate={{ left: `${carAPosition}%` }}
              initial={{ left: "2%" }}
              transition={{
                duration: isHardLocked ? 0.3 : 2.5,
                ease: "easeInOut",
              }}
              className="absolute z-30 flex flex-col items-start gap-1"
            >
              <div className="bg-[#3b82f6] px-3 py-0.5 rounded shadow-2xl border border-blue-400/50 ml-2">
                <span className="text-[9px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                  Mobil A
                </span>
              </div>
              <div className="w-24 h-12 bg-[#3b82f6] rounded-2xl shadow-2xl relative flex items-center justify-start border-b-[6px] border-[#1d4ed8]">
                <div className="w-8 h-8 bg-[#93c5fd] rounded-xl ml-auto mr-2 opacity-40 shadow-inner"></div>
                <div className="absolute -bottom-2.5 left-4 w-6 h-6 bg-slate-950 rounded-full border-[4px] border-slate-900 shadow-xl"></div>
                <div className="absolute -bottom-2.5 right-4 w-6 h-6 bg-slate-950 rounded-full border-[4px] border-slate-900 shadow-xl"></div>
              </div>
            </motion.div>

            <div className="absolute left-[50%] -translate-x-1/2 w-12 h-full z-20 pointer-events-none">
              <AnimatePresence>
                {lightColor === "red" && (
                  <motion.div
                    key="traffic-active"
                    initial={{ top: "-35%", opacity: 0 }}
                    animate={{ top: "135%", opacity: 1 }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute w-12 h-20 bg-[#525252] rounded-2xl shadow-2xl border-r-[8px] border-[#404040] flex flex-col items-center justify-end pb-3"
                  >
                    <div className="w-8 h-6 bg-[#f8fafc]/10 rounded-lg border border-white/5"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div
            className={`p-3 border-t h-20 flex flex-col justify-center transition-colors duration-500 shrink-0 ${
              simulationStatus === "success"
                ? "bg-green-50/80 border-green-100"
                : simulationStatus === "error"
                  ? "bg-red-50"
                  : "bg-white"
            }`}
          >
            <div className="flex items-center gap-2 px-2">
              <div
                className={`shrink-0 p-1.5 rounded-xl shadow-sm ${
                  simulationStatus === "success"
                    ? "bg-white text-green-600 shadow-md"
                    : simulationStatus === "error"
                      ? "bg-white text-red-500 shadow-md"
                      : "bg-slate-50 text-slate-300"
                }`}
              >
                {simulationStatus === "success" ? (
                  <CheckCircle2 size={20} />
                ) : simulationStatus === "error" ? (
                  <Zap size={20} />
                ) : (
                  <HelpCircle size={20} />
                )}
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 tracking-tighter">
                  Laporan Logika
                </h3>
                <p
                  className={`text-[9px] font-bold leading-tight ${
                    simulationStatus === "success"
                      ? "text-green-900"
                      : simulationStatus === "error"
                        ? "text-red-900"
                        : "text-slate-600"
                  }`}
                >
                  {feedback ||
                    "Lengkapi flowchart dengan menarik simbol ke dalam kotak teks yang sesuai."}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="bg-white border-t px-3 py-0.5 text-[7px] font-bold text-slate-300 flex justify-between items-center shrink-0 uppercase tracking-widest opacity-60 italic">
        <div className="flex gap-2 items-center">
          <span>STABLE ENGINE v5.5</span>
          <span className="text-slate-200">|</span>
          <span>INTERACTIVE SLIDING SYMBOLS</span>
        </div>
        <span>TRAFFIC LAB ACADEMY</span>
      </footer>
    </div>
  );
}
