"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Play,
  RotateCcw,
  Info,
  Trash2,
  ArrowDown,
  CheckCircle2,
  HelpCircle,
  Zap,
  Terminal,
  MousePointerClick,
  AlertOctagon,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MarkCompletedButton from "@/components/MarkCompletedButton";

// --- Konfigurasi Simbol (Standard Algoritma) ---
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
    label: "Proses (Action)",
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

const FLOW_MAP = {
  header: [
    {
      id: "step_start",
      type: "TERMINATOR",
      label: "START",
      fixed: true,
      group: "terminator",
    },
    {
      id: "step_input",
      type: "IO",
      label: "Input: warna_lampu",
      fixed: true,
      group: "io",
    },
    {
      id: "step_decide",
      placeholder: "Apakah warna_lampu = MERAH?",
      group: "decision",
    },
  ],
  pathYa: [
    { id: "ya_p1", placeholder: "lampu kuning", group: "io" },
    { id: "ya_p2", placeholder: "Proses: Tunggu 2 detik", group: "process" },
    { id: "ya_p3", placeholder: "Proses: lampu hijau", group: "process" },
  ],
  pathTidak: [{ id: "no_out", placeholder: "Lampu Tetap", group: "io" }],
  footer: [
    {
      id: "step_end",
      type: "TERMINATOR",
      label: "END",
      fixed: true,
      group: "terminator",
    },
  ],
};

export default function TrafficDebugPage() {
  const [workspace, setWorkspace] = useState<Record<string, any>>({
    step_start: { ...SYMBOL_TYPES.TERMINATOR, label: "START" },
    step_input: { ...SYMBOL_TYPES.IO, label: "INPUT: WARNA_LAMPU" },
    step_end: { ...SYMBOL_TYPES.TERMINATOR, label: "END" },
  });

  const [lightColor, setLightColor] = useState("red");
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState("idle");
  const [feedback, setFeedback] = useState("");
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [carAPosition, setCarAPosition] = useState(2);
  const [isHardLocked, setIsHardLocked] = useState(true);
  const [hardwareBroken, setHardwareBroken] = useState(false);

  const [awaitingDecision, setAwaitingDecision] = useState(false);
  const decisionResolver = useRef<((value: string) => void) | null>(null);

  const handleDragStart = (e: React.DragEvent, typeKey: string) => {
    if (isSimulating) {
      e.preventDefault();
      return;
    }
    setDraggedType(typeKey);
  };

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    if (!draggedType) return;
    setWorkspace((prev) => ({
      ...prev,
      [slotId]: { ...SYMBOL_TYPES[draggedType as keyof typeof SYMBOL_TYPES] },
    }));
    setDraggedType(null);
  };

  const removeSymbol = (slotId: string) => {
    const isFixed =
      slotId === "step_start" ||
      slotId === "step_input" ||
      slotId === "step_end";
    if (isSimulating || isFixed) return;
    setWorkspace((prev) => {
      const newWs = { ...prev };
      delete newWs[slotId];
      return newWs;
    });
  };

  const resetSim = () => {
    setIsSimulating(false);
    setActiveStep(null);
    setSimulationStatus("idle");
    setFeedback("");
    setCarAPosition(2);
    setIsHardLocked(true);
    setLightColor("red");
    setAwaitingDecision(false);
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
    resetSim();
    setIsSimulating(true);
    setSimulationStatus("running");
    setFeedback("Menjalankan sistem...");

    // 1. Jalankan Header (Start -> Input -> Decide)
    for (const step of FLOW_MAP.header) {
      setActiveStep(step.id);

      // Validasi saat itu juga
      const check = checkStepValidity(step.id, step.group);
      if (!check.valid) {
        await new Promise((r) => setTimeout(r, 600));
        triggerExplosion(check.error || "Terjadi kesalahan pada langkah ini!");
        return;
      }

      if (step.id === "step_decide") {
        setAwaitingDecision(true);
        const choice = await new Promise<string>((resolve) => {
          decisionResolver.current = resolve;
        });

        if (choice === "YA") {
          // Masuk ke Jalur YA
          for (const yStep of FLOW_MAP.pathYa) {
            setActiveStep(yStep.id);
            const yCheck = checkStepValidity(yStep.id, yStep.group);
            if (!yCheck.valid) {
              await new Promise((r) => setTimeout(r, 600));
              triggerExplosion(
                yCheck.error || "Terjadi kesalahan pada jalur YA!",
              );
              return;
            }

            if (yStep.id === "ya_p1") {
              setLightColor("yellow");
              await new Promise((r) => setTimeout(r, 800));
            } else if (yStep.id === "ya_p2") {
              await new Promise((r) => setTimeout(r, 1500));
            } else if (yStep.id === "ya_p3") {
              setLightColor("green");
              setIsHardLocked(false);
              await new Promise((r) => setTimeout(r, 800));
            }
          }
          setSimulationStatus("success");
          setCarAPosition(140);
          setFeedback("✅ BERHASIL! Alur logika dieksekusi dengan sempurna.");
        } else {
          // Masuk ke Jalur TIDAK
          setActiveStep("no_out");
          const nCheck = checkStepValidity("no_out", "io");
          if (!nCheck.valid) {
            await new Promise((r) => setTimeout(r, 600));
            triggerExplosion(
              nCheck.error || "Terjadi kesalahan pada jalur TIDAK!",
            );
            return;
          }
          await new Promise((r) => setTimeout(r, 1000));
          setFeedback("⚠️ Memilih jalur TIDAK: Lampu tetap merah.");
        }
      } else {
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    // End
    setActiveStep("step_end");
    await new Promise((r) => setTimeout(r, 800));
    setActiveStep(null);
  };

  const renderSlot = (slotData: any, customWidth = "w-52") => {
    const isPlaced = workspace[slotData.id];
    const isFixed = slotData.fixed;
    const isCurrent = activeStep === slotData.id;
    const isError = isCurrent && simulationStatus === "error";

    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => !isFixed && handleDrop(e, slotData.id)}
        className={`relative ${customWidth} h-[42px] rounded-xl flex items-center transition-all border-2 shrink-0
          ${
            isPlaced
              ? "bg-white border-white shadow-md"
              : "bg-slate-200/30 border-dashed border-slate-300"
          }
          ${
            isCurrent ? "ring-4 ring-blue-500/30 border-blue-400 shadow-lg" : ""
          }
          ${isError ? "ring-red-500/50 border-red-500 bg-red-50" : ""}
        `}
      >
        {isPlaced ? (
          <div className="flex items-center gap-1.5 w-full px-2 h-full overflow-hidden">
            <div
              className={`${workspace[slotData.id].shape} ${workspace[slotData.id].color} scale-[0.6] shrink-0 shadow-sm`}
            ></div>
            <span
              className={`text-[8px] font-black uppercase leading-tight truncate flex-1 min-w-0 ${
                isError ? "text-red-700" : "text-slate-700"
              }`}
            >
              {isFixed ? workspace[slotData.id].label : slotData.placeholder}
            </span>
            {!isSimulating && !isFixed && (
              <button
                onClick={() => removeSymbol(slotData.id)}
                className="ml-auto shrink-0 text-slate-300 hover:text-red-500"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full px-1 text-center opacity-40 overflow-hidden">
            <span className="text-[7px] font-bold uppercase italic truncate">
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
      <header className="bg-white border-b px-4 py-2 flex justify-between items-center shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/siswa/simulasi"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div className="bg-amber-500 p-1.5 rounded-lg text-white shadow-sm">
            <Zap size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-[#1e293b] uppercase leading-none italic">
              Transisi Lampu Bertahap
            </h1>
            <span className="text-[10px] text-amber-600 font-bold tracking-widest uppercase italic">
              Sedang
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetSim}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
          >
            <RotateCcw size={14} /> RESET
          </button>
          <button
            onClick={runSimulation}
            disabled={isSimulating && simulationStatus !== "error"}
            className={`flex items-center gap-2 px-8 py-2.5 text-xs font-black text-white rounded-lg transition-all shadow-lg ${
              isSimulating && simulationStatus !== "error"
                ? "bg-slate-300"
                : "bg-amber-500 hover:bg-amber-600 active:scale-95"
            }`}
          >
            <Play size={14} fill="currentColor" /> JALANKAN
          </button>
          <MarkCompletedButton simulasiSlug="traffic-debug" />
        </div>
      </header>

      <main className="flex flex-1 min-h-0 overflow-hidden">
        {/* PANEL KIRI */}
        <aside className="w-56 border-r bg-white flex flex-col z-20 shrink-0 shadow-sm">
          <div className="p-3 border-b bg-slate-50/50 overflow-y-auto max-h-[35%]">
            <h2 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Info size={12} className="text-blue-500" /> KOMPONEN
            </h2>
            <div className="space-y-2 text-justify">
              <p className="text-[9px] text-slate-600 leading-relaxed font-medium">
                Diagram alir (flowchart) adalah gambar yang menunjukkan urutan
                langkah dan keputusan dalam suatu sistem. Pada lampu lalu
                lintas, flowchart membantu kita memahami bagaimana sistem
                membaca warna lampu, memproses perubahan, lalu menentukan
                hasilnya secara berurutan.
              </p>
              <div className="bg-blue-50 p-2 rounded-xl border border-blue-100 shadow-sm">
                <p className="text-[9px] text-blue-800 font-bold leading-snug italic">
                  Tugas: Buatlah diagram alir yang menunjukkan bagaimana lampu
                  lalu lintas dapat berubah dari Merah → Kuning → Hijau secara
                  bertahap (dengan proses tunggu 2 detik sebelum menjadi hijau).
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 overflow-y-auto flex-1">
            <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 text-center">
              BANK SIMBOL
            </h2>
            <div className="grid grid-cols-1 gap-1.5">
              {Object.entries(SYMBOL_TYPES)
                .filter(([k]) => k !== "TERMINATOR")
                .map(([key, data]) => (
                  <div
                    key={key}
                    draggable={!isSimulating}
                    onDragStart={(e) => handleDragStart(e, key)}
                    className={`flex flex-col items-center p-1.5 bg-white border-2 border-slate-100 rounded-lg transition-all shadow-sm cursor-grab active:cursor-grabbing hover:border-amber-400 group ${
                      isSimulating && simulationStatus !== "error"
                        ? "opacity-50 grayscale"
                        : ""
                    }`}
                  >
                    <div
                      className={`${data.shape} ${data.color} mb-1 shadow-sm group-hover:scale-105 transition-transform`}
                    ></div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                      {data.label}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </aside>

        {/* PANEL TENGAH */}
        <section className="flex-1 bg-[#f1f5f9]/40 relative overflow-y-auto p-4 flex flex-col items-center z-10 border-r shadow-inner">
          <div
            className="absolute inset-0 opacity-[0.1] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          ></div>

          <div className="w-full max-w-[380px] flex flex-col items-center py-2">
            {FLOW_MAP.header.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="mb-0.5">{renderSlot(step, "w-full")}</div>
                <ArrowDown className="text-slate-300 mb-0.5" size={12} />
              </React.Fragment>
            ))}

            <div className="flex w-full gap-3 items-start px-1 mt-0.5">
              <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full mb-0.5">
                  <div className="h-[2px] bg-slate-200 flex-1"></div>
                  <span className="px-2 text-[9px] font-black text-slate-400 uppercase">
                    YA
                  </span>
                </div>
                {FLOW_MAP.pathYa.map((step, idx) => (
                  <React.Fragment key={step.id}>
                    <div className="w-full mb-0.5">
                      {renderSlot(step, "w-full")}
                    </div>
                    {idx < FLOW_MAP.pathYa.length - 1 && (
                      <ArrowDown className="text-slate-200 mb-0.5" size={12} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full mb-0.5">
                  <span className="px-2 text-[9px] font-black text-slate-400 uppercase">
                    TIDAK
                  </span>
                  <div className="h-[2px] bg-slate-200 flex-1"></div>
                </div>
                <div className="w-full mb-0.5">
                  {renderSlot(FLOW_MAP.pathTidak[0], "w-full")}
                </div>
                <div className="flex-1 h-[95px] w-full flex items-center justify-center opacity-5">
                  <div className="h-full w-[2px] bg-slate-500 border-dashed border-l-2"></div>
                </div>
              </div>
            </div>

            <div className="flex w-full justify-around mt-0.5 opacity-20">
              <ArrowDown size={14} className="text-slate-500" />
              <ArrowDown size={14} className="text-slate-500" />
            </div>
            <div className="w-full mt-0.5">
              {renderSlot(FLOW_MAP.footer[0], "w-full")}
            </div>
          </div>
        </section>

        {/* PANEL KANAN: HARDWARE SIMULATOR */}
        <aside className="w-80 bg-white flex flex-col z-20 shrink-0 shadow-2xl border-l">
          <div className="p-3 border-b bg-slate-50 flex items-center justify-between px-6 shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
              Hardware Status
            </span>
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)] 
                ${
                  hardwareBroken
                    ? "bg-red-600 animate-ping"
                    : lightColor === "red"
                      ? "bg-red-500 animate-pulse"
                      : lightColor === "yellow"
                        ? "bg-amber-500"
                        : "bg-green-500"
                }`}
              ></div>
              <span
                className={`text-[10px] font-black uppercase tracking-tighter ${
                  hardwareBroken ? "text-red-600" : ""
                }`}
              >
                {hardwareBroken ? "SYSTEM ERROR" : lightColor.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex-1 bg-[#1a0f1a] relative overflow-hidden flex items-center justify-center shadow-inner">
            <div className="absolute w-44 h-full bg-[#241724] border-x-4 border-slate-900/40 shadow-inner"></div>
            <div className="absolute h-44 w-full bg-[#241724] border-y-4 border-slate-900/40 shadow-inner"></div>

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

            {/* Input Decision UI */}
            <AnimatePresence>
              {awaitingDecision && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-md p-8"
                >
                  <div className="bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-400 text-center max-w-[280px]">
                    <MousePointerClick
                      className="mx-auto text-amber-500 mb-3"
                      size={32}
                    />
                    <h3 className="text-slate-900 font-black text-xs uppercase mb-1">
                      Cek Kondisi
                    </h3>
                    <p className="text-slate-500 text-[10px] mb-4 leading-tight">
                      Lampu saat ini menyala MERAH. Apakah ini sesuai alur?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          decisionResolver.current?.("YA");
                          setAwaitingDecision(false);
                        }}
                        className="flex-1 bg-blue-600 text-white font-black text-[10px] py-3 rounded-xl shadow-lg active:scale-95 uppercase"
                      >
                        YA (Merah)
                      </button>
                      <button
                        onClick={() => {
                          decisionResolver.current?.("TIDAK");
                          setAwaitingDecision(false);
                        }}
                        className="flex-1 bg-slate-200 text-slate-700 font-black text-[10px] py-3 rounded-xl shadow-lg active:scale-95 uppercase"
                      >
                        TIDAK
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tiang Lampu */}
            <div className="absolute left-[18%] top-[22%] z-40">
              <div
                className={`bg-[#0a050a] p-2 rounded-2xl border-2 border-slate-800 shadow-2xl flex flex-col gap-2 transition-all ${
                  hardwareBroken ? "rotate-12 translate-x-2 border-red-500" : ""
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    hardwareBroken
                      ? "bg-red-900 animate-ping"
                      : lightColor === "red"
                        ? "bg-red-500 shadow-[0_0_12px_#ef4444]"
                        : "bg-red-950/20"
                  }`}
                ></div>
                <div
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    hardwareBroken
                      ? "bg-amber-900"
                      : lightColor === "yellow"
                        ? "bg-amber-500 shadow-[0_0_12px_#f59e0b]"
                        : "bg-amber-950/20"
                  }`}
                ></div>
                <div
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    hardwareBroken
                      ? "bg-green-900"
                      : lightColor === "green"
                        ? "bg-[#10b981] shadow-[0_0_12px_#10b981]"
                        : "bg-green-950/20"
                  }`}
                ></div>
              </div>
              <div className="w-2 h-14 bg-gradient-to-b from-slate-800 to-slate-900 mx-auto -mt-1 rounded-b-xl opacity-40"></div>
            </div>

            {/* Mobil A */}
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

            {/* Arus Mobil B */}
            <div className="absolute left-[50%] -translate-x-1/2 w-12 h-full z-20 pointer-events-none">
              <AnimatePresence>
                {lightColor === "red" && !hardwareBroken && (
                  <motion.div
                    key="stream"
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
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 tracking-tighter">
                  Laporan Logika
                </h3>
                <p
                  className={`text-[10px] font-bold leading-tight ${
                    simulationStatus === "success"
                      ? "text-green-900"
                      : simulationStatus === "error"
                        ? "text-red-900"
                        : "text-slate-600"
                  }`}
                >
                  {feedback ||
                    "Lengkapi alur dan tekan JALANKAN untuk melihat apakah logika sistem stabil."}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="bg-white border-t px-6 py-1 text-[9px] font-bold text-slate-300 flex justify-between items-center shrink-0 uppercase tracking-widest opacity-60 italic">
        <div className="flex gap-4 items-center font-black text-slate-400">
          <span>STABLE ENGINE v6.1s</span>
          <span className="text-slate-200">|</span>
          <span>HARDWARE MALFUNCTION SIMULATION</span>
        </div>
        <span>TRAFFIC LAB ACADEMY</span>
      </footer>
    </div>
  );
}
