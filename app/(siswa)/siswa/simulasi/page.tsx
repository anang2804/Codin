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

      {/* Grid Cards */}
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
              Lengkapi pseudocode pembayaran bakso dan lihat bagaimana struktur
              IF-ELSE menentukan kembalian atau pesan kesalahan.
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

        {/* Card 3: Luas Segitiga */}
        <Card className="overflow-hidden bg-white border-gray-200 hover:shadow-lg transition-all">
          <div className="h-36 bg-gradient-to-br from-blue-100 to-cyan-200 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="text-5xl">🔺</div>
              <div className="flex gap-1">
                <div className="w-5 h-5 border-2 border-blue-500 rounded-full bg-white"></div>
                <div className="w-5 h-5 border-2 border-cyan-500 rounded-full bg-white"></div>
                <div className="w-5 h-5 border-2 border-blue-500 rounded-full bg-white"></div>
              </div>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-gray-900 mb-2 text-base flex items-center gap-2">
              🎯 Luas Tanah Pak Algor
            </h3>
            <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">
              Pilih bentuk tanah (segitiga, persegi, lingkaran) dan susun
              ekspresi untuk menghitung luasnya.
            </p>
            <Button
              onClick={() =>
                (window.location.href = "/siswa/simulasi/luas-segitiga")
              }
              className="w-full bg-green-600 hover:bg-green-700 h-9 text-sm"
            >
              Mulai Simulasi
            </Button>
          </div>
        </Card>

        {/* Card Placeholder */}
        {[4, 5, 6].map((index) => (
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
              <Button disabled className="w-full bg-gray-300 text-gray-600 cursor-not-allowed h-9 text-sm">
                Segera Hadir
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
