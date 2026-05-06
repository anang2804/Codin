"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, Pencil, Search, Save, X } from "lucide-react";
import { toast } from "sonner";

type PanduanRole = "admin" | "guru" | "siswa";

type PanduanItem = {
  id: string;
  title: string;
  role: PanduanRole;
  fileUrl: string;
  fileName: string;
};

type PanduanApiItem = {
  id: string;
  title: string;
  target_role: PanduanRole;
  file_name: string | null;
  file_url: string | null;
};

function roleLabel(role: PanduanRole) {
  if (role === "admin") return "Admin";
  if (role === "guru") return "Guru";
  return "Siswa";
}

function toUiItem(item: PanduanApiItem): PanduanItem {
  return {
    id: item.id,
    title: item.title,
    role: item.target_role,
    fileName: item.file_name || "",
    fileUrl: item.file_url || "",
  };
}

export default function AdminPanduanPage() {
  const [items, setItems] = useState<PanduanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formRole, setFormRole] = useState<PanduanRole>("admin");
  const [formFileName, setFormFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPanduan = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/panduan", { cache: "no-store" });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error || "Gagal memuat data panduan");
      }

      const rows = Array.isArray(json?.data) ? json.data : [];
      setItems(rows.map((row: PanduanApiItem) => toUiItem(row)));
    } catch (error: any) {
      toast.error(error?.message || "Gagal memuat data panduan");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanduan();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => {
      return (
        item.title.toLowerCase().includes(keyword) ||
        item.role.toLowerCase().includes(keyword) ||
        item.fileName.toLowerCase().includes(keyword)
      );
    });
  }, [items, search]);

  const startEdit = (item: PanduanItem) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormRole(item.role);
    setFormFileName(item.fileName);
    setSelectedFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormTitle("");
    setFormRole("admin");
    setFormFileName("");
    setSelectedFile(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const normalizedTitle = formTitle.trim();
    if (!normalizedTitle) {
      toast.error("Judul panduan wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("id", editingId);
      payload.append("title", normalizedTitle);
      payload.append("target_role", formRole);
      if (selectedFile) {
        payload.append("file", selectedFile);
      }

      const response = await fetch("/api/admin/panduan", {
        method: "PUT",
        body: payload,
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error || "Gagal menyimpan panduan");
      }

      const updatedItem = toUiItem(json.data as PanduanApiItem);
      setItems((prev) =>
        prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
      );

      toast.success("Panduan berhasil diperbarui");
      cancelEdit();
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan panduan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Panduan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola file panduan untuk Admin, Guru, dan Siswa.
          </p>
        </div>

        <div className="relative w-full max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari data..."
            className="pl-9 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
          />
        </div>
      </div>

      {editingId && (
        <div className="max-w-3xl mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <Card className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Edit Panduan
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Perbarui judul, target pengguna, dan file panduan.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Judul <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Panduan Admin"
                  className="border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Untuk
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as PanduanRole)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
                >
                  <option value="admin">Admin</option>
                  <option value="guru">Guru</option>
                  <option value="siswa">Siswa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Pilih File
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    (opsional)
                  </span>
                </label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    setFormFileName(selectedFile?.name || "");
                    setSelectedFile(selectedFile || null);
                  }}
                  className="border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
                {formFileName && (
                  <p className="mt-1 text-xs text-gray-500">{formFileName}</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  onClick={saveEdit}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 gap-2 rounded-lg px-6"
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Simpan
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={cancelEdit}
                  variant="outline"
                  disabled={saving}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50 gap-2 rounded-lg"
                >
                  <X size={15} />
                  Batal
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat panduan...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={42} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Data panduan tidak ditemukan.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid md:grid-cols-[2fr_2fr_1fr_auto] gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <div>Judul</div>
              <div>File</div>
              <div>Untuk</div>
              <div className="text-right">Aksi</div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_auto] gap-2 md:gap-4 px-6 py-4 items-center"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1 md:hidden">
                      Judul
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1 md:hidden">
                      File
                    </p>
                    {item.fileName && item.fileUrl ? (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {item.fileName}
                      </a>
                    ) : item.fileName ? (
                      <p className="text-sm text-blue-600">{item.fileName}</p>
                    ) : (
                      <p className="text-sm text-gray-500">Belum ada file</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1 md:hidden">
                      Untuk
                    </p>
                    <p className="text-sm text-gray-700">
                      {roleLabel(item.role)}
                    </p>
                  </div>

                  <div className="flex justify-start md:justify-end pt-1 md:pt-0">
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-400 text-white transition hover:bg-amber-500"
                      onClick={() => startEdit(item)}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 text-sm text-gray-500">
              1-{filteredItems.length} of {filteredItems.length}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
