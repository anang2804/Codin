"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Play,
  RotateCcw,
  Triangle,
  Code2,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import MarkCompletedButton from "@/components/MarkCompletedButton";

export default function LuasSegitigaPage() {
  // Konfigurasi untuk setiap bentuk
  const SHAPES = {
    segitiga: {
      name: "Segitiga",
      inputs: [
        { key: "alas", label: "Alas" },
        { key: "tinggi", label: "Tinggi" },
      ],
      operands: ["alas", "tinggi", "2"],
      formula: "(alas × tinggi) ÷ 2",
      correctAnswers: (values: any) => (values.alas * values.tinggi) / 2,
    },
    persegi: {
      name: "Persegi Panjang",
      inputs: [
        { key: "panjang", label: "Panjang" },
        { key: "lebar", label: "Lebar" },
      ],
      operands: ["panjang", "lebar"],
      formula: "panjang × lebar",
      correctAnswers: (values: any) => values.panjang * values.lebar,
    },
    lingkaran: {
      name: "Lingkaran",
      inputs: [{ key: "radius", label: "Radius" }],
      operands: ["314", "radius", "100"], // 3.14 = 314/100
      formula: "3.14 × radius × radius",
      correctAnswers: (values: any) => 3.14 * values.radius * values.radius,
    },
  };

  const OPERATORS = ["*", "/", "+", "-"];

  // State untuk bentuk yang dipilih
  const [selectedShape, setSelectedShape] =
    useState<keyof typeof SHAPES>("segitiga");

  // State untuk semua input values
  const [inputValues, setInputValues] = useState<Record<string, number>>({
    alas: 0,
    tinggi: 0,
    panjang: 0,
    lebar: 0,
    radius: 0,
  });

  // Shorthand untuk backward compatibility
  const alas = inputValues.alas;
  const tinggi = inputValues.tinggi;

  const currentShape = SHAPES[selectedShape];
  const OPERANDS = currentShape.operands;

  // State untuk 5 slot: [Operand, Operator, Operand, Operator, Operand]
  const [slots, setSlots] = useState(["", "", "", "", ""]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [steps, setSteps] = useState<string[]>([]);
  const [finalResult, setFinalResult] = useState<number | null>(null);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  const setAlas = (val: number) =>
    setInputValues((prev) => ({ ...prev, alas: val }));
  const setTinggi = (val: number) =>
    setInputValues((prev) => ({ ...prev, tinggi: val }));

  const handleSlotChange = (index: number, value: string) => {
    if (isRunning) return;
    const newSlots = [...slots];
    newSlots[index] = value;
    setSlots(newSlots);
    setFeedback(null);
  };

  const resetSimulasi = () => {
    setIsRunning(false);
    setCurrentStep(-1);
    setSteps([]);
    setFinalResult(null);
    setFeedback(null);
    setShowResultPopup(false);
    setSlots(["", "", "", "", ""]);
  };

  const runSimulation = async () => {
    // Validasi input berdasarkan bentuk yang dipilih
    const requiredInputs = currentShape.inputs;
    const hasInvalidInput = requiredInputs.some(
      (input) => inputValues[input.key] <= 0
    );

    if (hasInvalidInput) {
      setFeedback({
        type: "warning",
        text: `Masukkan nilai ${requiredInputs
          .map((i) => i.label.toLowerCase())
          .join(" dan ")} terlebih dahulu.`,
      });
      return;
    }

    // Validasi kelengkapan slot
    if (slots.some((s) => s === "")) {
      setFeedback({
        type: "warning",
        text: "Lengkapi semua slot ekspresi terlebih dahulu.",
      });
      return;
    }

    setIsRunning(true);
    setSteps([]);
    setFinalResult(null);
    setFeedback(null);

    // Helper function to get value
    const getValue = (operand: string) => {
      const numValue = parseFloat(operand);
      if (!isNaN(numValue)) return numValue;
      return inputValues[operand] || 0;
    };

    const [v1, op1, v2, op2, v3] = slots;
    const val1 = getValue(v1);
    const val2 = getValue(v2);
    const val3 = getValue(v3 || "0");

    // Tahap 1: Hitung operasi pertama (Kiri ke kanan - simulasi sederhana)
    setCurrentStep(0);
    await new Promise((r) => setTimeout(r, 800));

    let res1 = 0;
    switch (op1) {
      case "*":
        res1 = val1 * val2;
        break;
      case "/":
        res1 = val1 / val2;
        break;
      case "+":
        res1 = val1 + val2;
        break;
      case "-":
        res1 = val1 - val2;
        break;
      default:
        res1 = 0;
    }
    setSteps((prev) => [...prev, `${val1} ${op1} ${val2} = ${res1}`]);

    // Tahap 2: Hitung operasi kedua
    setCurrentStep(1);
    await new Promise((r) => setTimeout(r, 800));

    let res2 = 0;
    switch (op2) {
      case "*":
        res2 = res1 * val3;
        break;
      case "/":
        res2 = res1 / val3;
        break;
      case "+":
        res2 = res1 + val3;
        break;
      case "-":
        res2 = res1 - val3;
        break;
      default:
        res2 = 0;
    }
    setSteps((prev) => [...prev, `${res1} ${op2} ${val3} = ${res2}`]);

    // Tahap 3: Final
    setCurrentStep(2);
    await new Promise((r) => setTimeout(r, 600));
    setFinalResult(res2);

    // Cek apakah hasil sesuai dengan jawaban yang benar
    const correctAnswer = currentShape.correctAnswers(inputValues);
    const isCorrect = Math.abs(res2 - correctAnswer) < 0.01; // tolerance untuk float

    if (isCorrect) {
      setFeedback({
        type: "success",
        text: `Luar biasa! Ekspresi aritmatika kamu sudah benar untuk ${currentShape.name}.`,
      });
    } else {
      setFeedback({
        type: "error",
        text: `Ekspresi sudah dijalankan, tapi belum sesuai untuk menghitung luas ${currentShape.name.toLowerCase()}.`,
      });
    }

    // Tampilkan popup hasil
    await new Promise((r) => setTimeout(r, 500));
    setShowResultPopup(true);

    setIsRunning(false);
    setCurrentStep(-1);
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 p-4 font-sans text-slate-700 flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Header */}
        <header className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/siswa/simulasi"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200">
              <Triangle size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                Luas Tanah Pak Algor
              </h1>
              <p className="text-sm text-slate-500">
                Susun ekspresi untuk menghitung luas{" "}
                {currentShape.name.toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {/* Dropdown Pilih Bentuk */}
            <select
              value={selectedShape}
              onChange={(e) => {
                setSelectedShape(e.target.value as keyof typeof SHAPES);
                setSlots(["", "", "", "", ""]);
                setFeedback(null);
                setSteps([]);
                setFinalResult(null);
              }}
              className="px-4 py-2.5 bg-white border-2 border-emerald-600 text-slate-700 rounded-xl font-semibold transition-all hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              disabled={isRunning}
            >
              <option value="segitiga">🔺 Segitiga</option>
              <option value="persegi">▭ Persegi Panjang</option>
              <option value="lingkaran">⭕ Lingkaran</option>
            </select>

            <button
              onClick={resetSimulasi}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 font-medium text-sm whitespace-nowrap"
            >
              <RotateCcw size={16} /> Reset
            </button>
            <button
              onClick={runSimulation}
              disabled={isRunning}
              className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md text-sm whitespace-nowrap ${
                isRunning
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-emerald-100"
              }`}
            >
              <Play size={18} fill="currentColor" /> Jalankan Program
            </button>
            <MarkCompletedButton simulasiSlug="luas-segitiga" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Panel Kiri - Cerita */}
          <div className="lg:col-span-4 space-y-4 overflow-y-auto">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Info size={60} />
              </div>
              <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">
                Konteks Tanah
              </h2>
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-slate-600">
                  Pak Algor memiliki sebidang tanah berbentuk{" "}
                  <strong>
                    {selectedShape === "segitiga" && "segitiga siku-siku"}
                    {selectedShape === "persegi" && "persegi panjang"}
                    {selectedShape === "lingkaran" && "lingkaran"}
                  </strong>
                  . Bantu beliau membuat program penghitung luas otomatis.
                </p>

                {/* SVG Visual - Tanah Real - Conditional based on selected shape */}
                <div className="py-4 flex justify-center">
                  {selectedShape === "segitiga" && (
                    <svg
                      width="220"
                      height="180"
                      viewBox="0 0 220 180"
                      className="drop-shadow-lg"
                    >
                      <defs>
                        {/* Gradient untuk tanah */}
                        <linearGradient
                          id="tanahGradient"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#86efac"
                            stopOpacity="0.8"
                          />
                          <stop
                            offset="50%"
                            stopColor="#4ade80"
                            stopOpacity="0.9"
                          />
                          <stop
                            offset="100%"
                            stopColor="#22c55e"
                            stopOpacity="1"
                          />
                        </linearGradient>

                        {/* Pattern rumput */}
                        <pattern
                          id="grassPattern"
                          x="0"
                          y="0"
                          width="20"
                          height="20"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M2,18 Q2,15 3,12 M5,18 Q5,14 6,10 M8,18 Q8,15 9,12 M11,18 Q11,14 12,10 M14,18 Q14,15 15,12 M17,18 Q17,14 18,10"
                            stroke="#15803d"
                            strokeWidth="0.5"
                            fill="none"
                            opacity="0.3"
                          />
                        </pattern>

                        {/* Shadow */}
                        <filter id="shadow">
                          <feDropShadow
                            dx="2"
                            dy="2"
                            stdDeviation="3"
                            floodOpacity="0.3"
                          />
                        </filter>
                      </defs>

                      {/* Background sky */}
                      <rect
                        x="0"
                        y="0"
                        width="220"
                        height="140"
                        fill="#f0f9ff"
                        opacity="0.5"
                      />

                      {/* Tanah segitiga dengan gradient */}
                      <path
                        d="M40,130 L180,130 L40,40 Z"
                        fill="url(#tanahGradient)"
                        stroke="#16a34a"
                        strokeWidth="3"
                        filter="url(#shadow)"
                      />

                      {/* Pattern rumput di atas tanah */}
                      <path
                        d="M40,130 L180,130 L40,40 Z"
                        fill="url(#grassPattern)"
                      />

                      {/* Siku-siku marker */}
                      <rect
                        x="40"
                        y="118"
                        width="12"
                        height="12"
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth="2"
                      />

                      {/* Pagar kecil di pojok */}
                      <line
                        x1="38"
                        y1="130"
                        x2="38"
                        y2="135"
                        stroke="#7c3aed"
                        strokeWidth="2"
                      />
                      <line
                        x1="180"
                        y1="130"
                        x2="180"
                        y2="135"
                        stroke="#7c3aed"
                        strokeWidth="2"
                      />
                      <line
                        x1="40"
                        y1="40"
                        x2="35"
                        y2="40"
                        stroke="#7c3aed"
                        strokeWidth="2"
                      />

                      {/* Garis ukur alas dengan panah */}
                      <defs>
                        <marker
                          id="arrowEnd"
                          markerWidth="8"
                          markerHeight="8"
                          refX="6"
                          refY="3"
                          orient="auto"
                        >
                          <polygon points="0 0, 6 3, 0 6" fill="#64748b" />
                        </marker>
                        <marker
                          id="arrowStart"
                          markerWidth="8"
                          markerHeight="8"
                          refX="2"
                          refY="3"
                          orient="auto"
                        >
                          <polygon points="6 0, 0 3, 6 6" fill="#64748b" />
                        </marker>
                      </defs>

                      <line
                        x1="45"
                        y1="150"
                        x2="175"
                        y2="150"
                        stroke="#64748b"
                        strokeWidth="2"
                        markerEnd="url(#arrowEnd)"
                        markerStart="url(#arrowStart)"
                      />

                      {/* Label alas */}
                      <text
                        x="110"
                        y="168"
                        fontSize="14"
                        className="fill-slate-600 font-bold"
                        textAnchor="middle"
                      >
                        alas = {alas || "?"} m
                      </text>

                      {/* Garis ukur tinggi dengan panah */}
                      <line
                        x1="20"
                        y1="45"
                        x2="20"
                        y2="125"
                        stroke="#64748b"
                        strokeWidth="2"
                        markerEnd="url(#arrowEnd)"
                        markerStart="url(#arrowStart)"
                      />

                      {/* Label tinggi */}
                      <text
                        x="12"
                        y="90"
                        fontSize="14"
                        className="fill-slate-600 font-bold"
                        textAnchor="middle"
                        transform="rotate(-90 12 90)"
                      >
                        tinggi = {tinggi || "?"} m
                      </text>

                      {/* Dekorasi: Beberapa titik rumput */}
                      <circle
                        cx="60"
                        cy="115"
                        r="1.5"
                        fill="#15803d"
                        opacity="0.6"
                      />
                      <circle
                        cx="80"
                        cy="110"
                        r="1.5"
                        fill="#15803d"
                        opacity="0.6"
                      />
                      <circle
                        cx="100"
                        cy="105"
                        r="1.5"
                        fill="#15803d"
                        opacity="0.6"
                      />
                      <circle
                        cx="120"
                        cy="118"
                        r="1.5"
                        fill="#15803d"
                        opacity="0.6"
                      />
                      <circle
                        cx="140"
                        cy="120"
                        r="1.5"
                        fill="#15803d"
                        opacity="0.6"
                      />
                      <circle
                        cx="160"
                        cy="125"
                        r="1.5"
                        fill="#15803d"
                        opacity="0.6"
                      />

                      {/* Awan kecil sebagai dekorasi */}
                      <ellipse
                        cx="180"
                        cy="20"
                        rx="12"
                        ry="6"
                        fill="white"
                        opacity="0.7"
                      />
                      <ellipse
                        cx="170"
                        cy="22"
                        rx="8"
                        ry="5"
                        fill="white"
                        opacity="0.7"
                      />
                      <ellipse
                        cx="190"
                        cy="22"
                        rx="10"
                        ry="5"
                        fill="white"
                        opacity="0.7"
                      />
                    </svg>
                  )}

                  {selectedShape === "persegi" && (
                    <svg
                      width="220"
                      height="180"
                      viewBox="0 0 220 180"
                      className="drop-shadow-lg"
                    >
                      <defs>
                        <linearGradient
                          id="tanahGradient"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#16a34a" />
                          <stop offset="100%" stopColor="#15803d" />
                        </linearGradient>
                        <pattern
                          id="grassPattern"
                          x="0"
                          y="0"
                          width="6"
                          height="6"
                          patternUnits="userSpaceOnUse"
                        >
                          <circle
                            cx="3"
                            cy="3"
                            r="0.8"
                            fill="#15803d"
                            opacity="0.3"
                          />
                        </pattern>
                        <filter
                          id="shadow"
                          x="-20%"
                          y="-20%"
                          width="140%"
                          height="140%"
                        >
                          <feDropShadow
                            dx="0"
                            dy="2"
                            stdDeviation="4"
                            floodOpacity="0.2"
                          />
                        </filter>
                        <marker
                          id="arrowEnd2"
                          markerWidth="8"
                          markerHeight="8"
                          refX="6"
                          refY="3"
                          orient="auto"
                        >
                          <polygon points="0 0, 6 3, 0 6" fill="#64748b" />
                        </marker>
                        <marker
                          id="arrowStart2"
                          markerWidth="8"
                          markerHeight="8"
                          refX="2"
                          refY="3"
                          orient="auto"
                        >
                          <polygon points="6 0, 0 3, 6 6" fill="#64748b" />
                        </marker>
                      </defs>

                      {/* Langit */}
                      <rect
                        x="0"
                        y="0"
                        width="220"
                        height="40"
                        fill="#bae6fd"
                        opacity="0.3"
                      />

                      {/* Persegi Panjang Tanah */}
                      <rect
                        x="40"
                        y="50"
                        width="140"
                        height="80"
                        fill="url(#tanahGradient)"
                        stroke="#15803d"
                        strokeWidth="3"
                        filter="url(#shadow)"
                      />
                      <rect
                        x="40"
                        y="50"
                        width="140"
                        height="80"
                        fill="url(#grassPattern)"
                      />

                      {/* Garis ukur panjang horizontal */}
                      <line
                        x1="45"
                        y1="150"
                        x2="175"
                        y2="150"
                        stroke="#64748b"
                        strokeWidth="2"
                        markerEnd="url(#arrowEnd2)"
                        markerStart="url(#arrowStart2)"
                      />
                      <text
                        x="110"
                        y="168"
                        fontSize="14"
                        className="fill-slate-600 font-bold"
                        textAnchor="middle"
                      >
                        panjang = {inputValues.panjang || "?"} m
                      </text>

                      {/* Garis ukur lebar vertical */}
                      <line
                        x1="20"
                        y1="55"
                        x2="20"
                        y2="125"
                        stroke="#64748b"
                        strokeWidth="2"
                        markerEnd="url(#arrowEnd2)"
                        markerStart="url(#arrowStart2)"
                      />
                      <text
                        x="12"
                        y="95"
                        fontSize="14"
                        className="fill-slate-600 font-bold"
                        textAnchor="middle"
                        transform="rotate(-90 12 95)"
                      >
                        lebar = {inputValues.lebar || "?"} m
                      </text>

                      {/* Dekorasi */}
                      <ellipse
                        cx="180"
                        cy="20"
                        rx="12"
                        ry="6"
                        fill="white"
                        opacity="0.7"
                      />
                      <ellipse
                        cx="170"
                        cy="22"
                        rx="8"
                        ry="5"
                        fill="white"
                        opacity="0.7"
                      />
                      <ellipse
                        cx="190"
                        cy="22"
                        rx="10"
                        ry="5"
                        fill="white"
                        opacity="0.7"
                      />
                    </svg>
                  )}

                  {selectedShape === "lingkaran" && (
                    <svg
                      width="220"
                      height="180"
                      viewBox="0 0 220 180"
                      className="drop-shadow-lg"
                    >
                      <defs>
                        <radialGradient
                          id="tanahGradientCircle"
                          cx="50%"
                          cy="50%"
                          r="50%"
                        >
                          <stop offset="0%" stopColor="#16a34a" />
                          <stop offset="100%" stopColor="#15803d" />
                        </radialGradient>
                        <pattern
                          id="grassPattern3"
                          x="0"
                          y="0"
                          width="6"
                          height="6"
                          patternUnits="userSpaceOnUse"
                        >
                          <circle
                            cx="3"
                            cy="3"
                            r="0.8"
                            fill="#15803d"
                            opacity="0.3"
                          />
                        </pattern>
                        <filter
                          id="shadow3"
                          x="-20%"
                          y="-20%"
                          width="140%"
                          height="140%"
                        >
                          <feDropShadow
                            dx="0"
                            dy="2"
                            stdDeviation="4"
                            floodOpacity="0.2"
                          />
                        </filter>
                        <marker
                          id="arrowEnd3"
                          markerWidth="8"
                          markerHeight="8"
                          refX="6"
                          refY="3"
                          orient="auto"
                        >
                          <polygon points="0 0, 6 3, 0 6" fill="#64748b" />
                        </marker>
                        <marker
                          id="arrowStart3"
                          markerWidth="8"
                          markerHeight="8"
                          refX="2"
                          refY="3"
                          orient="auto"
                        >
                          <polygon points="6 0, 0 3, 6 6" fill="#64748b" />
                        </marker>
                      </defs>

                      {/* Langit */}
                      <rect
                        x="0"
                        y="0"
                        width="220"
                        height="40"
                        fill="#bae6fd"
                        opacity="0.3"
                      />

                      {/* Lingkaran Tanah */}
                      <circle
                        cx="110"
                        cy="95"
                        r="60"
                        fill="url(#tanahGradientCircle)"
                        stroke="#15803d"
                        strokeWidth="3"
                        filter="url(#shadow3)"
                      />
                      <circle
                        cx="110"
                        cy="95"
                        r="60"
                        fill="url(#grassPattern3)"
                      />

                      {/* Garis radius horizontal */}
                      <line
                        x1="110"
                        y1="95"
                        x2="170"
                        y2="95"
                        stroke="#7c3aed"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />

                      {/* Titik pusat */}
                      <circle cx="110" cy="95" r="3" fill="#7c3aed" />

                      {/* Garis ukur radius dengan panah */}
                      <line
                        x1="110"
                        y1="75"
                        x2="170"
                        y2="75"
                        stroke="#64748b"
                        strokeWidth="2"
                        markerEnd="url(#arrowEnd3)"
                        markerStart="url(#arrowStart3)"
                      />
                      <text
                        x="140"
                        y="70"
                        fontSize="14"
                        className="fill-slate-600 font-bold"
                        textAnchor="middle"
                      >
                        r = {inputValues.radius || "?"} m
                      </text>

                      {/* Dekorasi */}
                      <ellipse
                        cx="180"
                        cy="20"
                        rx="12"
                        ry="6"
                        fill="white"
                        opacity="0.7"
                      />
                      <ellipse
                        cx="170"
                        cy="22"
                        rx="8"
                        ry="5"
                        fill="white"
                        opacity="0.7"
                      />
                      <ellipse
                        cx="190"
                        cy="22"
                        rx="10"
                        ry="5"
                        fill="white"
                        opacity="0.7"
                      />
                    </svg>
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl space-y-3">
                  {/* Dynamic Input Fields based on selected shape */}
                  {currentShape.inputs.map((input) => (
                    <div key={input.key} className="flex flex-col gap-1">
                      <label className="text-xs text-slate-500 font-medium">
                        Variabel {input.label}
                      </label>
                      <input
                        type="number"
                        value={inputValues[input.key]}
                        onChange={(e) =>
                          setInputValues((prev) => ({
                            ...prev,
                            [input.key]: Number(e.target.value),
                          }))
                        }
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                          if (
                            inputValues[input.key] === 0 &&
                            e.key >= "0" &&
                            e.key <= "9" &&
                            e.key !== "0"
                          ) {
                            e.preventDefault();
                            setInputValues((prev) => ({
                              ...prev,
                              [input.key]: Number(e.key),
                            }));
                          }
                        }}
                        disabled={isRunning}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Panel Tengah - Editor Ekspresi */}
          <div className="lg:col-span-8 min-h-0 flex flex-col gap-4">
            {/* Code Editor */}
            <div className="bg-[#1e293b] rounded-3xl shadow-xl overflow-hidden border border-slate-700 flex flex-col">
              <div className="bg-slate-800/80 px-5 py-3 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 size={16} className="text-emerald-500" />
                  <span className="text-slate-300 text-[10px] font-mono uppercase tracking-widest"></span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                </div>
              </div>

              <div className="p-8 flex flex-col items-center justify-center space-y-8 bg-[#0f172a]/50">
                {/* Expression Statement - One Line Like Real Code */}
                <div className="w-full">
                  <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                    {/* luas = */}
                    <span className="text-emerald-400 font-mono text-xl font-semibold shrink-0">
                      luas
                    </span>
                    <span className="text-white font-mono text-xl shrink-0">
                      =
                    </span>

                    {/* Slot Builder - All in One Line */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-2 shrink-0">
                        <select
                          value={slots[i]}
                          onChange={(e) => handleSlotChange(i, e.target.value)}
                          disabled={isRunning}
                          className={`
                            h-12 ${
                              i % 2 === 0 ? "w-20" : "w-14"
                            } px-2 rounded-lg font-mono text-sm font-semibold text-center
                            appearance-none cursor-pointer outline-none transition-all
                            shadow-lg backdrop-blur-sm
                            ${
                              slots[i] === ""
                                ? "bg-slate-800/70 border-2 border-slate-600/50 text-slate-500"
                                : "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500 text-white"
                            }
                            ${
                              isRunning
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:scale-105 hover:border-emerald-400 focus:ring-4 focus:ring-emerald-500/30"
                            }
                          `}
                        >
                          <option
                            value=""
                            className="bg-slate-800 text-slate-400"
                          >
                            {i % 2 === 0 ? "___" : "_"}
                          </option>
                          {i % 2 === 0
                            ? OPERANDS.map((o) => (
                                <option
                                  key={o}
                                  value={o}
                                  className="bg-slate-800 text-white"
                                >
                                  {o}
                                </option>
                              ))
                            : OPERATORS.map((o) => (
                                <option
                                  key={o}
                                  value={o}
                                  className="bg-slate-800 text-white"
                                >
                                  {o}
                                </option>
                              ))}
                        </select>
                      </div>
                    ))}

                    {/* Semicolon */}
                    <span className="text-emerald-400 font-mono text-2xl font-bold shrink-0">
                      ;
                    </span>
                  </div>
                </div>

                {/* Tips Box */}
                <div className="w-full max-w-md">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <Info
                        size={18}
                        className="text-emerald-400 shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-semibold text-emerald-400 mb-1">
                          Tips
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Luas {currentShape.name.toLowerCase()} ={" "}
                          {currentShape.formula}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Execution Process - Moved Below */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 flex flex-col shadow-lg overflow-hidden">
              <div className="bg-slate-800/80 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-emerald-500" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Execution Process
                  </span>
                </div>
                {isRunning && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                )}
              </div>

              <div className="p-5 font-mono text-sm space-y-3 min-h-[200px] max-h-[300px] overflow-y-auto">
                {steps.length === 0 && !isRunning && (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-slate-500">
                    <Terminal size={40} className="mb-2" />
                    <p className="text-[10px] uppercase tracking-tighter">
                      Menunggu eksekusi...
                    </p>
                  </div>
                )}

                {steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-emerald-400 animate-in slide-in-from-left-4 duration-300"
                  >
                    <ChevronRight size={14} className="opacity-50" />
                    <span className="bg-emerald-500/10 px-2 py-0.5 rounded text-xs">
                      {step}
                    </span>
                  </div>
                ))}

                {finalResult !== null && (
                  <div className="pt-3 mt-3 border-t border-slate-800">
                    <div className="flex items-center gap-3 text-white font-bold">
                      <span className="text-emerald-500">luas =</span>
                      <span className="text-xl">{finalResult}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Feedback Message */}
            {feedback && (
              <div
                className={`p-4 rounded-3xl flex items-start gap-3 border shadow-sm animate-in zoom-in-95 duration-300 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : feedback.type === "warning"
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                )}
                <p className="text-xs font-bold leading-relaxed">
                  {feedback.text}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Popup Result */}
        {showResultPopup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div
                className={`p-6 rounded-t-3xl ${
                  feedback?.type === "success"
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                    : "bg-gradient-to-br from-red-500 to-orange-600"
                }`}
              >
                <div className="flex items-center gap-3 text-white">
                  {feedback?.type === "success" ? (
                    <CheckCircle2 size={32} />
                  ) : (
                    <AlertCircle size={32} />
                  )}
                  <div>
                    <h3 className="text-xl font-bold">
                      {feedback?.type === "success"
                        ? "Selamat! 🎉"
                        : "Belum Tepat"}
                    </h3>
                    <p className="text-sm opacity-90">Hasil Eksekusi Program</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Ekspresi yang digunakan */}
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">
                    Ekspresi Kamu:
                  </p>
                  <p className="font-mono text-sm text-slate-800 font-bold">
                    luas = {slots.join(" ")};
                  </p>
                </div>

                {/* Input Values - Dynamic based on shape */}
                <div
                  className={`grid gap-3 ${
                    currentShape.inputs.length === 1
                      ? "grid-cols-1"
                      : "grid-cols-2"
                  }`}
                >
                  {currentShape.inputs.map((input) => (
                    <div
                      key={input.key}
                      className="bg-emerald-50 p-3 rounded-xl border border-emerald-200"
                    >
                      <p className="text-xs text-emerald-600 font-semibold mb-1">
                        {input.label}
                      </p>
                      <p className="font-mono text-lg font-bold text-emerald-700">
                        {inputValues[input.key]} m
                      </p>
                    </div>
                  ))}
                </div>

                {/* Result */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl">
                  <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">
                    Hasil Perhitungan:
                  </p>
                  <p className="font-mono text-2xl font-bold text-white">
                    luas = {finalResult} m²
                  </p>
                </div>

                {/* Expected vs Actual */}
                {feedback?.type !== "success" && (
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                    <p className="text-xs text-amber-700 font-semibold mb-2 flex items-center gap-2">
                      <Info size={14} /> Formula yang Benar:
                    </p>
                    <p className="font-mono text-sm text-amber-800 font-bold">
                      luas = {currentShape.formula};
                    </p>
                    <p className="text-xs text-amber-600 mt-2">
                      Hasil yang seharusnya:{" "}
                      {currentShape.correctAnswers(inputValues).toFixed(2)} m²
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {feedback?.type === "success" && (
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                    <p className="text-sm text-emerald-700 font-semibold">
                      ✓ Ekspresi aritmatika sudah benar!
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      Kamu berhasil menerapkan rumus luas{" "}
                      {currentShape.name.toLowerCase()} dengan tepat.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={() => setShowResultPopup(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setShowResultPopup(false);
                    resetSimulasi();
                  }}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
