"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeft,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  FileText,
  Video,
  Link as LinkIcon,
  File,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useMateriDetail } from "@/lib/hooks/use-materi";
import {
  useBabs,
  useCreateBab,
  useUpdateBab,
  useDeleteBab,
  type Bab,
} from "@/lib/hooks/use-bab";
import {
  useCreateSubBab,
  useUpdateSubBab,
  useDeleteSubBab,
} from "@/lib/hooks/use-sub-bab";

interface SubBab {
  id: string;
  bab_id: string;
  title: string;
  content?: string;
  content_type: "text" | "video" | "file" | "link";
  content_url?: string;
  duration?: number;
  order_index: number;
}

export default function GuruMateriDetailPage() {
  const params = useParams();
  const router = useRouter();
  const materiId = params.id as string;

  const { data: materi, isLoading: loading } = useMateriDetail(materiId);
  const { data: babs = [], refetch: refetchBabs } = useBabs(materiId);
  const createBab = useCreateBab();
  const updateBab = useUpdateBab();
  const deleteBab = useDeleteBab();

  const [expandedBabs, setExpandedBabs] = useState<Set<string>>(new Set());
  const [selectedBabId, setSelectedBabId] = useState<string | null>(null);

  // Dialog states
  const [showBabDialog, setShowBabDialog] = useState(false);
  const [showSubBabDialog, setShowSubBabDialog] = useState(false);
  const [editingBabId, setEditingBabId] = useState<string | null>(null);
  const [editingSubBabId, setEditingSubBabId] = useState<string | null>(null);

  // Form data
  const [babForm, setBabForm] = useState({
    title: "",
    description: "",
  });

  const [subBabForm, setSubBabForm] = useState({
    title: "",
    content: "",
    content_type: "text" as "text" | "video" | "file" | "link",
    content_url: "",
    duration: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Get sub-babs for each expanded bab
  const createSubBab = useCreateSubBab();
  const updateSubBab = useUpdateSubBab();
  const deleteSubBab = useDeleteSubBab();

  const toggleBab = (babId: string) => {
    const newExpanded = new Set(expandedBabs);
    if (newExpanded.has(babId)) {
      newExpanded.delete(babId);
      if (selectedBabId === babId) setSelectedBabId(null);
    } else {
      newExpanded.add(babId);
      setSelectedBabId(babId);
    }
    setExpandedBabs(newExpanded);
  };

  // BAB CRUD Operations
  const openBabDialog = (bab?: Bab) => {
    if (bab) {
      setBabForm({
        title: bab.title,
        description: bab.description || "",
      });
      setEditingBabId(bab.id);
    } else {
      setBabForm({ title: "", description: "" });
      setEditingBabId(null);
    }
    setShowBabDialog(true);
  };

  const handleSaveBab = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!babForm.title.trim()) {
      toast.error("Judul bab wajib diisi");
      return;
    }

    try {
      if (editingBabId) {
        await updateBab.mutateAsync({
          id: editingBabId,
          materi_id: materiId,
          title: babForm.title,
          description: babForm.description,
        });
        toast.success("Bab berhasil diperbarui");
      } else {
        await createBab.mutateAsync({
          materi_id: materiId,
          title: babForm.title,
          description: babForm.description,
        });
        toast.success("Bab berhasil ditambahkan");
      }

      setShowBabDialog(false);
      setBabForm({ title: "", description: "" });
      setEditingBabId(null);
    } catch (error: any) {
      console.error("Error saving bab:", error);
      toast.error(error.message || "Gagal menyimpan bab");
    }
  };

  const handleDeleteBab = async (babId: string) => {
    if (
      !confirm(
        "Yakin ingin menghapus bab ini? Semua sub-bab di dalamnya juga akan terhapus."
      )
    ) {
      return;
    }

    try {
      await deleteBab.mutateAsync({
        id: babId,
        materi_id: materiId,
      });
      toast.success("Bab berhasil dihapus");
    } catch (error: any) {
      console.error("Error deleting bab:", error);
      toast.error(error.message || "Gagal menghapus bab");
    }
  };

  // SUB BAB CRUD Operations
  const openSubBabDialog = (babId: string, subBab?: SubBab) => {
    setSelectedBabId(babId);
    setSelectedFile(null);

    if (subBab) {
      setSubBabForm({
        title: subBab.title,
        content: subBab.content || "",
        content_type: subBab.content_type,
        content_url: subBab.content_url || "",
        duration: subBab.duration || 0,
      });
      setEditingSubBabId(subBab.id);
    } else {
      setSubBabForm({
        title: "",
        content: "",
        content_type: "text",
        content_url: "",
        duration: 0,
      });
      setEditingSubBabId(null);
    }
    setShowSubBabDialog(true);
  };

  const handleSaveSubBab = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subBabForm.title.trim()) {
      toast.error("Judul sub-bab wajib diisi");
      return;
    }

    if (!selectedBabId) return;

    // Validasi untuk tipe file: harus ada file yang dipilih atau sudah ada content_url
    if (
      subBabForm.content_type === "file" &&
      !selectedFile &&
      !subBabForm.content_url
    ) {
      toast.error("Harap pilih file untuk di-upload");
      return;
    }

    try {
      let fileUrl = subBabForm.content_url;

      // Upload file jika ada file baru yang dipilih
      if (selectedFile && subBabForm.content_type === "file") {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("type", "materi");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Gagal upload file");
        }

        const uploadData = await uploadResponse.json();
        fileUrl = uploadData.url;
        setIsUploading(false);
      }

      if (editingSubBabId) {
        await updateSubBab.mutateAsync({
          id: editingSubBabId,
          bab_id: selectedBabId,
          title: subBabForm.title,
          content:
            subBabForm.content_type === "text" ? subBabForm.content : undefined,
          content_type: subBabForm.content_type,
          content_url: subBabForm.content_type !== "text" ? fileUrl : undefined,
        });
        toast.success("Sub-bab berhasil diperbarui");
      } else {
        await createSubBab.mutateAsync({
          bab_id: selectedBabId,
          title: subBabForm.title,
          content:
            subBabForm.content_type === "text" ? subBabForm.content : undefined,
          content_type: subBabForm.content_type,
          content_url: subBabForm.content_type !== "text" ? fileUrl : undefined,
        });
        toast.success("Sub-bab berhasil ditambahkan");
      }

      setShowSubBabDialog(false);
      setSubBabForm({
        title: "",
        content: "",
        content_type: "text",
        content_url: "",
        duration: 0,
      });
      setEditingSubBabId(null);
      setSelectedBabId(null);
      setSelectedFile(null);
      setIsUploading(false);
    } catch (error: any) {
      console.error("Error saving sub-bab:", error);
      toast.error(error.message || "Gagal menyimpan sub-bab");
      setIsUploading(false);
    }
  };

  const handleDeleteSubBab = async (subBabId: string, babId: string) => {
    if (!confirm("Yakin ingin menghapus sub-bab ini?")) {
      return;
    }

    try {
      await deleteSubBab.mutateAsync({
        id: subBabId,
        bab_id: babId,
      });
      toast.success("Sub-bab berhasil dihapus");
    } catch (error: any) {
      console.error("Error deleting sub-bab:", error);
      toast.error(error.message || "Gagal menghapus sub-bab");
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video size={16} className="text-red-600" />;
      case "file":
        return <File size={16} className="text-blue-600" />;
      case "link":
        return <LinkIcon size={16} className="text-green-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
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

  if (!materi) {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Materi tidak ditemukan
          </h3>
          <Button onClick={() => router.push("/guru/materi")}>
            Kembali ke Daftar Materi
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/guru/materi")}
          className="mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Kembali
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="text-green-600" size={36} />
              {materi.title}
            </h1>
            {materi.mapel && (
              <span className="inline-block px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 rounded-full mt-2">
                {materi.mapel.name}
              </span>
            )}
            {materi.description && (
              <p className="text-gray-600 mt-3">{materi.description}</p>
            )}
          </div>
          <Button
            onClick={() => openBabDialog()}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus size={20} className="mr-2" />
            Tambah Bab
          </Button>
        </div>
      </div>

      {/* Babs List */}
      {!Array.isArray(babs) || babs.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300">
          <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Belum ada bab
          </h3>
          <p className="text-gray-500 mb-6">
            Mulai buat bab pertama untuk materi ini
          </p>
          <Button
            onClick={() => openBabDialog()}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus size={20} className="mr-2" />
            Tambah Bab
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {babs.map((bab, index) => (
            <Card key={bab.id} className="overflow-hidden">
              {/* Bab Header */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBab(bab.id)}
                      className="p-0 h-auto"
                    >
                      {expandedBabs.has(bab.id) ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </Button>
                    <GripVertical size={20} className="text-gray-400" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        Bab {index + 1}: {bab.title}
                      </h3>
                      {bab.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {bab.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {(bab.sub_babs || []).length} Sub-bab
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openSubBabDialog(bab.id)}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <Plus size={16} className="mr-1" />
                      Sub-bab
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openBabDialog(bab)}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteBab(bab.id)}
                      disabled={deleteBab.isPending}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      {deleteBab.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sub-babs */}
              {expandedBabs.has(bab.id) && (
                <div className="p-4 bg-white">
                  {!bab.sub_babs || bab.sub_babs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText
                        size={48}
                        className="mx-auto mb-3 text-gray-400"
                      />
                      <p className="text-sm">Belum ada sub-bab</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openSubBabDialog(bab.id)}
                        className="mt-3 border-green-300 text-green-700"
                      >
                        <Plus size={16} className="mr-1" />
                        Tambah Sub-bab
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(bab.sub_babs || []).map((subBab, subIndex: number) => (
                        <div
                          key={subBab.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <GripVertical size={16} className="text-gray-400" />
                            <div className="flex items-center gap-2">
                              {getContentTypeIcon(subBab.content_type)}
                              <span className="font-medium text-gray-900">
                                {subIndex + 1}. {subBab.title}
                              </span>
                            </div>
                            {subBab.duration && subBab.duration > 0 && (
                              <span className="text-xs text-gray-500">
                                ({subBab.duration} menit)
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openSubBabDialog(bab.id, subBab)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit size={14} className="text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleDeleteSubBab(subBab.id, bab.id)
                              }
                              disabled={deleteSubBab.isPending}
                              className="h-8 w-8 p-0"
                            >
                              {deleteSubBab.isPending ? (
                                <Loader2
                                  size={14}
                                  className="text-red-600 animate-spin"
                                />
                              ) : (
                                <Trash2 size={14} className="text-red-600" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Bab Dialog */}
      <Dialog open={showBabDialog} onOpenChange={setShowBabDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingBabId ? "Edit Bab" : "Tambah Bab Baru"}
            </DialogTitle>
            <DialogDescription>
              Bab adalah bagian utama dari materi pembelajaran
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBab} className="space-y-4">
            <div>
              <Label htmlFor="bab-title">
                Judul Bab <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bab-title"
                placeholder="Contoh: Pengenalan Variabel"
                value={babForm.title}
                onChange={(e) =>
                  setBabForm({ ...babForm, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="bab-description">Deskripsi (Opsional)</Label>
              <Textarea
                id="bab-description"
                placeholder="Penjelasan singkat tentang bab ini"
                value={babForm.description}
                onChange={(e) =>
                  setBabForm({ ...babForm, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createBab.isPending || updateBab.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {(createBab.isPending || updateBab.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingBabId ? "Perbarui" : "Simpan"} Bab
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBabDialog(false)}
                disabled={createBab.isPending || updateBab.isPending}
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sub-Bab Dialog */}
      <Dialog open={showSubBabDialog} onOpenChange={setShowSubBabDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSubBabId ? "Edit Sub-Bab" : "Tambah Sub-Bab Baru"}
            </DialogTitle>
            <DialogDescription>
              Sub-bab berisi konten pembelajaran yang detail
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSubBab} className="space-y-4">
            <div>
              <Label htmlFor="sub-bab-title">
                Judul Sub-Bab <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sub-bab-title"
                placeholder="Contoh: Deklarasi Variabel Integer"
                value={subBabForm.title}
                onChange={(e) =>
                  setSubBabForm({ ...subBabForm, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Tipe Konten</Label>
              <div className="grid grid-cols-4 gap-3 mt-2">
                {[
                  { value: "text", label: "Teks", icon: FileText },
                  { value: "video", label: "Video", icon: Video },
                  { value: "file", label: "File", icon: File },
                  { value: "link", label: "Link", icon: LinkIcon },
                ].map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={
                      subBabForm.content_type === value ? "default" : "outline"
                    }
                    onClick={() =>
                      setSubBabForm({
                        ...subBabForm,
                        content_type: value as any,
                      })
                    }
                    className={
                      subBabForm.content_type === value ? "bg-green-600" : ""
                    }
                  >
                    <Icon size={16} className="mr-2" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {subBabForm.content_type === "text" ? (
              <div>
                <Label htmlFor="content">Konten Materi</Label>
                <Textarea
                  id="content"
                  placeholder="Tulis konten materi di sini..."
                  value={subBabForm.content}
                  onChange={(e) =>
                    setSubBabForm({ ...subBabForm, content: e.target.value })
                  }
                  rows={10}
                  className="font-mono"
                />
              </div>
            ) : subBabForm.content_type === "file" ? (
              <div>
                <Label htmlFor="file-upload">Upload File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      // Set filename as content_url temporarily until uploaded
                      setSubBabForm({
                        ...subBabForm,
                        content_url: file.name,
                      });
                    }
                  }}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    File dipilih: {selectedFile.name} (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {subBabForm.content_url && !selectedFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    File saat ini: {subBabForm.content_url}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="content-url">
                  URL {subBabForm.content_type === "video" ? "Video" : "Link"}
                </Label>
                <Input
                  id="content-url"
                  type="url"
                  placeholder={
                    subBabForm.content_type === "video"
                      ? "https://youtube.com/watch?v=..."
                      : "https://..."
                  }
                  value={subBabForm.content_url}
                  onChange={(e) =>
                    setSubBabForm({
                      ...subBabForm,
                      content_url: e.target.value,
                    })
                  }
                />
              </div>
            )}

            <div>
              <Label htmlFor="duration">Durasi (menit, opsional)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                placeholder="0"
                value={subBabForm.duration || ""}
                onChange={(e) =>
                  setSubBabForm({
                    ...subBabForm,
                    duration: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={
                  createSubBab.isPending ||
                  updateSubBab.isPending ||
                  isUploading
                }
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {(createSubBab.isPending ||
                  updateSubBab.isPending ||
                  isUploading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isUploading
                  ? "Mengupload file..."
                  : editingSubBabId
                  ? "Perbarui Sub-Bab"
                  : "Simpan Sub-Bab"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSubBabDialog(false)}
                disabled={
                  createSubBab.isPending ||
                  updateSubBab.isPending ||
                  isUploading
                }
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
