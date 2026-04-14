"use client";

import type React from "react";

import { useEffect, useState } from "react";
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
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Layers,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { toast } from "sonner";

type FormErrors = {
  title?: string;
  mapel_id?: string;
  kelas_id?: string;
  waktu_mulai?: string;
  waktu_selesai?: string;
  duration?: string;
};

export default function GuruAsesmenPage() {
  const [asesmen, setAsesmen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [kelas, setKelas] = useState<any[]>([]);
  const [mapel, setMapel] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: Number.NaN,
    waktu_mulai: "",
    waktu_selesai: "",
    kelas_id: "",
    mapel_id: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const validateForm = (data: typeof formData): FormErrors => {
    const errors: FormErrors = {};

    if (!data.title.trim()) {
      errors.title = "Judul kuis wajib diisi";
    }

    if (!data.mapel_id) {
      errors.mapel_id = "Mata pelajaran wajib dipilih";
    }

    if (!data.kelas_id) {
      errors.kelas_id = "Kelas wajib dipilih";
    }

    if (!data.waktu_mulai) {
      errors.waktu_mulai = "Tanggal & waktu mulai wajib diisi";
    }

    if (!data.waktu_selesai) {
      errors.waktu_selesai = "Tanggal & waktu selesai wajib diisi";
    }

    if (data.waktu_mulai && data.waktu_selesai) {
      const startAt = new Date(data.waktu_mulai).getTime();
      const endAt = new Date(data.waktu_selesai).getTime();
      if (Number.isNaN(startAt) || Number.isNaN(endAt) || endAt <= startAt) {
        errors.waktu_selesai = "Waktu selesai harus setelah waktu mulai";
      }
    }

    if (Number.isNaN(data.duration) || data.duration <= 0) {
      errors.duration = "Waktu pengerjaan harus lebih dari 0";
    }

    return errors;
  };

  const formErrors = validateForm(formData);

  const formatScheduleDateTime = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

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
            }),
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
    setSubmitAttempted(true);

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsSaving(false);
      return;
    }

    try {
      const { data: newAsesmen, error } = await supabase
        .from("asesmen")
        .insert({
          title: formData.title,
          description: formData.description,
          duration: formData.duration,
          kelas_id: formData.kelas_id || null,
          mapel_id: formData.mapel_id || null,
          created_by: user.id,
          waktu_mulai: new Date(formData.waktu_mulai).toISOString(),
          waktu_selesai: new Date(formData.waktu_selesai).toISOString(),
        })
        .select();

      if (error) throw error;

      setAsesmen([newAsesmen[0], ...asesmen]);
      setFormData({
        title: "",
        description: "",
        duration: Number.NaN,
        kelas_id: "",
        mapel_id: "",
        waktu_mulai: "",
        waktu_selesai: "",
      });
      setTouchedFields({});
      setSubmitAttempted(false);
      setShowForm(false);
      toast.success("Kuis berhasil dibuat");
    } catch (error) {
      console.error("Error adding asesmen:", error);
      toast.error("Gagal membuat kuis");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAsesmen = (asesmenId: string, title: string) => {
    setDeleteTarget({ id: asesmenId, title });
    setShowDeleteDialog(true);
  };

  const confirmDeleteAsesmen = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    const supabase = createClient();
    try {
      // First delete all soals
      const { error: soalError } = await supabase
        .from("soal")
        .delete()
        .eq("asesmen_id", deleteTarget.id);

      if (soalError) {
        console.error("Error deleting soals:", soalError);
        throw soalError;
      }

      // Then delete asesmen
      const { error: asesmenError } = await supabase
        .from("asesmen")
        .delete()
        .eq("id", deleteTarget.id);

      if (asesmenError) {
        console.error("Error deleting asesmen:", asesmenError);
        throw asesmenError;
      }

      // Update state only after successful delete
      setAsesmen(asesmen.filter((a) => a.id !== deleteTarget.id));
      toast.success("Kuis berhasil dihapus");
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    } catch (error: any) {
      console.error("Error deleting asesmen:", error);
      toast.error(`Gagal menghapus kuis: ${error.message || "Unknown error"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Kuis</h1>
          <p className="mt-1 text-sm text-gray-500">
            Buat dan kelola kuis untuk mengevaluasi pemahaman siswa.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 gap-2 shrink-0"
        >
          <Plus size={20} />
          Tambah Kuis
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 rounded-xl border border-gray-100 p-6 shadow-sm">
          <form onSubmit={handleAddAsesmen} className="space-y-7">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Informasi Kuis
                </h3>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Judul Kuis <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Masukkan judul kuis"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  onBlur={() =>
                    setTouchedFields((prev) => ({ ...prev, title: true }))
                  }
                  className="border-gray-200 rounded-lg focus-visible:border-green-500 focus-visible:ring-green-500/30 transition-all duration-150"
                />
                {(submitAttempted || touchedFields.title) &&
                  formErrors.title && (
                    <p className="text-xs text-red-500">{formErrors.title}</p>
                  )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Deskripsi
                </label>
                <Input
                  type="text"
                  placeholder="Masukkan deskripsi kuis"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="border-gray-200 rounded-lg focus-visible:border-green-500 focus-visible:ring-green-500/30 transition-all duration-150"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Pengaturan Kuis
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Mata Pelajaran <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.mapel_id}
                    onChange={(e) =>
                      setFormData({ ...formData, mapel_id: e.target.value })
                    }
                    onBlur={() =>
                      setTouchedFields((prev) => ({ ...prev, mapel_id: true }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all duration-150"
                  >
                    <option value="">Pilih Mata Pelajaran</option>
                    {mapel.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  {(submitAttempted || touchedFields.mapel_id) &&
                    formErrors.mapel_id && (
                      <p className="text-xs text-red-500">
                        {formErrors.mapel_id}
                      </p>
                    )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.kelas_id}
                    onChange={(e) =>
                      setFormData({ ...formData, kelas_id: e.target.value })
                    }
                    onBlur={() =>
                      setTouchedFields((prev) => ({ ...prev, kelas_id: true }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all duration-150"
                  >
                    <option value="">Pilih Kelas</option>
                    {kelas.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                      </option>
                    ))}
                  </select>
                  {(submitAttempted || touchedFields.kelas_id) &&
                    formErrors.kelas_id && (
                      <p className="text-xs text-red-500">
                        {formErrors.kelas_id}
                      </p>
                    )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Waktu Pengerjaan (menit){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="60"
                    value={
                      Number.isNaN(formData.duration) ? "" : formData.duration
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration:
                          e.target.value === ""
                            ? Number.NaN
                            : Number.parseInt(e.target.value),
                      })
                    }
                    onBlur={() =>
                      setTouchedFields((prev) => ({ ...prev, duration: true }))
                    }
                    className="border-gray-200 rounded-lg focus-visible:border-green-500 focus-visible:ring-green-500/30 transition-all duration-150"
                  />
                  {(submitAttempted || touchedFields.duration) &&
                    formErrors.duration && (
                      <p className="text-xs text-red-500">
                        {formErrors.duration}
                      </p>
                    )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Mulai Kuis <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.waktu_mulai}
                    onChange={(e) =>
                      setFormData({ ...formData, waktu_mulai: e.target.value })
                    }
                    onBlur={() =>
                      setTouchedFields((prev) => ({
                        ...prev,
                        waktu_mulai: true,
                      }))
                    }
                    className="border-gray-200 rounded-lg focus-visible:border-green-500 focus-visible:ring-green-500/30 transition-all duration-150"
                  />
                  {(submitAttempted || touchedFields.waktu_mulai) &&
                    formErrors.waktu_mulai && (
                      <p className="text-xs text-red-500">
                        {formErrors.waktu_mulai}
                      </p>
                    )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Selesai Kuis <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.waktu_selesai}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        waktu_selesai: e.target.value,
                      })
                    }
                    onBlur={() =>
                      setTouchedFields((prev) => ({
                        ...prev,
                        waktu_selesai: true,
                      }))
                    }
                    className="border-gray-200 rounded-lg focus-visible:border-green-500 focus-visible:ring-green-500/30 transition-all duration-150"
                  />
                  {(submitAttempted || touchedFields.waktu_selesai) &&
                    formErrors.waktu_selesai && (
                      <p className="text-xs text-red-500">
                        {formErrors.waktu_selesai}
                      </p>
                    )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 hover:-translate-y-px transition-all duration-150 disabled:opacity-70 disabled:transform-none"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={15} className="mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Kuis"
                )}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setTouchedFields({});
                  setSubmitAttempted(false);
                }}
                variant="outline"
                disabled={isSaving}
                className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:-translate-y-px transition-all duration-150"
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
          <p className="text-gray-600">Memuat kuis...</p>
        </div>
      ) : asesmen.length === 0 ? (
        <Card className="p-12 text-center border border-gray-100 shadow-sm rounded-xl">
          <ClipboardList size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-base font-medium text-gray-700 mb-4">
            Belum ada kuis dibuat
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700 hover:scale-[1.03] transition-all duration-150"
          >
            Buat Kuis Pertama
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5">
          {asesmen.map((a) => (
            <Card
              key={a.id}
              className="p-6 border border-gray-100 shadow-sm rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {a.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Soal Pilihan Ganda
                  </p>

                  <div className="mt-3 grid gap-1.5 text-sm text-gray-500">
                    <p className="flex items-center gap-2">
                      <BookOpen size={14} className="text-gray-400" />
                      <span>Mata Pelajaran: {a.mapel?.name || "-"}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Layers size={14} className="text-gray-400" />
                      <span>Kelas: {a.kelas?.name || "-"}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <ClipboardList size={14} className="text-gray-400" />
                      <span>Jumlah soal: {a.soal_count || 0}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <span>
                        Jadwal: {formatScheduleDateTime(a.waktu_mulai)} -{" "}
                        {formatScheduleDateTime(a.waktu_selesai)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/guru/asesmen/${a.id}`}>
                    <Button className="h-9 bg-green-600 hover:bg-green-700 hover:scale-[1.03] transition-all duration-150">
                      <Eye size={15} className="mr-2" />
                      Kelola Soal
                    </Button>
                  </Link>

                  <Link href={`/guru/asesmen/${a.id}`}>
                    <Button
                      variant="outline"
                      className="h-9 w-9 p-0 border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:scale-[1.03] transition-all duration-150"
                    >
                      <Edit size={15} />
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    onClick={() => handleDeleteAsesmen(a.id, a.title)}
                    className="h-9 w-9 p-0 border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:scale-[1.03] transition-all duration-150 bg-transparent"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open && !isDeleting) {
            setDeleteTarget(null);
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
              Hapus Kuis
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              {deleteTarget?.title
                ? `Apakah kamu yakin ingin menghapus kuis "${deleteTarget.title}"? Semua soal di dalamnya juga akan terhapus dan tindakan ini tidak dapat dibatalkan.`
                : "Apakah kamu yakin ingin menghapus kuis ini? Semua soal di dalamnya juga akan terhapus dan tindakan ini tidak dapat dibatalkan."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteTarget(null);
              }}
              disabled={isDeleting}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteAsesmen}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 hover:scale-[1.02] transition-all duration-150"
            >
              {isDeleting ? (
                <Loader2 size={15} className="mr-2 animate-spin" />
              ) : (
                <Trash2 size={15} className="mr-2" />
              )}
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
