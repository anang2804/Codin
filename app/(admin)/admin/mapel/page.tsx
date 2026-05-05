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

function formatMapelName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
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
    description: "",
    guru_id: "",
    semester: "",
    tahun_ajaran: "",
  });
  const [formErrors, setFormErrors] = useState({
    name: "",
    guru_id: "",
    semester: "",
    tahun_ajaran: "",
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

    const normalizedName = formatMapelName(formData.name);

    const nextErrors = {
      name: normalizedName ? "" : "Nama mata pelajaran wajib diisi.",
      guru_id: formData.guru_id ? "" : "Guru pengampu wajib dipilih.",
      semester: formData.semester ? "" : "Semester wajib dipilih.",
      tahun_ajaran: formData.tahun_ajaran ? "" : "Tahun ajaran wajib diisi.",
    };

    setFormErrors(nextErrors);

    if (
      nextErrors.name ||
      nextErrors.guru_id ||
      nextErrors.semester ||
      nextErrors.tahun_ajaran
    ) {
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
          name: normalizedName,
          description: formData.description,
          guru_id: formData.guru_id || undefined,
          semester: formData.semester || undefined,
          tahun_ajaran: formData.tahun_ajaran || undefined,
        });
        toast({
          title: "Berhasil",
          description: "Mata pelajaran berhasil diupdate",
        });
        setEditingId(null);
      } else {
        await createMapel.mutateAsync({
          name: normalizedName,
          description: formData.description,
          guru_id: formData.guru_id || undefined,
          semester: formData.semester || undefined,
          tahun_ajaran: formData.tahun_ajaran || undefined,
        });
        toast({
          title: "Berhasil",
          description: "Mata pelajaran berhasil ditambahkan",
        });
      }

      setFormData({
        name: "",
        description: "",
        guru_id: "",
        semester: "",
        tahun_ajaran: "",
      });
      setFormErrors({ name: "", guru_id: "", semester: "", tahun_ajaran: "" });
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
      description: mapelItem.description || "",
      guru_id: mapelItem.guru_id || "",
      semester: mapelItem.semester || "",
      tahun_ajaran: mapelItem.tahun_ajaran || "",
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
    setFormData({
      name: "",
      description: "",
      guru_id: "",
      semester: "",
      tahun_ajaran: "",
    });
    setFormErrors({ name: "", guru_id: "", semester: "", tahun_ajaran: "" });
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Kelola Mata Pelajaran
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Total{" "}
            <span className="font-semibold text-green-600">
              {mapel?.length || 0}
            </span>{" "}
            mata pelajaran terdaftar
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setFormData({
                name: "",
                description: "",
                guru_id: "",
                semester: "",
                tahun_ajaran: "",
              });
              setEditingId(null);
            }
          }}
          className="bg-green-600 hover:bg-green-700 gap-2 rounded-lg px-5 py-2.5 transition hover:scale-[1.02]"
        >
          <Plus size={16} />
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
                    });
                    if (formErrors.name) {
                      setFormErrors((prev) => ({ ...prev, name: "" }));
                    }
                  }}
                  onBlur={() =>
                    setFormData((prev) => ({
                      ...prev,
                      name: formatMapelName(prev.name),
                    }))
                  }
                  className="border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                )}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, semester: value });
                      if (formErrors.semester) {
                        setFormErrors({ ...formErrors, semester: "" });
                      }
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 transition ${
                      formErrors.semester
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-gray-200 focus:border-green-400 focus:ring-green-100"
                    }`}
                  >
                    <option value="">Pilih Semester</option>
                    <option value="ganjil">Ganjil</option>
                    <option value="genap">Genap</option>
                  </select>
                  {formErrors.semester && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.semester}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tahun Ajaran <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: 2023/2024"
                    value={formData.tahun_ajaran}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, tahun_ajaran: value });
                      if (formErrors.tahun_ajaran) {
                        setFormErrors({ ...formErrors, tahun_ajaran: "" });
                      }
                    }}
                    className={`transition ${
                      formErrors.tahun_ajaran
                        ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                    }`}
                  />
                  {formErrors.tahun_ajaran && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.tahun_ajaran}
                    </p>
                  )}
                </div>
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
        <div className="flex flex-col gap-3">
          <div className="hidden rounded-xl border border-gray-100 bg-gray-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 lg:grid lg:grid-cols-[1.8fr_1fr_1.2fr_1.2fr_auto] lg:gap-3 lg:items-center">
            <div>Nama Mata Pelajaran</div>
            <div>Semester</div>
            <div>Tahun Ajaran</div>
            <div>Guru Pengampu</div>
            <div className="text-right">Aksi</div>
          </div>
          <div className="space-y-3">
            {Array.isArray(mapel) &&
              mapel.map((m) => (
                <Card
                  key={m.id}
                  className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.8fr_1fr_1.2fr_1.2fr_auto] lg:gap-3 lg:items-center">
                    {/* Nama Mata Pelajaran */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <BookOpen size={18} />
                      </div>
                      <div className="min-w-0 flex-1 lg:flex-none">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 lg:hidden mb-1">
                          Nama Mata Pelajaran
                        </p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {formatMapelName(m.name)}
                        </p>
                      </div>
                    </div>

                    {/* Semester */}
                    <div className="hidden lg:block">
                      <p className="text-sm text-gray-700">
                        {m.semester
                          ? m.semester.charAt(0).toUpperCase() +
                            m.semester.slice(1)
                          : "-"}
                      </p>
                    </div>
                    <div className="lg:hidden flex gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 w-16">
                        Semester
                      </p>
                      <p className="text-sm text-gray-700 flex-1">
                        {m.semester
                          ? m.semester.charAt(0).toUpperCase() +
                            m.semester.slice(1)
                          : "-"}
                      </p>
                    </div>

                    {/* Tahun Ajaran */}
                    <div className="hidden lg:block">
                      <p className="text-sm text-gray-700">
                        {m.tahun_ajaran || "-"}
                      </p>
                    </div>
                    <div className="lg:hidden flex gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 w-24">
                        Tahun Ajaran
                      </p>
                      <p className="text-sm text-gray-700 flex-1">
                        {m.tahun_ajaran || "-"}
                      </p>
                    </div>

                    {/* Guru Pengampu */}
                    <div className="hidden lg:block">
                      <p className="text-sm text-gray-700 truncate">
                        {m.guru ? m.guru.full_name || m.guru.email : "-"}
                      </p>
                    </div>
                    <div className="lg:hidden flex gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 w-16">
                        Guru
                      </p>
                      <p className="text-sm text-gray-700 flex-1 truncate">
                        {m.guru ? m.guru.full_name || m.guru.email : "-"}
                      </p>
                    </div>

                    {/* Aksi */}
                    <div className="flex gap-1 justify-end">
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-400 text-white transition hover:bg-amber-500"
                        onClick={() => handleEditMapel(m)}
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-white transition hover:bg-red-600"
                        onClick={() => handleDeleteMapel(m.id)}
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
