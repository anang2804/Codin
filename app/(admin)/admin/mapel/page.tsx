"use client";

import type React from "react";

import { useState } from "react";
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
  BookOpen,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  useMapel,
  useCreateMapel,
  useUpdateMapel,
  useDeleteMapel,
} from "@/lib/hooks/use-mapel";
import { useGuru } from "@/lib/hooks/use-guru";
import { useToast } from "@/hooks/use-toast";

function generateMapelCode(name: string) {
  const normalized = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .trim();

  if (!normalized) {
    return "MAP";
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  const baseCode =
    words.length > 1
      ? words.map((word) => word[0]).join("")
      : words[0].slice(0, 3);

  return baseCode.replace(/[^A-Z0-9]/g, "") || "MAP";
}

export default function AdminMapelPage() {
  const { data: mapel, isLoading: loading, error } = useMapel();
  const { data: guruList } = useGuru();
  const createMapel = useCreateMapel();
  const updateMapel = useUpdateMapel();
  const deleteMapel = useDeleteMapel();
  const { toast } = useToast();
  const isSavingMapel = createMapel.isPending || updateMapel.isPending;

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    guru_id: "",
  });
  const [formErrors, setFormErrors] = useState({
    name: "",
    guru_id: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (error) {
    toast({
      title: "Error",
      description: "Gagal memuat mata pelajaran",
      variant: "destructive",
    });
  }

  const handleAddMapel = async (e: React.FormEvent) => {
    e.preventDefault();

    const codeValue = editingId
      ? formData.code.trim().toUpperCase()
      : generateMapelCode(formData.name);

    const nextErrors = {
      name: formData.name.trim() ? "" : "Nama mata pelajaran wajib diisi.",
      guru_id: formData.guru_id ? "" : "Guru pengampu wajib dipilih.",
    };

    setFormErrors(nextErrors);

    if (nextErrors.name || nextErrors.guru_id) {
      toast({
        title: "Periksa kembali form",
        description: "Lengkapi field yang wajib diisi sebelum menyimpan.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        await updateMapel.mutateAsync({
          id: editingId,
          name: formData.name,
          code: codeValue,
          description: formData.description,
          guru_id: formData.guru_id || undefined,
        });
        toast({
          title: "Berhasil",
          description: "Mata pelajaran berhasil diupdate",
        });
        setEditingId(null);
      } else {
        await createMapel.mutateAsync({
          name: formData.name,
          code: codeValue,
          description: formData.description,
          guru_id: formData.guru_id || undefined,
        });
        toast({
          title: "Berhasil",
          description: "Mata pelajaran berhasil ditambahkan",
        });
      }

      setFormData({ name: "", code: "", description: "", guru_id: "" });
      setFormErrors({ name: "", guru_id: "" });
      setShowForm(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Gagal ${
          editingId ? "mengupdate" : "menambahkan"
        } mata pelajaran`,
        variant: "destructive",
      });
    }
  };

  const handleEditMapel = (mapelItem: any) => {
    setFormData({
      name: mapelItem.name,
      code: mapelItem.code,
      description: mapelItem.description || "",
      guru_id: mapelItem.guru_id || "",
    });
    setEditingId(mapelItem.id);
    setShowForm(true);
  };

  const handleDeleteMapel = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteDialog(true);
  };

  const confirmDeleteMapel = async () => {
    if (!deleteTargetId) return;

    setIsDeleting(true);
    try {
      await deleteMapel.mutateAsync(deleteTargetId);
      toast({
        title: "Berhasil",
        description: "Mata pelajaran berhasil dihapus",
      });
      setShowDeleteDialog(false);
      setDeleteTargetId(null);
    } catch (error) {
      toast({
        title: "Error",
        description:
          "Gagal menghapus mata pelajaran. Pastikan tidak ada data terkait.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormData({ name: "", code: "", description: "", guru_id: "" });
    setFormErrors({ name: "", guru_id: "" });
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Kelola Mata Pelajaran
        </h1>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setFormData({ name: "", code: "", description: "", guru_id: "" });
              setEditingId(null);
            }
          }}
          className="bg-green-600 hover:bg-green-700 gap-2"
        >
          <Plus size={20} />
          Tambah Mata Pelajaran
        </Button>
      </div>

      {showForm && (
        <div className="max-w-3xl mb-8 animate-in fade-in slide-in-from-top-2 duration-200">
          <Card className="p-8 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId
                  ? "Edit Mata Pelajaran"
                  : "Tambah Mata Pelajaran Baru"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingId
                  ? "Perbarui informasi mata pelajaran yang sudah ada."
                  : "Isi detail mata pelajaran yang ingin ditambahkan."}
              </p>
            </div>
            <form onSubmit={handleAddMapel} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nama Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Matematika"
                  value={formData.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      name: value,
                      code: editingId
                        ? formData.code
                        : generateMapelCode(value),
                    });
                    if (formErrors.name) {
                      setFormErrors((prev) => ({ ...prev, name: "" }));
                    }
                  }}
                  className="border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kode Mapel Otomatis
                </label>
                <p className="mb-1 text-xs text-gray-400">
                  Kode dibuat otomatis dari nama mata pelajaran.
                </p>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                  {editingId ? formData.code : generateMapelCode(formData.name)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Deskripsi
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    (opsional)
                  </span>
                </label>
                <Input
                  type="text"
                  placeholder="Deskripsi mata pelajaran"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Guru Pengampu <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.guru_id}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, guru_id: value });
                    if (formErrors.guru_id) {
                      setFormErrors({ ...formErrors, guru_id: "" });
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
                >
                  <option value="" disabled>
                    Pilih Guru
                  </option>
                  {guruList?.map((guru) => (
                    <option key={guru.id} value={guru.id}>
                      {guru.full_name || guru.email}
                    </option>
                  ))}
                </select>
                {formErrors.guru_id && (
                  <p className="mt-1 text-xs text-red-500">
                    {formErrors.guru_id}
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSavingMapel}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-lg transition"
                >
                  {isSavingMapel ? (
                    <>
                      <Loader2 size={15} className="mr-2 animate-spin" />
                      {editingId ? "Menyimpan..." : "Menyimpan..."}
                    </>
                  ) : (
                    <>{editingId ? "Update" : "Simpan"}</>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancelForm}
                  variant="outline"
                  disabled={isSavingMapel}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                >
                  Batal
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open && !isDeleting) {
            setDeleteTargetId(null);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-xl border border-gray-100 p-7 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle size={16} />
              </span>
              Hapus Mata Pelajaran
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Apakah Anda yakin ingin menghapus mata pelajaran ini? Tindakan ini
              tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteTargetId(null);
              }}
              disabled={isDeleting}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteMapel}
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

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat mata pelajaran...</p>
        </div>
      ) : !mapel || mapel.length === 0 ? (
        <Card className="p-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">
            Belum ada mata pelajaran. Tambahkan mata pelajaran baru untuk
            memulai.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {Array.isArray(mapel) &&
            mapel.map((m) => (
              <Card
                key={m.id}
                className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900">
                          {m.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-md border border-green-100">
                          {m.code}
                        </span>
                      </div>
                      {m.description && (
                        <p className="text-gray-500 text-sm mt-1">
                          {m.description}
                        </p>
                      )}
                      {m.guru && (
                        <p className="text-gray-400 text-xs mt-1">
                          <span className="font-medium text-gray-500">
                            Guru:
                          </span>{" "}
                          {m.guru.full_name || m.guru.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <button
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150"
                      onClick={() => handleEditMapel(m)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                      onClick={() => handleDeleteMapel(m.id)}
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
