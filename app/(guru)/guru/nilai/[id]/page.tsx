"use client";

import React, { useEffect, useState, use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function GuruNilaiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [asesmen, setAsesmen] = useState<any>(null);
  const [nilai, setNilai] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const supabase = createClient();
    try {
      // Fetch asesmen
      const { data: asesmenData, error: asesmenError } = await supabase
        .from("asesmen")
        .select("*")
        .eq("id", id)
        .single();

      if (asesmenError) {
        console.error("Error fetching asesmen:", asesmenError);
      }

      setAsesmen(asesmenData);

      // Fetch nilai with profiles
      const { data: nilaiData, error: nilaiError } = await supabase
        .from("nilai")
        .select("*")
        .eq("asesmen_id", id)
        .order("completed_at", { ascending: false });

      if (nilaiError) {
        console.error("Error fetching nilai:", nilaiError);
      }

      console.log("Nilai data:", nilaiData);

      // Fetch profiles for each nilai
      if (nilaiData) {
        const nilaiWithProfiles = await Promise.all(
          nilaiData.map(async (n) => {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("id, full_name, email")
              .eq("id", n.siswa_id)
              .single();

            return {
              ...n,
              profiles: profileData,
            };
          })
        );
        console.log("Nilai with profiles:", nilaiWithProfiles);
        setNilai(nilaiWithProfiles);
      } else {
        setNilai([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (nilaiId: string, siswaName: string) => {
    if (
      !confirm(
        `Yakin ingin me-reset nilai ${siswaName}? Siswa akan dapat mengerjakan asesmen lagi.`
      )
    )
      return;

    const supabase = createClient();
    try {
      // Delete nilai
      const { error: nilaiError } = await supabase
        .from("nilai")
        .delete()
        .eq("id", nilaiId);

      if (nilaiError) throw nilaiError;

      // Delete jawaban siswa
      const { error: jawabanError } = await supabase
        .from("jawaban_siswa")
        .delete()
        .eq("asesmen_id", id)
        .eq("siswa_id", nilai.find((n) => n.id === nilaiId)?.siswa_id);

      if (jawabanError) throw jawabanError;

      alert("Berhasil me-reset nilai. Siswa dapat mengerjakan ulang.");
      fetchData();
    } catch (error: any) {
      console.error("Error resetting nilai:", error);
      alert(`Gagal me-reset nilai: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const averageScore =
    nilai.length > 0
      ? Math.round(
          nilai.reduce((sum, n) => sum + (n.score || 0), 0) / nilai.length
        )
      : 0;

  const passedCount = nilai.filter(
    (n) => n.score >= (asesmen?.passing_score || 70)
  ).length;

  const failedCount = nilai.length - passedCount;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/guru/nilai">
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} className="mr-2" />
            Kembali
          </Button>
        </Link>
      </div>

      {/* Asesmen Info */}
      <Card className="p-6 mb-6 border-green-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {asesmen?.title}
        </h1>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total siswa</p>
            <p className="text-2xl font-bold text-blue-600">{nilai.length}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Nilai diatas KKM</p>
            <p className="text-2xl font-bold text-green-600">{passedCount}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Dibawah KKM</p>
            <p className="text-2xl font-bold text-red-600">{failedCount}</p>
          </div>
        </div>
      </Card>

      {/* Nilai List */}
      <Card className="border-green-100">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Daftar Nilai Siswa
          </h2>
          {nilai.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              Belum ada siswa yang mengerjakan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Nama Siswa
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Nilai
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Waktu Selesai
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {nilai.map((n, index) => {
                    const isPassed = n.score >= (asesmen?.passing_score || 70);
                    return (
                      <tr key={n.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {n.profiles?.full_name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-lg font-bold ${
                              isPassed ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {n.score || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isPassed ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              <CheckCircle size={14} />
                              Lulus
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                              <XCircle size={14} />
                              Tidak Lulus
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {n.completed_at
                            ? new Date(n.completed_at).toLocaleString("id-ID")
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleReset(
                                n.id,
                                n.profiles?.full_name || "Unknown"
                              )
                            }
                            className="border-orange-400 text-orange-600 hover:bg-orange-50"
                          >
                            <RefreshCw size={14} className="mr-1" />
                            Reset
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
