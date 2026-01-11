"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Users, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SimulasiProgress {
  id: string;
  name: string;
  slug: string;
  completed: boolean;
  completed_at: string | null;
}

interface SiswaProgress {
  id: string;
  full_name: string;
  kelas: string;
  simulasi: SimulasiProgress[];
}

interface Simulasi {
  id: string;
  name: string;
  slug: string;
}

export default function SimulasiProgressPage() {
  const [siswaList, setSiswaList] = useState<SiswaProgress[]>([]);
  const [simulasiList, setSimulasiList] = useState<Simulasi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await fetch("/api/guru/simulasi-progress");
      const data = await response.json();

      if (response.ok) {
        setSiswaList(data.siswa || []);
        setSimulasiList(data.simulasi || []);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <BookOpen className="text-emerald-600" size={32} />
          Progress Simulasi Siswa
        </h1>
        <p className="text-gray-600 mt-1">
          Monitor progress siswa dalam menyelesaikan simulasi interaktif
        </p>
      </div>

      {/* Progress Table */}
      <Card className="overflow-hidden">
        {siswaList.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>Tidak ada data siswa</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Nama Siswa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Kelas
                  </th>
                  {simulasiList.map((sim) => (
                    <th
                      key={sim.id}
                      className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider"
                    >
                      {sim.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {siswaList.map((siswa) => (
                  <tr key={siswa.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {siswa.full_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {siswa.kelas || "-"}
                    </td>
                    {siswa.simulasi.map((sim) => (
                      <td key={sim.id} className="px-4 py-3 text-center">
                        {sim.completed ? (
                          <CheckCircle2
                            size={20}
                            className="text-emerald-600 mx-auto"
                            fill="currentColor"
                          />
                        ) : (
                          <XCircle
                            size={20}
                            className="text-gray-300 mx-auto"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
