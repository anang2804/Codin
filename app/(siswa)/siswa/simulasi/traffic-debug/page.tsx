"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  RotateCcw,
  BookOpen,
  Trash2,
  ArrowDown,
  HelpCircle,
  Zap,
  Terminal,
  MousePointerClick,
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

type SymbolTypeKey = keyof typeof SYMBOL_TYPES;

const SYMBOL_MEANINGS: Record<SymbolTypeKey, { title: string; desc: string }> =
  {
    TERMINATOR: {
      title: "START / END",
      desc: "Menandai titik awal atau akhir algoritma pada flowchart.",
    },
    IO: {
      title: "INPUT / OUTPUT",
      desc: "Digunakan untuk membaca data lampu atau menampilkan hasil transisi.",
    },
    PROCESS: {
      title: "PROSES",
      desc: "Menunjukkan langkah aksi, misalnya jeda 2 detik sebelum lampu berubah.",
    },
    DECISION: {
      title: "KEPUTUSAN",
      desc: "Mengecek kondisi dan menentukan cabang alur YA atau TIDAK.",
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
  const [selectedSymbolType, setSelectedSymbolType] =
    useState<SymbolTypeKey | null>(null);
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
    setSelectedSymbolType(typeKey as SymbolTypeKey);
  };

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    if (!draggedType) return;
    const selectedType = draggedType as SymbolTypeKey;
    setSelectedSymbolType(selectedType);
    setWorkspace((prev) => ({
      ...prev,
      [slotId]: { ...SYMBOL_TYPES[selectedType] },
    }));
    setDraggedType(null);
  };

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
                Transisi Lampu Bertahap
              </h1>
            </div>
            <span className="text-[8px] text-sky-600 font-bold tracking-widest uppercase italic bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Menengah
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
          <MarkCompletedButton simulasiSlug="traffic-debug" />
          <button
            onClick={runSimulation}
            disabled={isSimulating && simulationStatus !== "error"}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 ${
              isSimulating && simulationStatus !== "error"
                ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
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
              {Object.entries(SYMBOL_TYPES)
                .filter(([k]) => k !== "TERMINATOR")
                .map(([key, data]) => (
                  <div
                    key={key}
                    draggable={!isSimulating}
                    onDragStart={(e) => handleDragStart(e, key)}
                    className={`flex flex-col items-center p-1 bg-card border border-border rounded-lg transition-all shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 group ${
                      isSimulating && simulationStatus !== "error"
                        ? "opacity-50 grayscale"
                        : ""
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

        {/* PANEL TENGAH */}
        <section
          className={`relative flex min-w-[500px] flex-1 flex-col overflow-auto rounded-3xl border border-emerald-100 bg-white py-4 shadow-sm z-10 transition-all duration-300 mx-5 my-4 ${
            simulationStatus === "success" ? "pt-24" : "pt-4"
          }`}
        >
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
                <p className="max-w-4xl text-[11px] text-muted-foreground leading-relaxed font-medium">
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
                className="pointer-events-none absolute left-4 right-4 top-2 z-30"
              >
                <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
                  <h3 className="text-sm font-black tracking-tight text-emerald-700">
                    Berhasil! Flowchart kamu sudah tepat
                  </h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                    Sistem berhasil membaca alur transisi lampu bertahap.
                    <br />
                    Keputusan dan proses sudah berjalan sesuai flowchart.
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#64748b 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          ></div>

          <div className="relative w-full max-w-[420px] flex flex-col items-center mx-auto scale-[0.9] origin-top">
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
                  <span className="px-2 text-[10px] font-black text-blue-500 uppercase">
                    Ya
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
                  <span className="px-2 text-[10px] font-black text-muted-foreground uppercase">
                    Tidak
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

            <div className="flex w-full justify-around mt-1">
              <ArrowDown size={14} className="text-muted-foreground/60" />
              <ArrowDown size={14} className="text-muted-foreground/60" />
            </div>
            <div className="w-full mt-1">
              {renderSlot(FLOW_MAP.footer[0], "w-full")}
            </div>
          </div>
        </section>

        {/* PANEL KANAN: HARDWARE SIMULATOR */}
        <aside className="relative flex w-[380px] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-2xl z-20 mr-5 my-4">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center px-5">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                <Activity size={14} />
              </div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Simulation Preview
              </span>
            </div>
            <div className="flex items-center gap-2">
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
              <span className="text-[8px] font-black uppercase tracking-tighter text-slate-300">
                {hardwareBroken ? "Error" : lightColor.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex-1 bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)] relative overflow-hidden flex items-center justify-center">
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
        </aside>
      </main>

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
