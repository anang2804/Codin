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
  Users,
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useKelas,
  useCreateKelas,
  useUpdateKelas,
  useDeleteKelas,
} from "@/lib/hooks/use-kelas";
import { useGuru } from "@/lib/hooks/use-guru";

export default function AdminKelasPage() {
  const { data: kelas, isLoading: loading } = useKelas();
  const { data: guruOptions } = useGuru();
  const createKelas = useCreateKelas();
  const updateKelas = useUpdateKelas();
  const deleteKelas = useDeleteKelas();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [nameError, setNameError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedName = formData.name.trim();
    if (!normalizedName) {
      setNameError("Nama kelas wajib diisi.");
      return;
    }

    setNameError("");

    try {
      if (isEditing) {
        await updateKelas.mutateAsync({
          id: formData.id,
          name: normalizedName,
        });
        toast.success("Kelas berhasil diupdate");
      } else {
        await createKelas.mutateAsync({
          name: normalizedName,
        });
        toast.success("Kelas berhasil ditambahkan");
      }

      setFormData({
        id: "",
        name: "",
      });
      setNameError("");
      setShowForm(false);
      setIsEditing(false);
    } catch (error: any) {
      toast.error(
        error.message ||
          `Gagal ${isEditing ? "mengupdate" : "menambahkan"} kelas`,
      );
    }
  };

  const handleDeleteKelas = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteDialog(true);
  };

  const confirmDeleteKelas = async () => {
    if (!deleteTargetId) return;

    setIsDeleting(true);
    try {
      await deleteKelas.mutateAsync(deleteTargetId);
      toast.success("Kelas berhasil dihapus");
      setShowDeleteDialog(false);
      setDeleteTargetId(null);
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus kelas");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditForm = (kelasItem: any) => {
    setFormData({
      id: kelasItem.id,
      name: kelasItem.name,
    });
    setNameError("");
    setIsEditing(true);
    setShowForm(true);
  };

  const openAddForm = () => {
    setFormData({
      id: "",
      name: "",
    });
    setNameError("");
    setIsEditing(false);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Kelola Kelas</h1>
        <Button
          onClick={openAddForm}
          className="bg-green-600 hover:bg-green-700 gap-2"
        >
          <Plus size={20} />
          Tambah Kelas
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md rounded-xl border border-gray-100 shadow-md p-8">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {isEditing ? "Edit Kelas" : "Tambah Kelas"}
            </DialogTitle>
            <p className="text-sm text-gray-500">
              {isEditing
                ? "Perbarui nama kelas yang sudah ada."
                : "Isi nama kelas yang ingin ditambahkan."}
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-1" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nama Kelas <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, name: value });
                  if (nameError && value.trim()) {
                    setNameError("");
                  }
                }}
                className={`transition ${
                  nameError
                    ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                }`}
              />
              {nameError && (
                <p className="mt-1 text-xs text-red-600">{nameError}</p>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 px-6 rounded-lg transition"
              >
                {isEditing ? "Update" : "Simpan"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setIsEditing(false);
                  setNameError("");
                }}
                variant="outline"
                className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition"
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
              Hapus Kelas
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Apakah Anda yakin ingin menghapus kelas ini? Tindakan ini tidak
              dapat dibatalkan.
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
              onClick={confirmDeleteKelas}
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
          <p className="text-gray-600">Memuat kelas...</p>
        </div>
      ) : !kelas || kelas.length === 0 ? (
        <Card className="p-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
          <GraduationCap size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            Belum ada kelas. Tambahkan kelas baru untuk memulai.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {kelas.map((k) => (
            <Card
              key={k.id}
              className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {k.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Dibuat:{" "}
                      {new Date(k.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150"
                    onClick={() => openEditForm(k)}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                    onClick={() => handleDeleteKelas(k.id)}
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
