"use client";

import React, { useEffect, useState, use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Upload,
  FileText,
  CheckCircle,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Soal {
  id: string;
  question: string;
  type: "pilihan_ganda" | "essay";
  options?: { [key: string]: string };
  correct_answer?: string;
  points: number;
  file_url?: string;
}

export default function AsesmenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [asesmen, setAsesmen] = useState<any>(null);
  const [soals, setSoals] = useState<Soal[]>([]);
  const [kelas, setKelas] = useState<any>(null);
  const [mapel, setMapel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSoal, setEditingSoal] = useState<Soal | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    question: "",
    type: "pilihan_ganda" as "pilihan_ganda" | "essay",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correct_answer: "",
    points: 1,
    file: null as File | null,
  });

  useEffect(() => {
    fetchAsesmenData();
  }, [id]);

  const fetchAsesmenData = async () => {
    const supabase = createClient();
    try {
      // Fetch asesmen
      const { data: asesmenData } = await supabase
        .from("asesmen")
        .select("*")
        .eq("id", id)
        .single();

      console.log("Fetched asesmen:", asesmenData);
      setAsesmen(asesmenData);

      // Fetch kelas
      if (asesmenData?.kelas_id) {
        const { data: kelasData } = await supabase
          .from("kelas")
          .select("*")
          .eq("id", asesmenData.kelas_id)
          .single();
        console.log("Fetched kelas:", kelasData);
        setKelas(kelasData);
      }

      // Fetch mapel
      if (asesmenData?.mapel_id) {
        const { data: mapelData } = await supabase
          .from("mapel")
          .select("*")
          .eq("id", asesmenData.mapel_id)
          .single();
        console.log("Fetched mapel:", mapelData);
        setMapel(mapelData);
      }

      // Fetch soals
      const { data: soalsData } = await supabase
        .from("soal")
        .select("*")
        .eq("asesmen_id", id)
        .order("created_at", { ascending: true });

      console.log("Fetched soals:", soalsData);
      console.log("Soals length:", soalsData?.length || 0);
      setSoals(soalsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const supabase = createClient();

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("learning-materials")
        .upload(fileName, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("learning-materials").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Gagal upload file");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitSoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    try {
      let fileUrl = editingSoal?.file_url || null;

      // Upload file if exists
      if (formData.file) {
        fileUrl = await handleFileUpload(formData.file);
      }

      const soalData: any = {
        asesmen_id: id,
        question: formData.question,
        type: formData.type,
        points: formData.points,
        file_url: fileUrl,
      };

      if (formData.type === "pilihan_ganda") {
        soalData.options = {
          A: formData.optionA,
          B: formData.optionB,
          C: formData.optionC,
          D: formData.optionD,
        };
        soalData.correct_answer = formData.correct_answer;
      }

      if (editingSoal) {
        // Update
        const { data, error } = await supabase
          .from("soal")
          .update(soalData)
          .eq("id", editingSoal.id)
          .select();

        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }
        console.log("Update success:", data);
      } else {
        // Insert
        const { data, error } = await supabase
          .from("soal")
          .insert(soalData)
          .select();

        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }
        console.log("Insert success:", data);
      }

      // Refresh data
      await fetchAsesmenData();
      resetForm();
      alert("Soal berhasil disimpan!");
    } catch (error: any) {
      console.error("Error saving soal:", error);
      const errorMessage =
        error?.message || error?.error_description || JSON.stringify(error);
      alert(`Gagal menyimpan soal: ${errorMessage}`);
    }
  };

  const handleEditSoal = (soal: Soal) => {
    setEditingSoal(soal);
    setFormData({
      question: soal.question,
      type: soal.type,
      optionA: soal.options?.A || "",
      optionB: soal.options?.B || "",
      optionC: soal.options?.C || "",
      optionD: soal.options?.D || "",
      correct_answer: soal.correct_answer || "",
      points: soal.points,
      file: null,
    });
    setShowForm(true);
  };

  const handleDeleteSoal = async (soalId: string) => {
    if (!confirm("Yakin ingin menghapus soal ini?")) return;

    const supabase = createClient();
    try {
      const { error } = await supabase.from("soal").delete().eq("id", soalId);
      if (error) throw error;

      await fetchAsesmenData();
    } catch (error) {
      console.error("Error deleting soal:", error);
      alert("Gagal menghapus soal");
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      type: "pilihan_ganda",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correct_answer: "",
      points: 1,
      file: null,
    });
    setEditingSoal(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/guru/asesmen">
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
        <p className="text-gray-600 mb-3">{asesmen?.description}</p>
        <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-2">
          <span>
            <span className="text-gray-500">Mata Pelajaran:</span>{" "}
            <span className="font-medium text-gray-900">
              {mapel?.name || "-"}
            </span>
          </span>
          <span>
            <span className="text-gray-500">Kelas:</span>{" "}
            <span className="font-medium text-gray-900">
              {kelas?.name || "-"}
            </span>
          </span>
        </div>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>📝 {soals.length} soal</span>
          <span>✓ Nilai minimum: {asesmen?.passing_score}</span>
        </div>
      </Card>

      {/* Add Soal Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Daftar Soal</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-green-600 hover:bg-green-700 gap-2"
        >
          <Plus size={20} />
          Tambah Soal
        </Button>
      </div>

      {/* Form Add/Edit Soal */}
      {showForm && (
        <Card className="p-4 mb-4 border-green-100">
          <h3 className="text-base font-bold mb-3">
            {editingSoal ? "Edit Soal" : "Tambah Soal Baru"}
          </h3>
          <form onSubmit={handleSubmitSoal} className="space-y-3">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Soal *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "pilihan_ganda" | "essay",
                  })
                }
              >
                <option value="pilihan_ganda">Pilihan Ganda</option>
                <option value="essay">Essay</option>
              </select>
            </div>

            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Soal *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
                placeholder="Masukkan pertanyaan soal"
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                required
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lampiran (opsional)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      file: e.target.files?.[0] || null,
                    })
                  }
                  accept="image/*,application/pdf"
                />
                {uploading && (
                  <span className="text-sm text-gray-500">Uploading...</span>
                )}
              </div>
              {editingSoal?.file_url && (
                <a
                  href={editingSoal.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
                >
                  <FileText size={14} />
                  File terlampir
                </a>
              )}
            </div>

            {/* Options (only for pilihan_ganda) */}
            {formData.type === "pilihan_ganda" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opsi A *
                    </label>
                    <Input
                      value={formData.optionA}
                      onChange={(e) =>
                        setFormData({ ...formData, optionA: e.target.value })
                      }
                      required
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opsi B *
                    </label>
                    <Input
                      value={formData.optionB}
                      onChange={(e) =>
                        setFormData({ ...formData, optionB: e.target.value })
                      }
                      required
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opsi C *
                    </label>
                    <Input
                      value={formData.optionC}
                      onChange={(e) =>
                        setFormData({ ...formData, optionC: e.target.value })
                      }
                      required
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opsi D *
                    </label>
                    <Input
                      value={formData.optionD}
                      onChange={(e) =>
                        setFormData({ ...formData, optionD: e.target.value })
                      }
                      required
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Correct Answer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kunci Jawaban *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={formData.correct_answer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        correct_answer: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Pilih jawaban yang benar</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              </>
            )}

            {/* Points */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poin
              </label>
              <Input
                type="number"
                value={formData.points}
                onChange={(e) =>
                  setFormData({ ...formData, points: parseInt(e.target.value) })
                }
                min={1}
                className="text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={uploading}
              >
                {editingSoal ? "Update Soal" : "Simpan Soal"}
              </Button>
              <Button
                type="button"
                onClick={resetForm}
                variant="outline"
                className="border-gray-300"
              >
                Batal
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Soal List */}
      <div className="space-y-4">
        {soals.length === 0 ? (
          <Card className="p-12 text-center border-green-100">
            <p className="text-gray-600">
              Belum ada soal. Tambahkan soal untuk memulai.
            </p>
          </Card>
        ) : (
          soals.map((soal, index) => (
            <Card key={soal.id} className="p-6 border-green-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                      Soal {index + 1}
                    </span>
                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                      {soal.type === "pilihan_ganda"
                        ? "Pilihan Ganda"
                        : "Essay"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {soal.points} poin
                    </span>
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap mb-3">
                    {soal.question}
                  </p>

                  {soal.file_url && (
                    <a
                      href={soal.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-3"
                    >
                      <FileText size={16} />
                      Lihat Lampiran
                    </a>
                  )}

                  {soal.type === "pilihan_ganda" && soal.options && (
                    <div className="space-y-2 mt-3">
                      {Object.entries(soal.options).map(([key, value]) => (
                        <div
                          key={key}
                          className={`flex items-center gap-2 p-2 rounded ${
                            soal.correct_answer === key
                              ? "bg-green-50 border border-green-200"
                              : "bg-gray-50"
                          }`}
                        >
                          {soal.correct_answer === key && (
                            <CheckCircle size={16} className="text-green-600" />
                          )}
                          <span className="font-semibold">{key}.</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditSoal(soal)}
                    className="border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteSoal(soal.id)}
                    className="border-red-400 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
