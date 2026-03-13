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

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Kategori 1: Diagram Alir */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-l-4 border-blue-600 pl-3">
          <h2 className="text-lg font-bold text-gray-800">Diagram Alir</h2>
          <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
            3 Simulasi
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Traffic Logic */}
          <Card className="overflow-hidden bg-white border-gray-200 hover:shadow-lg transition-all">
            <div className="h-36 bg-gradient-to-br from-blue-100 to-cyan-200 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="text-5xl">🚦</div>
                <div className="flex gap-1">
                  <div className="w-5 h-5 border-2 border-blue-500 rounded-full bg-white"></div>
                  <div className="w-5 h-5 border-2 border-cyan-500 rounded bg-white"></div>
                  <div className="w-5 h-5 border-2 border-blue-500 rotate-45 bg-white"></div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-2 text-base flex items-center gap-2">
                🎯 Logika Lalu Lintas
              </h3>
              <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                Susun diagram alir untuk mengatur lampu lalu lintas dengan
                benar.
              </p>
              <Button
                onClick={() =>
                  (window.location.href = "/siswa/simulasi/traffic-logic")
                }
                className="w-full bg-green-600 hover:bg-green-700 h-9 text-sm"
              >
                Mulai Simulasi
              </Button>
            </div>
          </Card>

          {/* Card 2: Traffic Debug */}
          <Card className="overflow-hidden bg-white border-gray-200 hover:shadow-lg transition-all">
            <div className="h-36 bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="text-5xl">🚦</div>
                <div className="flex gap-1">
                  <div className="w-5 h-5 border-2 border-amber-500 rounded-full bg-white"></div>
                  <div className="w-5 h-5 border-2 border-orange-500 rounded bg-white"></div>
                  <div className="w-5 h-5 border-2 border-amber-500 rotate-45 bg-white"></div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-2 text-base flex items-center gap-2">
                🎯 Transisi Lampu Bertahap
              </h3>
              <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                Susun diagram alir untuk mengatur perubahan lampu dari Merah →
                Kuning → Hijau secara berurutan.
              </p>
              <Button
                onClick={() =>
                  (window.location.href = "/siswa/simulasi/traffic-debug")
                }
                className="w-full bg-green-600 hover:bg-green-700 h-9 text-sm"
              >
                Mulai Simulasi
              </Button>
            </div>
          </Card>

          {/* Card 3: Traffic Expert */}
          <Card className="overflow-hidden bg-white border-gray-200 hover:shadow-lg transition-all">
            <div className="h-36 bg-gradient-to-br from-red-100 to-pink-200 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="text-5xl">🚦</div>
                <div className="flex gap-1">
                  <div className="w-5 h-5 border-2 border-red-500 rounded-full bg-white"></div>
                  <div className="w-5 h-5 border-2 border-pink-500 rounded bg-white"></div>
                  <div className="w-5 h-5 border-2 border-red-500 rotate-45 bg-white"></div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-2 text-base flex items-center gap-2">
                🎯 Prioritas Tiga Kendaraan
              </h3>
              <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                Susun diagram alir bercabang kompleks untuk mengatur 3 kendaraan
                dengan sistem prioritas: ambulans → lampu lalu lintas →
                kendaraan biasa.
              </p>
              <Button
                onClick={() =>
                  (window.location.href = "/siswa/simulasi/traffic-expert")
                }
                className="w-full bg-green-600 hover:bg-green-700 h-9 text-sm"
              >
                Mulai Simulasi
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Kategori 2: Pseudocode */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-l-4 border-purple-600 pl-3">
          <h2 className="text-lg font-bold text-gray-800">Pseudocode</h2>
          <span className="text-xs text-gray-500 bg-purple-50 px-2 py-1 rounded-full">
            3 Simulasi
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Kasir Kantin */}
          <Card className="overflow-hidden bg-white border-gray-200 hover:shadow-lg transition-all">
            <div className="h-36 bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="text-5xl">🍛</div>
                <div className="flex gap-1">
                  <div className="w-5 h-5 border-2 border-emerald-500 rounded-full bg-white"></div>
                  <div className="w-5 h-5 border-2 border-teal-500 rounded bg-white"></div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-2 text-base flex items-center gap-2">
                🎯 Perbaiki Mesin Kasir Kantin
              </h3>
              <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                Tulis algoritma pseudocode untuk menghitung total harga makanan
                dan minuman pelanggan di mesin kasir kantin.
              </p>
              <Button
                onClick={() =>
                  (window.location.href = "/siswa/simulasi/kasir-kantin")
                }
                className="w-full bg-green-600 hover:bg-green-700 h-9 text-sm"
              >
                Mulai Simulasi
              </Button>
            </div>
          </Card>

          {/* Card 2: Pintu Otomatis */}
          <Card className="overflow-hidden bg-white border-gray-200 hover:shadow-lg transition-all">
            <div className="h-36 bg-gradient-to-br from-indigo-100 to-purple-200 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="text-5xl">🚪</div>
                <div className="flex gap-1">
                  <div className="w-5 h-5 border-2 border-indigo-500 rounded-full bg-white"></div>
                  <div className="w-5 h-5 border-2 border-purple-500 rounded bg-white"></div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-2 text-base flex items-center gap-2">
                🎯 Koneksi Sensor & Pintu
              </h3>
              <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                Lengkapi pseudocode pintu otomatis dengan perintah INPUT dan
                PRINT agar pintu bekerja sesuai deteksi sensor infrared.
              </p>
              <Button
                onClick={() =>
                  (window.location.href = "/siswa/simulasi/pintu-otomatis")
                }
                className="w-full bg-green-600 hover:bg-green-700 h-9 text-sm"
              >
                Mulai Simulasi
              </Button>
            </div>
          </Card>

          {/* Card 3: Parkir Otomatis */}
          <Card className="overflow-hidden bg-white border-gray-200 hover:shadow-lg transition-all">
            <div className="h-36 bg-gradient-to-br from-blue-100 to-cyan-200 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="text-5xl">🚗</div>
                <div className="flex gap-1">
                  <div className="w-5 h-5 border-2 border-blue-500 rounded-full bg-white"></div>
                  <div className="w-5 h-5 border-2 border-cyan-500 rounded bg-white"></div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-2 text-base flex items-center gap-2">
                🎯 Sistem Parkir Otomatis
              </h3>
              <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                Lengkapi pseudocode sistem parkir dengan sensor dan kondisi
                IF-ELSE untuk menentukan apakah kendaraan boleh masuk atau
                parkiran penuh.
              </p>
              <Button
                onClick={() =>
                  (window.location.href = "/siswa/simulasi/parkir-otomatis")
                }
                className="w-full bg-green-600 hover:bg-green-700 h-9 text-sm"
              >
                Mulai Simulasi
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
