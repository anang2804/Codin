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
  const [logMessages, setLogMessages] = useState<string[]>([
    "Susun flowchart kamu, lalu tekan Jalankan untuk mencoba.",
  ]);
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
  };

  const handleDrop = (
    e: React.DragEvent,
    slotId: string,
    expectedGroup: string,
  ) => {
    e.preventDefault();
    if (!draggedType) return;

    const symbolInfo = SYMBOL_TYPES[draggedType as keyof typeof SYMBOL_TYPES];

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
    setLogMessages([
      "Susun flowchart kamu, lalu tekan Jalankan untuk mencoba.",
    ]);
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
      <header className="px-8 py-2 bg-background border-b border-border flex items-center justify-between shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg transition-all"
          >
            <ArrowLeft size={14} /> Kembali
          </button>
          <div className="w-px h-6 bg-border"></div>
          <div className="bg-green-600 p-1.5 rounded-xl text-white shadow-green-100 shadow-lg">
            <CheckCircle2 size={16} />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-base font-black tracking-tighter text-foreground uppercase italic leading-none">
                Logika Lalu Lintas
              </h1>
            </div>
            <span className="text-[8px] text-green-600 font-bold tracking-widest uppercase italic bg-green-50 px-2 py-0.5 rounded border border-green-200">
              Dasar
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetSim}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-muted text-foreground hover:bg-muted/80 border border-border rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <MarkCompletedButton simulasiSlug="traffic-logic" />
          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 ${
              isSimulating
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
        <aside className="w-72 border-r border-border bg-card flex flex-col z-20 shrink-0 overflow-y-auto">
          {/* Deskripsi */}
          <div className="p-3 border-b flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-blue-500/60" />
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Deskripsi Tugas
              </h2>
            </div>
            <div className="p-3 rounded-xl border bg-blue-50 border-blue-100 shadow-sm">
              <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                Diagram alir (flowchart) adalah gambar yang menunjukkan urutan
                langkah dan keputusan dalam suatu sistem. Setiap langkah
                digambarkan menggunakan simbol yang berbeda.
              </p>
            </div>
          </div>

          {/* Fungsi Simbol */}
          <div className="p-3 border-b flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-500/70" />
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Fungsi Simbol
              </h2>
            </div>
            <div className="flex flex-col gap-1.5">
              {/* Start / End */}
              <div className="flex items-start gap-2.5 p-2 bg-green-50 border border-green-100 rounded-xl">
                <div className="shrink-0 mt-0.5 w-7 h-3.5 rounded-full bg-green-500 border-2 border-green-600 shadow-sm" />
                <div>
                  <p className="text-[10px] font-black text-green-700 uppercase tracking-tight leading-none mb-0.5">
                    Start / End
                  </p>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">
                    Menandai awal atau akhir dari sebuah algoritma.
                  </p>
                </div>
              </div>
              {/* Input / Output */}
              <div className="flex items-start gap-2.5 p-2 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="shrink-0 mt-0.5 w-6 h-4 bg-blue-500 rounded-none transform skew-x-12 shadow-sm" />
                <div>
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-tight leading-none mb-0.5">
                    Input / Output
                  </p>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">
                    Menerima data masukan atau menampilkan informasi.
                  </p>
                </div>
              </div>
              {/* Proses */}
              <div className="flex items-start gap-2.5 p-2 bg-orange-50 border border-orange-100 rounded-xl">
                <div className="shrink-0 mt-0.5 w-6 h-4 bg-orange-500 border-2 border-orange-600 shadow-sm" />
                <div>
                  <p className="text-[10px] font-black text-orange-700 uppercase tracking-tight leading-none mb-0.5">
                    Proses
                  </p>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">
                    Melakukan langkah pengolahan data dalam algoritma.
                  </p>
                </div>
              </div>
              {/* Keputusan */}
              <div className="flex items-start gap-2.5 p-2 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="shrink-0 mt-1 w-4 h-4 bg-amber-500 rotate-45 shadow-sm" />
                <div>
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-tight leading-none mb-0.5">
                    Keputusan
                  </p>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">
                    Menentukan kondisi dengan dua hasil:{" "}
                    <span className="font-bold text-blue-600">YA</span> atau{" "}
                    <span className="font-bold text-muted-foreground">
                      TIDAK
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Simbol */}
          <div className="p-3 flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
              <HelpCircle size={14} className="text-muted-foreground" />
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Bank Simbol
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(SYMBOL_TYPES).map(([key, data]) => (
                <div
                  key={key}
                  draggable
                  onDragStart={(e) => handleDragStart(e, key)}
                  className="flex flex-col items-center gap-1.5 p-2 bg-card border border-border rounded-xl transition-all shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md group"
                >
                  <div
                    className={`${data.shape} ${data.color} shadow-sm group-hover:scale-110 transition-transform`}
                  ></div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight text-center leading-tight">
                    {data.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* MISI BANNER */}
          <section className="px-6 pt-4 pb-3 shrink-0">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 flex items-start gap-5 shadow-sm">
              <div className="bg-background p-2.5 rounded-xl shadow-sm text-primary shrink-0">
                <Lightbulb size={24} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded uppercase tracking-widest">
                    MISI
                  </span>
                  <h2 className="text-sm font-black text-foreground uppercase tracking-tight">
                    Logika Lalu Lintas
                  </h2>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed font-medium">
                  Susun diagram alir yang menunjukkan bagaimana sistem membaca
                  warna lampu lalu lintas dan menentukan apakah kendaraan harus
                  berhenti atau dapat melaju.
                </p>
              </div>
            </div>
          </section>

          <div className="flex-1 flex overflow-hidden">
            {/* PANEL TENGAH: WORKSPACE */}
            <section className="flex-1 bg-background relative overflow-auto flex flex-col items-center justify-start py-4 z-10 border-r border-border">
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
            <aside className="w-[400px] bg-[#020617] flex flex-col z-20 shrink-0 border-l border-slate-800">
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

              {/* Logic Log */}
              <div className="h-28 border-t border-slate-800 flex flex-col shrink-0">
                <div className="px-5 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      simulationStatus === "success"
                        ? "bg-emerald-500"
                        : simulationStatus === "error"
                          ? "bg-red-500 animate-ping"
                          : isSimulating
                            ? "bg-blue-400 animate-pulse"
                            : "border border-border/70"
                    }`}
                  />
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    Laporan Logika
                  </span>
                </div>
                <div
                  className={`flex-1 p-4 overflow-y-auto text-[10px] font-mono space-y-1 ${
                    simulationStatus === "error"
                      ? "bg-red-950/30 text-red-300"
                      : "bg-black/30 text-emerald-400"
                  }`}
                >
                  {logMessages.map((msg, i) => (
                    <div key={i} className="leading-relaxed">
                      {msg}
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
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
