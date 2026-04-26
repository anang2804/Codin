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
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  GripVertical,
  FileText,
  Link as LinkIcon,
  File,
  Upload,
  Loader2,
  Eye,
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
  description?: string | null;
  content?: string | null;
  content_type: "text" | "video" | "file" | "link" | "assignment";
  content_url?: string | null;
  duration?: number | null;
  order_index: number;
  created_at?: string;
}

interface DeleteSubBabTarget {
  id: string;
  babId: string;
  title: string;
}

interface DeleteBabTarget {
  id: string;
  title: string;
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
  const [showDeleteBabDialog, setShowDeleteBabDialog] = useState(false);
  const [showDeleteSubBabDialog, setShowDeleteSubBabDialog] = useState(false);
  const [editingBabId, setEditingBabId] = useState<string | null>(null);
  const [editingSubBabId, setEditingSubBabId] = useState<string | null>(null);
  const [deleteSubBabTarget, setDeleteSubBabTarget] =
    useState<DeleteSubBabTarget | null>(null);
  const [deleteBabTarget, setDeleteBabTarget] =
    useState<DeleteBabTarget | null>(null);

  // Form data
  const [babForm, setBabForm] = useState({
    title: "",
    description: "",
  });

  const [subBabForm, setSubBabForm] = useState({
    title: "",
    description: "",
    content_type: "text" as "text" | "file" | "link" | "assignment",
    content_url: "",
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
        title: bab.title || "",
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

  const handleDeleteBab = (babId: string, babTitle: string) => {
    setDeleteBabTarget({ id: babId, title: babTitle });
    setShowDeleteBabDialog(true);
  };

  const confirmDeleteBab = async () => {
    if (!deleteBabTarget) return;

    try {
      await deleteBab.mutateAsync({
        id: deleteBabTarget.id,
        materi_id: materiId,
      });
      toast.success("Bab berhasil dihapus");
      setShowDeleteBabDialog(false);
      setDeleteBabTarget(null);
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
        title: subBab.title || "",
        description: subBab.description || "",
        content_type:
          subBab.content_type === "video"
            ? "link"
            : ((subBab.content_type || "text") as
                | "text"
                | "file"
                | "link"
                | "assignment"),
        content_url: subBab.content_url || "",
      });
      setEditingSubBabId(subBab.id);
    } else {
      setSubBabForm({
        title: "",
        description: "",
        content_type: "text",
        content_url: "",
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
          description: subBabForm.description,
          content_type: subBabForm.content_type,
          content_url:
            subBabForm.content_type === "file" ||
            subBabForm.content_type === "link"
              ? fileUrl
              : undefined,
        });
        toast.success("Sub-bab berhasil diperbarui");
      } else {
        await createSubBab.mutateAsync({
          bab_id: selectedBabId,
          title: subBabForm.title,
          description: subBabForm.description,
          content_type: subBabForm.content_type,
          content_url:
            subBabForm.content_type === "file" ||
            subBabForm.content_type === "link"
              ? fileUrl
              : undefined,
        });
        toast.success("Sub-bab berhasil ditambahkan");
      }

      setShowSubBabDialog(false);
      setSubBabForm({
        title: "",
        description: "",
        content_type: "text",
        content_url: "",
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

  const handleDeleteSubBab = (
    subBabId: string,
    babId: string,
    title: string,
  ) => {
    setDeleteSubBabTarget({ id: subBabId, babId, title });
    setShowDeleteSubBabDialog(true);
  };

  const confirmDeleteSubBab = async () => {
    if (!deleteSubBabTarget) {
      return;
    }

    try {
      await deleteSubBab.mutateAsync({
        id: deleteSubBabTarget.id,
        bab_id: deleteSubBabTarget.babId,
      });
      toast.success("Sub-bab berhasil dihapus");
      setShowDeleteSubBabDialog(false);
      setDeleteSubBabTarget(null);
    } catch (error: any) {
      console.error("Error deleting sub-bab:", error);
      toast.error(error.message || "Gagal menghapus sub-bab");
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <LinkIcon size={16} className="text-green-600" />;
      case "file":
        return <File size={16} className="text-blue-600" />;
      case "link":
        return <LinkIcon size={16} className="text-green-600" />;
      case "assignment":
        return <Upload size={16} className="text-orange-600" />;
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
    <div className="pt-2 md:pt-4 pb-6 md:pb-8">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/guru/materi")}
          className="mb-5 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors duration-150"
        >
          <ArrowLeft size={15} className="mr-2" />
          Kembali
        </Button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="text-green-600 shrink-0" size={22} />
              {materi.title}
            </h1>
            {materi.mapel && (
              <span className="inline-block px-2.5 py-0.5 text-xs font-medium text-green-700 bg-green-50 border border-green-100 rounded-full mt-2">
                {materi.mapel.name}
              </span>
            )}
            {materi.description && (
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                {materi.description}
              </p>
            )}
          </div>
          <div className="flex gap-2 justify-start md:justify-end mt-2 md:mt-0">
            <Button
              variant="outline"
              onClick={() => router.push(`/guru/materi/${materiId}/preview`)}
              className="border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors duration-150"
            >
              <Eye size={16} className="mr-2" />
              Preview
            </Button>
            <Button
              onClick={() => openBabDialog()}
              className="bg-green-600 hover:bg-green-700 hover:scale-[1.02] transition-all duration-150 shrink-0"
            >
              <Plus size={16} className="mr-2" />
              Tambah Bab
            </Button>
          </div>
        </div>
      </div>

      {/* Babs List */}
      {!Array.isArray(babs) || babs.length === 0 ? (
        <Card className="p-12 text-center border border-dashed border-gray-200">
          <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            Belum ada bab
          </h3>
          <p className="text-sm text-gray-400 mb-5">
            Mulai buat bab pertama untuk materi ini
          </p>
          <Button
            onClick={() => openBabDialog()}
            className="bg-green-600 hover:bg-green-700 hover:scale-[1.02] transition-all duration-150"
          >
            <Plus size={16} className="mr-2" />
            Tambah Bab
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {babs.map((bab, index) => (
            <Card
              key={bab.id}
              className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Bab Header */}
              <div className="bg-gray-50/80 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleBab(bab.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-150 shrink-0"
                    >
                      {expandedBabs.has(bab.id) ? (
                        <ChevronDown size={18} />
                      ) : (
                        <ChevronRight size={18} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        Bab {index + 1}: {bab.title}
                      </h3>
                      {bab.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                          {bab.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {(bab.sub_babs || []).length} Sub-bab
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openSubBabDialog(bab.id)}
                      className="border-green-200 text-green-700 hover:bg-green-50 hover:scale-[1.05] transition-all duration-150 h-8 px-2.5 text-xs"
                    >
                      <Plus size={14} className="mr-1" />
                      Sub-bab
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openBabDialog(bab)}
                      className="border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-blue-600 hover:border-blue-200 hover:scale-[1.05] transition-all duration-150 h-8 w-8 p-0"
                    >
                      <Edit size={15} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteBab(bab.id, bab.title)}
                      disabled={deleteBab.isPending}
                      className="border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:scale-[1.05] transition-all duration-150 h-8 w-8 p-0"
                    >
                      {deleteBab.isPending ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sub-babs */}
              {expandedBabs.has(bab.id) && (
                <div className="px-5 py-4 bg-white border-t border-gray-100">
                  {!bab.sub_babs || bab.sub_babs.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <FileText
                        size={32}
                        className="mx-auto mb-2 text-gray-300"
                      />
                      <p className="text-sm">Belum ada sub-bab</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openSubBabDialog(bab.id)}
                        className="mt-3 border-green-200 text-green-700 hover:bg-green-50 text-xs"
                      >
                        <Plus size={14} className="mr-1" />
                        Tambah Sub-bab
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(bab.sub_babs || []).map((subBab, subIndex: number) => (
                        <div
                          key={subBab.id}
                          className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="text-gray-400 shrink-0">
                              {getContentTypeIcon(subBab.content_type)}
                            </div>
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {subIndex + 1}. {subBab.title}
                            </span>
                            {subBab.duration && subBab.duration > 0 && (
                              <span className="text-xs text-gray-400 shrink-0">
                                {subBab.duration} mnt
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openSubBabDialog(bab.id, subBab)}
                              className="h-7 w-7 p-0 hover:bg-blue-50 hover:scale-[1.05] transition-all duration-150"
                            >
                              <Edit size={14} className="text-blue-500" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleDeleteSubBab(
                                  subBab.id,
                                  bab.id,
                                  subBab.title,
                                )
                              }
                              disabled={deleteSubBab.isPending}
                              className="h-7 w-7 p-0 hover:bg-red-50 hover:scale-[1.05] transition-all duration-150"
                            >
                              {deleteSubBab.isPending ? (
                                <Loader2
                                  size={14}
                                  className="text-red-500 animate-spin"
                                />
                              ) : (
                                <Trash2 size={14} className="text-red-400" />
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
        <DialogContent className="max-w-lg animate-in fade-in-0 zoom-in-95 duration-200">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingBabId ? "Edit Bab" : "Tambah Bab Baru"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              Bab adalah bagian utama dari materi pembelajaran
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBab} className="space-y-5 pt-1">
            <div className="space-y-1.5">
              <Label
                htmlFor="bab-title"
                className="text-sm font-medium text-gray-700"
              >
                Judul Bab <span className="text-red-400">*</span>
              </Label>
              <Input
                id="bab-title"
                placeholder="Contoh: Pengenalan Variabel"
                value={babForm.title ?? ""}
                onChange={(e) =>
                  setBabForm({ ...babForm, title: e.target.value })
                }
                required
                className="border-gray-200 focus:border-green-400 focus:ring-green-400 transition-colors duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="bab-description"
                className="text-sm font-medium text-gray-700"
              >
                Deskripsi{" "}
                <span className="text-gray-400 font-normal">(Opsional)</span>
              </Label>
              <Textarea
                id="bab-description"
                placeholder="Penjelasan singkat tentang bab ini"
                value={babForm.description ?? ""}
                onChange={(e) =>
                  setBabForm({ ...babForm, description: e.target.value })
                }
                rows={3}
                className="border-gray-200 focus:border-green-400 focus:ring-green-400 transition-colors duration-200 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="submit"
                disabled={createBab.isPending || updateBab.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 hover:scale-[1.02] transition-all duration-150 disabled:opacity-70 disabled:scale-100"
              >
                {(createBab.isPending || updateBab.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingBabId ? "Perbarui Bab" : "Simpan Bab"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBabDialog(false)}
                disabled={createBab.isPending || updateBab.isPending}
                className="border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors duration-150"
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sub-Bab Dialog */}
      <Dialog open={showSubBabDialog} onOpenChange={setShowSubBabDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden animate-in fade-in-0 zoom-in-95 duration-200">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingSubBabId ? "Edit Sub-Bab" : "Tambah Sub-Bab Baru"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              Sub-bab berisi konten pembelajaran yang detail
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSubBab} className="space-y-5 pt-1">
            {/* Judul */}
            <div className="space-y-1.5">
              <Label
                htmlFor="sub-bab-title"
                className="text-sm font-medium text-gray-700"
              >
                Judul Sub-Bab <span className="text-red-400">*</span>
              </Label>
              <Input
                id="sub-bab-title"
                placeholder="Contoh: Deklarasi Variabel Integer"
                value={subBabForm.title ?? ""}
                onChange={(e) =>
                  setSubBabForm({ ...subBabForm, title: e.target.value })
                }
                required
                className="border-gray-200 focus:border-green-400 focus:ring-green-400 transition-colors duration-200"
              />
            </div>

            {/* Tipe Konten */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Tipe Konten
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                {[
                  { value: "text", label: "Teks", icon: FileText },
                  { value: "file", label: "File", icon: File },
                  { value: "link", label: "Link", icon: LinkIcon },
                  { value: "assignment", label: "Tugas", icon: Upload },
                ].map(({ value, label, icon: Icon }) => {
                  const isActive = subBabForm.content_type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setSubBabForm({
                          ...subBabForm,
                          content_type: value as any,
                        })
                      }
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-150 hover:scale-[1.03] ${
                        isActive
                          ? "bg-green-600 border-green-600 text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700"
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Konten berdasarkan tipe */}
            {/* File upload — always mounted, visible only for "file" type */}
            <div
              className={
                subBabForm.content_type === "file" ? "space-y-1.5" : "hidden"
              }
            >
              <Label
                htmlFor="file-upload"
                className="text-sm font-medium text-gray-700"
              >
                Upload File
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    setSubBabForm({ ...subBabForm, content_url: file.name });
                  }
                }}
                className="cursor-pointer border-gray-200"
              />
              {selectedFile && (
                <p className="text-xs text-gray-500 mt-1 break-all">
                  File dipilih: {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              {subBabForm.content_url && !selectedFile && (
                <p className="text-xs text-gray-500 mt-1 break-all">
                  File saat ini: {subBabForm.content_url}
                </p>
              )}
            </div>

            {/* URL input hanya dirender saat tipe konten link */}
            {subBabForm.content_type === "link" && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="content-url"
                  className="text-sm font-medium text-gray-700"
                >
                  URL Link
                </Label>
                <Input
                  id="content-url"
                  type="url"
                  placeholder="https://example.com atau https://youtube.com/watch?v=..."
                  value={subBabForm.content_url ?? ""}
                  onChange={(e) =>
                    setSubBabForm({
                      ...subBabForm,
                      content_url: e.target.value,
                    })
                  }
                  className="border-gray-200 focus:border-green-400 focus:ring-green-400 transition-colors duration-200"
                />
              </div>
            )}

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <Label
                htmlFor="sub-description"
                className="text-sm font-medium text-gray-700"
              >
                Deskripsi Singkat{" "}
                <span className="text-gray-400 font-normal">(Opsional)</span>
              </Label>
              <Textarea
                id="sub-description"
                placeholder="Penjelasan singkat tentang sub-bab ini..."
                value={subBabForm.description ?? ""}
                onChange={(e) =>
                  setSubBabForm({ ...subBabForm, description: e.target.value })
                }
                rows={3}
                className="border-gray-200 focus:border-green-400 focus:ring-green-400 transition-colors duration-200 resize-none"
              />
            </div>

            {/* Tombol */}
            <div className="flex gap-3 pt-1">
              <Button
                type="submit"
                disabled={
                  createSubBab.isPending ||
                  updateSubBab.isPending ||
                  isUploading
                }
                className="flex-1 bg-green-600 hover:bg-green-700 hover:scale-[1.02] hover:-translate-y-px transition-all duration-150 disabled:opacity-70 disabled:scale-100"
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
                className="border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors duration-150"
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDeleteBabDialog}
        onOpenChange={(open) => {
          setShowDeleteBabDialog(open);
          if (!open && !deleteBab.isPending) {
            setDeleteBabTarget(null);
          }
        }}
      >
        <DialogContent
          className="max-w-md rounded-xl border border-gray-100 p-7 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 duration-200"
          showCloseButton={false}
        >
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle size={16} />
              </span>
              Hapus Bab
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              {deleteBabTarget?.title
                ? `Apakah kamu yakin ingin menghapus bab "${deleteBabTarget.title}"? Semua sub-bab di dalamnya juga akan terhapus.`
                : "Apakah kamu yakin ingin menghapus bab ini? Semua sub-bab di dalamnya juga akan terhapus."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteBabDialog(false);
                setDeleteBabTarget(null);
              }}
              disabled={deleteBab.isPending}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteBab}
              disabled={deleteBab.isPending}
              className="bg-red-600 hover:bg-red-700 hover:scale-[1.02] transition-all duration-150"
            >
              {deleteBab.isPending ? (
                <Loader2 size={15} className="mr-2 animate-spin" />
              ) : (
                <Trash2 size={15} className="mr-2" />
              )}
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDeleteSubBabDialog}
        onOpenChange={(open) => {
          setShowDeleteSubBabDialog(open);
          if (!open && !deleteSubBab.isPending) {
            setDeleteSubBabTarget(null);
          }
        }}
      >
        <DialogContent
          className="max-w-md rounded-xl border border-gray-100 p-7 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 duration-200"
          showCloseButton={false}
        >
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle size={16} />
              </span>
              Hapus Sub-Bab
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              {deleteSubBabTarget?.title
                ? `Apakah kamu yakin ingin menghapus sub-bab "${deleteSubBabTarget.title}"? Tindakan ini tidak dapat dibatalkan.`
                : "Apakah kamu yakin ingin menghapus sub-bab ini? Tindakan ini tidak dapat dibatalkan."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteSubBabDialog(false);
                setDeleteSubBabTarget(null);
              }}
              disabled={deleteSubBab.isPending}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteSubBab}
              disabled={deleteSubBab.isPending}
              className="bg-red-600 hover:bg-red-700 hover:scale-[1.02] transition-all duration-150"
            >
              {deleteSubBab.isPending ? (
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
