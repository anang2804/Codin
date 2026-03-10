"use client";

import type React from "react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Plus, Edit, Trash2, GraduationCap } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        await updateKelas.mutateAsync({
          id: formData.id,
          name: formData.name,
        });
        toast.success("Kelas berhasil diupdate");
      } else {
        await createKelas.mutateAsync({
          name: formData.name,
        });
        toast.success("Kelas berhasil ditambahkan");
      }

      setFormData({
        id: "",
        name: "",
      });
      setShowForm(false);
      setIsEditing(false);
    } catch (error: any) {
      toast.error(
        error.message ||
          `Gagal ${isEditing ? "mengupdate" : "menambahkan"} kelas`,
      );
    }
  };

  const handleDeleteKelas = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kelas ini?")) return;

    try {
      await deleteKelas.mutateAsync(id);
      toast.success("Kelas berhasil dihapus");
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus kelas");
    }
  };

  const openEditForm = (kelasItem: any) => {
    setFormData({
      id: kelasItem.id,
      name: kelasItem.name,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const openAddForm = () => {
    setFormData({
      id: "",
      name: "",
    });
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
          <form onSubmit={handleSubmit} className="space-y-5 mt-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nama Kelas <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
              />
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
