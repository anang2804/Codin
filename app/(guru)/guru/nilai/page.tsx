"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function GuruNilaiPage() {
  const [asesmen, setAsesmen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAsesmen();
  }, []);

  const fetchAsesmen = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    try {
      // Fetch asesmen created by this guru
      const { data: asesmenData } = await supabase
        .from("asesmen")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      // Get details for each asesmen
      if (asesmenData) {
        const asesmenWithDetails = await Promise.all(
          asesmenData.map(async (a) => {
            // Get kelas
            let kelasData = null;
            if (a.kelas_id) {
              const { data } = await supabase
                .from("kelas")
                .select("id, name")
                .eq("id", a.kelas_id)
                .single();
              kelasData = data;
            }

            // Get mapel
            let mapelData = null;
            if (a.mapel_id) {
              const { data } = await supabase
                .from("mapel")
                .select("id, name")
                .eq("id", a.mapel_id)
                .single();
              mapelData = data;
            }

            // Get nilai count
            const { count } = await supabase
              .from("nilai")
              .select("*", { count: "exact", head: true })
              .eq("asesmen_id", a.id);

            return {
              ...a,
              kelas: kelasData,
              mapel: mapelData,
              nilai_count: count || 0,
            };
          })
        );
        setAsesmen(asesmenWithDetails);
      }
    } catch (error) {
      console.error("Error fetching asesmen:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Kelola Nilai</h1>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat asesmen...</p>
        </div>
      ) : asesmen.length === 0 ? (
        <Card className="p-12 text-center border-green-100">
          <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Belum ada asesmen.</p>
          <Link href="/guru/asesmen">
            <Button className="mt-4 bg-green-600 hover:bg-green-700">
              Buat Asesmen
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {asesmen.map((a) => (
            <Card key={a.id} className="p-6 border-green-100">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{a.title}</h3>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>
                      <span className="text-gray-500">Mata Pelajaran:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {a.mapel?.name || "-"}
                      </span>
                    </span>
                    <span>
                      <span className="text-gray-500">Kelas:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {a.kelas?.name || "-"}
                      </span>
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>📊 {a.nilai_count} siswa telah mengerjakan</span>
                  </div>
                </div>
                <Link href={`/guru/nilai/${a.id}`}>
                  <Button className="bg-green-600 hover:bg-green-700 gap-2">
                    <Eye size={16} />
                    Lihat Nilai
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
