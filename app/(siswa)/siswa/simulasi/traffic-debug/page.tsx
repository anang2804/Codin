"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Activity,
  Lightbulb,
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
  const router = useRouter();
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
        className={`relative ${customWidth} h-[40px] rounded-lg flex items-center transition-all border shrink-0
          ${
            isPlaced
              ? "bg-card border-border shadow-md"
              : "bg-muted/30 border-dashed border-border"
          }
          ${
            isCurrent ? "ring-2 ring-blue-500/30 border-blue-400 shadow-lg" : ""
          }
          ${isError ? "ring-red-500/50 border-red-500 bg-red-50" : ""}
        `}
      >
        {isPlaced ? (
          <div className="flex items-center gap-2 w-full px-2.5 h-full overflow-hidden">
            <div
              className={`${workspace[slotData.id].shape} ${workspace[slotData.id].color} scale-[0.38] shrink-0 shadow-sm`}
            ></div>
            <span
              className={`text-[9px] font-black uppercase leading-tight truncate flex-1 min-w-0 ${
                isError ? "text-red-700" : "text-foreground"
              }`}
            >
              {isFixed ? workspace[slotData.id].label : slotData.placeholder}
            </span>
            {!isSimulating && !isFixed && (
              <button
                onClick={() => removeSymbol(slotData.id)}
                className="ml-auto shrink-0 text-muted-foreground hover:text-red-500"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full px-1.5 text-center opacity-40 overflow-hidden">
            <span className="text-[8px] font-bold uppercase italic truncate">
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
      <header className="bg-background border-b border-border px-6 py-3 flex justify-between items-center shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft size={16} className="text-muted-foreground" />
          </button>
          <div className="bg-amber-500 p-1 rounded-lg text-white shadow-sm">
            <Zap size={16} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-foreground uppercase leading-none italic">
              Transisi Lampu Bertahap
            </h1>
            <span className="text-[8px] text-amber-600 font-bold tracking-widest uppercase italic">
              Menengah
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={resetSim}
            className="flex items-center gap-1 px-3 py-2 text-[10px] font-bold bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0] border border-[#e2e8f0] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
          >
            <RotateCcw size={12} /> RESET
          </button>
          <button
            onClick={runSimulation}
            disabled={isSimulating && simulationStatus !== "error"}
            className={`flex items-center gap-1 px-4 py-2 text-[10px] font-bold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 ${
              isSimulating && simulationStatus !== "error"
                ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                : "bg-gradient-to-br from-[#16a34a] to-[#22c55e] hover:from-[#22c55e] hover:to-[#16a34a] text-white"
            }`}
          >
            <Play size={12} fill="currentColor" /> JALANKAN
          </button>
          <MarkCompletedButton simulasiSlug="traffic-debug" />
        </div>
      </header>

      <main className="flex flex-1 min-h-0 overflow-hidden">
        {/* PANEL KIRI */}
        <aside className="w-72 border-r border-border bg-card flex flex-col z-20 shrink-0 shadow-sm overflow-y-auto">
          <div className="p-2 border-b bg-muted/40 overflow-y-auto max-h-[30%]">
            <h2 className="text-[9px] font-bold text-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <Info size={10} className="text-blue-500" /> DESKRIPSI PERINTAH
            </h2>
            <div className="space-y-1.5 text-justify">
              <p className="text-[10px] text-muted-foreground leading-snug font-medium">
                Diagram alir (flowchart) adalah gambar yang menunjukkan urutan
                langkah dan keputusan dalam suatu sistem. Pada lampu lalu
                lintas, flowchart membantu kita memahami bagaimana sistem
                membaca warna lampu, memproses perubahan, lalu menentukan
                hasilnya secara berurutan.
              </p>
              <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100 shadow-sm">
                <p className="text-[10px] text-blue-800 font-bold leading-tight italic">
                  Tugas: Buatlah diagram alir yang menunjukkan bagaimana lampu
                  lalu lintas dapat berubah dari Merah → Kuning → Hijau secara
                  bertahap (dengan proses tunggu 2 detik sebelum menjadi hijau).
                </p>
              </div>
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
            <div className="grid grid-cols-1 gap-1.5">
              {Object.entries(SYMBOL_TYPES)
                .filter(([k]) => k !== "TERMINATOR")
                .map(([key, data]) => (
                  <div
                    key={key}
                    draggable={!isSimulating}
                    onDragStart={(e) => handleDragStart(e, key)}
                    className={`flex flex-col items-center p-1 bg-card border border-border rounded-lg transition-all shadow-sm cursor-grab active:cursor-grabbing hover:border-amber-400 group ${
                      isSimulating && simulationStatus !== "error"
                        ? "opacity-50 grayscale"
                        : ""
                    }`}
                  >
                    <div
                      className={`${data.shape} ${data.color} mb-0.5 shadow-sm group-hover:scale-105 transition-transform scale-75`}
                    ></div>
                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">
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

        {/* PANEL TENGAH */}
        <section className="flex-1 bg-background relative overflow-hidden p-2 flex flex-col items-center z-10 border-r border-border shadow-inner">
          <div className="w-full px-4 pt-3 pb-2">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
              <div className="bg-background p-2 rounded-xl shadow-sm text-primary">
                <Lightbulb size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded uppercase tracking-widest">
                    MISI
                  </span>
                  <h2 className="text-[15px] font-black text-foreground uppercase tracking-tight">
                    Transisi Lampu Bertahap
                  </h2>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                  Susun diagram alir agar lampu lalu lintas dapat bertransisi
                  dari merah ke kuning lalu hijau secara bertahap.
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {simulationStatus === "success" && (
              <motion.section
                key="success-card"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full px-4 pb-2"
              >
                <div className="bg-card border border-emerald-200 rounded-2xl px-4 py-3 shadow-sm">
                  <h3 className="text-sm font-black text-emerald-700 tracking-tight">
                    🎉 Berhasil! Diagram alir benar
                  </h3>
                  <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed font-medium">
                    Alur logika berjalan sesuai urutan keputusan.
                    <br />
                    Lampu berhasil transisi dari merah → kuning → hijau,
                    kemudian kendaraan dapat melintas.
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="w-full px-4 pb-2">
            <div className="px-5 py-3 bg-muted/40 border border-border rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSimulating
                      ? "bg-rose-500 animate-pulse"
                      : simulationStatus === "error"
                        ? "bg-red-500 shadow-[0_0_5px_red]"
                        : "bg-emerald-500"
                  }`}
                />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic font-mono">
                  ALGORITMA TRANSISI LAMPU
                </span>
              </div>
              <div
                className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${
                  isSimulating
                    ? "bg-rose-500 text-white"
                    : simulationStatus === "error"
                      ? "bg-red-500 text-white border-red-600 shadow-sm"
                      : "bg-background text-muted-foreground border-border"
                }`}
              >
                {isSimulating
                  ? "RUNNING"
                  : simulationStatus === "error"
                    ? "ERROR"
                    : "SIAP MENULIS"}
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 opacity-[0.1] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          ></div>

          <div className="w-full max-w-[380px] flex flex-col items-center scale-[0.8] origin-top">
            {FLOW_MAP.header.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="">{renderSlot(step, "w-full")}</div>
                <ArrowDown
                  className="text-muted-foreground/60 my-1"
                  size={16}
                />
              </React.Fragment>
            ))}

            <div className="flex w-full gap-4 items-start px-1 mt-1.5">
              <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full mb-1">
                  <div className="h-[2px] bg-border flex-1"></div>
                  <span className="px-2 text-[9px] font-black text-muted-foreground uppercase">
                    YA
                  </span>
                </div>
                {FLOW_MAP.pathYa.map((step, idx) => (
                  <React.Fragment key={step.id}>
                    <div className="w-full">{renderSlot(step, "w-full")}</div>
                    {idx < FLOW_MAP.pathYa.length - 1 && (
                      <ArrowDown
                        className="text-muted-foreground/50 my-1"
                        size={14}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full mb-1">
                  <span className="px-2 text-[9px] font-black text-muted-foreground uppercase">
                    TIDAK
                  </span>
                  <div className="h-[2px] bg-border flex-1"></div>
                </div>
                <div className="w-full">
                  {renderSlot(FLOW_MAP.pathTidak[0], "w-full")}
                </div>
                <div className="flex-1 h-[110px] w-full flex items-center justify-center opacity-5">
                  <div className="h-full w-[2px] bg-border border-dashed border-l-2"></div>
                </div>
              </div>
            </div>

            <div className="flex w-full justify-around mt-1 opacity-20">
              <ArrowDown size={16} className="text-muted-foreground/60" />
              <ArrowDown size={16} className="text-muted-foreground/60" />
            </div>
            <div className="w-full mt-1">
              {renderSlot(FLOW_MAP.footer[0], "w-full")}
            </div>
          </div>
        </section>

        {/* PANEL KANAN: HARDWARE SIMULATOR */}
        <aside className="w-[420px] bg-[#020617] flex flex-col z-20 shrink-0 shadow-2xl border-l border-slate-800">
          <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-4 shrink-0">
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest italic">
              VISUALISASI
            </span>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)] 
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
                className={`text-[8px] font-black uppercase tracking-tighter ${
                  hardwareBroken ? "text-red-400" : "text-slate-300"
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
                  <div className="bg-card rounded-3xl p-6 shadow-2xl border-4 border-amber-400 text-center max-w-[280px]">
                    <MousePointerClick
                      className="mx-auto text-amber-500 mb-3"
                      size={32}
                    />
                    <h3 className="text-foreground font-black text-xs uppercase mb-1">
                      Cek Kondisi
                    </h3>
                    <p className="text-muted-foreground text-[10px] mb-4 leading-tight">
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
                        className="flex-1 bg-muted text-muted-foreground font-black text-[10px] py-3 rounded-xl shadow-lg active:scale-95 uppercase"
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
                  : "bg-card"
            }`}
          >
            <div className="flex items-center gap-2 px-2">
              <div
                className={`shrink-0 p-1.5 rounded-xl shadow-sm ${
                  simulationStatus === "success"
                    ? "bg-card text-green-600 shadow-md"
                    : simulationStatus === "error"
                      ? "bg-card text-red-500 shadow-md"
                      : "bg-muted text-muted-foreground"
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
                <h3 className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-0.5">
                  Laporan Logika
                </h3>
                <p
                  className={`text-[9px] font-bold leading-tight ${
                    simulationStatus === "success"
                      ? "text-green-900"
                      : simulationStatus === "error"
                        ? "text-red-900"
                        : "text-muted-foreground"
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

      <footer className="bg-background border-t border-border px-3 py-0.5 text-[7px] font-bold text-muted-foreground flex justify-between items-center shrink-0 uppercase tracking-widest opacity-60 italic">
        <div className="flex gap-2 items-center font-black text-muted-foreground">
          <span>STABLE ENGINE v6.1s</span>
          <span className="text-muted-foreground/40">|</span>
          <span>HARDWARE MALFUNCTION SIMULATION</span>
        </div>
        <span>TRAFFIC LAB ACADEMY</span>
      </footer>
    </div>
  );
}
