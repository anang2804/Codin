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
import { Users, Plus, Edit, Trash2 } from "lucide-react";
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
          `Gagal ${isEditing ? "mengupdate" : "menambahkan"} kelas`
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
        <h1 className="text-3xl font-bold text-gray-900">Kelola Kelas</h1>
        <Button
          onClick={openAddForm}
          className="bg-green-600 hover:bg-green-700 gap-2"
        >
          <Plus size={20} />
          Tambah Kelas
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Kelas" : "Tambah Kelas"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Kelas
              </label>
              <Input
                type="text"
                placeholder="Contoh: X-A, XI IPA 1, XII IPS 2"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="border-green-200"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {isEditing ? "Update" : "Simpan"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setIsEditing(false);
                }}
                variant="outline"
                className="border-green-200"
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
        <Card className="p-12 text-center border-green-100">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">
            Belum ada kelas. Tambahkan kelas baru untuk memulai.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {kelas.map((k) => (
            <Card
              key={k.id}
              className="p-6 border-green-100 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {k.name}
                  </h3>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>
                      Dibuat:{" "}
                      {new Date(k.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditForm(k)}
                    className="border-yellow-400 text-yellow-600 hover:bg-yellow-50 bg-transparent"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteKelas(k.id)}
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
