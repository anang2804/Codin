"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Barcode,
  Wallet,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Cpu,
  Zap,
  CreditCard,
  Package,
  ArrowRight,
  Monitor,
  CheckCircle,
  X,
  Plus,
  Database,
  Search,
  Check,
  ChevronUp,
  Gift,
  BadgeCheck,
  Printer,
  MousePointer2,
  Scissors,
  Lightbulb,
  FileText,
  CpuIcon,
  Terminal,
  Settings,
  Layers,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// --- THREE.JS CDN ---
const THREE_JS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

export default function KasirIPOSimulation() {
  const [step, setStep] = useState(1); // 1: Input, 2: Payment, 3: Processing, 4: Done
  const [cart, setCart] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  const products = [
    { id: 1, name: "Kopi Arabika", price: 25000, category: "Minuman" },
    { id: 2, name: "Roti Cokelat", price: 12000, category: "Makanan" },
    { id: 3, name: "Susu Segar", price: 18000, category: "Minuman" },
    { id: 4, name: "Air Mineral", price: 5000, category: "Minuman" },
    { id: 5, name: "Snack Kentang", price: 15000, category: "Makanan" },
    { id: 6, name: "Teh Manis", price: 8000, category: "Minuman" },
  ];

  // --- MATERI IPO ---
  const ipoInsights: Record<number, any> = {
    1: {
      title: "TAHAP 1: INPUT (DATA)",
      desc: "Komputer menerima data mentah berupa harga dan jumlah. Tanpa input, sistem tidak bisa bekerja.",
      theory: "Input: Harga & Qty.",
      logic: "Status: Idle",
    },
    2: {
      title: "TAHAP 1: INPUT (INSTRUKSI)",
      desc: "Instruksi pembayaran memberitahu CPU untuk mulai memproses data mentah tersebut.",
      theory: "Instruksi: Perintah Bayar.",
      logic: "Status: Validasi",
    },
    3: {
      title: "TAHAP 2: PROCESS (LOGIKA)",
      desc: "CPU menghitung algoritma: (Harga x Qty) + Pajak. Data mentah diubah menjadi informasi.",
      theory: "Process: Total + Pajak.",
      logic: "Status: Kalkulasi",
    },
    4: {
      title: "TAHAP 3: OUTPUT (INFORMASI)",
      desc: "Informasi adalah hasil olahan yang berguna. Struk belanja adalah bentuk informasi fisik.",
      theory: "Output: Struk Belanja.",
      logic: "Status: Selesai",
    },
  };

  // --- THREE.JS LOGIC ---
  useEffect(() => {
    const script = document.createElement("script");
    script.src = THREE_JS_URL;
    script.onload = initThree;
    document.head.appendChild(script);

    let scene: any, camera: any, renderer: any, core: any;

    function initThree() {
      if (!canvasRef.current) return;
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      scene = new (window as any).THREE.Scene();
      camera = new (window as any).THREE.PerspectiveCamera(
        75,
        width / height,
        0.1,
        1000
      );
      camera.position.z = 3.5;
      renderer = new (window as any).THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true,
      });
      renderer.setSize(width, height);

      const geometry = new (window as any).THREE.TorusKnotGeometry(
        1,
        0.3,
        100,
        16
      );
      const material = new (window as any).THREE.MeshPhongMaterial({
        color: 0x3b82f6,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });
      core = new (window as any).THREE.Mesh(geometry, material);
      scene.add(core);

      const light = new (window as any).THREE.PointLight(0xffffff, 1, 100);
      light.position.set(5, 5, 5);
      scene.add(light);
      scene.add(new (window as any).THREE.AmbientLight(0x404040));

      animate();
    }

    function animate() {
      requestRef.current = requestAnimationFrame(animate);
      if (core) {
        core.rotation.y += step === 3 ? 0.08 : 0.01;
        core.rotation.z += 0.005;
        if (step === 3) core.material.color.setHex(0xf59e0b);
        else if (step === 4) core.material.color.setHex(0x10b981);
        else core.material.color.setHex(0x3b82f6);
      }
      if (renderer && scene && camera) renderer.render(scene, camera);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, [step]);

  const addToCart = (product: any) => {
    if (step !== 1) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing)
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id: number) =>
    setCart((prev) => prev.filter((item) => item.id !== id));
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const processTransaction = () => {
    setStep(3);
    let p = 0;
    const interval = setInterval(() => {
      p += 2;
      if (p > 100) p = 100;
      setProgress(p);
      if (p >= 100) clearInterval(interval);
    }, 20);
  };

  const finishProcess = () => {
    setStep(4);
    setReceiptVisible(true);
  };

  const reset = () => {
    setReceiptVisible(false);
    setTimeout(() => {
      setStep(1);
      setCart([]);
      setProgress(0);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans p-4 md:p-6 flex flex-col items-center overflow-x-hidden relative">
      {/* Back Button */}
      <div className="w-full max-w-6xl mb-4">
        <Link href="/siswa/simulasi">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <ArrowLeft size={16} />
            <span className="text-sm font-bold">Kembali ke Simulasi</span>
          </button>
        </Link>
      </div>

      {/* 1. HEADER - Z-INDEX TINGGI */}
      <div className="w-full max-w-6xl mb-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-200 pb-4 relative z-[100]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl">
            <CpuIcon size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none italic">
              Sistem Kasir IPO
            </h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest font-mono">
              Real-time Data Processing
            </p>
          </div>
        </div>
        <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-inner">
          <div
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 ${
              step <= 2 ? "bg-blue-600 text-white shadow-lg" : "text-slate-400"
            }`}
          >
            Input
          </div>
          <div
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 ${
              step === 3
                ? "bg-amber-500 text-white shadow-lg"
                : "text-slate-400"
            }`}
          >
            Process
          </div>
          <div
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 ${
              step === 4
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-slate-400"
            }`}
          >
            Output
          </div>
        </div>
      </div>

      {/* 2. PANEL MATERI IPO - SOLID BACKGROUND */}
      <div className="w-full max-w-6xl mb-6 relative z-[100] animate-in fade-in slide-in-from-top-4 duration-700">
        <div
          className={`p-4 rounded-[1.8rem] border-2 flex flex-col md:flex-row items-center gap-5 transition-all duration-700 bg-white shadow-xl ${
            step <= 2
              ? "border-blue-200"
              : step === 3
              ? "border-amber-200"
              : "border-emerald-200"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 shadow-lg ${
              step <= 2
                ? "bg-blue-600 text-white"
                : step === 3
                ? "bg-amber-500 text-white"
                : "bg-emerald-600 text-white"
            }`}
          >
            <Lightbulb size={24} className="animate-pulse" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4
              className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${
                step <= 2
                  ? "text-blue-700"
                  : step === 3
                  ? "text-amber-700"
                  : "text-emerald-700"
              }`}
            >
              {ipoInsights[step].title}
            </h4>
            <p className="text-[13px] text-slate-700 font-bold leading-tight italic">
              &quot;{ipoInsights[step].desc}&quot;
            </p>
          </div>
          <div className="bg-slate-50 px-5 py-2 rounded-xl border border-slate-200 flex flex-col items-center md:items-end min-w-[150px]">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 underline">
              Konsep
            </span>
            <span className="text-[11px] font-mono font-black uppercase tracking-tighter text-slate-800">
              {ipoInsights[step].theory}
            </span>
          </div>
        </div>
      </div>

      {/* 3. HARDWARE AREA - MONITOR & PRINTER */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-stretch justify-center gap-8 relative z-10 min-h-[500px]">
        {/* MONITOR SECTION */}
        <div className="flex-[3] flex flex-col items-center relative">
          <div className="w-full aspect-video bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-[12px] border-slate-800 flex flex-col relative overflow-hidden">
            <div className="flex-1 bg-white rounded-[1.8rem] overflow-hidden flex flex-col relative shadow-inner">
              <div className="h-10 bg-slate-100 border-b border-slate-200 px-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-slate-600" />
                  <span className="font-black text-[9px] uppercase tracking-widest text-slate-500 font-mono">
                    Terminal_OS
                  </span>
                </div>
                <div className="text-slate-400 font-bold uppercase text-[8px] flex items-center gap-3">
                  {step === 1 && (
                    <span className="animate-pulse text-blue-500 font-black tracking-widest">
                      INPUT_MODE
                    </span>
                  )}
                  {step === 3 ? "PROCESSING..." : "READY"}
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden relative">
                {/* Katalog (Input) */}
                <div
                  className={`flex-1 p-6 overflow-y-auto bg-slate-50 transition-all duration-500 ${
                    step !== 1 ? "opacity-0 blur-2xl" : "opacity-100"
                  }`}
                >
                  <div className="flex justify-between items-center mb-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                    <MousePointer2
                      size={14}
                      className="text-blue-500 animate-bounce"
                    />{" "}
                    KLIK PRODUK (INPUT DATA)
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className="p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-blue-500 hover:shadow-xl transition-all group active:scale-95 shadow-sm relative"
                      >
                        <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                          <Package size={16} />
                        </div>
                        <div className="font-bold text-[11px] text-slate-800 truncate mb-1">
                          {p.name}
                        </div>
                        <div className="text-[9px] font-black text-slate-400 font-mono uppercase tracking-tighter">
                          Rp {p.price.toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sidebar (Input List) */}
                <div
                  className={`w-72 border-l border-slate-200 flex flex-col bg-white transition-all duration-700 ${
                    step >= 3 ? "hidden" : "flex"
                  }`}
                >
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center font-mono text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    <span>Input_Data</span>
                    <Barcode size={16} />
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 && (
                      <div className="h-full flex items-center justify-center text-slate-300 italic text-[10px]">
                        Menunggu Input...
                      </div>
                    )}
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center shadow-md border-l-4 border-l-blue-500 animate-in slide-in-from-right-2"
                      >
                        <div className="flex-1 min-w-0 pr-2 text-left">
                          <div className="text-[10px] font-bold text-slate-800 truncate leading-none mb-1">
                            {item.name}
                          </div>
                          <div className="text-[9px] text-blue-600 font-bold font-mono tracking-tighter uppercase">
                            x{item.qty} &bull;{" "}
                            {(item.price * item.qty).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-slate-200 hover:text-red-500 transition-colors bg-slate-50 rounded-lg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 bg-slate-900 border-t border-slate-800">
                    <div className="flex justify-between items-end mb-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 uppercase font-mono">
                          Total_Now
                        </span>
                        <span className="text-xl font-black text-emerald-400 font-mono tracking-tighter">
                          Rp {(totalPrice * 1.1).toLocaleString()}
                        </span>
                      </div>
                      <CheckCircle
                        size={20}
                        className="text-emerald-500 opacity-50"
                      />
                    </div>
                    {step === 1 && (
                      <button
                        onClick={() => setStep(2)}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-[1rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        KE PEMBAYARAN <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* OVERLAY TAHAP 2: PEMBAYARAN */}
              {step === 2 && (
                <div className="absolute inset-0 bg-white/98 z-20 flex flex-col items-center justify-center p-8 animate-in zoom-in-95 text-center">
                  <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase italic font-mono underline decoration-blue-200 underline-offset-8">
                    Payment Input
                  </h2>
                  <p className="text-[11px] text-slate-400 mb-8 font-bold italic uppercase px-12 leading-relaxed tracking-widest">
                    Metode pembayaran akan memicu proses pengolahan data.
                  </p>
                  <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    <button
                      onClick={processTransaction}
                      className="p-8 border-2 border-slate-100 rounded-3xl hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-95 group shadow-sm bg-white"
                    >
                      <Wallet
                        size={40}
                        className="text-blue-500 mx-auto mb-2"
                      />
                      <span className="text-[10px] font-black uppercase text-slate-700">
                        Cash
                      </span>
                    </button>
                    <button
                      onClick={processTransaction}
                      className="p-8 border-2 border-slate-100 rounded-3xl hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-95 group shadow-sm bg-white"
                    >
                      <CreditCard
                        size={40}
                        className="text-purple-500 mx-auto mb-2"
                      />
                      <span className="text-[10px] font-black uppercase text-slate-700">
                        Digital
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* OVERLAY TAHAP 3: PROCESS (LOGIKA) */}
              {step === 3 && (
                <div className="absolute inset-0 bg-slate-900/98 z-30 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl animate-in fade-in duration-500">
                  <div className="w-full flex flex-col items-center max-w-md relative z-[110]">
                    <div className="w-20 h-20 mb-4 scale-150">
                      <canvas ref={canvasRef} className="w-full h-full" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-2 italic">
                      Computing Logics
                    </h3>
                    <p className="text-[11px] text-slate-400 mb-6 px-10 leading-snug font-mono">
                      CPU Menghitung: (Data x Qty) + Pajak...
                    </p>
                    <div className="w-56 h-1 bg-white/10 rounded-full overflow-hidden mb-8 shadow-inner border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="h-16 flex items-center justify-center w-full">
                      {progress >= 100 ? (
                        <button
                          onClick={finishProcess}
                          className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-[1.2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl active:scale-95 flex items-center justify-center gap-3 animate-in slide-in-from-bottom-2"
                        >
                          TERBITKAN OUTPUT <ArrowRight size={16} />
                        </button>
                      ) : (
                        <div className="text-[10px] font-mono text-amber-500 animate-pulse uppercase tracking-[0.5em]">
                          PROCESSING... {Math.floor(progress)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* OVERLAY TAHAP 4: OUTPUT (INFORMASI) */}
              {step === 4 && (
                <div className="absolute inset-0 bg-emerald-600/95 z-40 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
                  <div className="max-w-xs w-full bg-white rounded-[2.5rem] shadow-2xl flex flex-col items-center relative z-50 overflow-hidden border-8 border-white/10 p-8 text-center">
                    <BadgeCheck
                      size={48}
                      className="text-emerald-600 mb-4"
                      strokeWidth={3}
                    />
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic leading-none mb-4">
                      Output Berhasil
                    </h2>
                    <button
                      onClick={reset}
                      className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-[1.2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    >
                      TRANSAKSI BARU
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PRINTER UNIT - DIRANCANG AGAR STRUK KELUAR KE BAWAH/DEPAN */}
        <div className="flex-1 w-full lg:max-w-[300px] flex flex-col items-center relative z-0">
          <div className="w-full h-[320px] bg-slate-900 rounded-[3rem] shadow-2xl border-[14px] border-slate-800 relative flex flex-col items-center pt-8 overflow-visible group">
            <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-6 font-mono italic opacity-40">
              Thermal_Unit_Module
            </div>

            {/* Printer Slot (Celah Depan) */}
            <div className="w-40 h-8 bg-slate-800 rounded-xl relative flex justify-center z-30 shadow-lg border-b-2 border-slate-950 flex flex-col items-center pt-2">
              <div className="w-32 h-2 bg-black rounded-full shadow-[inset_0_4px_15px_rgba(255,255,255,0.1)] relative flex items-center justify-center overflow-visible">
                <div className="w-full h-[1px] bg-white/5 shadow-[0_0_10px_white]" />
              </div>
            </div>

            {/* STRUK - SEKARANG MELUNCUR KE BAWAH (KE ARAH PENGGUNA) */}
            <div
              onClick={receiptVisible ? reset : undefined}
              className={`absolute top-[60px] left-1/2 -translate-x-1/2 w-40 transition-all duration-[3000ms] ease-out transform-gpu z-10 cursor-pointer group/receipt ${
                receiptVisible
                  ? "translate-y-4 opacity-100 rotate-[-0.5deg]"
                  : "-translate-y-full opacity-0 pointer-events-none"
              }`}
              style={{ height: "480px" }}
            >
              <div className="flex flex-col bg-white text-[#1a1a1a] h-full shadow-[0_40px_80px_rgba(0,0,0,0.4)] border-x border-slate-100 relative p-6 border-t-[30px] border-slate-50 transition-colors hover:bg-slate-50/90 font-mono text-left overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/0 group-hover/receipt:bg-emerald-600/5 transition-colors z-20">
                  <Scissors
                    size={28}
                    className="text-emerald-600 opacity-0 group-hover/receipt:opacity-100 transition-opacity"
                  />
                </div>

                <div className="text-center mb-4 pb-4 border-b-2 border-dashed border-slate-300 pt-2">
                  <div className="font-black text-[12px] uppercase">
                    Smart Mart JKT
                  </div>
                  <div className="text-[6px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
                    Jl. Pendidikan No. 12
                  </div>
                  <div className="font-black text-[7px] mt-4 px-3 py-1 bg-slate-100 inline-block uppercase tracking-widest rounded-md leading-none">
                    *** STRUK BELANJA ***
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  {cart.map((i) => (
                    <div
                      key={i.id}
                      className="flex flex-col gap-1 leading-none border-b border-slate-50 pb-1"
                    >
                      <div className="text-[9px] font-black text-slate-800 uppercase tracking-tighter">
                        {i.name}
                      </div>
                      <div className="flex justify-between text-[7px] text-slate-400 font-bold italic">
                        <span>
                          {i.qty} x {i.price.toLocaleString()}
                        </span>
                        <span className="font-black text-slate-800">
                          {(i.price * i.qty).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4 border-t-2 border-double border-slate-300 space-y-2 text-right">
                  <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase leading-none italic">
                    <span>Subtotal</span>
                    <span>{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black pt-3 text-blue-900 border-t border-slate-100 mt-2 bg-slate-50 p-2 rounded shadow-inner items-end">
                    <span className="text-[7px] italic font-mono uppercase tracking-widest">
                      Total_Output
                    </span>
                    <span>Rp {(totalPrice * 1.1).toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-center opacity-60 border-t border-dashed border-slate-200 w-full pt-4 mt-6 pb-12">
                  <div className="text-[10px] font-black tracking-[0.5em] text-slate-900">
                    PAID
                  </div>
                  <div className="text-[6px] font-mono mt-2 opacity-50 uppercase italic">
                    Klik Struk: Sobek & Reset
                  </div>
                </div>

                {/* Jagged Edge (Bottom) */}
                <div
                  className="absolute bottom-0 left-0 w-full h-3 bg-white"
                  style={{
                    clipPath:
                      "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)",
                  }}
                />
              </div>
            </div>

            <div className="mt-auto mb-8 w-16 h-16 bg-black/40 rounded-[1.5rem] flex items-center justify-center border-4 border-slate-800 shadow-xl">
              <Printer
                size={28}
                className={`${
                  receiptVisible
                    ? "text-emerald-500 animate-pulse"
                    : "text-slate-700"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. DYNAMIC IPO LEGEND AT THE BOTTOM - Z-INDEX 0 */}
      <div className="w-full max-w-6xl mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 pb-20 opacity-95 relative z-0">
        <div
          className={`bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col items-center text-center shadow-xl transition-all duration-700 ${
            step <= 2
              ? "border-b-[10px] border-b-blue-600 scale-105 shadow-blue-200/50"
              : "opacity-30 grayscale blur-[1px]"
          }`}
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-6 border border-blue-100 shadow-inner">
            <Zap size={32} strokeWidth={2.5} />
          </div>
          <h4 className="text-[14px] font-black uppercase text-blue-700 mb-2 tracking-[0.2em] font-mono leading-none">
            1. TAHAP INPUT
          </h4>
          <p className="text-[12px] text-slate-500 leading-relaxed italic px-4">
            Memasukkan data mentah berupa jenis barang dan instruksi bayar.
          </p>
        </div>
        <div
          className={`bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col items-center text-center shadow-xl transition-all duration-700 ${
            step === 3
              ? "border-b-[10px] border-b-amber-500 scale-105 shadow-amber-200/50"
              : "opacity-30 grayscale blur-[2px]"
          }`}
        >
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-[1.5rem] flex items-center justify-center mb-6 border border-amber-100 shadow-inner">
            <Cpu size={32} strokeWidth={2.5} />
          </div>
          <h4 className="text-[14px] font-black uppercase text-amber-700 mb-2 tracking-[0.2em] font-mono leading-none">
            2. TAHAP PROCESS
          </h4>
          <p className="text-[12px] text-slate-500 leading-relaxed italic px-4">
            Pengolahan data mentah menggunakan logika algoritma (Aritmatika).
          </p>
        </div>
        <div
          className={`bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col items-center text-center shadow-xl transition-all duration-700 ${
            step === 4
              ? "border-b-[10px] border-b-emerald-600 scale-105 shadow-emerald-200/50"
              : "opacity-30 grayscale blur-[2px]"
          }`}
        >
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center mb-6 border border-emerald-100 shadow-inner">
            <Receipt size={32} strokeWidth={2.5} />
          </div>
          <h4 className="text-[14px] font-black uppercase text-emerald-700 mb-2 tracking-[0.2em] font-mono leading-none">
            3. TAHAP OUTPUT
          </h4>
          <p className="text-[12px] text-slate-500 leading-relaxed italic px-4">
            Data yang sudah terolah disajikan sebagai informasi bermanfaat
            (Struk).
          </p>
        </div>
      </div>
    </div>
  );
}
