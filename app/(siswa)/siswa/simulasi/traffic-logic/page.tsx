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
  Lightbulb,
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
    width: "w-56",
  },
  input: {
    id: "s2",
    group: "io",
    placeholder: "INPUT: WARNA LAMPU",
    width: "w-56",
  },
  process: {
    id: "s3",
    group: "process",
    placeholder: "PROSES: BACA SENSOR",
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
    placeholder: "OUTPUT: LAMPU = HIJAU",
    width: "w-full",
  },
  branchTidak: {
    id: "s5b",
    group: "io",
    placeholder: "OUTPUT: LAMPU TETAP",
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
        className={`relative ${slotData.width} h-12 rounded-2xl flex items-center transition-all border-2 shrink-0
          ${
            workspace[slotData.id]
              ? "bg-white border-slate-200 shadow-md"
              : "bg-white/60 border-dashed border-slate-300 hover:bg-blue-50 hover:border-blue-300"
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
                isError ? "text-red-700" : "text-slate-700"
              }`}
            >
              {slotData.placeholder}
            </span>
            {!isSimulating && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => removeSymbol(slotData.id)}
                className="ml-auto shrink-0 text-slate-300 hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}
          </motion.div>
        ) : (
          <div className="flex items-center justify-center w-full pointer-events-none px-3 text-center overflow-hidden">
            <span className="text-[11px] font-medium text-slate-400 truncate">
              {slotData.placeholder}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#fafbfc] overflow-hidden font-sans text-sm">
      {/* Header */}
      <header className="px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ArrowLeft size={14} /> Kembali
          </button>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="bg-green-600 p-2 rounded-xl text-white shadow-green-100 shadow-lg">
            <CheckCircle2 size={20} />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-lg font-black tracking-tighter text-slate-800 uppercase italic leading-none">
                Logika Lalu Lintas
              </h1>
            </div>
            <span className="text-[8px] text-green-600 font-bold tracking-widest uppercase italic bg-green-50 px-2 py-0.5 rounded border border-green-200">
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
          <MarkCompletedButton simulasiSlug="traffic-logic" />
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 ${
              isSimulating
                ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                : "bg-gradient-to-br from-[#16a34a] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-white"
            }`}
          >
            <Play size={14} fill={isSimulating ? "none" : "white"} /> Jalankan
          </button>
        </div>
      </header>

      <main className="flex flex-1 min-h-0 overflow-hidden">
        {/* PANEL KIRI */}
        <aside className="w-64 border-r bg-white flex flex-col z-20 shrink-0 overflow-y-auto">
          {/* Deskripsi */}
          <div className="p-5 border-b flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-blue-500/60" />
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Deskripsi Tugas
              </h2>
            </div>
            <div className="p-4 rounded-2xl border bg-blue-50 border-blue-100 shadow-sm">
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Diagram alir (flowchart) adalah gambar yang menunjukkan urutan
                langkah dan keputusan dalam suatu sistem. Setiap langkah
                digambarkan dengan simbol yang berbeda.
              </p>
            </div>
          </div>

          {/* Bank Simbol */}
          <div className="p-5 flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-slate-400/60" />
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Bank Simbol
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SYMBOL_TYPES).map(([key, data]) => (
                <div
                  key={key}
                  draggable={!isSimulating}
                  onDragStart={(e) => handleDragStart(e, key)}
                  className={`flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl transition-all shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md group ${
                    isSimulating
                      ? "opacity-50 grayscale cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div
                    className={`${data.shape} ${data.color} shadow-sm group-hover:scale-110 transition-transform`}
                  ></div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight text-center leading-tight">
                    {data.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* MISI BANNER */}
          <section className="px-6 pt-5 pb-3 shrink-0">
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
                    Logika Lalu Lintas
                  </h2>
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                  Buatlah diagram alir yang menunjukkan bagaimana sistem membaca
                  warna lampu lalu lintas dan menentukan apakah lampu berubah
                  menjadi hijau sehingga kendaraan bisa melaju.
                </p>
              </div>
            </div>
          </section>

          <div className="flex-1 flex overflow-hidden">
            {/* PANEL TENGAH: WORKSPACE */}
            <section className="flex-1 bg-slate-50 relative overflow-auto flex flex-col items-center justify-start py-10 z-10 border-r">
              <div
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(#64748b 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              ></div>

              <div className="relative flex flex-col items-center gap-2">
                <div>{renderSlot(FLOWCHART_STRUCTURE.start)}</div>
                <ArrowDown className="text-slate-300" size={18} />

                <div>{renderSlot(FLOWCHART_STRUCTURE.input)}</div>
                <ArrowDown className="text-slate-300" size={18} />

                <div>{renderSlot(FLOWCHART_STRUCTURE.process)}</div>
                <ArrowDown className="text-slate-300" size={18} />

                <div>{renderSlot(FLOWCHART_STRUCTURE.decision)}</div>

                {/* Cabang Ya / Tidak */}
                <div className="flex w-full gap-6 relative items-start mt-2">
                  <div className="flex-1 flex flex-col items-center min-w-0">
                    <div className="flex items-center w-full mb-2">
                      <div className="h-[2px] bg-slate-300 flex-1"></div>
                      <span className="px-2 text-[10px] font-black text-blue-500 uppercase">
                        Ya
                      </span>
                    </div>
                    <div className="w-full">
                      {renderSlot(FLOWCHART_STRUCTURE.branchYa)}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center min-w-0">
                    <div className="flex items-center w-full mb-2">
                      <span className="px-2 text-[10px] font-black text-slate-400 uppercase">
                        Tidak
                      </span>
                      <div className="h-[2px] bg-slate-300 flex-1"></div>
                    </div>
                    <div className="w-full">
                      {renderSlot(FLOWCHART_STRUCTURE.branchTidak)}
                    </div>
                  </div>
                </div>

                <div className="flex w-full justify-around mt-1">
                  <ArrowDown size={18} className="text-slate-300" />
                  <ArrowDown size={18} className="text-slate-300" />
                </div>

                <div>{renderSlot(FLOWCHART_STRUCTURE.end)}</div>
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
                      hardwareBroken
                        ? "rotate-12 translate-x-2 border-red-500"
                        : ""
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
          </div>
        </div>
      </main>
    </div>
  );
}
