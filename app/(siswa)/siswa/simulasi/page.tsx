"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Microscope, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function isKelasX(kelas: string | null | undefined) {
  const normalized = (kelas || "").trim().toUpperCase();
  if (!normalized) return false;

  const startsWithX = /^X(\b|[\s/-])/.test(normalized);
  const startsWithXI = /^XI(\b|[\s/-])/.test(normalized);
  const startsWithXII = /^XII(\b|[\s/-])/.test(normalized);

  return startsWithX && !startsWithXI && !startsWithXII;
}

export default function SiswaSimulasiPage() {
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  const [canAccessSimulasi, setCanAccessSimulasi] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const checkKelasAccess = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setCanAccessSimulasi(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("kelas")
          .eq("id", user.id)
          .single();

        setCanAccessSimulasi(isKelasX(profile?.kelas));
      } catch (error) {
        console.error("Error checking simulasi access:", error);
        setCanAccessSimulasi(false);
      } finally {
        setIsLoadingAccess(false);
      }
    };

    checkKelasAccess();
  }, []);

  useEffect(() => {
    if (!isLoadingAccess && canAccessSimulasi) {
      const timer = window.setTimeout(() => setAnimateIn(true), 40);
      return () => window.clearTimeout(timer);
    }
  }, [isLoadingAccess, canAccessSimulasi]);

  if (isLoadingAccess) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  if (!canAccessSimulasi) {
    return (
      <Card className="border border-amber-100 bg-amber-50/70 p-6">
        <h1 className="text-xl font-semibold text-amber-900">
          Simulasi khusus Kelas X
        </h1>
        <p className="mt-2 text-sm text-amber-800">
          Fitur simulasi saat ini hanya tersedia untuk siswa kelas X.
        </p>
      </Card>
    );
  }

  const simulationSections = [
    {
      title: "Diagram Alir",
      badgeClass: "bg-sky-50 text-sky-700 border border-sky-100",
      items: [
        {
          title: "Logika Lalu Lintas",
          description:
            "Susun diagram alir untuk mengatur lampu lalu lintas dengan benar.",
          href: "/siswa/simulasi/traffic-logic",
          level: "Dasar",
          status: "Belum dicoba",
          gradient: "from-sky-100 to-cyan-200",
          emoji: "🚦",
          accent: "border-sky-500",
        },
        {
          title: "Transisi Lampu Bertahap",
          description:
            "Susun diagram alir untuk perubahan lampu Merah ke Kuning lalu Hijau secara berurutan.",
          href: "/siswa/simulasi/traffic-debug",
          level: "Menengah",
          status: "Belum dicoba",
          gradient: "from-amber-100 to-orange-200",
          emoji: "🚦",
          accent: "border-amber-500",
        },
        {
          title: "Prioritas Tiga Kendaraan",
          description:
            "Susun diagram alir bercabang untuk sistem prioritas ambulans, lampu lalu lintas, dan kendaraan biasa.",
          href: "/siswa/simulasi/traffic-expert",
          level: "Lanjutan",
          status: "Belum dicoba",
          gradient: "from-rose-100 to-pink-200",
          emoji: "🚦",
          accent: "border-rose-500",
        },
      ],
    },
    {
      title: "Pseudocode",
      badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-100",
      items: [
        {
          title: "Perbaiki Mesin Kasir Kantin",
          description:
            "Tulis algoritma pseudocode untuk menghitung total harga makanan dan minuman pelanggan.",
          href: "/siswa/simulasi/kasir-kantin",
          level: "Dasar",
          status: "Belum dicoba",
          gradient: "from-emerald-100 to-teal-200",
          emoji: "🍛",
          accent: "border-emerald-500",
        },
        {
          title: "Koneksi Sensor & Pintu",
          description:
            "Lengkapi pseudocode pintu otomatis agar bekerja sesuai deteksi sensor infrared.",
          href: "/siswa/simulasi/pintu-otomatis",
          level: "Menengah",
          status: "Belum dicoba",
          gradient: "from-indigo-100 to-purple-200",
          emoji: "🚪",
          accent: "border-indigo-500",
        },
        {
          title: "Sistem Parkir Otomatis",
          description:
            "Lengkapi pseudocode sistem parkir dengan sensor dan kondisi IF-ELSE untuk akses kendaraan.",
          href: "/siswa/simulasi/parkir-otomatis",
          level: "Menengah",
          status: "Belum dicoba",
          gradient: "from-blue-100 to-cyan-200",
          emoji: "🚗",
          accent: "border-blue-500",
        },
      ],
    },
  ];

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case "Dasar":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case "Menengah":
        return "bg-sky-50 text-sky-700 border border-sky-100";
      case "Lanjutan":
        return "bg-rose-50 text-rose-700 border border-rose-100";
      default:
        return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Microscope className="text-green-600" size={28} />
            Simulasi
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Simulasi interaktif untuk memahami algoritma dan pemrograman
          </p>
        </div>
      </div>

      {simulationSections.map((section, sectionIndex) => (
        <section key={section.title} className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">
              {section.title}
            </h2>
            <span
              className={`text-[11px] px-2 py-1 rounded-full font-medium ${section.badgeClass}`}
            >
              {section.items.length} simulasi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {section.items.map((item, itemIndex) => (
              <Card
                key={item.href}
                className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  animateIn
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-3"
                }`}
                style={{
                  transitionDelay: `${sectionIndex * 120 + itemIndex * 60}ms`,
                }}
              >
                <div
                  className={`h-24 bg-gradient-to-br ${item.gradient} flex items-center justify-center`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl">{item.emoji}</div>
                    <div className="flex gap-1.5">
                      <div
                        className={`w-4 h-4 border-2 ${item.accent} rounded-full bg-white`}
                      />
                      <div
                        className={`w-4 h-4 border-2 ${item.accent} rounded bg-white`}
                      />
                      <div
                        className={`w-4 h-4 border-2 ${item.accent} rotate-45 bg-white`}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-medium ${getLevelBadgeClass(item.level)}`}
                    >
                      Level {item.level}
                    </span>
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                      {item.status}
                    </span>
                  </div>

                  <Button
                    onClick={() => {
                      window.location.href = item.href;
                    }}
                    className="w-full h-9 bg-green-600 text-sm hover:bg-green-700 transition-all duration-200 hover:shadow-md"
                  >
                    Mulai Simulasi
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
