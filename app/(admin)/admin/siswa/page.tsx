"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Mail,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  User,
  BookOpen,
  TrendingUp,
  Key,
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Siswa {
  id: string;
  email: string;
  full_name: string;
  kelas?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  no_telepon?: string;
  alamat?: string;
  created_at: string;
}

interface KelasOption {
  id: string;
  name: string;
}

interface MateriProgress {
  siswa_id: string;
  kelas?: string;
  total_materi: number;
  materi_read: number;
  materi_completed: number;
  average_progress: number;
  progress: Array<{
    id: string;
    materi_id: string;
    completed_sub_bab: number;
    total_sub_bab: number;
    progress_percentage: number;
    last_read_at: string;
    completed_at?: string;
    materi: {
      id: string;
      title: string;
      kelas: string[];
    };
  }>;
}

export default function AdminSiswaPage() {
  const supabase = createClient();
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [filteredSiswa, setFilteredSiswa] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<
    Partial<Siswa> & { password?: string }
  >({});
  const [saving, setSaving] = useState(false);
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Add form state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addMode, setAddMode] = useState<"single" | "bulk">("single");
  const [addForm, setAddForm] = useState({
    full_name: "",
    email: "",
    password: "",
    no_telepon: "",
    kelas: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Bulk upload state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Progress state
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [selectedSiswaId, setSelectedSiswaId] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<MateriProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Filter state
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>("all");

  // Password management state
  const [createdAccounts, setCreatedAccounts] = useState<
    Array<{
      id?: string;
      full_name: string;
      email: string;
      temporaryPassword?: string;
    }>
  >([]);
  const [sessionCreatedAccounts, setSessionCreatedAccounts] = useState<
    Array<{
      id?: string;
      full_name: string;
      email: string;
      temporaryPassword?: string;
    }>
  >([]);
  const [passwordChangedStatus, setPasswordChangedStatus] = useState<
    Map<string, { changed: boolean; lastChange?: string }>
  >(new Map());
  const [userPasswords, setUserPasswords] = useState<
    Map<string, { password: string; updatedAt: string }>
  >(new Map());

  // Helper functions for password management
  const normalizeEmail = (e?: string) =>
    e ? String(e).trim().toLowerCase() : "";

  const extractTemp = (it: any) => {
    return (
      it?.temporaryPassword ||
      it?.temporary_password ||
      it?.tempPassword ||
      it?.password ||
      it?.pw ||
      it?.temp ||
      ""
    );
  };

  const hasTemporaryFor = (opts: { id?: string; email?: string }) => {
    const e = normalizeEmail(opts.email || "");
    const byLists = [...sessionCreatedAccounts, ...createdAccounts];
    if (
      byLists.some(
        (p) =>
          (opts.id && p.id === opts.id) ||
          (p.email &&
            normalizeEmail(p.email) === e &&
            (p.temporaryPassword || "").length > 0)
      )
    )
      return true;
    try {
      const raw = localStorage.getItem("admin_created_accounts_siswa");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const p of parsed) {
            const pid = p?.id || null;
            const pe = normalizeEmail(p?.email);
            const pw = extractTemp(p);
            if (opts.id && pid && String(pid) === String(opts.id) && pw)
              return true;
            if (pe && e && pe === e && pw) return true;
          }
        }
      }
    } catch (e2) {}
    return false;
  };

  const getTemporaryPassword = (opts: {
    id?: string;
    email?: string;
  }): string => {
    const e = normalizeEmail(opts.email || "");
    try {
      const raw = localStorage.getItem("admin_created_accounts_siswa");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const p of parsed) {
            const pid = p?.id || null;
            const pe = normalizeEmail(p?.email);
            const pw = extractTemp(p);
            if (opts.id && pid && String(pid) === String(opts.id) && pw)
              return pw;
            if (pe && e && pe === e && pw) return pw;
          }
        }
      }
    } catch (e2) {}
    const byLists = [...sessionCreatedAccounts, ...createdAccounts];
    for (const p of byLists) {
      if (
        (opts.id && p.id === opts.id) ||
        (p.email && normalizeEmail(p.email) === e)
      ) {
        const pw = p.temporaryPassword || "";
        if (pw) return pw;
      }
    }
    return "";
  };

  // Load created accounts from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_created_accounts_siswa");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((p: any) => ({
            id: p?.id || null,
            full_name: p?.full_name || "",
            email: normalizeEmail(p?.email || ""),
            temporaryPassword: extractTemp(p) || "",
          }));
          setCreatedAccounts(normalized);
          setSessionCreatedAccounts(normalized);
        }
      }
    } catch (e) {
      console.warn("Failed to load created accounts", e);
    }
  }, []);

  // Save created accounts to localStorage
  useEffect(() => {
    if (createdAccounts.length > 0) {
      try {
        localStorage.setItem(
          "admin_created_accounts_siswa",
          JSON.stringify(createdAccounts)
        );
      } catch (e) {
        console.warn("Failed to save created accounts", e);
      }
    }
  }, [createdAccounts]);

  useEffect(() => {
    fetchSiswa();
    fetchKelas();
  }, []);

  useEffect(() => {
    filterSiswa();
  }, [searchTerm, siswa, selectedKelasFilter]);

  // Check password status
  const checkPasswordStatus = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    try {
      const res = await fetch(
        "/api/admin/check-password-status?t=" + Date.now(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
          body: JSON.stringify({ userIds }),
          cache: "no-store",
        }
      );
      if (res.ok) {
        const json = await res.json();
        const statusMap = new Map();
        const passwordPromises = [];
        for (const result of json.results || []) {
          statusMap.set(result.id, {
            changed: result.passwordChanged,
            lastChange: result.lastPasswordChange,
          });
          if (result.passwordChanged) {
            passwordPromises.push(getUserPassword(result.id));
          }
        }
        setPasswordChangedStatus(statusMap);
        await Promise.all(passwordPromises);
      }
    } catch (error) {
      console.error("Error checking password status:", error);
    }
  };

  // Get user password
  const getUserPassword = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/get-user-password?t=" + Date.now(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        body: JSON.stringify({ userId }),
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.password) {
          setUserPasswords((prev) => {
            const newMap = new Map(prev);
            newMap.set(userId, {
              password: json.password,
              updatedAt: json.updatedAt,
            });
            return newMap;
          });
        }
      }
    } catch (error) {
      console.error(`Error getting user password:`, error);
    }
  };

  // Check password status when siswa data changes
  useEffect(() => {
    if (siswa.length > 0) {
      const allIds = siswa.map((s) => s.id);
      checkPasswordStatus(allIds);
      allIds.forEach((userId) => {
        getUserPassword(userId);
      });
    }
  }, [siswa]);

  // Auto-refresh password status every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (siswa.length > 0) {
        checkPasswordStatus(siswa.map((s) => s.id));
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [siswa]);

  // Download PDF
  const downloadPdf = (
    items: Array<{
      full_name: string;
      email: string;
      temporaryPassword?: string;
    }>,
    title?: string
  ) => {
    const escapeHtml = (unsafe: string) => {
      return unsafe
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    };
    const rows = items
      .map(
        (i) =>
          `<tr><td>${escapeHtml(i.full_name)}</td><td>${escapeHtml(
            i.email
          )}</td><td>${escapeHtml(i.temporaryPassword || "")}</td></tr>`
      )
      .join("");
    const pdfTitle = title || `Daftar Akun Siswa`;
    const html = `
      <html>
        <head>
          <title>${escapeHtml(pdfTitle)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px }
            table { border-collapse: collapse; width: 100% }
            th, td { border: 1px solid #ddd; padding: 8px }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h2>${escapeHtml(pdfTitle)}</h2>
          <table>
            <thead>
              <tr><th>Nama</th><th>Email</th><th>Password Sementara</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;
    const w = window.open("", "_blank");
    if (!w) {
      toast.error(
        "Tidak bisa membuka jendela baru. Izinkan pop-up lalu coba lagi."
      );
      return;
    }
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 500);
  };

  const clearCreatedAccounts = () => {
    if (!confirm("Hapus daftar akun baru yang tersimpan?")) return;
    try {
      localStorage.removeItem("admin_created_accounts_siswa");
    } catch (e) {
      console.warn("Failed to remove created accounts", e);
    }
    setCreatedAccounts([]);
    setSessionCreatedAccounts([]);
    toast.success("Daftar akun baru berhasil dihapus");
  };

  // Build combined list for download
  const combinedDownloadList = (() => {
    let persistedMap = new Map<string, string>();
    try {
      const raw = localStorage.getItem("admin_created_accounts_siswa");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const p of parsed) {
            const pw = extractTemp(p);
            if (pw) {
              if (p?.id) persistedMap.set(`id:${p.id}`, pw);
              if (p?.email)
                persistedMap.set(`email:${normalizeEmail(p.email)}`, pw);
            }
          }
        }
      }
    } catch (e) {}
    const tempByEmail = new Map<string, string>();
    const tempById = new Map<string, string>();
    const add = (it: any) => {
      const pw = extractTemp(it);
      const emailKey = normalizeEmail(it.email);
      if (emailKey) tempByEmail.set(emailKey, pw || "");
      if (it.id) tempById.set(String(it.id), pw || "");
    };
    for (const it of sessionCreatedAccounts) add(it);
    for (const it of createdAccounts) add(it);
    const list: Array<{
      id?: string;
      full_name: string;
      email: string;
      temporaryPassword?: string;
    }> = [];
    for (const s of siswa) {
      const email = s.email || "";
      const id = s.id;
      let pw =
        persistedMap.get(`id:${id}`) ||
        persistedMap.get(`email:${normalizeEmail(email)}`) ||
        (id && tempById.get(String(id))) ||
        tempByEmail.get(normalizeEmail(email)) ||
        "";
      list.push({
        id,
        full_name: s.full_name || "",
        email,
        temporaryPassword: pw,
      });
    }
    return list;
  })();

  async function fetchSiswa() {
    try {
      const response = await fetch("/api/admin/siswa");
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch siswa");
      }

      setSiswa(json.data || []);
      setFilteredSiswa(json.data || []);
    } catch (err: any) {
      console.error("Error fetching siswa:", err);
      toast.error(err.message || "Gagal memuat data siswa");
    } finally {
      setLoading(false);
    }
  }

  async function fetchKelas() {
    try {
      const { data, error } = await supabase
        .from("kelas")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setKelasOptions(data || []);
    } catch (err: any) {
      console.error("Error fetching kelas:", err);
    }
  }

  function filterSiswa() {
    let filtered = [...siswa];

    // Filter by kelas
    if (selectedKelasFilter !== "all") {
      filtered = filtered.filter((s) => s.kelas === selectedKelasFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(term) ||
          s.email?.toLowerCase().includes(term) ||
          s.kelas?.toLowerCase().includes(term)
      );
    }

    setFilteredSiswa(filtered);
  }

  // Group siswa by kelas for stats
  function getSiswaCountByKelas() {
    const counts: Record<string, number> = { all: siswa.length };
    siswa.forEach((s) => {
      const kelas = s.kelas || "Belum Ada Kelas";
      counts[kelas] = (counts[kelas] || 0) + 1;
    });
    return counts;
  }

  function startEdit(siswa: Siswa) {
    setEditingId(siswa.id);
    setEditForm({ ...siswa });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit() {
    if (!editingId) return;

    setSaving(true);
    try {
      const updateData: any = {
        id: editingId,
        full_name: editForm.full_name,
        kelas: editForm.kelas || null,
        tanggal_lahir: editForm.tanggal_lahir || null,
        jenis_kelamin: editForm.jenis_kelamin || null,
        no_telepon: editForm.no_telepon || null,
        alamat: editForm.alamat || null,
      };

      // Only include password if it's been provided
      if (editForm.password && editForm.password.trim()) {
        updateData.password = editForm.password;
      }

      const response = await fetch("/api/admin/siswa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to update siswa");
      }

      toast.success("Data siswa berhasil diupdate");
      setEditingId(null);
      setEditForm({});
      setShowEditPassword(false);
      fetchSiswa();
    } catch (err: any) {
      console.error("Error updating siswa:", err);
      toast.error(err.message || "Gagal mengupdate data siswa");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Yakin ingin menghapus siswa "${name}"?`)) return;

    // Optimistic update - langsung hapus dari UI
    const previousSiswa = [...siswa];
    const previousFiltered = [...filteredSiswa];

    setSiswa((prev) => prev.filter((s) => s.id !== id));
    setFilteredSiswa((prev) => prev.filter((s) => s.id !== id));

    try {
      const response = await fetch(`/api/admin/siswa?id=${id}`, {
        method: "DELETE",
      });

      const json = await response.json();

      if (!response.ok) {
        // Rollback jika gagal
        setSiswa(previousSiswa);
        setFilteredSiswa(previousFiltered);
        throw new Error(json.error || "Failed to delete siswa");
      }

      toast.success("Siswa berhasil dihapus");
    } catch (err: any) {
      console.error("Error deleting siswa:", err);
      toast.error(err.message || "Gagal menghapus siswa");
    }
  }

  // Handle Excel file upload
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Validate data structure
        const validatedData = data.map((row: any, index) => {
          const rowNum = index + 2; // Excel row number (header is row 1)
          return {
            full_name: row["Nama"] || row["nama"] || row["NAMA"] || "",
            email:
              row["Email"] ||
              row["email"] ||
              row["EMAIL"] ||
              row["Akun"] ||
              row["akun"] ||
              "",
            password:
              row["Password"] || row["password"] || row["PASSWORD"] || "",
            no_telepon:
              row["No Telepon"] ||
              row["no_telepon"] ||
              row["NO_TELEPON"] ||
              row["Telepon"] ||
              row["telepon"] ||
              "",
            kelas: row["Kelas"] || row["kelas"] || row["KELAS"] || "",
            rowNum,
          };
        });

        setExcelData(validatedData);
        toast.success(`Berhasil membaca ${validatedData.length} baris data`);
      } catch (error) {
        console.error("Error reading Excel:", error);
        toast.error("Gagal membaca file Excel. Pastikan format file benar.");
      }
    };

    reader.readAsBinaryString(file);
  };

  // Handle bulk create from Excel
  const handleBulkCreate = async () => {
    if (excelData.length === 0) {
      toast.error("Tidak ada data untuk diupload");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    const newAccounts = [];

    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      setUploadProgress(Math.round(((i + 1) / excelData.length) * 100));

      // Validate required fields
      if (!row.full_name || !row.email || !row.password) {
        results.failed++;
        results.errors.push(
          `Baris ${row.rowNum}: Data tidak lengkap (Nama, Email, dan Password harus diisi)`
        );
        continue;
      }

      try {
        const response = await fetch("/api/admin/siswa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: row.email.trim(),
            full_name: row.full_name.trim(),
            password: row.password.trim(),
            no_telepon: row.no_telepon?.trim() || null,
            kelas: row.kelas?.trim() || null,
            sendEmail: false,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          results.failed++;
          if (data.error === "email_exists") {
            results.errors.push(
              `Baris ${row.rowNum}: Email ${row.email} sudah terdaftar`
            );
          } else {
            results.errors.push(
              `Baris ${row.rowNum}: ${data.error || "Gagal menambahkan"}`
            );
          }
          continue;
        }

        results.success++;
        newAccounts.push({
          id: data.id,
          full_name: row.full_name.trim(),
          email: data.email || row.email,
          temporaryPassword: row.password.trim(),
        });
      } catch (err: any) {
        results.failed++;
        results.errors.push(
          `Baris ${row.rowNum}: ${err.message || "Terjadi kesalahan"}`
        );
      }
    }

    // Save new accounts to state
    if (newAccounts.length > 0) {
      setCreatedAccounts((prev) => {
        const next = [...newAccounts, ...prev];
        localStorage.setItem(
          "admin_created_accounts_siswa",
          JSON.stringify(next)
        );
        return next;
      });
      setSessionCreatedAccounts((prev) => [...newAccounts, ...prev]);
    }

    setUploadResults(results);
    setIsSubmitting(false);

    // Show summary
    if (results.success > 0) {
      toast.success(`Berhasil menambahkan ${results.success} siswa`);
    }
    if (results.failed > 0) {
      toast.error(`Gagal menambahkan ${results.failed} siswa`);
    }

    // Refresh data
    setTimeout(() => {
      fetchSiswa();
    }, 500);
  };

  async function handleAddSiswa() {
    if (
      !addForm.full_name.trim() ||
      !addForm.email.trim() ||
      !addForm.password.trim()
    ) {
      toast.error("Nama, email, dan password harus diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/siswa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addForm.email.trim(),
          full_name: addForm.full_name.trim(),
          password: addForm.password.trim(),
          no_telepon: addForm.no_telepon?.trim() || null,
          kelas: addForm.kelas || null,
          sendEmail: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "email_exists") {
          throw new Error("Email sudah terdaftar");
        }
        throw new Error(data.error || "Gagal menambahkan siswa");
      }

      setCreatedAccount({
        email: data.email,
        password: addForm.password.trim(),
      });

      // Save to created accounts state
      const newEntry = {
        id: data.id,
        full_name: addForm.full_name.trim(),
        email: data.email || "",
        temporaryPassword: addForm.password.trim(),
      };
      setCreatedAccounts((prev) => {
        const next = [newEntry, ...prev];
        localStorage.setItem(
          "admin_created_accounts_siswa",
          JSON.stringify(next)
        );
        return next;
      });
      setSessionCreatedAccounts((prev) => [newEntry, ...prev]);

      toast.success("Siswa berhasil ditambahkan!");
      setAddForm({
        full_name: "",
        email: "",
        password: "",
        no_telepon: "",
        kelas: "",
      });

      setTimeout(() => {
        fetchSiswa();
      }, 500);
    } catch (err: any) {
      console.error("Error adding siswa:", err);
      toast.error(err.message || "Gagal menambahkan siswa");
    } finally {
      setIsSubmitting(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Disalin ke clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  async function fetchProgress(siswaId: string) {
    setLoadingProgress(true);
    setSelectedSiswaId(siswaId);
    setShowProgressDialog(true);

    try {
      const response = await fetch(
        `/api/admin/materi-progress?siswa_id=${siswaId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memuat progress");
      }

      setProgressData(data);
    } catch (err: any) {
      console.error("Error fetching progress:", err);
      toast.error(err.message || "Gagal memuat progress materi");
      setShowProgressDialog(false);
    } finally {
      setLoadingProgress(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Kelola Siswa & Akun
          </h1>
          <p className="text-gray-600 mt-1">
            {selectedKelasFilter === "all" ? (
              <>
                Total <strong className="text-green-600">{siswa.length}</strong>{" "}
                siswa terdaftar
              </>
            ) : (
              <>
                Menampilkan{" "}
                <strong className="text-green-600">
                  {filteredSiswa.length}
                </strong>{" "}
                siswa dari kelas{" "}
                <strong className="text-green-600">
                  {selectedKelasFilter}
                </strong>
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            💡 Kelola profil siswa dan manajemen password akun
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus size={20} className="mr-2" />
            Tambah Siswa
          </Button>
        </div>
      </div>

      {/* Filter by Kelas - Horizontal Tabs */}
      <Card className="p-3 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap mr-2">
            Filter Kelas:
          </span>
          <button
            onClick={() => setSelectedKelasFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              selectedKelasFilter === "all"
                ? "bg-green-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Semua ({getSiswaCountByKelas().all || 0})
          </button>
          {kelasOptions.map((kelas) => {
            const count = getSiswaCountByKelas()[kelas.name] || 0;
            return (
              <button
                key={kelas.id}
                onClick={() => setSelectedKelasFilter(kelas.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  selectedKelasFilter === kelas.name
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {kelas.name} ({count})
              </button>
            );
          })}
          {getSiswaCountByKelas()["Belum Ada Kelas"] > 0 && (
            <button
              onClick={() => setSelectedKelasFilter("Belum Ada Kelas")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                selectedKelasFilter === "Belum Ada Kelas"
                  ? "bg-yellow-600 text-white shadow-md"
                  : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
              }`}
            >
              Belum Ada Kelas ({getSiswaCountByKelas()["Belum Ada Kelas"]})
            </button>
          )}
        </div>
      </Card>

      {/* Search Bar */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            type="text"
            placeholder="Cari siswa berdasarkan nama, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data siswa...</p>
        </div>
      ) : filteredSiswa.length === 0 ? (
        <Card className="p-12 text-center border-green-100">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">
            {searchTerm || selectedKelasFilter !== "all"
              ? `Tidak ada siswa ${
                  selectedKelasFilter !== "all"
                    ? `di kelas ${selectedKelasFilter}`
                    : ""
                } ${searchTerm ? "yang cocok dengan pencarian" : ""}`
              : "Belum ada siswa terdaftar"}
          </p>
          {selectedKelasFilter !== "all" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedKelasFilter("all")}
              className="mt-4"
            >
              Tampilkan Semua Siswa
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSiswa.map((s) => (
            <Card key={s.id} className="p-6 border-green-100">
              {editingId === s.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Lengkap
                      </label>
                      <Input
                        value={editForm.full_name || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            full_name: e.target.value,
                          })
                        }
                        placeholder="Nama lengkap"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email (tidak bisa diubah)
                      </label>
                      <Input value={s.email} disabled className="bg-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kelas
                      </label>
                      <select
                        value={editForm.kelas || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, kelas: e.target.value })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Pilih Kelas</option>
                        {kelasOptions.map((kelas) => (
                          <option key={kelas.id} value={kelas.name}>
                            {kelas.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Lahir
                      </label>
                      <Input
                        type="date"
                        value={editForm.tanggal_lahir || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            tanggal_lahir: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        value={editForm.jenis_kelamin || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            jenis_kelamin: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Pilih jenis kelamin</option>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        No. Telepon
                      </label>
                      <Input
                        value={editForm.no_telepon || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            no_telepon: e.target.value,
                          })
                        }
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alamat
                      </label>
                      <Input
                        value={editForm.alamat || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, alamat: e.target.value })
                        }
                        placeholder="Alamat lengkap"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password Baru (opsional)
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type={showEditPassword ? "text" : "password"}
                          value={editForm.password || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              password: e.target.value,
                            })
                          }
                          placeholder="Kosongkan jika tidak ingin mengubah"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                        >
                          {showEditPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Minimal 6 karakter. Kosongkan jika tidak ingin mengubah
                        password.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={cancelEdit}>
                      <X size={16} className="mr-2" />
                      Batal
                    </Button>
                    <Button
                      onClick={saveEdit}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save size={16} className="mr-2" />
                      {saving ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {s.full_name}
                      </h3>
                      <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail size={16} />
                          {s.email}
                        </div>
                        {s.kelas && (
                          <div className="flex items-center gap-2">
                            <Users size={16} />
                            Kelas: {s.kelas}
                          </div>
                        )}
                        {s.jenis_kelamin && (
                          <div className="flex items-center gap-2">
                            <User size={16} />
                            {s.jenis_kelamin === "L"
                              ? "Laki-laki"
                              : "Perempuan"}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          Terdaftar:{" "}
                          {new Date(s.created_at).toLocaleDateString("id-ID")}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchProgress(s.id)}
                        className="border-blue-400 text-blue-600 hover:bg-blue-50"
                        title="Lihat Progress Materi"
                      >
                        <BookOpen size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(s)}
                        className="border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(s.id, s.full_name)}
                        className="border-red-400 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* Password Management Section */}
                  {(() => {
                    const tempPassword = getTemporaryPassword({
                      id: s.id,
                      email: s.email,
                    });
                    const hasPassword = tempPassword.length > 0;
                    const passwordStatus = passwordChangedStatus.get(s.id);
                    const currentPassword = userPasswords.get(s.id);
                    const hasChangedPassword =
                      passwordStatus?.changed ||
                      (currentPassword &&
                        currentPassword.password &&
                        currentPassword.password !== tempPassword);

                    return (
                      <div className="border-t mt-4 pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Key size={14} className="text-gray-500" />
                          <span className="text-xs font-medium text-gray-700">
                            Manajemen Password
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div>
                            {hasPassword ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <code className="text-xs font-mono bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">
                                  {tempPassword}
                                </code>
                              </div>
                            ) : null}
                          </div>

                          {/* Password Terbaru */}
                          {(hasChangedPassword || currentPassword) && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                {currentPassword &&
                                currentPassword.password !== tempPassword
                                  ? "Password Terbaru (Diganti User)"
                                  : "Password dari Database"}
                              </p>
                              {currentPassword ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <code className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                                    {currentPassword.password}
                                  </code>
                                  {currentPassword.updatedAt && (
                                    <span className="text-xs text-gray-500">
                                      {new Date(
                                        currentPassword.updatedAt
                                      ).toLocaleString("id-ID", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                      })}
                                    </span>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => getUserPassword(s.id)}
                                    className="text-xs h-6 px-2"
                                    title="Refresh password"
                                  >
                                    🔄
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">
                                    Loading...
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => getUserPassword(s.id)}
                                    className="text-xs h-6 px-2"
                                  >
                                    Muat
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setCreatedAccount(null);
            setUploadResults(null);
            setExcelData([]);
            setExcelFile(null);
            setUploadProgress(0);
            setAddMode("single");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Siswa Baru</DialogTitle>
          </DialogHeader>

          {/* Mode Selection */}
          {!createdAccount && !uploadResults && (
            <div className="flex gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
              <Button
                type="button"
                variant={addMode === "single" ? "default" : "outline"}
                onClick={() => setAddMode("single")}
                className="flex-1"
              >
                <User size={16} className="mr-2" />
                Tambah Satuan
              </Button>
              <Button
                type="button"
                variant={addMode === "bulk" ? "default" : "outline"}
                onClick={() => setAddMode("bulk")}
                className="flex-1"
              >
                <FileSpreadsheet size={16} className="mr-2" />
                Upload Excel
              </Button>
            </div>
          )}

          {createdAccount ? (
            // Show created account credentials (single)
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-3">
                  ✅ Akun siswa berhasil dibuat!
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <label className="font-medium text-gray-700">Email:</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-white rounded border">
                        {createdAccount.email}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(createdAccount.email)}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">
                      Password:
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-white rounded border">
                        {showPassword ? createdAccount.password : "••••••••"}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(createdAccount.password)}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  💾 Simpan password ini dan berikan kepada siswa.
                </p>
              </div>
              <Button
                onClick={() => {
                  setCreatedAccount(null);
                  setShowAddDialog(false);
                  setShowPassword(false);
                  fetchSiswa();
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Tutup
              </Button>
            </div>
          ) : uploadResults ? (
            // Show bulk upload results
            <div className="space-y-4">
              <div
                className={`p-4 border rounded-lg ${
                  uploadResults.failed === 0
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <p className="text-sm font-medium mb-3">📊 Hasil Upload:</p>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="text-center p-3 bg-white rounded">
                    <p className="text-2xl font-bold text-green-600">
                      {uploadResults.success}
                    </p>
                    <p className="text-xs text-gray-600">Berhasil</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded">
                    <p className="text-2xl font-bold text-red-600">
                      {uploadResults.failed}
                    </p>
                    <p className="text-xs text-gray-600">Gagal</p>
                  </div>
                </div>
                {uploadResults.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Detail Error:
                    </p>
                    <div className="max-h-40 overflow-y-auto bg-white rounded border p-2">
                      {uploadResults.errors.map((error, idx) => (
                        <p key={idx} className="text-xs text-red-600 mb-1">
                          • {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={() => {
                  setUploadResults(null);
                  setShowAddDialog(false);
                  setExcelData([]);
                  setExcelFile(null);
                  fetchSiswa();
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Tutup
              </Button>
            </div>
          ) : addMode === "single" ? (
            // Single add form
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <Input
                  value={addForm.full_name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, full_name: e.target.value })
                  }
                  placeholder="Nama lengkap siswa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm({ ...addForm, email: e.target.value })
                  }
                  placeholder="email@siswa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  value={addForm.password}
                  onChange={(e) =>
                    setAddForm({ ...addForm, password: e.target.value })
                  }
                  placeholder="Password untuk siswa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. Telepon
                </label>
                <Input
                  value={addForm.no_telepon}
                  onChange={(e) =>
                    setAddForm({ ...addForm, no_telepon: e.target.value })
                  }
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kelas
                </label>
                <select
                  value={addForm.kelas}
                  onChange={(e) =>
                    setAddForm({ ...addForm, kelas: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Pilih Kelas</option>
                  {kelasOptions.map((kelas) => (
                    <option key={kelas.id} value={kelas.name}>
                      {kelas.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setAddForm({
                      full_name: "",
                      email: "",
                      password: "",
                      no_telepon: "",
                      kelas: "",
                    });
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleAddSiswa}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "Menambahkan..." : "Tambah Siswa"}
                </Button>
              </div>
            </div>
          ) : (
            // Bulk upload form
            <div className="space-y-4">
              {/* Template Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle
                    size={20}
                    className="text-blue-600 flex-shrink-0 mt-0.5"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-2">
                      Format File Excel:
                    </p>
                    <p className="text-blue-800 mb-2">
                      File harus memiliki kolom berikut (header di baris
                      pertama):
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>
                        <strong>Nama</strong> - Nama lengkap siswa (wajib)
                      </li>
                      <li>
                        <strong>Email</strong> atau <strong>Akun</strong> -
                        Alamat email (wajib)
                      </li>
                      <li>
                        <strong>Password</strong> - Password akun (wajib)
                      </li>
                      <li>
                        <strong>No Telepon</strong> atau{" "}
                        <strong>Telepon</strong> - Nomor telepon (opsional)
                      </li>
                      <li>
                        <strong>Kelas</strong> - Nama kelas (opsional)
                      </li>
                    </ul>
                    <p className="text-xs text-blue-600 mt-2">
                      💡 Tips: Gunakan format .xlsx atau .xls
                    </p>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File Excel <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelUpload}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label htmlFor="excel-upload" className="cursor-pointer">
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    {excelFile ? (
                      <div>
                        <p className="text-sm font-medium text-green-600">
                          {excelFile.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {excelData.length} data terbaca
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Klik untuk upload file
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          atau drag & drop file disini
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Preview Data */}
              {excelData.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Preview Data ({excelData.length} baris):
                  </p>
                  <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left">No</th>
                          <th className="px-2 py-2 text-left">Nama</th>
                          <th className="px-2 py-2 text-left">Email</th>
                          <th className="px-2 py-2 text-left">Password</th>
                          <th className="px-2 py-2 text-left">Telepon</th>
                          <th className="px-2 py-2 text-left">Kelas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {excelData.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-2 py-2">{idx + 1}</td>
                            <td className="px-2 py-2">
                              {row.full_name || "-"}
                            </td>
                            <td className="px-2 py-2">{row.email || "-"}</td>
                            <td className="px-2 py-2">
                              {row.password ? "••••••" : "-"}
                            </td>
                            <td className="px-2 py-2">
                              {row.no_telepon || "-"}
                            </td>
                            <td className="px-2 py-2">{row.kelas || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {excelData.length > 10 && (
                      <p className="text-xs text-gray-500 text-center py-2 bg-gray-50">
                        ... dan {excelData.length - 10} baris lainnya
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isSubmitting && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Mengupload data... {uploadProgress}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setExcelData([]);
                    setExcelFile(null);
                  }}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleBulkCreate}
                  disabled={isSubmitting || excelData.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>Mengupload... {uploadProgress}%</>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      Upload {excelData.length} Siswa
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Progress Membaca Materi</DialogTitle>
          </DialogHeader>

          {loadingProgress ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat progress...</p>
            </div>
          ) : progressData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-3">
                    <BookOpen className="text-blue-600" size={24} />
                    <div>
                      <p className="text-2xl font-bold text-blue-900">
                        {progressData.total_materi}
                      </p>
                      <p className="text-xs text-blue-700">Total Materi</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center gap-3">
                    <Check className="text-green-600" size={24} />
                    <div>
                      <p className="text-2xl font-bold text-green-900">
                        {progressData.materi_completed}
                      </p>
                      <p className="text-xs text-green-700">Selesai Dibaca</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-3">
                    <Eye className="text-yellow-600" size={24} />
                    <div>
                      <p className="text-2xl font-bold text-yellow-900">
                        {progressData.materi_read}
                      </p>
                      <p className="text-xs text-yellow-700">Sudah Dibuka</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-purple-50 border-purple-200">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-purple-600" size={24} />
                    <div>
                      <p className="text-2xl font-bold text-purple-900">
                        {progressData.average_progress}%
                      </p>
                      <p className="text-xs text-purple-700">Rata-rata</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Kelas Info */}
              {progressData.kelas && (
                <div className="text-sm text-gray-600">
                  <strong>Kelas:</strong> {progressData.kelas}
                </div>
              )}

              {/* Progress List */}
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Detail Progress per Materi
                </h3>

                {progressData.progress && progressData.progress.length > 0 ? (
                  <div className="space-y-3">
                    {progressData.progress.map((p) => (
                      <Card key={p.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {p.materi.title}
                            </h4>
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600">
                                  Sub-bab selesai: {p.completed_sub_bab} /{" "}
                                  {p.total_sub_bab}
                                </span>
                                <span className="font-semibold text-blue-600">
                                  {p.progress_percentage}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full transition-all ${
                                    p.progress_percentage === 100
                                      ? "bg-green-600"
                                      : p.progress_percentage >= 50
                                      ? "bg-blue-600"
                                      : "bg-yellow-500"
                                  }`}
                                  style={{
                                    width: `${p.progress_percentage}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>
                                Terakhir dibaca:{" "}
                                {new Date(p.last_read_at).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                              {p.completed_at && (
                                <span className="text-green-600 font-medium">
                                  ✓ Selesai:{" "}
                                  {new Date(p.completed_at).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          {p.progress_percentage === 100 && (
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <Check className="text-green-600" size={20} />
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center border-dashed">
                    <BookOpen
                      size={48}
                      className="mx-auto text-gray-400 mb-3"
                    />
                    <p className="text-gray-600">
                      Siswa belum membaca materi apapun
                    </p>
                  </Card>
                )}
              </div>

              <Button
                onClick={() => {
                  setShowProgressDialog(false);
                  setProgressData(null);
                  setSelectedSiswaId(null);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Tutup
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Tidak ada data progress</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
