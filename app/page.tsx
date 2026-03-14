"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  BarChart3,
  Zap,
  ChevronDown,
  Power,
  FileCode,
  Play,
  Code2,
  Cpu,
  GitBranch,
  GraduationCap,
  User,
  Settings,
  Instagram,
  Youtube,
  Github,
  Mail,
  Menu,
  X,
} from "lucide-react";

export default function LandingPage() {
  const [active, setActive] = useState<string>("home");
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [heroVideoVisible, setHeroVideoVisible] = useState<boolean>(false);
  const [simFront, setSimFront] = useState<number>(0);
  const [simFlipping, setSimFlipping] = useState<boolean>(false);
  const [simTiltX, setSimTiltX] = useState<number>(0);
  const [simTiltY, setSimTiltY] = useState<number>(0);
  const [simHovered, setSimHovered] = useState<boolean>(false);
  // touch swipe for mobile
  const [simTouchStart, setSimTouchStart] = useState<number>(0);
  const simCardRef = useRef<HTMLDivElement>(null);

  // Mitra section scroll animation
  const [mitraVisible, setMitraVisible] = useState<boolean>(false);
  const mitraRef = useRef<HTMLDivElement>(null);

  const flipSim = () => {
    if (simFlipping) return;
    setSimFlipping(true);
    setTimeout(() => {
      setSimFront((v) => (v === 0 ? 1 : 0));
      setSimFlipping(false);
    }, 350);
  };

  const handleSimMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = simCardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setSimTiltX(x * 18); // max ±9deg horizontal
    setSimTiltY(-y * 14); // max ±7deg vertical
  };

  const handleSimMouseLeave = () => {
    setSimHovered(false);
    setSimTiltX(0);
    setSimTiltY(0);
  };

  useEffect(() => {
    const ids = ["features", "simulasi", "about", "mitra"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setActive(entry.target.id);
          }
        });
      },
      { root: null, rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // If nothing is intersecting, fallback to home when near top
    const onScroll = () => {
      if (window.scrollY < 120) setActive("home");
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Mitra section IntersectionObserver
  useEffect(() => {
    const el = mitraRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMitraVisible(true);
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Hero video fade-in on first load
  useEffect(() => {
    const timer = window.setTimeout(() => setHeroVideoVisible(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200">
        <nav
          className="flex items-center justify-between px-6 md:px-8 h-[68px] max-w-7xl mx-auto"
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src="/logo codin.png"
              alt="Codin Logo"
              className="h-14 w-auto"
            />
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-1">
            {[
              { label: "Beranda", href: "/", id: "home" },
              { label: "Fitur", href: "#features", id: "features" },
              { label: "Simulasi", href: "#simulasi", id: "simulasi" },
              { label: "Tentang", href: "#about", id: "about" },
              { label: "Mitra", href: "#mitra", id: "mitra" },
            ].map(({ label, href, id }) => (
              <li key={id}>
                <Link
                  href={href}
                  onClick={() => setActive(id)}
                  className={`relative inline-flex items-center px-4 h-[68px] text-[14px] font-medium transition-colors whitespace-nowrap group ${
                    active === id
                      ? "text-emerald-600"
                      : "text-[#444] hover:text-emerald-600"
                  }`}
                >
                  {label}
                  {/* Active underline indicator */}
                  <span
                    className={`absolute bottom-0 left-4 right-4 h-[2.5px] rounded-full bg-emerald-500 transition-all duration-300 ${
                      active === id
                        ? "opacity-100 scale-x-100"
                        : "opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-100"
                    }`}
                    style={{ transformOrigin: "center" }}
                  />
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side: CTA + hamburger */}
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden md:inline-flex">
              <button
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-[13.5px] font-semibold rounded-lg hover:bg-emerald-700 active:scale-95 transition-all duration-200 shadow-sm whitespace-nowrap"
                aria-label="Masuk"
              >
                <Power className="w-3.5 h-3.5" />
                Masuk
              </button>
            </Link>

            {/* Hamburger toggle */}
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-neutral-200 text-[#444] hover:text-emerald-600 hover:border-emerald-300 transition-all duration-200"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile dropdown menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white border-t border-neutral-100 ${
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <ul className="flex flex-col px-6 py-4 gap-1">
            {[
              { label: "Beranda", href: "/", id: "home" },
              { label: "Fitur", href: "#features", id: "features" },
              { label: "Simulasi", href: "#simulasi", id: "simulasi" },
              { label: "Tentang", href: "#about", id: "about" },
              { label: "Mitra", href: "#mitra", id: "mitra" },
            ].map(({ label, href, id }) => (
              <li key={id}>
                <Link
                  href={href}
                  onClick={() => {
                    setActive(id);
                    setMenuOpen(false);
                  }}
                  className={`block px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                    active === id
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-[#444] hover:bg-neutral-50 hover:text-emerald-600"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-[14px] font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
                  <Power className="w-4 h-4" />
                  Masuk
                </button>
              </Link>
            </li>
          </ul>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full">
        {/* Hero */}
        <section className="relative overflow-hidden bg-white">
          <style>{`
            @keyframes heroFloatSoft {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
            }
            @keyframes heroFloatTilt {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-6px) rotate(3deg); }
            }
          `}</style>

          {/* Background blobs */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-50 rounded-full blur-3xl opacity-30 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center py-20">
              {/* LEFT: Text */}
              <div className="flex flex-col gap-6">
                {/* Heading */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#0f172a] leading-[1.15] tracking-tight">
                  Belajar{" "}
                  <span className="text-emerald-600">Algoritma &amp;</span>
                  <br />
                  <span className="text-emerald-600">Pemrograman</span> Lebih
                  <br />
                  Mudah &amp; Interaktif
                </h1>

                {/* Description */}
                <p className="text-base text-gray-500 leading-relaxed max-w-md">
                  CODIN adalah platform pembelajaran berbasis web yang membantu
                  siswa memahami algoritma dan pemrograman melalui materi
                  terstruktur, kuis evaluasi, serta simulasi visual interaktif.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3">
                  <Link href="/auth/login">
                    <button className="inline-flex items-center gap-2 px-7 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[15px] font-bold rounded-full shadow-lg shadow-emerald-200 transition-all duration-200">
                      <Play className="w-4 h-4 fill-white" />
                      Belajar Sekarang
                    </button>
                  </Link>
                </div>
              </div>

              {/* RIGHT: CODIN video branding */}
              <div className="relative flex items-center justify-center">
                {/* Floating programming symbols */}
                <div
                  className="pointer-events-none absolute -top-3 left-6 z-20 flex items-center justify-center h-7 md:h-8 px-2.5 md:px-3 rounded-lg border border-emerald-200 bg-white/90 backdrop-blur-sm text-[11px] font-bold text-emerald-600 opacity-90 shadow-sm"
                  style={{
                    animation: "heroFloatSoft 5.5s ease-in-out infinite",
                  }}
                >
                  &lt;/&gt;
                </div>
                <div
                  className="pointer-events-none absolute top-14 -right-2 z-20 flex items-center justify-center h-7 md:h-8 px-2.5 md:px-3 rounded-lg border border-blue-200 bg-white/90 backdrop-blur-sm text-[11px] font-bold text-blue-600 opacity-90 shadow-sm"
                  style={{
                    animation: "heroFloatTilt 6.3s ease-in-out infinite",
                  }}
                >
                  {"{}"}
                </div>
                <div
                  className="pointer-events-none absolute bottom-8 -left-3 z-20 flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-lg border border-violet-200 bg-white/90 backdrop-blur-sm text-violet-600 opacity-85 shadow-sm"
                  style={{
                    animation: "heroFloatSoft 5.8s ease-in-out infinite",
                  }}
                >
                  <GitBranch className="w-4 h-4" />
                </div>
                <div
                  className="pointer-events-none absolute -bottom-2 right-10 z-20 flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-lg border border-sky-200 bg-white/90 backdrop-blur-sm text-sky-600 opacity-85 shadow-sm"
                  style={{
                    animation: "heroFloatTilt 6.8s ease-in-out infinite",
                  }}
                >
                  <Code2 className="w-4 h-4" />
                </div>

                {/* Floating flowchart symbols */}
                <div
                  className="pointer-events-none absolute top-8 left-2 z-20 block w-3.5 h-3.5 rounded-full border border-emerald-400/80 bg-emerald-200/70 opacity-85 shadow-sm"
                  style={{
                    animation: "heroFloatSoft 6.2s ease-in-out infinite",
                  }}
                />
                <div
                  className="pointer-events-none absolute top-24 right-6 z-20 block w-3.5 h-3.5 border border-blue-400/80 bg-blue-200/70 opacity-85 shadow-sm"
                  style={{
                    animation: "heroFloatTilt 6.6s ease-in-out infinite",
                  }}
                />
                <div
                  className="pointer-events-none absolute bottom-14 left-10 z-20 block w-3.5 h-3.5 rotate-45 border border-violet-400/80 bg-violet-200/70 opacity-85 shadow-sm"
                  style={{
                    animation: "heroFloatSoft 5.9s ease-in-out infinite",
                  }}
                />

                <div
                  className={`w-full max-w-[620px] overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.12)] transition-all duration-700 ${
                    heroVideoVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                >
                  <video
                    src="/codin.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="block aspect-video w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="relative overflow-hidden py-24">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/70 via-white to-white pointer-events-none" />
          {/* Decorative SVG dots */}
          <svg
            className="absolute top-0 left-0 w-64 h-64 opacity-20 pointer-events-none"
            viewBox="0 0 200 200"
            fill="none"
          >
            {Array.from({ length: 6 }).map((_, row) =>
              Array.from({ length: 6 }).map((_, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={20 + col * 32}
                  cy={20 + row * 32}
                  r="3"
                  fill="#10b981"
                />
              )),
            )}
          </svg>
          <svg
            className="absolute bottom-0 right-0 w-64 h-64 opacity-20 pointer-events-none"
            viewBox="0 0 200 200"
            fill="none"
          >
            {Array.from({ length: 6 }).map((_, row) =>
              Array.from({ length: 6 }).map((_, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={20 + col * 32}
                  cy={20 + row * 32}
                  r="3"
                  fill="#10b981"
                />
              )),
            )}
          </svg>
          {/* Abstract shape */}
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-8">
            {/* Section header */}
            <div className="max-w-2xl mx-auto text-center mb-16">
              <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
                Fitur Unggulan
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-black text-[#0f172a] leading-tight">
                Semua yang Kamu Butuhkan untuk{" "}
                <span className="text-emerald-600">Belajar Lebih Baik</span>
              </h2>
              <p className="mt-4 text-base text-gray-500 leading-relaxed">
                Platform CODIN menyediakan fitur lengkap untuk mendukung
                pembelajaran algoritma dan pemrograman secara interaktif.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: (
                    <BookOpen className="w-7 h-7 text-emerald-600 transition-all duration-300 group-hover:text-emerald-700 group-hover:scale-110" />
                  ),
                  iconBg: "bg-emerald-50 group-hover:bg-emerald-100",
                  iconRing: "ring-emerald-100",
                  accent: "group-hover:text-emerald-600",
                  title: "Materi",
                  desc: "Pelajari konsep algoritma melalui materi terstruktur dan mudah dipahami.",
                },
                {
                  icon: (
                    <Zap className="w-7 h-7 text-yellow-500 transition-all duration-300 group-hover:text-yellow-600 group-hover:scale-110" />
                  ),
                  iconBg: "bg-yellow-50 group-hover:bg-yellow-100",
                  iconRing: "ring-yellow-100",
                  accent: "group-hover:text-yellow-600",
                  title: "Kuis",
                  desc: "Kerjakan soal untuk mengukur pemahaman terhadap materi yang telah dipelajari.",
                },
                {
                  icon: (
                    <GitBranch className="w-7 h-7 text-blue-500 transition-all duration-300 group-hover:text-blue-600 group-hover:scale-110" />
                  ),
                  iconBg: "bg-blue-50 group-hover:bg-blue-100",
                  iconRing: "ring-blue-100",
                  accent: "group-hover:text-blue-600",
                  title: "Simulasi",
                  desc: "Visualisasikan alur algoritma secara langkah demi langkah secara visual.",
                },
                {
                  icon: (
                    <BarChart3 className="w-7 h-7 text-purple-500 transition-all duration-300 group-hover:text-purple-600 group-hover:scale-110" />
                  ),
                  iconBg: "bg-purple-50 group-hover:bg-purple-100",
                  iconRing: "ring-purple-100",
                  accent: "group-hover:text-purple-600",
                  title: "Nilai",
                  desc: "Lihat hasil evaluasi dan pantau perkembangan belajar secara berkala.",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="group relative bg-white rounded-[18px] p-7 flex flex-col gap-5 shadow-[0_2px_16px_0_rgba(0,0,0,0.07)] border border-neutral-100 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.13)] hover:-translate-y-2 transition-all duration-300 cursor-default"
                >
                  {/* Icon container */}
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ring-4 ${f.iconRing} ${f.iconBg} transition-all duration-300`}
                  >
                    {f.icon}
                  </div>
                  {/* Text */}
                  <div className="flex flex-col gap-2">
                    <h3
                      className={`text-[17px] font-bold text-[#0f172a] transition-colors duration-300 ${f.accent}`}
                    >
                      {f.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-neutral-100 to-transparent rounded-full group-hover:via-emerald-200 transition-all duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Simulation Showcase */}
        <section id="simulasi" className="relative overflow-hidden py-28">
          {/* Richer background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50/50 pointer-events-none" />
          {/* Soft radial glow behind right side */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/60 rounded-full blur-[100px] opacity-50 pointer-events-none" />
          {/* Bottom-left accent */}
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-100/70 rounded-full blur-[80px] opacity-40 pointer-events-none" />

          {/* Dot pattern — bottom left */}
          <svg
            className="absolute bottom-8 left-6 w-40 h-40 opacity-[0.13] pointer-events-none"
            viewBox="0 0 140 140"
            fill="none"
          >
            {Array.from({ length: 5 }).map((_, row) =>
              Array.from({ length: 5 }).map((_, col) => (
                <circle
                  key={`bl-${row}-${col}`}
                  cx={14 + col * 28}
                  cy={14 + row * 28}
                  r="3"
                  fill="#10b981"
                />
              )),
            )}
          </svg>
          {/* Dot pattern — top right */}
          <svg
            className="absolute top-6 right-8 w-44 h-44 opacity-[0.12] pointer-events-none"
            viewBox="0 0 160 160"
            fill="none"
          >
            {Array.from({ length: 5 }).map((_, row) =>
              Array.from({ length: 5 }).map((_, col) => (
                <circle
                  key={`tr-${row}-${col}`}
                  cx={16 + col * 32}
                  cy={16 + row * 32}
                  r="3.5"
                  fill="#6366f1"
                />
              )),
            )}
          </svg>
          {/* Abstract ring shape */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-emerald-100/60 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-blue-100/50 pointer-events-none" />

          {/* Floating micro icons in background */}
          <div
            className="absolute top-16 left-[12%] opacity-20 pointer-events-none"
            style={{ animation: "float 6s ease-in-out infinite" }}
          >
            <GitBranch className="w-7 h-7 text-emerald-500" />
          </div>
          <div
            className="absolute bottom-20 right-[15%] opacity-[0.15] pointer-events-none"
            style={{ animation: "float 8s ease-in-out infinite 1s" }}
          >
            <Code2 className="w-6 h-6 text-blue-400" />
          </div>
          <div
            className="absolute top-1/2 left-[5%] opacity-10 pointer-events-none"
            style={{ animation: "float 7s ease-in-out infinite 2s" }}
          >
            <FileCode className="w-8 h-8 text-purple-400" />
          </div>

          {/* Keyframes */}
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              33% { transform: translateY(-12px) rotate(2deg); }
              66% { transform: translateY(6px) rotate(-1deg); }
            }
            @keyframes floatCard {
              0%, 100% { transform: translateY(0px) rotate(-1deg); }
              50% { transform: translateY(-10px) rotate(-0.5deg); }
            }
            @keyframes floatCardBack {
              0%, 100% { transform: translateY(0px) rotate(2deg); }
              50% { transform: translateY(-6px) rotate(1.5deg); }
            }
          `}</style>

          <div className="relative max-w-7xl mx-auto px-8">
            <div className="grid md:grid-cols-2 gap-14 items-center">
              {/* LEFT: Text */}
              <div className="flex flex-col gap-7 order-2 md:order-1">
                {/* Eyebrow badge */}
                <span className="inline-flex items-center gap-2 self-start bg-blue-50 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full tracking-widest uppercase border border-blue-100 shadow-sm">
                  <GitBranch className="w-3.5 h-3.5" />
                  Simulasi Interaktif
                </span>

                <h2 className="text-3xl md:text-4xl font-black text-[#0f172a] leading-tight">
                  Belajar Lebih Mudah dengan{" "}
                  <span className="text-emerald-600">Simulasi Interaktif</span>
                </h2>

                <p className="text-base text-gray-500 leading-relaxed max-w-md">
                  Amati proses pembelajaran secara visual melalui simulasi
                  interaktif yang membantu memahami konsep secara lebih jelas
                  dan bertahap — langkah demi langkah.
                </p>

                {/* Feature list */}
                <ul className="flex flex-col gap-3">
                  {[
                    {
                      color: "bg-emerald-100 text-emerald-700",
                      text: "Visualisasi pembelajaran secara bertahap",
                    },
                    {
                      color: "bg-blue-100 text-blue-700",
                      text: "Simulasi pembelajaran interaktif",
                    },
                    {
                      color: "bg-purple-100 text-purple-700",
                      text: "Umpan balik pembelajaran secara real-time",
                    },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${item.color}`}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-600 font-medium">
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* RIGHT: Swipeable simulation card stack */}
              <div className="relative order-1 md:order-2 flex items-center justify-center min-h-[400px] select-none">
                {/* Glow behind images */}
                <div className="absolute inset-10 bg-emerald-200/30 rounded-3xl blur-2xl pointer-events-none" />

                {/* Floating icon decorations */}
                <div
                  className="absolute -top-5 -right-3 p-2 bg-white rounded-xl shadow-lg border border-neutral-100 z-20"
                  style={{ animation: "float 3.2s ease-in-out infinite" }}
                >
                  <Code2 className="w-5 h-5 text-blue-500" />
                </div>
                <div
                  className="absolute -bottom-4 -left-3 p-2 bg-white rounded-xl shadow-lg border border-neutral-100 z-20"
                  style={{ animation: "float 2.7s ease-in-out infinite 0.6s" }}
                >
                  <Cpu className="w-5 h-5 text-purple-500" />
                </div>
                <div
                  className="absolute top-6 -left-6 p-2 bg-white rounded-xl shadow-lg border border-neutral-100 z-20"
                  style={{ animation: "float 4s ease-in-out infinite 1.2s" }}
                >
                  <FileCode className="w-5 h-5 text-emerald-500" />
                </div>

                {/* Swipe hint */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all duration-300 ${simFront === i ? "w-5 h-2 bg-emerald-500" : "w-2 h-2 bg-neutral-300"}`}
                    />
                  ))}
                </div>
                <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-[11px] text-gray-400 font-medium tracking-wide whitespace-nowrap">
                  Klik atau geser untuk melihat simulasi lain
                </div>

                {/* Card stack — 3D tilt on desktop, swipe on mobile */}
                <div
                  ref={simCardRef}
                  className="relative w-[88%] mt-6 cursor-pointer"
                  style={{ perspective: "900px" }}
                  onMouseMove={handleSimMouseMove}
                  onMouseEnter={() => setSimHovered(true)}
                  onMouseLeave={handleSimMouseLeave}
                  onClick={flipSim}
                  onTouchStart={(e) => setSimTouchStart(e.touches[0].clientX)}
                  onTouchEnd={(e) => {
                    const dx = e.changedTouches[0].clientX - simTouchStart;
                    if (Math.abs(dx) > 50) flipSim();
                  }}
                >
                  {/* Back card */}
                  <div
                    className="absolute top-4 left-4 right-4 rounded-2xl overflow-hidden border border-neutral-100"
                    style={{
                      boxShadow: "0 12px 40px rgba(0,0,0,0.10)",
                      transform: `rotate(${simFront === 0 ? 2 : -2}deg) rotateY(${simTiltX * 0.3}deg)`,
                      transition:
                        "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                      zIndex: 0,
                    }}
                  >
                    <img
                      src={simFront === 0 ? "/simulasi2.png" : "/simulasi1.png"}
                      alt="Simulasi Preview"
                      className="w-full h-auto object-cover pointer-events-none"
                      draggable={false}
                    />
                  </div>

                  {/* Front card — 3D tilt + flip */}
                  <div
                    className="relative rounded-2xl overflow-hidden border border-neutral-100"
                    style={{
                      boxShadow: simHovered
                        ? "0 40px 100px rgba(0,0,0,0.22), 0 12px 32px rgba(0,0,0,0.12)"
                        : "0 32px 80px rgba(0,0,0,0.16), 0 8px 24px rgba(0,0,0,0.08)",
                      transform: simFlipping
                        ? `rotateY(90deg) scale(0.92)`
                        : `rotateX(${simTiltY}deg) rotateY(${simTiltX}deg) scale(${simHovered ? 1.025 : 1}) rotate(${simFront === 0 ? -1 : 1}deg)`,
                      transition: simFlipping
                        ? "transform 0.35s ease-in"
                        : "transform 0.12s ease-out, box-shadow 0.3s",
                      transformStyle: "preserve-3d",
                      zIndex: 10,
                    }}
                  >
                    <img
                      src={simFront === 0 ? "/simulasi1.png" : "/simulasi2.png"}
                      alt="Simulasi Aktif"
                      className="w-full h-auto object-cover pointer-events-none"
                      draggable={false}
                    />
                    {/* Glare overlay — follows mouse */}
                    {simHovered && (
                      <div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at ${50 + simTiltX * 3}% ${50 - simTiltY * 3}%, rgba(255,255,255,0.18) 0%, transparent 65%)`,
                        }}
                      />
                    )}
                    {/* Overlay badge */}
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-md border border-neutral-100">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-gray-700 tracking-wide">
                        Simulasi Aktif
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Roles */}
        <section
          id="about"
          className="relative overflow-hidden py-24 bg-gradient-to-b from-emerald-50/40 via-white to-white"
        >
          <style>{`
            @keyframes floatRole {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            @keyframes arrowPulse {
              0%, 100% { opacity: 0.5; stroke-dashoffset: 0; }
              50% { opacity: 1; stroke-dashoffset: -12; }
            }
            .role-icon { animation: floatRole 4s ease-in-out infinite; }
            .role-icon-1 { animation-delay: 0s; }
            .role-icon-2 { animation-delay: 0.8s; }
            .role-icon-3 { animation-delay: 1.6s; }
            .flow-arrow { stroke-dasharray: 8 6; animation: arrowPulse 2s ease-in-out infinite; }
          `}</style>

          {/* Dot pattern */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, #a7f3d0 1px, transparent 1px)",
              backgroundSize: "30px 30px",
              opacity: 0.45,
            }}
          />
          {/* Decorative blobs */}
          <div
            className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
            }}
          />
          {/* Small bg icons */}
          <div className="pointer-events-none absolute top-10 right-20 opacity-[0.06]">
            <GraduationCap className="w-28 h-28 text-emerald-700" />
          </div>
          <div className="pointer-events-none absolute bottom-10 left-16 opacity-[0.05]">
            <Settings className="w-24 h-24 text-violet-700" />
          </div>

          <div className="relative max-w-5xl mx-auto px-8">
            {/* Heading */}
            <div className="text-center mb-16">
              <span className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-wide">
                Untuk Siapa Platform Ini?
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] mb-4 leading-tight">
                Dirancang untuk Semua Peran
              </h2>
              <p className="text-[#64748b] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Platform CODIN hadir untuk memenuhi kebutuhan setiap pengguna —
                dari guru, siswa, hingga admin sekolah.
              </p>
            </div>

            {/* Flow layout */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-0">
              {/* — Guru — */}
              <div className="group flex flex-col items-center text-center max-w-[220px] mx-auto md:mx-0 transition-all duration-300 ease-in-out hover:-translate-y-2">
                <div
                  className="role-icon role-icon-1 relative flex items-center justify-center w-24 h-24 rounded-full bg-white border-2 border-emerald-100 mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    boxShadow:
                      "0 8px 32px rgba(16,185,129,0.18), 0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at 40% 35%, rgba(16,185,129,0.15) 0%, transparent 70%)",
                    }}
                  />
                  <GraduationCap className="relative z-10 w-10 h-10 text-emerald-500 transition-all duration-300 group-hover:text-emerald-600 group-hover:scale-110" />
                </div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-2">Guru</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">
                  Mengelola kelas, materi pembelajaran, serta memantau
                  perkembangan siswa.
                </p>
              </div>

              {/* Arrow Guru → Siswa */}
              <div className="hidden md:flex items-center justify-center mx-4 flex-shrink-0">
                <svg
                  width="80"
                  height="28"
                  viewBox="0 0 80 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    className="flow-arrow"
                    d="M4 14 Q40 2 76 14"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <polygon
                    points="72,9 80,14 72,19"
                    fill="#10b981"
                    opacity="0.7"
                  />
                </svg>
              </div>
              {/* Mobile vertical connector */}
              <div className="flex md:hidden flex-col items-center my-2">
                <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-300 to-blue-300 rounded-full" />
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-0.5" />
              </div>

              {/* — Siswa — */}
              <div className="group flex flex-col items-center text-center max-w-[220px] mx-auto md:mx-0 transition-all duration-300 ease-in-out hover:-translate-y-2">
                <div
                  className="role-icon role-icon-2 relative flex items-center justify-center w-24 h-24 rounded-full bg-white border-2 border-blue-100 mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    boxShadow:
                      "0 8px 32px rgba(59,130,246,0.18), 0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at 40% 35%, rgba(59,130,246,0.15) 0%, transparent 70%)",
                    }}
                  />
                  <User className="relative z-10 w-10 h-10 text-blue-500 transition-all duration-300 group-hover:text-blue-600 group-hover:scale-110" />
                </div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-2">Siswa</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">
                  Mengakses materi, mengikuti simulasi pembelajaran, dan
                  mengerjakan tugas.
                </p>
              </div>

              {/* Arrow Siswa → Admin */}
              <div className="hidden md:flex items-center justify-center mx-4 flex-shrink-0">
                <svg
                  width="80"
                  height="28"
                  viewBox="0 0 80 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    className="flow-arrow"
                    d="M4 14 Q40 2 76 14"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    style={{ animationDelay: "1s" }}
                  />
                  <polygon
                    points="72,9 80,14 72,19"
                    fill="#8b5cf6"
                    opacity="0.7"
                  />
                </svg>
              </div>
              {/* Mobile vertical connector */}
              <div className="flex md:hidden flex-col items-center my-2">
                <div className="w-0.5 h-8 bg-gradient-to-b from-blue-300 to-violet-300 rounded-full" />
                <div className="w-2 h-2 rounded-full bg-violet-400 mt-0.5" />
              </div>

              {/* — Admin — */}
              <div className="group flex flex-col items-center text-center max-w-[220px] mx-auto md:mx-0 transition-all duration-300 ease-in-out hover:-translate-y-2">
                <div
                  className="role-icon role-icon-3 relative flex items-center justify-center w-24 h-24 rounded-full bg-white border-2 border-violet-100 mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    boxShadow:
                      "0 8px 32px rgba(139,92,246,0.18), 0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at 40% 35%, rgba(139,92,246,0.15) 0%, transparent 70%)",
                    }}
                  />
                  <Settings className="relative z-10 w-10 h-10 text-violet-500 transition-all duration-300 group-hover:text-violet-600 group-hover:scale-110" />
                </div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-2">Admin</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">
                  Mengelola sistem, pengguna, serta pengaturan platform secara
                  menyeluruh.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Mitra Kami ─────────────────────────────────────────────── */}
        <section
          id="mitra"
          className="relative overflow-hidden py-20 bg-gradient-to-b from-slate-50 via-white to-white"
        >
          {/* Dot pattern background */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              opacity: 0.35,
            }}
          />
          {/* Decorative blobs */}
          <div
            className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)",
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
            }}
          />

          <div ref={mitraRef} className="relative max-w-7xl mx-auto px-8">
            {/* Heading */}
            <div
              className="text-center mb-14"
              style={{
                opacity: mitraVisible ? 1 : 0,
                transform: mitraVisible ? "translateY(0)" : "translateY(24px)",
                transition: "opacity 0.7s ease, transform 0.7s ease",
              }}
            >
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] mb-4 leading-tight">
                Sekolah Implementasi
              </h2>
              <p className="text-[#64748b] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                Platform CODIN digunakan sebagai media pembelajaran berbasis web
                untuk mendukung pembelajaran Algoritma dan Pemrograman di SMKS
                YPM 4 Taman.
              </p>
            </div>

            {/* Logo */}
            <div
              className="flex flex-col items-center gap-4"
              style={{
                opacity: mitraVisible ? 1 : 0,
                transform: mitraVisible ? "translateY(0)" : "translateY(28px)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
              }}
            >
              <img
                src="/SMKS YPM 4.png"
                alt="SMKS YPM 4"
                className="h-40 w-auto object-contain transition-transform duration-300 hover:scale-105"
                draggable={false}
              />
              <span className="text-base font-bold text-[#0f172a]">
                SMKS YPM 4
              </span>
            </div>

            {/* Bottom CTA nudge */}
            <div
              className="mt-12 text-center"
              style={{
                opacity: mitraVisible ? 1 : 0,
                transition: "opacity 0.7s ease 500ms",
              }}
            ></div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#f8fafc] border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-8 pt-14 pb-8">
          {/* 4-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
            {/* Col 1 – Brand */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="/logo codin.png"
                  alt="Codin Logo"
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-sm text-[#64748b] leading-relaxed max-w-[220px]">
                Platform pembelajaran berbasis proyek yang inovatif untuk siswa,
                guru, dan institusi pendidikan.
              </p>
            </div>

            {/* Col 2 – Navigasi */}
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-bold text-[#0f172a] uppercase tracking-widest mb-1">
                Navigasi
              </h4>
              {[
                { label: "Beranda", href: "/" },
                { label: "Fitur", href: "#features" },
                { label: "Simulasi", href: "#" },
                { label: "Mitra", href: "#" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-sm text-[#64748b] hover:text-emerald-600 transition-colors duration-200 w-fit"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Col 4 – Sosial Media */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-bold text-[#0f172a] uppercase tracking-widest mb-1">
                Ikuti Kami
              </h4>
              <div className="flex gap-3">
                {[
                  {
                    icon: Instagram,
                    label: "Instagram",
                    href: "https://www.instagram.com/anang_aak/",
                  },

                  {
                    icon: Github,
                    label: "GitHub",
                    href: "https://github.com/anang2804",
                  },
                  {
                    icon: Mail,
                    label: "Email",
                    href: "mailto:mochardiansyahanang.22006@mhs.unesa.ac.id",
                  },
                ].map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-neutral-200 text-[#64748b] hover:text-emerald-600 hover:border-emerald-300 hover:shadow-md transition-all duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Divider + copyright */}
          <div className="border-t border-neutral-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#94a3b8]">
              © {new Date().getFullYear()} CODIN. Seluruh hak cipta dilindungi.
            </p>
            <p className="text-xs text-[#94a3b8]">
              Dibuat dengan ❤️ untuk pendidikan Indonesia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
