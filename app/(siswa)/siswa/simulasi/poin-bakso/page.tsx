"use client";

import React, { useState } from "react";
import Link from "next/link";
import MarkCompletedButton from "@/components/MarkCompletedButton";
import {
  Plus,
  Trash2,
  Play,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Zap,
  Terminal,
  HelpCircle,
  Layout,
  ArrowLeft,
} from "lucide-react";

export default function PoinBaksoSimulation() {
  // --- States ---
  const [poinAwal, setPoinAwal] = useState(90000);
  const [transaksi, setTransaksi] = useState([0]);
  const [aturanIf, setAturanIf] = useState(">="); // '>=' atau '>'
  const [prediksi, setPrediksi] = useState<{ kupon: boolean | null }>({
    kupon: null,
  });

  // Simulation States
  const [isRunning, setIsRunning] = useState(false);
  const [isStepByStep, setIsStepByStep] = useState(false);
  const [currentTxIdx, setCurrentTxIdx] = useState(0);
  const [currentLine, setCurrentLine] = useState(-1);
  const [livePoin, setLivePoin] = useState(90000);
  const [outputLog, setOutputLog] = useState<string[]>([]);
  const [statusProses, setStatusProses] = useState("Menunggu Input");
  const [simulationFinished, setSimulationFinished] = useState(false);
  const [dapatKuponCount, setDapatKuponCount] = useState(0);
  const [showResultPopup, setShowResultPopup] = useState(false);

  // --- Logic Helpers ---
  const canRun = prediksi.kupon !== null && !isRunning;

  const addTransaksi = () => {
    if (transaksi.length < 3) setTransaksi([...transaksi, 0]);
  };

  const removeTransaksi = (index: number) => {
    const newTx = transaksi.filter((_, i) => i !== index);
    setTransaksi(newTx);
  };

  const updateTransaksiValue = (index: number, value: string) => {
    const newTx = [...transaksi];
    newTx[index] = Number(value);
    setTransaksi(newTx);
  };

  const resetSimulasi = () => {
    setIsRunning(false);
    setIsStepByStep(false);
    setCurrentLine(-1);
    setCurrentTxIdx(0);
    setLivePoin(poinAwal);
    setOutputLog([]);
    setStatusProses("Menunggu Input");
    setSimulationFinished(false);
    setDapatKuponCount(0);
    setShowResultPopup(false);
  };

  // --- Pseudocode Definition ---
  const lines = [
    { id: 0, text: "INPUT total_pembayaran", indent: 0 },
    { id: 1, text: "INPUT total_poin", indent: 0 },
    { id: 2, text: "total_poin ← total_poin + total_pembayaran", indent: 0 },
    {
      id: 3,
      text: `IF total_poin ${aturanIf} 100000 THEN`,
      indent: 0,
      color: "text-emerald-400",
    },
    { id: 4, text: 'PRINT "Anda mendapatkan kupon bakso gratis"', indent: 4 },
    { id: 5, text: "total_poin ← total_poin - 100000", indent: 4 },
    { id: 6, text: "END IF", indent: 0 },
    { id: 7, text: 'PRINT "Poin Anda saat ini: ", total_poin', indent: 0 },
  ];

  // --- Simulation Engine ---
  const handleStep = async () => {
    if (simulationFinished) return;
    if (!isRunning) {
      setIsRunning(true);
      setIsStepByStep(true);
      setLivePoin(poinAwal);
      setCurrentTxIdx(0);
      setCurrentLine(0);
      setStatusProses(`Memproses Transaksi ke-1`);
      return;
    }

    let nextLine = currentLine + 1;
    let nextTxIdx = currentTxIdx;

    // Logic per baris
    if (currentLine === 2) {
      // Penambahan poin
      setLivePoin((prev) => prev + transaksi[currentTxIdx]);
    } else if (currentLine === 3) {
      // Cek IF
      const currentVal = livePoin + transaksi[currentTxIdx]; // Peek value for logic
      const threshold = 100000;
      const condition =
        aturanIf === ">=" ? currentVal >= threshold : currentVal > threshold;

      if (!condition) {
        nextLine = 7; // Skip ke PRINT Poin
        setStatusProses("Kondisi IF tidak terpenuhi");
      } else {
        setStatusProses("Mengecek Bonus: BERHASIL");
      }
    } else if (currentLine === 4) {
      // Print Kupon
      setOutputLog((prev) => [
        ...prev,
        `[Tx ${currentTxIdx + 1}] Anda mendapatkan kupon bakso gratis`,
      ]);
      setDapatKuponCount((prev) => prev + 1);
    } else if (currentLine === 5) {
      // Potong Poin
      setLivePoin((prev) => prev - 100000);
    } else if (currentLine === 7) {
      // Selesai satu transaksi
      const finalPoinInLoop = livePoin;
      setOutputLog((prev) => [
        ...prev,
        `Poin Anda saat ini: ${finalPoinInLoop}`,
      ]);

      if (currentTxIdx < transaksi.length - 1) {
        nextTxIdx = currentTxIdx + 1;
        nextLine = 0; // Ulang ke baris pertama untuk transaksi berikutnya
        setCurrentTxIdx(nextTxIdx);
        setStatusProses(`Memproses Transaksi ke-${nextTxIdx + 1}`);
      } else {
        // Selesai semua
        setSimulationFinished(true);
        setCurrentLine(-1);
        setIsRunning(false);
        setStatusProses("Transaksi Selesai");
        setTimeout(() => setShowResultPopup(true), 500);
        return;
      }
    }

    setCurrentLine(nextLine);
  };

  const runAll = async () => {
    if (!canRun) return;
    setIsRunning(true);
    setIsStepByStep(false);
    setLivePoin(poinAwal);
    let currentP = poinAwal;
    let kuponTotal = 0;

    for (let i = 0; i < transaksi.length; i++) {
      setCurrentTxIdx(i);
      setStatusProses(`Memproses Transaksi ke-${i + 1}`);

      // Step simulation delay visual
      for (let l = 0; l < lines.length; l++) {
        setCurrentLine(l);
        await new Promise((r) => setTimeout(r, 150));

        if (l === 2) currentP += transaksi[i];
        if (l === 3) {
          const condition =
            aturanIf === ">=" ? currentP >= 100000 : currentP > 100000;
          if (!condition) l = 6; // jump to END IF
        }
        if (l === 4) {
          setOutputLog((prev) => [
            ...prev,
            `[Tx ${i + 1}] Anda mendapatkan kupon bakso gratis`,
          ]);
          kuponTotal++;
        }
        if (l === 5) currentP -= 100000;
        if (l === 7)
          setOutputLog((prev) => [...prev, `Poin Anda saat ini: ${currentP}`]);

        setLivePoin(currentP);
      }
    }

    setDapatKuponCount(kuponTotal);
    setSimulationFinished(true);
    setIsRunning(false);
    setCurrentLine(-1);
    setStatusProses("Transaksi Selesai");
    setTimeout(() => setShowResultPopup(true), 500);
  };

  // --- Feedback Logic ---
  const renderFeedback = () => {
    if (!simulationFinished) return null;

    const actualKupon = dapatKuponCount > 0;
    const isKuponCorrect = prediksi.kupon === actualKupon;

    return (
      <div
        className={`p-4 rounded-xl border animate-in zoom-in-95 duration-300 ${
          isKuponCorrect
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}
      >
        <div className="flex items-center gap-2 mb-2 font-bold">
          {isKuponCorrect ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {isKuponCorrect
            ? "Prediksi kamu sesuai!"
            : "Mari evaluasi prediksimu"}
        </div>
        <p className="text-sm">
          {isKuponCorrect
            ? "Bagus! Kamu memahami alur logika percabangan dengan baik."
            : "Perhatikan kembali kondisi IF dan total poin yang terkumpul sebelum memutuskan prediksi."}
        </p>
        {poinAwal + transaksi.reduce((a, b) => a + b, 0) === 100000 && (
          <p className="text-xs mt-2 italic opacity-80">
            Poin tepat 100.000! Coba bandingkan hasil antara kondisi {` >= `}{" "}
            dan {` > `}.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-slate-50 p-3 font-sans text-slate-800 overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto flex flex-col gap-3 flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-200 shrink-0">
          <Link
            href="/siswa/simulasi"
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div className="p-2 bg-emerald-600 text-white rounded-lg">
            <Layout size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Sistem Poin Bakso Gratis
            </h1>
            <p className="text-xs text-slate-500 italic">
              Analisis alur data dan logika poin pelanggan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
          {/* 1. Panel Input & Keputusan (4 cols) */}
          <div className="lg:col-span-4 flex flex-col min-h-0">
            <section className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 overflow-y-auto">
              {/* A. Nilai Awal */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Poin Awal Pelanggan
                </label>
                <div className="relative">
                  <Wallet
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="number"
                    value={poinAwal}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPoinAwal(val);
                      setLivePoin(val);
                    }}
                    onFocus={(e) => {
                      if (poinAwal === 0) {
                        e.target.select();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (poinAwal === 0 && e.key >= "0" && e.key <= "9") {
                        const val = Number(e.key);
                        setPoinAwal(val);
                        setLivePoin(val);
                        e.preventDefault();
                      }
                    }}
                    disabled={isRunning}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* B. Daftar Transaksi */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Daftar Transaksi
                  </label>
                  <button
                    onClick={addTransaksi}
                    disabled={isRunning || transaksi.length >= 3}
                    className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-md transition-colors disabled:opacity-30"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {transaksi.map((val, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 animate-in slide-in-from-left-2"
                    >
                      <div className="flex-grow relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                          #{idx + 1}
                        </span>
                        <input
                          type="number"
                          value={val}
                          onChange={(e) =>
                            updateTransaksiValue(idx, e.target.value)
                          }
                          onFocus={(e) => {
                            if (val === 0) {
                              e.target.select();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (val === 0 && e.key >= "0" && e.key <= "9") {
                              updateTransaksiValue(idx, e.key);
                              e.preventDefault();
                            }
                          }}
                          disabled={isRunning}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                      <button
                        onClick={() => removeTransaksi(idx)}
                        disabled={isRunning || transaksi.length <= 1}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* C. Pilihan Aturan */}
              <div className="pt-3 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Pilih Kondisi IF
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[">=", ">"].map((op) => (
                    <button
                      key={op}
                      onClick={() => setAturanIf(op)}
                      disabled={isRunning}
                      className={`py-2 px-3 rounded-lg border-2 transition-all font-mono font-bold text-sm ${
                        aturanIf === op
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-100 text-slate-400 hover:border-slate-200"
                      }`}
                    >
                      {op} 100000
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 flex items-start gap-1">
                  <HelpCircle size={12} className="shrink-0 mt-0.5" />
                  Pilih kondisi yang menurutmu paling tepat untuk sistem kupon.
                </p>
              </div>

              {/* D. Prediksi */}
              <div className="pt-3 border-t border-slate-100 space-y-2 bg-slate-50/50 p-3 rounded-lg">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Zap size={14} className="text-amber-500" /> Prediksi Hasil
                </h3>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600">
                    Dapat kupon bakso?
                  </p>
                  <div className="flex gap-4">
                    {[true, false].map((val) => (
                      <label
                        key={String(val)}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name="kupon_pred"
                          checked={prediksi.kupon === val}
                          onChange={() => setPrediksi({ kupon: val })}
                          disabled={isRunning}
                          className="w-4 h-4 text-emerald-600 accent-emerald-600"
                        />
                        <span className="text-sm text-slate-600 group-hover:text-emerald-600">
                          {val ? "Ya" : "Tidak"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 2. Panel Tengah — Pseudocode (5 cols) */}
          <div className="lg:col-span-5 flex flex-col min-h-0">
            <div className="bg-[#0f172a] rounded-xl shadow-xl overflow-hidden border border-slate-800 flex flex-col flex-1 min-h-0">
              <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700 flex items-center justify-between shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">
                  Pseudocode Tracing
                </span>
              </div>

              <div className="p-3 font-mono text-xs space-y-1 flex-grow bg-[#0f172a]/50 overflow-y-auto min-h-0">
                {lines.map((line) => (
                  <div
                    key={line.id}
                    className={`flex items-start transition-all duration-300 rounded-lg px-2 py-1 ${
                      currentLine === line.id
                        ? "bg-emerald-500/20 border-l-4 border-emerald-500 text-emerald-300 translate-x-1"
                        : "text-slate-400 border-l-4 border-transparent"
                    }`}
                    style={{ marginLeft: `${line.indent * 0.5}rem` }}
                  >
                    <span className="opacity-20 w-8 text-xs mt-1 shrink-0 select-none">
                      {line.id + 1}
                    </span>
                    <span className={line.color || ""}>{line.text}</span>
                  </div>
                ))}
              </div>

              {/* Kontrol Panel di bawah Editor */}
              <div className="p-2 bg-slate-800/50 border-t border-slate-700 flex flex-wrap gap-2 shrink-0">
                <MarkCompletedButton simulasiSlug="poin-bakso" />
                <button
                  onClick={runAll}
                  disabled={!canRun || isRunning}
                  className={`flex-1 min-w-[120px] py-2 text-sm rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    !canRun || isRunning
                      ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                  }`}
                >
                  <Play size={16} fill="currentColor" /> Jalankan Semua
                </button>
                <button
                  onClick={handleStep}
                  disabled={
                    !canRun ||
                    (isRunning &&
                      isStepByStep === false &&
                      currentLine !== -1) ||
                    simulationFinished
                  }
                  className="flex-1 min-w-[120px] py-2 text-sm rounded-lg font-bold bg-white text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                >
                  <ChevronRight size={18} /> Langkah Berikutnya
                </button>
                <button
                  onClick={resetSimulasi}
                  className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
                  title="Reset"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Panel Kanan — Visual & Output (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">
            {/* Visual State */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Live Point Indicator
              </h2>
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="relative">
                  <div
                    className={`absolute inset-0 bg-emerald-100 rounded-full blur-2xl transition-opacity duration-700 ${
                      isRunning ? "opacity-100" : "opacity-0"
                    }`}
                  ></div>
                  <div
                    className={`relative z-10 w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-500 ${
                      livePoin >= 100000
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <span className="text-[8px] font-bold text-slate-400">
                      TOTAL POIN
                    </span>
                    <span
                      className={`text-base font-mono font-black ${
                        livePoin >= 100000
                          ? "text-emerald-600"
                          : "text-slate-700"
                      }`}
                    >
                      {livePoin.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="w-full space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>STATUS</span>
                    <span className="text-emerald-600">{statusProses}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${Math.min((livePoin / 100000) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Console Output */}
            <div className="bg-[#0f172a] rounded-xl border border-slate-800 flex flex-col flex-1 min-h-0 shadow-lg overflow-hidden">
              <div className="bg-slate-800 px-3 py-1.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-emerald-500" />
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                    Console Output
                  </span>
                </div>
              </div>
              <div className="p-2 font-mono text-[10px] space-y-1 text-emerald-400 flex-grow bg-black/10 overflow-y-auto min-h-0">
                {outputLog.length === 0 && (
                  <span className="text-slate-700 italic">
                    Menunggu eksekusi...
                  </span>
                )}
                {outputLog.map((log, i) => (
                  <div
                    key={i}
                    className="flex gap-2 animate-in slide-in-from-bottom-1"
                  >
                    <span className="text-emerald-800 font-bold">{`>`}</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback & Result */}
            {simulationFinished && !showResultPopup && renderFeedback()}
          </div>
        </div>
      </div>

      {/* Tutorial Footer */}
      {!simulationFinished && !isRunning && prediksi.kupon === null && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce border border-slate-700">
          <HelpCircle size={18} className="text-emerald-400" />
          <span className="text-xs font-medium">
            Isi prediksi untuk mengaktifkan tombol Jalankan!
          </span>
        </div>
      )}

      {/* Result Popup Modal */}
      {showResultPopup &&
        (() => {
          const actualKupon = dapatKuponCount > 0;
          const isKuponCorrect = prediksi.kupon === actualKupon;
          const totalPoinAkhir = livePoin;
          const totalTransaksi = transaksi.reduce((a, b) => a + b, 0);

          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div
                  className={`p-5 rounded-t-2xl border-b-4 ${
                    isKuponCorrect
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-700"
                      : "bg-gradient-to-r from-amber-500 to-amber-600 border-amber-700"
                  }`}
                >
                  <div className="flex items-center gap-3 text-white">
                    {isKuponCorrect ? (
                      <CheckCircle2 size={32} className="shrink-0" />
                    ) : (
                      <AlertCircle size={32} className="shrink-0" />
                    )}
                    <div>
                      <h2 className="text-xl font-bold">
                        {isKuponCorrect
                          ? "Prediksi Benar! 🎉"
                          : "Prediksi Kurang Tepat"}
                      </h2>
                      <p className="text-sm opacity-90">
                        {isKuponCorrect
                          ? "Kamu memahami logika dengan baik!"
                          : "Mari kita evaluasi bersama"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Hasil Simulasi */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Terminal size={16} className="text-emerald-600" />
                      Hasil Simulasi
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Poin Awal:</span>
                        <span className="font-bold font-mono">
                          Rp {poinAwal.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Transaksi:</span>
                        <span className="font-bold font-mono text-emerald-600">
                          + Rp {totalTransaksi.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-2">
                        <span className="text-slate-600">Poin Akhir:</span>
                        <span className="font-bold font-mono text-lg">
                          Rp {totalPoinAkhir.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between bg-purple-50 -mx-2 px-2 py-2 rounded">
                        <span className="text-slate-600">Kupon Didapat:</span>
                        <span className="font-bold text-purple-600">
                          {dapatKuponCount} Kupon 🎁
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Penjelasan */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-800 text-sm">
                      💡 Penjelasan:
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {isKuponCorrect ? (
                        <>
                          Prediksimu tepat! Dengan kondisi{" "}
                          <strong className="font-mono text-emerald-600">
                            {aturanIf} 100000
                          </strong>
                          ,
                          {actualKupon ? (
                            <>
                              {" "}
                              pelanggan <strong>mendapatkan kupon</strong>{" "}
                              karena poin mencapai threshold. Setiap dapat
                              kupon, poin dikurangi 100.000.
                            </>
                          ) : (
                            <>
                              {" "}
                              pelanggan <strong>
                                tidak mendapatkan kupon
                              </strong>{" "}
                              karena poin tidak mencapai threshold. Poin tetap
                              tersimpan untuk transaksi berikutnya.
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          Dengan kondisi{" "}
                          <strong className="font-mono text-amber-600">
                            {aturanIf} 100000
                          </strong>{" "}
                          dan poin total{" "}
                          {poinAwal + totalTransaksi >= 100000
                            ? "mencapai"
                            : "belum mencapai"}{" "}
                          100.000, pelanggan seharusnya{" "}
                          <strong>
                            {actualKupon ? "mendapatkan" : "tidak mendapatkan"}
                          </strong>{" "}
                          kupon. Perhatikan bagaimana kondisi IF mengecek nilai
                          poin!
                        </>
                      )}
                    </p>
                  </div>

                  {/* Tips */}
                  {!isKuponCorrect && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <p className="text-xs text-amber-800">
                        <strong>💡 Tips:</strong> Coba perhatikan perbedaan
                        antara operator{" "}
                        <code className="font-mono bg-amber-100 px-1 rounded">
                          {">="}{" "}
                        </code>
                        dan{" "}
                        <code className="font-mono bg-amber-100 px-1 rounded">
                          {">"}
                        </code>
                        . Jika poin tepat 100.000, hasilnya akan berbeda!
                      </p>
                    </div>
                  )}

                  {poinAwal + totalTransaksi === 100000 && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-blue-800">
                        <strong>🎯 Edge Case:</strong> Poin kamu tepat 100.000!
                        Ini kasus spesial untuk memahami perbedaan{" "}
                        <code className="font-mono bg-blue-100 px-1 rounded">
                          {">="}{" "}
                        </code>{" "}
                        vs
                        <code className="font-mono bg-blue-100 px-1 rounded">
                          {">"}
                        </code>
                        .
                      </p>
                    </div>
                  )}
                </div>

                {/* Button */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => setShowResultPopup(false)}
                    className={`w-full py-3 rounded-xl font-bold text-white text-sm uppercase tracking-wider transition-all ${
                      isKuponCorrect
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200"
                        : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-200"
                    } active:scale-95`}
                  >
                    {isKuponCorrect ? "LANJUT EKSPLORASI!" : "COBA LAGI!"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
