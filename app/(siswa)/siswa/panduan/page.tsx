"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, FileText } from "lucide-react";
import { toast } from "sonner";

type PanduanData = {
  id: string;
  title: string;
  file_name: string | null;
  file_url: string | null;
  updated_at: string;
} | null;

export default function SiswaPanduanPage() {
  const [loading, setLoading] = useState(true);
  const [panduan, setPanduan] = useState<PanduanData>(null);

  useEffect(() => {
    const fetchPanduan = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/panduan", { cache: "no-store" });
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json?.error || "Gagal memuat panduan");
        }

        setPanduan(json?.data || null);
      } catch (error: any) {
        toast.error(error?.message || "Gagal memuat panduan");
      } finally {
        setLoading(false);
      }
    };

    fetchPanduan();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Panduan Siswa</h1>
        <p className="text-sm text-gray-500 mt-1">
          Unduh panduan penggunaan platform untuk akun siswa.
        </p>
      </div>

      <Card className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat panduan...</p>
          </div>
        ) : !panduan ? (
          <div className="text-center py-10">
            <FileText size={42} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Panduan belum tersedia.</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {panduan.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {panduan.file_name || "Belum ada file"}
                </p>
              </div>
            </div>

            {panduan.file_url ? (
              <a href={panduan.file_url} target="_blank" rel="noreferrer">
                <Button className="bg-green-600 hover:bg-green-700 gap-2 rounded-lg px-5">
                  <Download size={15} />
                  Unduh Panduan
                </Button>
              </a>
            ) : (
              <p className="text-sm text-gray-500">
                Belum ada file untuk diunduh.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
