"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList, Plus, Edit, Trash2, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function GuruAsesmenPage() {
  const [asesmen, setAsesmen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [kelas, setKelas] = useState<any[]>([]);
  const [mapel, setMapel] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    passing_score: 70,
    duration: 60,
    kelas_id: "",
    mapel_id: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      try {
        // Fetch asesmen
        const { data: asesmenData, error: asesmenError } = await supabase
          .from("asesmen")
          .select("*")
          .eq("created_by", user.id)
          .order("created_at", { ascending: false });

        if (asesmenError) {
          console.error("Error fetching asesmen:", asesmenError);
          setAsesmen([]);
          return;
        }

        // Fetch soal count, kelas, and mapel for each asesmen
        if (asesmenData) {
          const asesmenWithDetails = await Promise.all(
            asesmenData.map(async (a) => {
              // Get soal count
              const { count } = await supabase
                .from("soal")
                .select("*", { count: "exact", head: true })
                .eq("asesmen_id", a.id);

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

              return {
                ...a,
                soal_count: count || 0,
                kelas: kelasData,
                mapel: mapelData,
              };
            })
          );
          setAsesmen(asesmenWithDetails);
        } else {
          setAsesmen([]);
        }

        // Fetch kelas
        const { data: kelasData } = await supabase
          .from("kelas")
          .select("*")
          .order("name", { ascending: true });

        setKelas(kelasData || []);

        // Fetch all mapel
        const { data: mapelData } = await supabase
          .from("mapel")
          .select("*")
          .order("name", { ascending: true });

        setMapel(mapelData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddAsesmen = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    try {
      const { data: newAsesmen, error } = await supabase
        .from("asesmen")
        .insert({
          title: formData.title,
          description: formData.description,
          passing_score: formData.passing_score,
          duration: formData.duration,
          kelas_id: formData.kelas_id || null,
          mapel_id: formData.mapel_id || null,
          created_by: user.id,
        })
        .select();

      if (error) throw error;

      setAsesmen([newAsesmen[0], ...asesmen]);
      setFormData({
        title: "",
        description: "",
        passing_score: 70,
        duration: 60,
        kelas_id: "",
        mapel_id: "",
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error adding asesmen:", error);
    }
  };

  const handleDeleteAsesmen = async (asesmenId: string) => {
    if (
      !confirm(
        "Yakin ingin menghapus asesmen ini? Semua soal akan ikut terhapus."
      )
    )
      return;

    const supabase = createClient();
    try {
      // First delete all soals
      const { error: soalError } = await supabase
        .from("soal")
        .delete()
        .eq("asesmen_id", asesmenId);

      if (soalError) {
        console.error("Error deleting soals:", soalError);
        throw soalError;
      }

      // Then delete asesmen
      const { error: asesmenError } = await supabase
        .from("asesmen")
        .delete()
        .eq("id", asesmenId);

      if (asesmenError) {
        console.error("Error deleting asesmen:", asesmenError);
        throw asesmenError;
      }

      // Update state only after successful delete
      setAsesmen(asesmen.filter((a) => a.id !== asesmenId));
      alert("Asesmen berhasil dihapus");
    } catch (error: any) {
      console.error("Error deleting asesmen:", error);
      alert(`Gagal menghapus asesmen: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Kelola Asesmen</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 gap-2"
        >
          <Plus size={20} />
          Tambah Asesmen
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 border-green-100 mb-8">
          <form onSubmit={handleAddAsesmen} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Judul Asesmen
              </label>
              <Input
                type="text"
                placeholder="Masukkan judul asesmen"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="border-green-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <Input
                type="text"
                placeholder="Masukkan deskripsi asesmen"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="border-green-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mata Pelajaran
              </label>
              <select
                value={formData.mapel_id}
                onChange={(e) =>
                  setFormData({ ...formData, mapel_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Pilih Mata Pelajaran</option>
                {mapel.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kelas
              </label>
              <select
                value={formData.kelas_id}
                onChange={(e) =>
                  setFormData({ ...formData, kelas_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Pilih Kelas</option>
                {kelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nilai Minimum
              </label>
              <Input
                type="number"
                placeholder="70"
                value={formData.passing_score}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    passing_score: Number.parseInt(e.target.value) || 0,
                  })
                }
                className="border-green-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waktu Pengerjaan (menit)
              </label>
              <Input
                type="number"
                placeholder="60"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration: Number.parseInt(e.target.value) || 0,
                  })
                }
                className="border-green-200"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Simpan
              </Button>
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                variant="outline"
                className="border-green-200"
              >
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat asesmen...</p>
        </div>
      ) : asesmen.length === 0 ? (
        <Card className="p-12 text-center border-green-100">
          <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">
            Belum ada asesmen. Tambahkan asesmen baru untuk memulai.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {asesmen.map((a) => (
            <Card key={a.id} className="p-6 border-green-100">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{a.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{a.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
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
                    <span>📝 {a.soal_count || 0} soal</span>
                    <span>✓ Nilai minimum: {a.passing_score}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/guru/asesmen/${a.id}`}>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Eye size={16} className="mr-2" />
                      Kelola Soal
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteAsesmen(a.id)}
                    className="border-red-400 text-red-600 hover:bg-red-50 bg-transparent"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
