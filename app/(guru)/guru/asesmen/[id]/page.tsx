"use client";

import React, { useEffect, useState, use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Upload,
  FileText,
  CheckCircle,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { compressImageFile } from "@/lib/utils/image-compression";

interface Soal {
  id: string;
  question: string;
  type: "pilihan_ganda" | "essay";
  options?: {
    [key: string]: string | { text?: string; image_url?: string | null };
  };
  correct_answer?: string;
  points: number;
  file_url?: string;
}

type OptionValue = string | { text?: string; image_url?: string | null };
type SoalFormErrors = Partial<{
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correct_answer: string;
  points: string;
}>;

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
  const [formErrors, setFormErrors] = useState<SoalFormErrors>({});
  const [showDeleteSoalDialog, setShowDeleteSoalDialog] = useState(false);
  const [deleteSoalTarget, setDeleteSoalTarget] = useState<{
    id: string;
    question: string;
  } | null>(null);
  const [isDeletingSoal, setIsDeletingSoal] = useState(false);

  const [formData, setFormData] = useState({
    question: "",
    type: "pilihan_ganda" as "pilihan_ganda" | "essay",
    optionA: "",
    optionAImageFile: null as File | null,
    optionAImageUrl: "",
    optionB: "",
    optionBImageFile: null as File | null,
    optionBImageUrl: "",
    optionC: "",
    optionCImageFile: null as File | null,
    optionCImageUrl: "",
    optionD: "",
    optionDImageFile: null as File | null,
    optionDImageUrl: "",
    optionE: "",
    optionEImageFile: null as File | null,
    optionEImageUrl: "",
    correct_answer: "",
    points: Number.NaN,
    file: null as File | null,
  });

  const getOptionText = (optionValue?: OptionValue) => {
    if (!optionValue) return "";
    if (typeof optionValue === "string") return optionValue;
    return optionValue.text || "";
  };

  const getOptionImageUrl = (optionValue?: OptionValue) => {
    if (!optionValue || typeof optionValue === "string") return "";
    return optionValue.image_url || "";
  };

  const clearFieldError = (field: keyof SoalFormErrors) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateSoalForm = () => {
    const errors: SoalFormErrors = {};

    if (!formData.question.trim()) {
      errors.question = "Pertanyaan soal wajib diisi";
    }

    if (formData.type === "pilihan_ganda") {
      if (!formData.optionA.trim()) {
        errors.optionA = "Jawaban opsi A wajib diisi";
      }
      if (!formData.optionB.trim()) {
        errors.optionB = "Jawaban opsi B wajib diisi";
      }
      if (!formData.optionC.trim()) {
        errors.optionC = "Jawaban opsi C wajib diisi";
      }
      if (!formData.optionD.trim()) {
        errors.optionD = "Jawaban opsi D wajib diisi";
      }
      if (!formData.optionE.trim()) {
        errors.optionE = "Jawaban opsi E wajib diisi";
      }
      if (!formData.correct_answer) {
        errors.correct_answer = "Pilih kunci jawaban yang benar";
      }
    }

    if (Number.isNaN(formData.points) || formData.points < 1) {
      errors.points = "Poin wajib diisi";
    }

    return errors;
  };

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
      const isImage = file.type.startsWith("image/");
      const compressed = isImage
        ? await compressImageFile(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.78,
            targetType: "image/webp",
          })
        : {
            file,
            compressed: false,
            originalSize: file.size,
            compressedSize: file.size,
          };
      const uploadFile = compressed.file;

      const extFromName = uploadFile.name.split(".").pop() || "bin";
      const safeName = uploadFile.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `${Date.now()}_${safeName}.${extFromName}`;

      const { data, error } = await supabase.storage
        .from("learning-materials")
        .upload(fileName, uploadFile, { contentType: uploadFile.type });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("learning-materials").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Gagal upload file");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitSoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateSoalForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setFormErrors({});
    const supabase = createClient();

    try {
      let fileUrl = editingSoal?.file_url || null;

      // Upload file if exists
      if (formData.file) {
        fileUrl = await handleFileUpload(formData.file);
      }

      let optionAImageUrl = formData.optionAImageUrl;
      let optionBImageUrl = formData.optionBImageUrl;
      let optionCImageUrl = formData.optionCImageUrl;
      let optionDImageUrl = formData.optionDImageUrl;
      let optionEImageUrl = formData.optionEImageUrl;

      if (formData.optionAImageFile) {
        optionAImageUrl =
          (await handleFileUpload(formData.optionAImageFile)) || "";
      }
      if (formData.optionBImageFile) {
        optionBImageUrl =
          (await handleFileUpload(formData.optionBImageFile)) || "";
      }
      if (formData.optionCImageFile) {
        optionCImageUrl =
          (await handleFileUpload(formData.optionCImageFile)) || "";
      }
      if (formData.optionDImageFile) {
        optionDImageUrl =
          (await handleFileUpload(formData.optionDImageFile)) || "";
      }
      if (formData.optionEImageFile) {
        optionEImageUrl =
          (await handleFileUpload(formData.optionEImageFile)) || "";
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
          A: {
            text: formData.optionA,
            image_url: optionAImageUrl || null,
          },
          B: {
            text: formData.optionB,
            image_url: optionBImageUrl || null,
          },
          C: {
            text: formData.optionC,
            image_url: optionCImageUrl || null,
          },
          D: {
            text: formData.optionD,
            image_url: optionDImageUrl || null,
          },
          E: {
            text: formData.optionE,
            image_url: optionEImageUrl || null,
          },
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
      toast.success("Soal berhasil disimpan");
    } catch (error: any) {
      console.error("Error saving soal:", error);
      const errorMessage =
        error?.message || error?.error_description || JSON.stringify(error);
      toast.error(`Gagal menyimpan soal: ${errorMessage}`);
    }
  };

  const handleEditSoal = (soal: Soal) => {
    setEditingSoal(soal);
    setFormData({
      question: soal.question,
      type: soal.type,
      optionA: getOptionText(soal.options?.A),
      optionAImageFile: null,
      optionAImageUrl: getOptionImageUrl(soal.options?.A),
      optionB: getOptionText(soal.options?.B),
      optionBImageFile: null,
      optionBImageUrl: getOptionImageUrl(soal.options?.B),
      optionC: getOptionText(soal.options?.C),
      optionCImageFile: null,
      optionCImageUrl: getOptionImageUrl(soal.options?.C),
      optionD: getOptionText(soal.options?.D),
      optionDImageFile: null,
      optionDImageUrl: getOptionImageUrl(soal.options?.D),
      optionE: getOptionText(soal.options?.E),
      optionEImageFile: null,
      optionEImageUrl: getOptionImageUrl(soal.options?.E),
      correct_answer: soal.correct_answer || "",
      points: soal.points,
      file: null,
    });
    setShowForm(true);
  };

  const handleDeleteSoal = (soal: Soal) => {
    setDeleteSoalTarget({ id: soal.id, question: soal.question });
    setShowDeleteSoalDialog(true);
  };

  const confirmDeleteSoal = async () => {
    if (!deleteSoalTarget) return;

    setIsDeletingSoal(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("soal")
        .delete()
        .eq("id", deleteSoalTarget.id);
      if (error) throw error;

      await fetchAsesmenData();
      toast.success("Soal berhasil dihapus");
      setShowDeleteSoalDialog(false);
      setDeleteSoalTarget(null);
    } catch (error) {
      console.error("Error deleting soal:", error);
      toast.error("Gagal menghapus soal");
    } finally {
      setIsDeletingSoal(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      type: "pilihan_ganda",
      optionA: "",
      optionAImageFile: null,
      optionAImageUrl: "",
      optionB: "",
      optionBImageFile: null,
      optionBImageUrl: "",
      optionC: "",
      optionCImageFile: null,
      optionCImageUrl: "",
      optionD: "",
      optionDImageFile: null,
      optionDImageUrl: "",
      optionE: "",
      optionEImageFile: null,
      optionEImageUrl: "",
      correct_answer: "",
      points: Number.NaN,
      file: null,
    });
    setFormErrors({});
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
      <Card className="p-5 mb-6 border-green-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
          {asesmen?.title}
        </h1>
        {asesmen?.description && (
          <p className="text-gray-600 mb-2.5 leading-relaxed">
            {asesmen.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <span className="font-medium text-gray-700">
            {mapel?.name || "-"}
          </span>
          <span>•</span>
          <span className="font-medium text-gray-700">
            {kelas?.name || "-"}
          </span>
          <span>•</span>
          <span>{soals.length} Soal</span>
        </div>
      </Card>

      {/* Add Soal Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Daftar Soal</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-green-600 hover:bg-green-700 gap-2"
        >
          <Plus size={20} />
          Tambah Soal
        </Button>
      </div>

      {/* Form Add/Edit Soal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingSoal ? "Edit Soal" : "Tambah Soal Baru"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Buat dan atur soal kuis dengan format yang rapi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitSoal} className="space-y-6 pt-2">
            <section className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">
                Informasi Soal
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tipe Soal *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all duration-150"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Pertanyaan Soal *
                </label>
                <textarea
                  className={`w-full px-4 py-3 border rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-2 transition-all duration-150 ${
                    formErrors.question
                      ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                      : "border-gray-200 focus:ring-green-500/30 focus:border-green-500"
                  }`}
                  rows={5}
                  placeholder="Masukkan pertanyaan soal"
                  value={formData.question}
                  onChange={(e) => {
                    setFormData({ ...formData, question: e.target.value });
                    clearFieldError("question");
                  }}
                />
                {formErrors.question && (
                  <p className="mt-1 text-xs text-red-500">
                    {formErrors.question}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
            </section>

            {formData.type === "pilihan_ganda" && (
              <section className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">
                  Pilihan Jawaban
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(
                    [
                      {
                        key: "A",
                        text: formData.optionA,
                        imageFile: formData.optionAImageFile,
                        imageUrl: formData.optionAImageUrl,
                      },
                      {
                        key: "B",
                        text: formData.optionB,
                        imageFile: formData.optionBImageFile,
                        imageUrl: formData.optionBImageUrl,
                      },
                      {
                        key: "C",
                        text: formData.optionC,
                        imageFile: formData.optionCImageFile,
                        imageUrl: formData.optionCImageUrl,
                      },
                      {
                        key: "D",
                        text: formData.optionD,
                        imageFile: formData.optionDImageFile,
                        imageUrl: formData.optionDImageUrl,
                      },
                      {
                        key: "E",
                        text: formData.optionE,
                        imageFile: formData.optionEImageFile,
                        imageUrl: formData.optionEImageUrl,
                      },
                    ] as const
                  ).map((option) => (
                    <div
                      key={option.key}
                      className={`rounded-lg border p-3 space-y-2.5 transition-all duration-150 ${
                        formData.correct_answer === option.key
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50/70 border-gray-200"
                      }`}
                    >
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700">
                        {option.key}
                      </span>

                      <Input
                        value={option.text}
                        onChange={(e) => {
                          if (option.key === "A") {
                            setFormData({
                              ...formData,
                              optionA: e.target.value,
                            });
                            clearFieldError("optionA");
                          }
                          if (option.key === "B") {
                            setFormData({
                              ...formData,
                              optionB: e.target.value,
                            });
                            clearFieldError("optionB");
                          }
                          if (option.key === "C") {
                            setFormData({
                              ...formData,
                              optionC: e.target.value,
                            });
                            clearFieldError("optionC");
                          }
                          if (option.key === "D") {
                            setFormData({
                              ...formData,
                              optionD: e.target.value,
                            });
                            clearFieldError("optionD");
                          }
                          if (option.key === "E") {
                            setFormData({
                              ...formData,
                              optionE: e.target.value,
                            });
                            clearFieldError("optionE");
                          }
                        }}
                        className={`text-sm transition-all duration-150 bg-white ${
                          (option.key === "A" && formErrors.optionA) ||
                          (option.key === "B" && formErrors.optionB) ||
                          (option.key === "C" && formErrors.optionC) ||
                          (option.key === "D" && formErrors.optionD) ||
                          (option.key === "E" && formErrors.optionE)
                            ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-200"
                            : "border-gray-200 focus-visible:border-green-500 focus-visible:ring-green-500/30"
                        }`}
                        placeholder={`Tulis jawaban opsi ${option.key}`}
                      />
                      {option.key === "A" && formErrors.optionA && (
                        <p className="mt-1 text-xs text-red-500">
                          {formErrors.optionA}
                        </p>
                      )}
                      {option.key === "B" && formErrors.optionB && (
                        <p className="mt-1 text-xs text-red-500">
                          {formErrors.optionB}
                        </p>
                      )}
                      {option.key === "C" && formErrors.optionC && (
                        <p className="mt-1 text-xs text-red-500">
                          {formErrors.optionC}
                        </p>
                      )}
                      {option.key === "D" && formErrors.optionD && (
                        <p className="mt-1 text-xs text-red-500">
                          {formErrors.optionD}
                        </p>
                      )}
                      {option.key === "E" && formErrors.optionE && (
                        <p className="mt-1 text-xs text-red-500">
                          {formErrors.optionE}
                        </p>
                      )}

                      <label className="inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <Upload size={13} />
                        Upload gambar opsional
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const selected = e.target.files?.[0] || null;
                            if (option.key === "A") {
                              setFormData({
                                ...formData,
                                optionAImageFile: selected,
                              });
                            }
                            if (option.key === "B") {
                              setFormData({
                                ...formData,
                                optionBImageFile: selected,
                              });
                            }
                            if (option.key === "C") {
                              setFormData({
                                ...formData,
                                optionCImageFile: selected,
                              });
                            }
                            if (option.key === "D") {
                              setFormData({
                                ...formData,
                                optionDImageFile: selected,
                              });
                            }
                            if (option.key === "E") {
                              setFormData({
                                ...formData,
                                optionEImageFile: selected,
                              });
                            }
                          }}
                        />
                      </label>

                      {(option.imageFile || option.imageUrl) && (
                        <div className="rounded-md border border-gray-200 bg-white p-1">
                          <img
                            src={
                              option.imageFile
                                ? URL.createObjectURL(option.imageFile)
                                : option.imageUrl
                            }
                            alt={`Preview opsi ${option.key}`}
                            className="h-20 w-auto object-contain rounded"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">
                Pengaturan Jawaban
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formData.type === "pilihan_ganda" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Kunci Jawaban *
                    </label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all duration-150 ${
                        formErrors.correct_answer
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                          : "border-gray-200 focus:ring-green-500/30 focus:border-green-500"
                      }`}
                      value={formData.correct_answer}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          correct_answer: e.target.value,
                        });
                        clearFieldError("correct_answer");
                      }}
                    >
                      <option value="">Pilih jawaban yang benar</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                    </select>
                    {formErrors.correct_answer && (
                      <p className="mt-1 text-xs text-red-500">
                        {formErrors.correct_answer}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Poin
                  </label>
                  <Input
                    type="number"
                    value={Number.isNaN(formData.points) ? "" : formData.points}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        points:
                          e.target.value === ""
                            ? Number.NaN
                            : parseInt(e.target.value),
                      });
                      clearFieldError("points");
                    }}
                    min={1}
                    className={`text-sm transition-all duration-150 ${
                      formErrors.points
                        ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-200"
                        : "border-gray-200 focus-visible:border-green-500 focus-visible:ring-green-500/30"
                    }`}
                  />
                  {formErrors.points && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.points}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 hover:scale-[1.02] transition-all duration-150"
                disabled={uploading}
              >
                {editingSoal ? "Update Soal" : "Simpan Soal"}
              </Button>
              <Button
                type="button"
                onClick={resetForm}
                variant="outline"
                className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:scale-[1.02] transition-all duration-150"
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
            <Card
              key={soal.id}
              className="p-6 border border-gray-100 rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                      Soal {index + 1}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                      {soal.type === "pilihan_ganda"
                        ? "Pilihan Ganda"
                        : "Essay"}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                      {soal.points} poin
                    </span>
                  </div>

                  <p className="text-[15px] leading-relaxed text-gray-900 whitespace-pre-wrap">
                    {soal.question}
                  </p>

                  {soal.file_url && (
                    <a
                      href={soal.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mt-2"
                    >
                      <FileText size={16} />
                      Lihat Lampiran
                    </a>
                  )}

                  {soal.type === "pilihan_ganda" && soal.options && (
                    <div className="space-y-2 mt-4">
                      {Object.entries(soal.options).map(([key, value]) => {
                        const optionText = getOptionText(value as OptionValue);
                        const optionImageUrl = getOptionImageUrl(
                          value as OptionValue,
                        );

                        return (
                          <div
                            key={key}
                            className={`p-3 rounded-lg border ${
                              soal.correct_answer === key
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50/70 border-gray-100"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {soal.correct_answer === key && (
                                <CheckCircle
                                  size={16}
                                  className="text-green-600 shrink-0 mt-0.5"
                                />
                              )}
                              <span className="font-semibold text-gray-700">
                                {key}.
                              </span>
                              <span className="text-gray-700">
                                {optionText}
                              </span>
                            </div>
                            {optionImageUrl && (
                              <div className="mt-2 ml-6 rounded-md border border-gray-200 bg-white p-1">
                                <img
                                  src={optionImageUrl}
                                  alt={`Gambar opsi ${key}`}
                                  className="h-20 w-auto object-contain rounded"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditSoal(soal)}
                    className="h-8 w-8 p-0 border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 hover:scale-[1.03] transition-all duration-150"
                  >
                    <Edit size={15} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteSoal(soal)}
                    className="h-8 w-8 p-0 border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:scale-[1.03] transition-all duration-150"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={showDeleteSoalDialog}
        onOpenChange={(open) => {
          setShowDeleteSoalDialog(open);
          if (!open && !isDeletingSoal) {
            setDeleteSoalTarget(null);
          }
        }}
      >
        <DialogContent
          className="max-w-md rounded-xl border border-gray-100 p-7 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200"
          showCloseButton={false}
        >
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle size={16} />
              </span>
              Hapus Soal
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              {deleteSoalTarget?.question
                ? `Apakah kamu yakin ingin menghapus soal "${deleteSoalTarget.question}"? Tindakan ini tidak dapat dibatalkan.`
                : "Apakah kamu yakin ingin menghapus soal ini? Tindakan ini tidak dapat dibatalkan."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteSoalDialog(false);
                setDeleteSoalTarget(null);
              }}
              disabled={isDeletingSoal}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteSoal}
              disabled={isDeletingSoal}
              className="bg-red-600 hover:bg-red-700 hover:scale-[1.02] transition-all duration-150"
            >
              {isDeletingSoal ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                  Menghapus...
                </span>
              ) : (
                <>
                  <Trash2 size={15} className="mr-2" />
                  Hapus
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
