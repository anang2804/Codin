"use client";

import React, { useState, useEffect, useRef } from "react";
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
  MousePointerClick,
  Siren,
  ShieldAlert,
  AlertTriangle,
  Search,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MarkCompletedButton from "@/components/MarkCompletedButton";

// --- Konfigurasi Simbol Standard ---
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

// --- Struktur Kanvas Expert (Satu Titik Akhir) ---
const HARD_STRUCTURE = {
  top: [
    { id: "s1", group: "terminator", placeholder: "START" },
    { id: "s2", group: "io", placeholder: "Status Ambulans" },
    { id: "s3", group: "decision", placeholder: "Apakah ada ambulans?" },
  ],
  branchAmbYa: [
    {
      id: "s4ya",
      group: "process",
      placeholder: "Semua kendaraan berhenti",
    },
  ],
  branchAmbTidak: {
    header: [
      { id: "s4no", group: "io", placeholder: "Warna Lampu" },
      { id: "s5no", group: "decision", placeholder: "Apakah warna MERAH?" },
    ],
    redYa: [
      { id: "s6ya", group: "process", placeholder: "Kendaraan Berhenti" },
    ],
    redTidak: [
      { id: "s6no", group: "process", placeholder: "Kendaraan Jalan" },
    ],
  },
  footer: { id: "s_end", group: "terminator", placeholder: "END" },
};

export default function TrafficExpertPage() {
  const [workspace, setWorkspace] = useState<Record<string, any>>({});
  const [lightColor, setLightColor] = useState("red");
  const [ambulanceActive, setAmbulanceActive] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState("idle");
  const [feedback, setFeedback] = useState("");
  const [draggedType, setDraggedType] = useState<string | null>(null);

  // Posisi Kendaraan
  const [carAPosition, setCarAPosition] = useState(2);
  const [carBPosition, setCarBPosition] = useState(2);
  const [carCPos, setCarCPos] = useState(-20); // Mobil C vertikal

  const [hardwareBroken, setHardwareBroken] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [awaitingDecision, setAwaitingDecision] = useState<string | null>(null);
  const decisionResolver = useRef<((value: string) => void) | null>(null);

  // Animasi Arus Mobil C (Jalan terus jika A&B Lampu Merah)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!hardwareBroken) {
      interval = setInterval(() => {
        setCarCPos((prev) => {
          // Mobil C HANYA JALAN jika Lampu Merah (A/B Berhenti) DAN Tidak ada Ambulans
          const isABRed = lightColor === "red";
          if (!isABRed || ambulanceActive) {
            // Berhenti di garis stop vertikal atas jika lampu A/B Hijau atau ada Ambulans
            if (prev >= 15 && prev <= 25) return 20;
          }
          const nextPos = prev + 1.2;
          return nextPos > 130 ? -20 : nextPos;
        });
      }, 30);
    }
    return () => clearInterval(interval);
  }, [lightColor, ambulanceActive, hardwareBroken]);

  const handleDragStart = (e: React.DragEvent, typeKey: string) => {
    if (isSimulating) return;
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
    if (isSimulating) return;
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
    setCarBPosition(2);
    setCarCPos(-20);
    setLightColor("red");
    setHardwareBroken(false);
    setAwaitingDecision(null);
    setAmbulanceActive(false);
    setIsScanning(false);
  };

  const triggerExplosion = (msg: string) => {
    setHardwareBroken(true);
    setSimulationStatus("error");
    setFeedback(`💥 KRITIS: ${msg}`);
  };

  const checkValidity = (id: string, expectedGroup: string) => {
    const symbol = workspace[id];
    if (!symbol)
      return { valid: false, error: "Bagian ini belum diisi simbol!" };
    if (symbol.group !== expectedGroup) {
      let info =
        expectedGroup === "io"
          ? "Jajargenjang Biru"
          : expectedGroup === "process"
            ? "Persegi Oranye"
            : expectedGroup === "decision"
              ? "Belah Ketupat Kuning"
              : "Kapsul Hijau";
      return {
        valid: false,
        error: `Simbol "${symbol.label}" salah. Gunakan simbol ${info}.`,
      };
    }
    return { valid: true };
  };

  const handleUserChoice = (choice: string) => {
    if (decisionResolver.current) {
      decisionResolver.current(choice);
      setAwaitingDecision(null);
    }
  };

  const runSimulation = async () => {
    resetSim();

    const requiredIds = [
      "s1",
      "s2",
      "s3",
      "s4ya",
      "s4no",
      "s5no",
      "s6ya",
      "s6no",
      "s_end",
    ];
    const missing = requiredIds.filter((id) => !workspace[id]);
    if (missing.length > 0) {
      setFeedback(
        "⚠️ Kanvas belum lengkap! Pasangkan semua simbol termasuk START dan END tunggal.",
      );
      return;
    }

    setIsSimulating(true);
    setSimulationStatus("running");
    setFeedback("Sistem memulai sinkronisasi sensor prioritas...");

    // 1. Alur Atas
    for (const step of HARD_STRUCTURE.top) {
      setActiveStep(step.id);
      const check = checkValidity(step.id, step.group);
      if (!check.valid) {
        await new Promise((r) => setTimeout(r, 600));
        triggerExplosion(check.error || "Terjadi kesalahan!");
        return;
      }

      if (step.id === "s3") {
        setFeedback("🔍 SENSOR: Mencari frekuensi sirine ambulans...");
        setIsScanning(true);
        await new Promise((r) => setTimeout(r, 1500));

        const randomAmbulance = Math.random() > 0.5;
        setAmbulanceActive(randomAmbulance);
        setIsScanning(false);

        if (randomAmbulance) {
          setFeedback(
            "🚨 ALERT: Ambulans terdeteksi! Semua kendaraan berhenti di garis stop.",
          );
          setActiveStep("s4ya");
          const checkY = checkValidity("s4ya", "process");
          if (!checkY.valid) {
            await new Promise((r) => setTimeout(r, 600));
            triggerExplosion(checkY.error || "Kesalahan jalur YA!");
            return;
          }
          await new Promise((r) => setTimeout(r, 2000));
        } else {
          setFeedback("ℹ️ Status: Aman. Memeriksa sensor lampu lalu lintas...");
          for (const nStep of HARD_STRUCTURE.branchAmbTidak.header) {
            setActiveStep(nStep.id);
            const checkN = checkValidity(nStep.id, nStep.group);
            if (!checkN.valid) {
              await new Promise((r) => setTimeout(r, 600));
              triggerExplosion(checkN.error || "Kesalahan jalur TIDAK!");
              return;
            }

            if (nStep.id === "s5no") {
              setAwaitingDecision("LIGHT");
              const color = await new Promise<string>((r) => {
                decisionResolver.current = r;
              });

              if (color === "Merah") {
                setLightColor("red");
                setFeedback(
                  "Lampu Merah: Mobil A & B Berhenti. Mobil C Vertikal melaju.",
                );
                setActiveStep("s6ya");
                const checkR = checkValidity("s6ya", "process");
                if (!checkR.valid) {
                  await new Promise((r) => setTimeout(r, 600));
                  triggerExplosion(checkR.error || "Kesalahan proses!");
                  return;
                }
                await new Promise((r) => setTimeout(r, 2000));
              } else {
                setLightColor("green");
                setFeedback(
                  "Lampu Hijau: Mobil A & B melaju. Mobil C Berhenti.",
                );
                setActiveStep("s6no");
                const checkG = checkValidity("s6no", "process");
                if (!checkG.valid) {
                  await new Promise((r) => setTimeout(r, 600));
                  triggerExplosion(checkG.error || "Kesalahan proses!");
                  return;
                }
                setCarAPosition(140);
                setCarBPosition(140);
                await new Promise((r) => setTimeout(r, 2000));
              }
            }
            await new Promise((r) => setTimeout(r, 800));
          }
        }
      } else {
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    setActiveStep("s_end");
    const finalCheck = checkValidity("s_end", "terminator");
    if (!finalCheck.valid) {
      await new Promise((r) => setTimeout(r, 600));
      triggerExplosion(finalCheck.error || "Kesalahan END!");
      return;
    }

    await new Promise((r) => setTimeout(r, 800));
    setSimulationStatus("success");
    setFeedback(
      "✅ BERHASIL: Seluruh alur logika dan pergerakan kendaraan sudah sinkron.",
    );
    setActiveStep(null);
  };

  const renderSlot = (slotData: any, customWidth = "w-full") => {
    const isPlaced = workspace[slotData.id];
    const isCurrent = activeStep === slotData.id;
    const isError = isCurrent && simulationStatus === "error";

    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, slotData.id)}
        className={`relative ${customWidth} h-[40px] rounded-lg flex items-center transition-all border shrink-0
          ${
            isPlaced
              ? "bg-white border-white shadow-sm"
              : "bg-slate-200/10 border-dashed border-slate-300 hover:bg-emerald-50/20"
          }
          ${
            isCurrent ? "ring-2 ring-blue-500/30 border-blue-400 shadow-lg" : ""
          }
          ${isError ? "ring-red-500 bg-red-50 border-red-500 shadow-red-100" : ""}
        `}
      >
        {isPlaced ? (
          <div className="flex items-center gap-2 w-full px-2.5 h-full overflow-hidden">
            <div
              className={`${workspace[slotData.id].shape} ${workspace[slotData.id].color} scale-[0.38] shrink-0 shadow-sm`}
            ></div>
            <span
              className={`text-[9px] font-black uppercase leading-tight truncate flex-1 min-w-0 ${
                isError ? "text-red-700" : "text-slate-700"
              }`}
            >
              {slotData.placeholder}
            </span>
            {!isSimulating && (
              <button
                onClick={() => removeSymbol(slotData.id)}
                className="ml-auto shrink-0 text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ) : (
          <div className="w-full text-center px-1.5 overflow-hidden">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter italic leading-none truncate">
              {slotData.placeholder}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans text-sm">
      {/* Header Panel */}
      <header className="bg-white border-b px-3 py-1.5 flex justify-between items-center shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-2">
          <Link
            href="/siswa/simulasi"
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={16} className="text-gray-600" />
          </Link>
          <div className="bg-red-600 p-1 rounded-lg text-white shadow-lg">
            <ShieldAlert size={16} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-[#1e293b] uppercase leading-none italic">
              Prioritas Tiga Kendaraan
            </h1>
            <span className="text-[8px] text-red-500 font-bold tracking-widest uppercase">
              Sulit
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
            disabled={isSimulating && !hardwareBroken}
            className={`flex items-center gap-1 px-4 py-1 text-[10px] font-black text-white rounded-lg transition-all shadow-lg ${
              isSimulating && !hardwareBroken
                ? "bg-slate-300"
                : "bg-red-600 hover:bg-red-700 active:scale-95"
            }`}
          >
            <Play size={12} fill="currentColor" /> JALANKAN
          </button>
          <MarkCompletedButton simulasiSlug="traffic-expert" />
        </div>
      </header>

      <main className="flex flex-1 min-h-0 overflow-hidden">
        {/* PANEL KIRI: BANK SIMBOL */}
        <aside className="w-44 border-r bg-white flex flex-col z-20 shrink-0 shadow-sm">
          <div className="p-2 border-b bg-slate-50/50 overflow-y-auto max-h-[30%]">
            <h2 className="text-[9px] font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Info size={10} className="text-blue-500" /> KOMPONEN
            </h2>
            <div className="space-y-1.5 text-justify">
              <p className="text-[10px] text-slate-600 leading-snug font-medium">
                Diagram alir nested (bersarang) menunjukkan percabangan dalam
                percabangan. Simulasi ini mengatur 3 kendaraan dengan sistem
                prioritas: ambulans → lampu lalu lintas → kendaraan biasa.
              </p>
              <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100 shadow-sm">
                <p className="text-[10px] text-blue-800 font-bold leading-tight italic">
                  Tugas: Buatlah diagram alir bercabang yang memeriksa ambulans
                  terlebih dahulu, lalu warna lampu untuk mengatur 3 kendaraan.
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
                  className={`flex flex-col items-center p-1 bg-white border border-slate-100 rounded-lg transition-all shadow-sm cursor-grab active:cursor-grabbing hover:border-red-400 group ${
                    isSimulating && !hardwareBroken
                      ? "opacity-50 grayscale"
                      : ""
                  }`}
                >
                  <div
                    className={`${data.shape} ${data.color} mb-0.5 shadow-sm group-hover:scale-105 transition-transform scale-75`}
                  ></div>
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">
                    {data.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* PANEL TENGAH: WORKSPACE */}
        <section className="flex-1 bg-[#f1f5f9]/40 relative overflow-hidden p-2 flex flex-col items-center z-10 border-r shadow-inner text-slate-900">
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          ></div>

          <div className="w-full max-w-[600px] flex flex-col items-center scale-[0.8] origin-top font-black">
            <div className="w-36">{renderSlot(HARD_STRUCTURE.top[0])}</div>
            <ArrowDown className="text-slate-300 my-1" size={16} />
            <div className="w-48">{renderSlot(HARD_STRUCTURE.top[1])}</div>
            <ArrowDown className="text-slate-300 my-1" size={16} />
            <div className="w-56 mb-1.5">
              {renderSlot(HARD_STRUCTURE.top[2])}
            </div>

            <div className="flex w-full gap-4 items-start mt-2">
              <div className="flex-1 flex flex-col items-center pt-1.5">
                <div className="flex items-center w-full mb-1 text-blue-500">
                  <div className="h-[2px] bg-blue-500/20 flex-1"></div>
                  <span className="px-2 text-[9px] uppercase font-black">
                    YA
                  </span>
                </div>
                <div className="w-full">
                  {renderSlot(HARD_STRUCTURE.branchAmbYa[0])}
                </div>
                <div className="h-36 w-[2px] bg-slate-200 mt-1.5 border-dashed border-l border-slate-300"></div>
              </div>

              <div className="flex-[2.2] flex flex-col items-center border-l border-slate-200 pl-4">
                <div className="flex items-center w-full mb-1 text-slate-400">
                  <span className="px-2 text-[9px] uppercase font-black">
                    TIDAK
                  </span>
                  <div className="h-[2px] bg-slate-300 flex-1"></div>
                </div>
                <div className="w-44">
                  {renderSlot(HARD_STRUCTURE.branchAmbTidak.header[0])}
                </div>
                <ArrowDown className="text-slate-300 my-1" size={14} />
                <div className="w-52 mb-1.5">
                  {renderSlot(HARD_STRUCTURE.branchAmbTidak.header[1])}
                </div>

                <div className="flex w-full gap-3 items-start mt-1.5">
                  <div className="flex-1 flex flex-col items-center">
                    <div className="flex items-center w-full mb-1 text-slate-400">
                      <div className="h-[1px] bg-slate-200 flex-1"></div>
                      <span className="px-1.5 text-[8px] font-bold uppercase">
                        YA
                      </span>
                    </div>
                    <div className="w-full">
                      {renderSlot(HARD_STRUCTURE.branchAmbTidak.redYa[0])}
                    </div>
                    <div className="h-8 w-[2px] bg-slate-200"></div>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="flex items-center w-full mb-1 text-slate-400">
                      <span className="px-1.5 text-[8px] font-bold uppercase">
                        TIDAK
                      </span>
                      <div className="h-[1px] bg-slate-200 flex-1"></div>
                    </div>
                    <div className="w-full">
                      {renderSlot(HARD_STRUCTURE.branchAmbTidak.redTidak[0])}
                    </div>
                    <div className="h-8 w-[2px] bg-slate-200"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative w-full flex flex-col items-center mt-1.5">
              <div className="flex w-[85%] justify-between h-4 border-b-2 border-x-2 border-slate-200 rounded-b-3xl"></div>
              <div className="h-3 w-[2px] bg-slate-300"></div>
              <div className="w-36">{renderSlot(HARD_STRUCTURE.footer)}</div>
            </div>
          </div>
        </section>

        {/* PANEL KANAN: SIMULATOR PERSIMPANGAN */}
        <aside className="w-[440px] bg-white flex flex-col z-20 shrink-0 shadow-2xl border-l">
          <div className="p-2 border-b bg-slate-50 flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <Siren
                className={
                  ambulanceActive
                    ? "text-red-500 animate-bounce"
                    : "text-slate-300"
                }
                size={14}
              />
              <span className="text-[8px] font-black uppercase tracking-widest italic text-slate-500">
                Live Hardware Simulator
              </span>
            </div>
          </div>

          <div className="flex-1 bg-[#0f0a0f] relative overflow-hidden flex items-center justify-center shadow-inner">
            {/* AREA JALAN PERSIMPANGAN */}
            <div className="absolute w-44 h-full bg-[#1a151a] border-x-2 border-slate-800 shadow-inner"></div>
            <div className="absolute h-44 w-full bg-[#1a151a] border-y-2 border-slate-800 shadow-inner"></div>

            {/* Marka Jalan Horizontal (Dua Jalur) */}
            <div className="absolute w-full h-[2px] border-t border-dashed border-white/20 top-1/2 -translate-y-1/2"></div>

            {/* MOBIL C (Vertikal dari Atas, Jalur Kiri Vertikal) */}
            <motion.div
              style={{ top: `${carCPos}%` }}
              className="absolute left-[34%] z-20 flex flex-col items-center gap-1"
            >
              <div className="bg-[#10b981] px-2 py-0.5 rounded shadow-lg border border-white/10">
                <span className="text-[7px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                  Mobil C
                </span>
              </div>
              <div className="w-8 h-16 bg-[#10b981] rounded-lg relative border-r-4 border-emerald-700 shadow-2xl overflow-hidden flex flex-col items-center justify-start pt-2">
                <div className="w-5 h-5 bg-white opacity-20 rounded mb-1"></div>
                <div className="absolute -left-2 top-3 w-3 h-3 bg-slate-950 rounded-full"></div>
                <div className="absolute -right-2 top-3 w-3 h-3 bg-slate-950 rounded-full"></div>
              </div>
            </motion.div>

            {/* MOBIL B (Horizontal Jalur Bawah, Kanan -> Kiri) */}
            <motion.div
              animate={{ right: `${carBPosition}%` }}
              initial={{ right: "2%" }}
              transition={{ duration: 2.5, ease: "linear" }}
              className="absolute bottom-[38%] z-30 flex flex-col items-end gap-1"
            >
              <div className="bg-[#475569] px-2 py-0.5 rounded shadow-lg border border-white/10">
                <span className="text-[7px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                  Mobil B
                </span>
              </div>
              <div className="w-16 h-8 bg-[#475569] rounded-lg relative border-t-4 border-slate-600 shadow-2xl overflow-hidden flex items-center justify-start">
                <div className="w-6 h-6 bg-slate-300 opacity-20 rounded ml-1"></div>
                <div className="absolute -top-2 left-3 w-3 h-3 bg-slate-950 rounded-full border-2 border-slate-900"></div>
                <div className="absolute -top-2 right-3 w-3 h-3 bg-slate-950 rounded-full border-2 border-slate-900"></div>
              </div>
            </motion.div>

            {/* MOBIL A (Horizontal Jalur Atas, Kiri -> Kanan) */}
            <motion.div
              animate={{ left: `${carAPosition}%` }}
              initial={{ left: "2%" }}
              transition={{ duration: 2.5, ease: "linear" }}
              className="absolute top-[38%] z-30 flex flex-col items-start gap-1"
            >
              <div className="bg-blue-600 px-2 py-0.5 rounded shadow-lg ml-1 border border-white/10">
                <span className="text-[7px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                  Mobil A
                </span>
              </div>
              <div className="w-16 h-8 bg-blue-600 rounded-lg relative border-b-4 border-blue-800 shadow-2xl overflow-hidden flex items-center justify-end">
                <div className="w-6 h-6 bg-blue-300 opacity-20 rounded mr-1"></div>
                <div className="absolute -bottom-2 left-3 w-3 h-3 bg-slate-950 rounded-full border-2 border-slate-900"></div>
                <div className="absolute -bottom-2 right-3 w-3 h-3 bg-slate-950 rounded-full border-2 border-slate-900"></div>
              </div>
            </motion.div>

            {/* AMBULANS (Vertikal: Atas -> Bawah di jalur tengah) */}
            <AnimatePresence>
              {ambulanceActive && !hardwareBroken && !isScanning && (
                <motion.div
                  initial={{ top: "-30%" }}
                  animate={{ top: "120%" }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute left-[52%] -translate-x-1/2 z-40"
                >
                  <div className="w-12 h-20 bg-white rounded-lg shadow-2xl relative border-r-4 border-slate-200 flex flex-col items-center justify-between py-3">
                    <div className="w-8 h-6 bg-red-600/10 rounded flex items-center justify-center">
                      <Siren className="text-red-600 animate-pulse" size={16} />
                    </div>
                    <div className="text-[7px] font-black text-slate-800 rotate-90 whitespace-nowrap tracking-tighter">
                      AMBULANCE
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* OVERLAY SENSOR & PEMINDAI */}
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-6 text-white text-center font-black"
                >
                  <div className="flex flex-col items-center gap-4 bg-slate-900 p-8 rounded-3xl border-2 border-blue-500/50 shadow-2xl">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <Search className="text-blue-400" size={48} />
                    </motion.div>
                    <h3 className="font-black text-xs uppercase tracking-widest mb-1">
                      Scanning Ambulans
                    </h3>
                    <p className="text-slate-400 text-[10px] animate-pulse italic">
                      Mendeteksi lalu lintas vertikal...
                    </p>
                  </div>
                </motion.div>
              )}

              {awaitingDecision === "LIGHT" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center font-black"
                >
                  <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-3xl p-6 shadow-2xl max-w-[280px]">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="text-blue-500" size={32} />
                    </div>
                    <h3 className="text-white font-black text-[10px] uppercase mb-1 tracking-widest">
                      Input Sensor Lampu
                    </h3>
                    <p className="text-slate-400 text-[9px] mb-4 uppercase leading-relaxed font-medium text-center">
                      Sinkronisasi: Pilih warna lampu:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleUserChoice("Merah")}
                        className="bg-red-900 text-white font-bold text-[8px] py-2 rounded-lg border border-red-700 hover:bg-red-800 uppercase active:scale-95 tracking-widest"
                      >
                        MERAH
                      </button>
                      <button
                        onClick={() => handleUserChoice("Hijau")}
                        className="bg-emerald-900 text-white font-bold text-[8px] py-2 rounded-lg border border-emerald-700 hover:bg-emerald-800 uppercase active:scale-95 tracking-widest"
                      >
                        HIJAU
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {hardwareBroken && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2 }}
                  className="absolute z-50 pointer-events-none flex flex-col items-center"
                >
                  <Zap
                    size={100}
                    className="text-yellow-400 fill-yellow-400 animate-bounce shadow-2xl"
                  />
                  <div className="bg-red-600 text-white font-black px-4 py-1 rounded-full shadow-2xl -mt-4 uppercase text-[10px] tracking-widest font-black italic">
                    MALFUNCTION
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* TIANG LAMPU KIRI (MOBIL A) */}
            <div className="absolute left-[12%] top-[5%] z-40">
              <div
                className={`bg-[#050505] p-1 rounded-xl border-2 border-slate-800 flex flex-col gap-1 ${
                  hardwareBroken ? "opacity-10 blur-xl" : ""
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    lightColor === "red"
                      ? "bg-red-500 shadow-[0_0_10px_#ef4444]"
                      : "bg-red-950/30"
                  }`}
                ></div>
                <div
                  className={`w-2.5 h-2.5 rounded-full bg-amber-950/20`}
                ></div>
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    lightColor === "green"
                      ? "bg-green-500 shadow-[0_0_10px_#10b981]"
                      : "bg-green-950/30"
                  }`}
                ></div>
              </div>
              <div className="w-1 h-12 bg-slate-900 mx-auto"></div>
            </div>

            {/* TIANG LAMPU KANAN (MOBIL B) */}
            <div className="absolute right-[12%] bottom-[5%] z-40 rotate-180">
              <div
                className={`bg-[#050505] p-1 rounded-xl border-2 border-slate-800 flex flex-col gap-1 ${
                  hardwareBroken ? "opacity-10 blur-xl" : ""
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    lightColor === "red"
                      ? "bg-red-500 shadow-[0_0_10px_#ef4444]"
                      : "bg-red-950/30"
                  }`}
                ></div>
                <div
                  className={`w-2.5 h-2.5 rounded-full bg-amber-950/20`}
                ></div>
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    lightColor === "green"
                      ? "bg-green-500 shadow-[0_0_10px_#10b981]"
                      : "bg-green-950/30"
                  }`}
                ></div>
              </div>
              <div className="w-1 h-12 bg-slate-900 mx-auto"></div>
            </div>
          </div>

          {/* LAPORAN LOGIKA */}
          <div
            className={`p-2 border-t h-16 flex flex-col justify-center transition-colors duration-500 shrink-0 ${
              simulationStatus === "success"
                ? "bg-green-50/80 border-green-100"
                : simulationStatus === "error"
                  ? "bg-red-50"
                  : awaitingDecision || isScanning
                    ? "bg-amber-50"
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
                      : isScanning
                        ? "bg-white text-blue-500 shadow-md"
                        : awaitingDecision
                          ? "bg-white text-amber-500 shadow-md"
                          : "bg-slate-50 text-slate-300"
                }`}
              >
                {simulationStatus === "success" ? (
                  <CheckCircle2 size={20} />
                ) : simulationStatus === "error" ? (
                  <AlertTriangle size={20} />
                ) : isScanning ? (
                  <Search size={20} className="animate-spin" />
                ) : awaitingDecision ? (
                  <MousePointerClick size={20} />
                ) : (
                  <HelpCircle size={20} />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">
                  Status Laporan
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
                    "Susun alur Expert. Mobil C akan melaju otomatis dari arah atas jika sensor mendeteksi Lampu Merah (A/B Berhenti)."}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="bg-white border-t px-3 py-0.5 text-[7px] font-bold text-slate-400 flex justify-between items-center shrink-0 uppercase tracking-widest italic">
        <div className="flex gap-2 items-center font-black">
          <span className="text-red-500">STABLE ENGINE v12.5-EXPERT</span>
          <span className="text-slate-200">|</span>
          <span>NESTED CROSSROAD LOGIC SYNC</span>
        </div>
        <span>TRAFFIC LAB ACADEMY</span>
      </footer>
    </div>
  );
}
