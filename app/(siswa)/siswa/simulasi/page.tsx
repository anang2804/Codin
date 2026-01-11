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
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Microscope className="text-green-600" size={32} />
            Simulasi
          </h1>
          <p className="text-gray-600 mt-1">
            Simulasi interaktif untuk memahami algoritma dan pemrograman
          </p>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Card 1: Bayar Bakso */}
        <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden bg-white border-green-100 hover:border-green-300">
          <div className="h-40 bg-gradient-to-br from-emerald-50 via-green-100 to-yellow-50 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="text-8xl">🍜</div>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="text-5xl animate-pulse">💰</div>
              <div className="flex gap-1">
                <div className="w-6 h-6 border-2 border-emerald-400 rounded-full bg-emerald-50"></div>
                <div className="w-6 h-6 border-2 border-green-400 rounded bg-green-50"></div>
              </div>
            </div>
          </div>
          <div className="p-4 flex flex-col">
            <h3 className="font-semibold text-gray-800 mb-2">
              🎯 Membayar Bakso
            </h3>
            <p className="text-sm text-gray-600 mb-3 min-h-[48px]">
              Lengkapi pseudocode pembayaran bakso dan lihat bagaimana struktur
              IF-ELSE menentukan kembalian atau pesan kesalahan.
            </p>
            <Button
              onClick={() =>
                (window.location.href = "/siswa/simulasi/bayar-bakso")
              }
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Mulai Simulasi
            </Button>
          </div>
        </Card>

        {/* Card 2: Poin Bakso */}
        <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden bg-white border-green-100 hover:border-green-300">
          <div className="h-40 bg-gradient-to-br from-emerald-50 via-green-100 to-teal-50 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="text-8xl">🎁</div>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="text-5xl animate-bounce">⭐</div>
              <div className="flex gap-1">
                <div className="w-6 h-6 border-2 border-emerald-400 rounded-full bg-emerald-50"></div>
                <div className="w-6 h-6 border-2 border-green-400 rounded-full bg-green-50"></div>
                <div className="w-6 h-6 border-2 border-teal-400 rounded-full bg-teal-50"></div>
              </div>
            </div>
          </div>
          <div className="p-4 flex flex-col">
            <h3 className="font-semibold text-gray-800 mb-2">
              🎯 Sistem Poin Bakso Gratis
            </h3>
            <p className="text-sm text-gray-600 mb-3 min-h-[48px]">
              Simulasikan sistem poin pelanggan dan amati bagaimana perubahan
              nilai poin dan kondisi IF-ELSE menentukan pemberian kupon.
            </p>
            <Button
              onClick={() =>
                (window.location.href = "/siswa/simulasi/poin-bakso")
              }
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Mulai Simulasi
            </Button>
          </div>
        </Card>

        {/* Card 3: Luas Segitiga */}
        <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden bg-white border-green-100 hover:border-green-300">
          <div className="h-40 bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="text-8xl">📐</div>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="text-5xl">🔺</div>
              <div className="flex gap-1">
                <div className="w-6 h-6 border-2 border-emerald-400 rounded-full bg-emerald-50"></div>
                <div className="w-6 h-6 border-2 border-cyan-400 rounded-full bg-cyan-50"></div>
                <div className="w-6 h-6 border-2 border-blue-400 rounded-full bg-blue-50"></div>
              </div>
            </div>
          </div>
          <div className="p-4 flex flex-col">
            <h3 className="font-semibold text-gray-800 mb-2">
              🎯 Luas Tanah Pak Algor
            </h3>
            <p className="text-sm text-gray-600 mb-3 min-h-[48px]">
              Pilih bentuk tanah (segitiga, persegi, lingkaran) dan susun
              ekspresi untuk menghitung luasnya.
            </p>
            <Button
              onClick={() =>
                (window.location.href = "/siswa/simulasi/luas-segitiga")
              }
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Mulai Simulasi
            </Button>
          </div>
        </Card>

        {/* Card Placeholder */}
        {[3, 4, 5, 6, 7, 8].map((index) => (
          <Card
            key={index}
            className="group hover:shadow-lg transition-all duration-300 overflow-hidden bg-white border-green-100 hover:border-green-300"
          >
            <div className="h-40 bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center relative">
              <div className="text-center">
                <Plus className="text-gray-300 mx-auto mb-2" size={48} />
                <p className="text-gray-400 text-sm font-medium">
                  Simulasi #{index}
                </p>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-2">
                Judul Simulasi
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Deskripsi singkat simulasi akan ditampilkan di sini...
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Mulai Simulasi
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
