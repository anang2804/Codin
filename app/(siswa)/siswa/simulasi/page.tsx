"use client";

import { Card } from "@/components/ui/card";
import { Microscope, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SiswaSimulasiPage() {
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

      {/* Kategori 1: Struktur Kontrol (IF-ELSE) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-l-4 border-green-600 pl-3">
          <h2 className="text-lg font-bold text-gray-800">
            Struktur Kontrol (IF-ELSE)
          </h2>
          <span className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded-full">
            3 Simulasi
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Bayar Bakso */}
          <Card className="overflow-hidden bg-white border-gray-200 hover:shadow-lg transition-all">
            <div className="h-36 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="text-5xl">💰</div>
                <div className="flex gap-1">
                  <div className="w-5 h-5 border-2 border-green-500 rounded-full bg-white"></div>
                  <div className="w-5 h-5 border-2 border-green-500 rounded bg-white"></div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-2 text-base flex items-center gap-2">
                🎯 Membayar Bakso
              </h3>
              <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                Lengkapi pseudocode pembayaran bakso dan lihat bagaimana
                struktur IF-ELSE menentukan kembalian atau pesan kesalahan.
              </p>
              <Button
                onClick={() =>
                  (window.location.href = "/siswa/simulasi/bayar-bakso")
                }
                className="w-full bg-green-600 hover:bg-green-700 h-9 text-sm"
              >
                Mulai Simulasi
              </Button>
            </div>
          </Card>

          {/* Card 2: Poin Bakso */}
          <Card className="overflow-hidden bg-white border-gray-200 hover:shadow-lg transition-all">
            <div className="h-36 bg-gradient-to-br from-yellow-100 to-orange-200 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="text-5xl">⭐</div>
                <div className="flex gap-1">
                  <div className="w-5 h-5 border-2 border-orange-500 rounded-full bg-white"></div>
                  <div className="w-5 h-5 border-2 border-orange-500 rounded-full bg-white"></div>
                  <div className="w-5 h-5 border-2 border-orange-500 rounded-full bg-white"></div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-2 text-base flex items-center gap-2">
                🎯 Sistem Poin Bakso Gratis
              </h3>
              <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                Simulasikan sistem poin pelanggan dan amati bagaimana perubahan
                nilai poin dan kondisi IF-ELSE menentukan pemberian kupon.
              </p>
              <Button
                onClick={() =>
                  (window.location.href = "/siswa/simulasi/poin-bakso")
                }
                className="w-full bg-green-600 hover:bg-green-700 h-9 text-sm"
              >
                Mulai Simulasi
              </Button>
            </div>
          </Card>

          {/* Placeholder */}
          <Card className="overflow-hidden bg-white border-gray-200 hover:shadow-lg transition-all">
            <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-center">
                <Plus className="text-gray-400 mx-auto mb-2" size={40} />
                <p className="text-gray-500 text-xs font-medium">Simulasi #3</p>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-2 text-base">
                Judul Simulasi
              </h3>
              <p className="text-xs text-gray-600 mb-4 line-clamp-3">
                Deskripsi singkat simulasi akan ditampilkan di sini...
              </p>
              <Button
                disabled
                className="w-full bg-gray-300 text-gray-600 cursor-not-allowed h-9 text-sm"
              >
                Segera Hadir
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Kategori 2: Diagram Alir */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-l-4 border-blue-600 pl-3">
          <h2 className="text-lg font-bold text-gray-800">Diagram Alir</h2>
          <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
            3 Simulasi
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Traffic Logic */}
          <Card className="overflow-hidden bg-white border-gray-200 hover:shadow-lg transition-all flex flex-col h-full">
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
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  🎯 Logika Lalu Lintas
                </h3>
                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  MUDAH
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-grow">
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
          <Card className="overflow-hidden bg-white border-gray-200 hover:shadow-lg transition-all flex flex-col h-full">
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
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  🎯 Transisi Lampu Bertahap
                </h3>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  SEDANG
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-grow">
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
          <Card className="overflow-hidden bg-white border-gray-200 hover:shadow-lg transition-all flex flex-col h-full">
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
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  🎯 Prioritas Tiga Kendaraan
                </h3>
                <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  SULIT
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-grow">
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

      {/* Kategori 3: Struktur Perulangan */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-l-4 border-purple-600 pl-3">
          <h2 className="text-lg font-bold text-gray-800">
            Struktur Perulangan (Loop)
          </h2>
          <span className="text-xs text-gray-500 bg-purple-50 px-2 py-1 rounded-full">
            3 Simulasi
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Placeholder */}
          {[1, 2, 3].map((index) => (
            <Card
              key={index}
              className="overflow-hidden bg-white border-gray-200 hover:shadow-lg transition-all"
            >
              <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <Plus className="text-gray-400 mx-auto mb-2" size={40} />
                  <p className="text-gray-500 text-xs font-medium">
                    Simulasi #{index}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2 text-base">
                  Judul Simulasi
                </h3>
                <p className="text-xs text-gray-600 mb-4 line-clamp-3">
                  Deskripsi singkat simulasi akan ditampilkan di sini...
                </p>
                <Button
                  disabled
                  className="w-full bg-gray-300 text-gray-600 cursor-not-allowed h-9 text-sm"
                >
                  Segera Hadir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
