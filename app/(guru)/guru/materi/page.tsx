"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Eye,
  Search,
  Image as ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { useMapel } from "@/lib/hooks/use-mapel";
import {
  useMateri,
  useCreateMateri,
  useUpdateMateri,
  useDeleteMateri,
  type Materi,
} from "@/lib/hooks/use-materi";

export default function GuruMateriPage() {
  // React Query hooks
  const { data: mapelList = [], isLoading: mapelLoading } = useMapel();
  const { data: materi = [], isLoading: materiLoading } = useMateri();
  const createMateri = useCreateMateri();
  const updateMateri = useUpdateMateri();
  const deleteMateri = useDeleteMateri();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMapel, setSelectedMapel] = useState<string>("all");
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mapel_id: "",
    kelas_id: "",
    thumbnail_url: "",
  });
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const supabase = createClient();
  const loading = mapelLoading || materiLoading;

  // Fetch kelas list
  useEffect(() => {
    const fetchKelas = async () => {
      const { data, error } = await supabase
        .from("kelas")
        .select("*")
        .order("name");
      if (data) {
        setKelasList(data);
      }
      if (error) {
        console.error("Error fetching kelas:", error);
      }
    };
    fetchKelas();
  }, []);

  // Memoize filtered data untuk menghindari infinite loop
  const filteredMateri = useMemo(() => {
    let filtered = [...materi];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by mapel
    if (selectedMapel !== "all") {
      filtered = filtered.filter((m) => m.mapel_id === selectedMapel);
    }

    return filtered;
  }, [materi, searchTerm, selectedMapel]);

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    try {
      setUploadingThumbnail(true);

      // Convert image to base64 as fallback (no storage bucket needed)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, thumbnail_url: base64String });
        toast.success("Thumbnail berhasil diunggah");
        setUploadingThumbnail(false);
      };
      reader.onerror = () => {
        toast.error("Gagal membaca file");
        setUploadingThumbnail(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      toast.error("Gagal mengunggah thumbnail");
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Judul materi wajib diisi");
      return;
    }

    if (!formData.mapel_id) {
      toast.error("Mata pelajaran wajib dipilih");
      return;
    }

    try {
      if (editingId) {
        await updateMateri.mutateAsync({
          id: editingId,
          mapel_id: formData.mapel_id,
          kelas_id: formData.kelas_id || undefined,
          title: formData.title,
          description: formData.description || undefined,
          thumbnail_url: formData.thumbnail_url || undefined,
        });
        toast.success("Materi berhasil diperbarui");
      } else {
        await createMateri.mutateAsync({
          mapel_id: formData.mapel_id,
          kelas_id: formData.kelas_id || undefined,
          title: formData.title,
          description: formData.description || undefined,
          thumbnail_url: formData.thumbnail_url || undefined,
        });
        toast.success("Materi berhasil ditambahkan");
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: "",
        description: "",
        mapel_id: "",
        kelas_id: "",
        thumbnail_url: "",
      });
    } catch (error: any) {
      console.error("Error saving materi:", error);
      toast.error(error.message || "Gagal menyimpan materi");
    }
  };

  const handleEdit = (m: Materi) => {
    setFormData({
      title: m.title,
      description: m.description || "",
      mapel_id: m.mapel_id || "",
      kelas_id: (m as any).kelas_id || "",
      thumbnail_url: m.thumbnail_url || "",
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Yakin ingin menghapus materi ini? Semua bab dan sub-bab juga akan terhapus."
      )
    ) {
      return;
    }

    try {
      await deleteMateri.mutateAsync(id);
      toast.success("Materi berhasil dihapus");
    } catch (error: any) {
      console.error("Error deleting materi:", error);
      toast.error(error.message || "Gagal menghapus materi");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      mapel_id: "",
      kelas_id: "",
      thumbnail_url: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="text-green-600" size={36} />
              Kelola Materi Pembelajaran
            </h1>
            <p className="text-gray-600 mt-2">
              Buat dan kelola materi pembelajaran dengan bab dan sub-bab
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus size={20} className="mr-2" />
            Tambah Materi Baru
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              placeholder="Cari materi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {Array.isArray(mapelList) &&
                mapelList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Materi List */}
      {filteredMateri.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300">
          <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchTerm || selectedMapel !== "all"
              ? "Tidak ada materi yang ditemukan"
              : "Belum ada materi"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedMapel !== "all"
              ? "Coba ubah filter pencarian"
              : "Mulai buat materi pembelajaran pertama Anda"}
          </p>
          {!searchTerm && selectedMapel === "all" && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus size={20} className="mr-2" />
              Tambah Materi
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMateri.map((m) => (
            <Card
              key={m.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-green-100 to-green-200">
                {m.thumbnail_url ? (
                  <img
                    src={m.thumbnail_url}
                    alt={m.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen size={64} className="text-green-600 opacity-50" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="mb-3">
                  {m.mapel && (
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full mb-2">
                      {m.mapel.name}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                    {m.title}
                  </h3>
                  {m.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {m.description}
                    </p>
                  )}
                </div>

                <div className="text-xs text-gray-400 mb-4">
                  Dibuat: {new Date(m.created_at).toLocaleDateString("id-ID")}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/guru/materi/${m.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <Eye size={16} className="mr-2" />
                      Kelola Bab
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(m)}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(m.id)}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={resetForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Materi" : "Tambah Materi Baru"}
            </DialogTitle>
            <DialogDescription>
              Lengkapi informasi dasar materi. Anda bisa menambahkan bab dan
              sub-bab setelah materi dibuat.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">
                Judul Materi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Contoh: Pengenalan Pemrograman Python"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="border-green-200"
              />
            </div>

            <div>
              <Label htmlFor="mapel">Mata Pelajaran</Label>
              <select
                id="mapel"
                value={formData.mapel_id}
                onChange={(e) =>
                  setFormData({ ...formData, mapel_id: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-green-200 bg-background px-3 py-2 text-sm"
              >
                <option value="">Pilih Mata Pelajaran (Opsional)</option>
                {Array.isArray(mapelList) &&
                  mapelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <Label htmlFor="kelas">Kelas</Label>
              <select
                id="kelas"
                value={formData.kelas_id}
                onChange={(e) =>
                  setFormData({ ...formData, kelas_id: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-green-200 bg-background px-3 py-2 text-sm"
              >
                <option value="">Semua Kelas (Opsional)</option>
                {Array.isArray(kelasList) &&
                  kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Pilih kelas tertentu jika materi hanya untuk kelas tersebut.
                Kosongkan jika untuk semua kelas.
              </p>
            </div>

            <div>
              <Label htmlFor="description">Deskripsi Singkat</Label>
              <Textarea
                id="description"
                placeholder="Ringkasan materi yang akan disampaikan"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="border-green-200"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="thumbnail">Thumbnail/Sampul</Label>
              <div className="mt-2">
                {formData.thumbnail_url ? (
                  <div className="relative">
                    <img
                      src={formData.thumbnail_url}
                      alt="Thumbnail"
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        setFormData({ ...formData, thumbnail_url: "" })
                      }
                      className="absolute top-2 right-2"
                    >
                      Hapus
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                    <ImageIcon
                      className="mx-auto text-gray-400 mb-2"
                      size={32}
                    />
                    <label
                      htmlFor="thumbnail-upload"
                      className="cursor-pointer"
                    >
                      <span className="text-sm text-blue-600 hover:underline">
                        {uploadingThumbnail
                          ? "Mengunggah..."
                          : "Klik untuk upload gambar"}
                      </span>
                      <input
                        id="thumbnail-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleThumbnailUpload}
                        disabled={uploadingThumbnail}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG maksimal 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={uploadingThumbnail}
              >
                {editingId ? "Perbarui" : "Simpan"} Materi
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={uploadingThumbnail}
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
