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
  AlertTriangle,
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
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
          m.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by mapel
    if (selectedMapel !== "all") {
      filtered = filtered.filter((m) => m.mapel_id === selectedMapel);
    }

    return filtered;
  }, [materi, searchTerm, selectedMapel]);

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
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

    if (!formData.kelas_id) {
      toast.error("Kelas wajib dipilih");
      return;
    }

    try {
      setIsSaving(true);
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
    } finally {
      setIsSaving(false);
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

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setIsDeleting(true);
      await deleteMateri.mutateAsync(deleteTargetId);
      toast.success("Materi berhasil dihapus");
      setDeleteTargetId(null);
    } catch (error: any) {
      console.error("Error deleting materi:", error);
      toast.error(error.message || "Gagal menghapus materi");
    } finally {
      setIsDeleting(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BookOpen className="text-green-600" size={22} />
              Kelola Materi
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Buat dan kelola materi pembelajaran dengan bab dan sub-bab
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700 hover:scale-[1.02] transition-all duration-200"
          >
            <Plus size={16} className="mr-2" />
            Tambah Materi
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={16}
            />
            <Input
              placeholder="Cari materi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-gray-200 dark:border-gray-700 focus:border-green-400 dark:focus:border-green-600"
            />
          </div>
          <select
            value={selectedMapel}
            onChange={(e) => setSelectedMapel(e.target.value)}
            className="h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-input px-3 py-2 text-sm text-gray-700 dark:text-foreground focus:outline-none focus:border-green-400 dark:focus:border-green-600 min-w-[200px]"
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

      {/* Materi List */}
      {filteredMateri.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 bg-card">
          <BookOpen
            size={64}
            className="mx-auto text-gray-400 dark:text-gray-600 mb-4"
          />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {searchTerm || selectedMapel !== "all"
              ? "Tidak ada materi yang ditemukan"
              : "Belum ada materi"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
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
              className="overflow-hidden border border-gray-100 dark:border-gray-800 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              {/* Thumbnail */}
              <div className="relative h-40 bg-gradient-to-br from-green-50 dark:from-green-900/20 to-green-100 dark:to-green-900/10 overflow-hidden">
                {m.thumbnail_url ? (
                  <img
                    src={m.thumbnail_url}
                    alt={m.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen
                      size={48}
                      className="text-green-500 dark:text-green-600 opacity-40"
                    />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="mb-3">
                  {m.mapel && (
                    <span className="inline-block px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-900/50 rounded-full mb-2">
                      {m.mapel.name}
                    </span>
                  )}
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {m.title}
                  </h3>
                  {m.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {m.description}
                    </p>
                  )}
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  {new Date(m.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/guru/materi/${m.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:scale-[1.02] transition-all duration-200"
                    >
                      <Eye size={14} className="mr-1.5" />
                      Kelola Bab
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(m)}
                    className="border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-secondary hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900/50 hover:scale-[1.02] transition-all duration-200"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(m.id)}
                    className="border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:scale-[1.02] transition-all duration-200"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={resetForm}>
        <DialogContent className="max-w-2xl animate-in fade-in-0 zoom-in-95 duration-200 dark:bg-card">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {editingId ? "Edit Materi" : "Tambah Materi Baru"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400 dark:text-gray-500">
              Lengkapi informasi dasar materi. Bab dan sub-bab dapat ditambahkan
              setelah materi dibuat.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-1">
            {/* Judul */}
            <div className="space-y-1.5">
              <Label
                htmlFor="title"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Judul Materi <span className="text-red-400">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Contoh: Pengenalan Pemrograman Python"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="border-gray-200 dark:border-gray-700 focus:border-green-400 dark:focus:border-green-600 focus:ring-green-400 dark:focus:ring-green-900/40 transition-colors duration-200"
              />
            </div>

            {/* Mapel & Kelas - side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="mapel"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Mata Pelajaran <span className="text-red-400">*</span>
                </Label>
                <select
                  id="mapel"
                  value={formData.mapel_id}
                  onChange={(e) =>
                    setFormData({ ...formData, mapel_id: e.target.value })
                  }
                  className="h-10 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-input px-3 py-2 text-sm text-gray-700 dark:text-foreground focus:outline-none focus:border-green-400 dark:focus:border-green-600 transition-colors duration-200"
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {Array.isArray(mapelList) &&
                    mapelList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="kelas"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Kelas <span className="text-red-400">*</span>
                </Label>
                <select
                  id="kelas"
                  value={formData.kelas_id}
                  onChange={(e) =>
                    setFormData({ ...formData, kelas_id: e.target.value })
                  }
                  className="h-10 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-input px-3 py-2 text-sm text-gray-700 dark:text-foreground focus:outline-none focus:border-green-400 dark:focus:border-green-600 transition-colors duration-200"
                >
                  <option value="">Pilih Kelas</option>
                  {Array.isArray(kelasList) &&
                    kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Deskripsi Singkat
              </Label>
              <Textarea
                id="description"
                placeholder="Ringkasan singkat tentang materi ini..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="border-gray-200 dark:border-gray-700 focus:border-green-400 dark:focus:border-green-600 focus:ring-green-400 dark:focus:ring-green-900/40 transition-colors duration-200 resize-none"
                rows={3}
              />
            </div>

            {/* Thumbnail */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Thumbnail / Sampul
              </Label>
              <div className="mt-1">
                {formData.thumbnail_url ? (
                  <div className="relative rounded-lg overflow-hidden animate-in fade-in-0 duration-300">
                    <img
                      src={formData.thumbnail_url}
                      alt="Thumbnail"
                      className="w-full h-44 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, thumbnail_url: "" })
                      }
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white text-xs px-2.5 py-1 rounded-full transition-colors duration-150"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="thumbnail-upload"
                    className="group flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-all duration-200"
                  >
                    <ImageIcon
                      className="text-gray-300 dark:text-gray-600 group-hover:text-green-500 dark:group-hover:text-green-400 mb-2 transition-colors duration-200"
                      size={28}
                    />
                    <span className="text-sm text-gray-400 dark:text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
                      {uploadingThumbnail
                        ? "Mengunggah..."
                        : "Klik untuk upload gambar"}
                    </span>
                    <span className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                      PNG, JPG maks. 5MB
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
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 hover:scale-[1.02] transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                disabled={uploadingThumbnail || isSaving}
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Menyimpan...
                  </>
                ) : editingId ? (
                  "Perbarui Materi"
                ) : (
                  "Simpan Materi"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={uploadingThumbnail}
                className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:scale-[1.02] transition-all duration-150"
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTargetId}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTargetId(null);
        }}
      >
        <DialogContent className="max-w-sm animate-in fade-in-0 zoom-in-95 duration-200 p-7">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle size={26} className="text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Hapus Materi
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Apakah kamu yakin ingin menghapus materi ini? Semua bab dan
              sub-bab juga akan terhapus. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50"
              onClick={() => setDeleteTargetId(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 transition-all duration-150 disabled:opacity-70"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <svg
                    className="animate-spin mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 size={15} className="mr-1.5" />
                  Hapus Materi
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
