"use client";

import type React from "react";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Edit, Trash2 } from "lucide-react";
import {
  useMapel,
  useCreateMapel,
  useUpdateMapel,
  useDeleteMapel,
} from "@/lib/hooks/use-mapel";
import { useGuru } from "@/lib/hooks/use-guru";
import { useToast } from "@/hooks/use-toast";

export default function AdminMapelPage() {
  const { data: mapel, isLoading: loading, error } = useMapel();
  const { data: guruList } = useGuru();
  const createMapel = useCreateMapel();
  const updateMapel = useUpdateMapel();
  const deleteMapel = useDeleteMapel();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    guru_id: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  if (error) {
    toast({
      title: "Error",
      description: "Gagal memuat mata pelajaran",
      variant: "destructive",
    });
  }

  const handleAddMapel = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateMapel.mutateAsync({
          id: editingId,
          name: formData.name,
          code: formData.code,
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
          code: formData.code,
          description: formData.description,
          guru_id: formData.guru_id || undefined,
        });
        toast({
          title: "Berhasil",
          description: "Mata pelajaran berhasil ditambahkan",
        });
      }

      setFormData({ name: "", code: "", description: "", guru_id: "" });
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

  const handleDeleteMapel = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus mata pelajaran ini?"))
      return;

    try {
      await deleteMapel.mutateAsync(id);
      toast({
        title: "Berhasil",
        description: "Mata pelajaran berhasil dihapus",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          "Gagal menghapus mata pelajaran. Pastikan tidak ada data terkait.",
        variant: "destructive",
      });
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormData({ name: "", code: "", description: "", guru_id: "" });
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
          Tambah Mapel
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
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kode Mapel <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: MTK"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                  className="border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
                />
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
                  onChange={(e) =>
                    setFormData({ ...formData, guru_id: e.target.value })
                  }
                  required
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
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-lg transition"
                >
                  {editingId ? "Update" : "Simpan"}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancelForm}
                  variant="outline"
                  className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                >
                  Batal
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

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
