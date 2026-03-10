"use client";

import type React from "react";

import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Get user to redirect to appropriate dashboard
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "guru") {
          router.push("/guru/dashboard");
        } else if (profile?.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/siswa/dashboard");
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Gagal login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes floatIllus {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        .anim-left   { animation: fadeIn 0.8s ease both; }
        .anim-right  { animation: fadeSlideUp 0.7s ease 0.18s both; }
        .illus-float { animation: floatIllus 6s ease-in-out infinite; }
      `}</style>

      {/* ── Left panel ── */}
      <div className="anim-left flex flex-col items-center justify-center w-full lg:w-1/2 min-h-[38vh] lg:min-h-screen relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 px-8 lg:px-16 py-10 lg:py-0">
        {/* Blur circles */}
        <div className="pointer-events-none absolute top-[-80px] left-[-80px] w-96 h-96 rounded-full bg-green-200 blur-3xl opacity-40" />
        <div className="pointer-events-none absolute bottom-[-80px] right-[-60px] w-80 h-80 rounded-full bg-emerald-200 blur-3xl opacity-35" />
        <div className="pointer-events-none absolute top-1/2 right-[-40px] w-48 h-48 rounded-full bg-teal-100 blur-3xl opacity-50" />
        {/* Dot pattern */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(16,185,129,0.22) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Abstract rings */}
        <div className="pointer-events-none absolute top-10 right-10 w-28 h-28 rounded-full border-[3px] border-emerald-300/40" />
        <div className="pointer-events-none absolute bottom-16 left-10 w-16 h-16 rounded-full border-[2px] border-green-300/40" />
        <div className="pointer-events-none absolute top-1/3 left-8 w-10 h-10 rounded-full border-[2px] border-teal-300/30" />

        {/* Illustration — transparent PNG, no frame */}
        <div className="illus-float relative z-10 flex items-center justify-center w-full max-w-[220px] lg:max-w-[380px]">
          <img
            src="/logo login nobg.png"
            alt="CODIN Platform Illustration"
            className="w-full h-auto object-contain"
            style={{
              filter:
                "drop-shadow(0 24px 48px rgba(16,185,129,0.2)) drop-shadow(0 6px 16px rgba(0,0,0,0.08))",
            }}
            draggable={false}
          />
        </div>

        {/* Text — hidden on mobile to keep layout compact */}
        <div className="relative z-10 mt-8 text-center max-w-xs hidden lg:block">
          <h2 className="text-xl font-bold text-[#0f172a] mb-2 leading-snug">
            Belajar Lebih Mudah dengan CODIN
          </h2>
          <p className="text-sm text-[#64748b] leading-relaxed">
            Platform pembelajaran interaktif untuk memahami konsep pemrograman
            secara visual.
          </p>
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="anim-right flex flex-col items-center justify-center w-full lg:w-1/2 flex-1 lg:min-h-screen px-6 py-10 lg:py-12 bg-white">
        <div className="w-full max-w-[420px]">
          {/* Card */}
          <div className="bg-white px-8 py-10">
            {/* Logo inside card */}
            <div className="flex items-center justify-center mb-7">
              <img
                src="/logo codin.png"
                alt="Codin Logo"
                className="h-14 w-auto"
              />
            </div>

            <div className="mb-7 text-center">
              <h1 className="text-2xl font-extrabold text-[#0f172a] mb-1">
                Selamat Datang
              </h1>
              <p className="text-sm text-[#64748b]">
                Masuk ke akun Anda untuk melanjutkan pembelajaran.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-[#374151]"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-lg border-neutral-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 px-4 text-sm"
                  suppressHydrationWarning
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-[#374151]"
                  >
                    Password
                  </Label>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-green-600 transition-colors duration-150"
                  >
                    Lupa password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-lg border-neutral-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 px-4 text-sm"
                  suppressHydrationWarning
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                suppressHydrationWarning
                className="w-full py-3 mt-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
