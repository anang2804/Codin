"use client";

import React, { useState } from "react";
import Link from "next/link";
import MarkCompletedButton from "@/components/MarkCompletedButton";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  CreditCard,
  UtensilsCrossed,
  Terminal,
  ArrowLeft,
} from "lucide-react";

export default function BayarBaksoSimulation() {
  // Pilihan yang tersedia
  const OPTIONS = [
    { id: "calc", text: "kembalian ← uang_dibayar - total_bayar" },
    { id: "print_res", text: "PRINT kembalian" },
    { id: "print_err", text: 'PRINT "Uang yang dibayarkan kurang"' },
  ];

  // State
  const [totalBayar, setTotalBayar] = useState(0);
  const [uangDibayar, setUangDibayar] = useState(0);
  const [slots, setSlots] = useState({
    if1: "",
    if2: "",
    else1: "",
  });
  const [isRunning, setIsRunning] = useState(false);
  const [currentLine, setCurrentLine] = useState(-1);
  const [output, setOutput] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showResultPopup, setShowResultPopup] = useState(false);

  // Struktur Pseudocode
  const codeLines = [
    { text: `INPUT total_bayar (${totalBayar})`, indent: 0 },
    { text: `INPUT uang_dibayar (${uangDibayar})`, indent: 0 },
    {
      text: `IF uang_dibayar >= total_bayar THEN`,
      indent: 0,
      isCondition: true,
    },
    { isSlot: true, slotKey: "if1", indent: 4 },
    { isSlot: true, slotKey: "if2", indent: 4 },
    { text: `ELSE`, indent: 0 },
    { isSlot: true, slotKey: "else1", indent: 4 },
    { text: `END IF`, indent: 0 },
  ];

  const handleSelect = (key: string, value: string) => {
    if (isRunning) return;
    setSlots((prev) => ({ ...prev, [key]: value }));
    setFeedback(null);
  };

  const reset = () => {
    setIsRunning(false);
    setCurrentLine(-1);
    setOutput([]);
    setFeedback(null);
    setShowResultPopup(false);
    setSlots({ if1: "", if2: "", else1: "" });
  };

  const runSimulation = async () => {
    if (!slots.if1 || !slots.if2 || !slots.else1) {
      setFeedback({
        type: "error",
        message: "Harap lengkapi semua slot kosong.",
      });
      return;
    }

    const isCorrect =
      slots.if1 === OPTIONS[0].text &&
      slots.if2 === OPTIONS[1].text &&
      slots.else1 === OPTIONS[2].text;

    setIsRunning(true);
    setOutput([]);
    setFeedback(null);

    for (let i = 0; i < codeLines.length; i++) {
      setCurrentLine(i);
      await new Promise((r) => setTimeout(r, 600));

      if (i === 2) {
        const condition = uangDibayar >= totalBayar;
        if (!condition) i = 4; // Skip to ELSE
      } else if (i === 3 && slots.if1 === OPTIONS[0].text) {
        // Logika hitung internal (visual saja)
      } else if (i === 4 && slots.if2 === OPTIONS[1].text) {
        setOutput((prev) => [
          ...prev,
          `Kembalian: Rp ${(uangDibayar - totalBayar).toLocaleString("id-ID")}`,
        ]);
        i = 6; // Skip to END IF
      } else if (i === 6 && slots.else1 === OPTIONS[2].text) {
        setOutput((prev) => [...prev, "Uang yang dibayarkan kurang"]);
      }
    }

    setCurrentLine(-1);
    setIsRunning(false);

    if (isCorrect) {
      setFeedback({
        type: "success",
        message: "Selamat! Logika pseudocode kamu sudah benar.",
      });
      setTimeout(() => setShowResultPopup(true), 500);
    } else {
      setFeedback({
        type: "error",
        message: "Urutan instruksi belum tepat. Silakan coba lagi.",
      });
      setTimeout(() => setShowResultPopup(true), 500);
    }
  };

  return (
    <div className="h-screen bg-slate-50 p-3 font-sans text-slate-700 overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
        {/* Header Section */}
        <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl shadow-sm border border-slate-200 shrink-0 mb-3">
          <div className="flex items-center gap-3">
            <Link
              href="/siswa/simulasi"
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Melengkapi Pseudocode: Membayar Bakso
              </h1>
              <p className="text-xs text-slate-500">
                Pahami struktur IF-ELSE melalui simulasi interaktif.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MarkCompletedButton simulasiSlug="bayar-bakso" />
            <button
              onClick={reset}
              className="px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              onClick={runSimulation}
              disabled={isRunning}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                isRunning
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95"
              }`}
            >
              <Play size={14} fill="currentColor" /> Jalankan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
          {/* Panel Instruksi & Input */}
          <div className="col-span-3 flex flex-col gap-2 min-h-0">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertCircle size={12} className="text-emerald-600" />
                Instruksi Kerja
              </h2>
              <p className="text-xs leading-relaxed text-slate-600">
                Lengkapi bagian kosong dengan instruksi yang tersedia untuk
                menghitung kembalian dan menampilkan pesan yang tepat.
              </p>
            </div>

            <div className="bg-emerald-600 p-3 rounded-lg text-white shadow-lg relative overflow-hidden flex-1">
              <div className="absolute -right-2 -top-2 opacity-10 rotate-12">
                <ShoppingCart size={60} />
              </div>
              <h2 className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1 relative z-10">
                <ShoppingCart size={12} />
                Data Input
              </h2>
              <div className="space-y-2 relative z-10">
                <div>
                  <label className="text-[10px] opacity-80 block mb-1">
                    Total Tagihan (Rp)
                  </label>
                  <input
                    type="number"
                    value={totalBayar}
                    onChange={(e) => setTotalBayar(Number(e.target.value))}
                    onFocus={(e) => {
                      if (totalBayar === 0) {
                        e.target.select();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (totalBayar === 0 && e.key >= "0" && e.key <= "9") {
                        setTotalBayar(Number(e.key));
                        e.preventDefault();
                      }
                    }}
                    disabled={isRunning}
                    className="w-full bg-emerald-700 border border-emerald-500 text-white font-mono font-bold text-sm px-2 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] opacity-80 block mb-1">
                    Uang Tunai (Rp)
                  </label>
                  <input
                    type="number"
                    value={uangDibayar}
                    onChange={(e) => setUangDibayar(Number(e.target.value))}
                    onFocus={(e) => {
                      if (uangDibayar === 0) {
                        e.target.select();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (uangDibayar === 0 && e.key >= "0" && e.key <= "9") {
                        setUangDibayar(Number(e.key));
                        e.preventDefault();
                      }
                    }}
                    disabled={isRunning}
                    className="w-full bg-emerald-700 border border-emerald-500 text-white font-mono font-bold text-sm px-2 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel Editor */}
          <div className="col-span-6 flex flex-col min-h-0">
            <div className="bg-[#0f172a] rounded-xl shadow-xl overflow-hidden border border-slate-800 flex flex-col flex-1 min-h-0">
              <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700 flex items-center justify-between shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">
                  Logic Editor
                </span>
              </div>

              <div className="p-3 font-mono text-xs space-y-1 flex-grow bg-[#0f172a]/50 overflow-y-auto min-h-0">
                {codeLines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start transition-all duration-300 rounded-lg px-2 py-1 ${
                      currentLine === idx
                        ? "bg-emerald-500/20 border-l-4 border-emerald-500 text-emerald-300 translate-x-1"
                        : "text-slate-400 border-l-4 border-transparent"
                    }`}
                    style={{ marginLeft: `${line.indent * 0.5}rem` }}
                  >
                    <span className="opacity-20 w-8 text-xs mt-1 shrink-0 select-none">
                      {idx + 1}
                    </span>
                    {"isSlot" in line && line.isSlot ? (
                      <span className="flex-1">
                        <select
                          value={slots[line.slotKey as keyof typeof slots]}
                          onChange={(e) =>
                            handleSelect(line.slotKey as string, e.target.value)
                          }
                          disabled={isRunning}
                          className={`w-full bg-slate-700 border ${
                            slots[line.slotKey as keyof typeof slots]
                              ? "border-emerald-500 text-emerald-400"
                              : "border-slate-600 text-slate-400"
                          } rounded px-2 py-1 text-xs outline-none focus:border-emerald-400`}
                        >
                          <option value="">-- Pilih Instruksi --</option>
                          {OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.text}>
                              {opt.text}
                            </option>
                          ))}
                        </select>
                      </span>
                    ) : (
                      <span
                        className={`${
                          "isCondition" in line && line.isCondition
                            ? "text-emerald-400 font-semibold"
                            : ""
                        }`}
                      >
                        {line.text}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel Output & Feedback */}
          <div className="col-span-3 flex flex-col min-h-0">
            {/* Receipt/Struk Output */}
            <div className="bg-gradient-to-b from-slate-100 to-slate-50 rounded-lg p-2 shadow-lg flex-1 flex flex-col">
              <div className="bg-white rounded shadow-inner flex-1 flex flex-col">
                {/* Paper tear effect top */}
                <div
                  className="h-2 bg-gradient-to-b from-slate-200 to-white"
                  style={{
                    backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 8px, #e2e8f0 8px, #e2e8f0 12px)`,
                    backgroundSize: "12px 100%",
                    clipPath:
                      "polygon(0 0, 5% 100%, 10% 0, 15% 100%, 20% 0, 25% 100%, 30% 0, 35% 100%, 40% 0, 45% 100%, 50% 0, 55% 100%, 60% 0, 65% 100%, 70% 0, 75% 100%, 80% 0, 85% 100%, 90% 0, 95% 100%, 100% 0, 100% 100%, 0 100%)",
                  }}
                ></div>

                <div className="px-3 py-2 font-mono text-xs flex-1 flex flex-col">
                  {/* Header Struk */}
                  <div className="text-center border-b border-dashed border-slate-300 pb-1.5 mb-1.5">
                    <div className="text-sm font-bold">🍜 WARUNG BAKSO</div>
                    <div className="text-[10px] text-slate-500">
                      Jl. Algoritma No. 123
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Tel: (021) 123-4567
                    </div>
                  </div>

                  {/* Output Area */}
                  <div className="flex-1 flex flex-col justify-center">
                    {output.length === 0 && !isRunning ? (
                      <div className="text-center text-slate-400 italic text-[10px] py-4">
                        Menunggu transaksi...
                      </div>
                    ) : (
                      <>
                        {output.map((line, i) => (
                          <div
                            key={i}
                            className="animate-in fade-in slide-in-from-top-2 text-slate-800"
                          >
                            {line.includes("Kembalian") ? (
                              <div className="border-t border-dashed border-slate-300 pt-1 mt-1">
                                <div className="flex justify-between font-bold text-xs">
                                  <span>KEMBALIAN:</span>
                                  <span>{line.split(": ")[1]}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-red-600 font-semibold text-center py-1 text-[10px]">
                                ⚠️ {line}
                              </div>
                            )}
                          </div>
                        ))}
                        {isRunning && (
                          <div className="flex justify-center items-center py-1">
                            <div className="inline-block w-1.5 h-3 bg-slate-800 animate-pulse"></div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Footer Struk */}
                  {output.length > 0 && !isRunning && (
                    <div className="text-center border-t border-dashed border-slate-300 pt-1.5 mt-1.5 text-[10px] text-slate-500">
                      <div>Terima kasih atas kunjungan Anda</div>
                      <div className="mt-0.5">Selamat datang kembali!</div>
                      <div className="mt-1 text-[9px]">
                        {new Date().toLocaleString("id-ID")}
                      </div>
                    </div>
                  )}
                </div>

                {/* Paper tear effect bottom */}
                <div
                  className="h-2 bg-gradient-to-t from-slate-200 to-white"
                  style={{
                    backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 8px, #e2e8f0 8px, #e2e8f0 12px)`,
                    backgroundSize: "12px 100%",
                    clipPath:
                      "polygon(0 0, 5% 0, 10% 100%, 15% 0, 20% 100%, 25% 0, 30% 100%, 35% 0, 40% 100%, 45% 0, 50% 100%, 55% 0, 60% 100%, 65% 0, 70% 100%, 75% 0, 80% 100%, 85% 0, 90% 100%, 95% 0, 100% 100%, 100% 0, 0 0)",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Info tambahan untuk mobile */}
      <div className="max-w-7xl mx-auto text-center py-2">
        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-medium">
          Modul Algoritma & Pemrograman • 2024
        </p>
      </div>

      {/* Result Popup Modal */}
      {showResultPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-300">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div
                className={`p-6 rounded-3xl shadow-xl ${
                  feedback?.type === "success"
                    ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                    : "bg-gradient-to-br from-orange-400 to-orange-600"
                }`}
              >
                {feedback?.type === "success" ? (
                  <CheckCircle2 size={48} className="text-white" />
                ) : (
                  <AlertCircle size={48} className="text-white" />
                )}
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-3">
              {feedback?.type === "success"
                ? "HASIL PENGUJIAN KUALITAS"
                : "PERLU PERBAIKAN"}
            </h2>

            {/* Subtitle */}
            <p className="text-center text-slate-500 mb-6">
              {feedback?.type === "success"
                ? "Sangat mengejutkan!"
                : "Jangan menyerah!"}
            </p>

            {/* Content */}
            <div className="bg-white rounded-2xl p-5 mb-6 shadow-inner border border-slate-100">
              {feedback?.type === "success" ? (
                <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                  {/* Info Transaksi */}
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                    <p className="font-semibold text-emerald-800 text-xs mb-2">
                      💰 Data Transaksi
                    </p>
                    <div className="space-y-0.5 text-xs">
                      <div className="flex justify-between">
                        <span>Total Bayar:</span>
                        <span className="font-bold">
                          Rp {totalBayar.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uang Dibayar:</span>
                        <span className="font-bold">
                          Rp {uangDibayar.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-emerald-200 pt-1 mt-1">
                        <span>Kembalian:</span>
                        <span className="font-bold text-emerald-600">
                          Rp{" "}
                          {(uangDibayar - totalBayar).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Penjelasan Singkat */}
                  <p className="text-xs">
                    Karena uang dibayar{" "}
                    <strong className="text-emerald-600">
                      (Rp {uangDibayar.toLocaleString("id-ID")})
                    </strong>{" "}
                    lebih besar dari tagihan{" "}
                    <strong>(Rp {totalBayar.toLocaleString("id-ID")})</strong>,
                    program masuk ke blok{" "}
                    <strong className="text-emerald-600">IF (THEN)</strong>{" "}
                    untuk menghitung dan menampilkan kembalian. Urutan
                    instruksinya sudah benar: hitung dulu, baru print! 🎉
                  </p>

                  <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-700 text-center">
                      🎉 Keren! Logika kamu sudah sempurna dan efisien!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                  {/* Info Transaksi */}
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <p className="font-semibold text-orange-800 text-xs mb-2">
                      💰 Data Transaksi
                    </p>
                    <div className="space-y-0.5 text-xs">
                      <div className="flex justify-between">
                        <span>Total Bayar:</span>
                        <span className="font-bold">
                          Rp {totalBayar.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uang Dibayar:</span>
                        <span className="font-bold">
                          Rp {uangDibayar.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-orange-200 pt-1 mt-1">
                        <span>Status:</span>
                        {uangDibayar >= totalBayar ? (
                          <span className="font-bold text-emerald-600">
                            Cukup (Kembalian: Rp{" "}
                            {(uangDibayar - totalBayar).toLocaleString("id-ID")}
                            )
                          </span>
                        ) : (
                          <span className="font-bold text-red-600">
                            Uang Kurang!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Penjelasan Singkat */}
                  <p className="text-xs">
                    {uangDibayar >= totalBayar ? (
                      <>
                        Uang cukup, seharusnya masuk blok{" "}
                        <strong className="text-emerald-600">IF (THEN)</strong>{" "}
                        untuk hitung kembalian. Cek lagi urutan instruksinya ya!
                      </>
                    ) : (
                      <>
                        Uang kurang{" "}
                        <strong>
                          (Rp {uangDibayar.toLocaleString("id-ID")} {"<"} Rp{" "}
                          {totalBayar.toLocaleString("id-ID")})
                        </strong>
                        , seharusnya masuk blok{" "}
                        <strong className="text-orange-600">ELSE</strong> untuk
                        tampilkan pesan error.
                      </>
                    )}
                  </p>

                  <div className="bg-orange-50 rounded-lg p-2 border border-orange-100">
                    <p className="text-xs text-orange-700">
                      💡 <strong>Tips:</strong> Pastikan urutan instruksi sesuai
                      dengan kondisi IF-ELSE dan hitung dulu sebelum print!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Button */}
            <button
              onClick={() => setShowResultPopup(false)}
              className={`w-full py-4 rounded-xl font-bold text-white text-sm uppercase tracking-wider transition-all ${
                feedback?.type === "success"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200"
                  : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-200"
              } active:scale-95`}
            >
              {feedback?.type === "success"
                ? "PAHAM, LUAR BIASA!"
                : "COBA LAGI!"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
