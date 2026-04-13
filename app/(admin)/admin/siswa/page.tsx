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
  FileText,
  CheckCircle2,
  FileUp,
  X as XIcon,
  GraduationCap,
  RefreshCw,
  Phone,
  MapPin,
  Lock,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const PHONE_NUMBER_REGEX = /^\d+$/;

  const supabase = createClient();
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [filteredSiswa, setFilteredSiswa] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<
    Partial<Siswa> & { password?: string }
  >({});
  const [originalEditForm, setOriginalEditForm] = useState<
    Partial<Siswa> & { password?: string }
  >({});
  const [editValidationErrors, setEditValidationErrors] = useState<
    Record<string, boolean>
  >({});
  const [editPhoneError, setEditPhoneError] = useState("");
  const [showEditPasswordError, setShowEditPasswordError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const clearEditValidationError = (field: string) => {
    setEditValidationErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

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
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addPhoneError, setAddPhoneError] = useState("");
  const [copied, setCopied] = useState(false);

  // Bulk upload state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const [passwordLoadingUsers, setPasswordLoadingUsers] = useState<Set<string>>(
    new Set(),
  );

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
            (p.temporaryPassword || "").length > 0),
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
          JSON.stringify(createdAccounts),
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
        },
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
    if (passwordLoadingUsers.has(userId)) return;

    setPasswordLoadingUsers((prev) => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });

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

      if (!res.ok) {
        const errorText = await res.text();
        let parsedError: any = null;
        try {
          parsedError = errorText ? JSON.parse(errorText) : null;
        } catch {
          parsedError = null;
        }
        console.error(
          "Error response getting user password:",
          `userId=${userId}`,
          `status=${res.status}`,
          `error=${parsedError?.error || errorText || "unknown"}`,
        );
        return;
      }

      const json = await res.json();
      setUserPasswords((prev) => {
        const newMap = new Map(prev);
        newMap.set(userId, {
          password: json.password || "",
          updatedAt: json.updatedAt || "",
        });
        return newMap;
      });
    } catch (error) {
      console.error(`Error getting user password:`, error);
    } finally {
      setUserPasswords((prev) => {
        if (prev.has(userId)) return prev;
        const newMap = new Map(prev);
        newMap.set(userId, { password: "", updatedAt: "" });
        return newMap;
      });
      setPasswordLoadingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
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
    title?: string,
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
            i.email,
          )}</td><td>${escapeHtml(i.temporaryPassword || "")}</td></tr>`,
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
        "Tidak bisa membuka jendela baru. Izinkan pop-up lalu coba lagi.",
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
      const response = await fetch(`/api/admin/siswa?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
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
          s.kelas?.toLowerCase().includes(term),
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
    setOriginalEditForm({ ...siswa });
    setEditValidationErrors({});
    setEditPhoneError("");
    setShowEditPasswordError(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
    setEditValidationErrors({});
    setEditPhoneError("");
    setShowEditPasswordError(false);
  }

  async function saveEdit() {
    if (!editingId) return;
    const targetId = editingId;

    const normalizedEditData = {
      full_name: String(editForm.full_name ?? "").trim(),
      kelas: String(editForm.kelas ?? "").trim(),
      tanggal_lahir: String(editForm.tanggal_lahir ?? "").trim(),
      jenis_kelamin: String(editForm.jenis_kelamin ?? "").trim(),
      no_telepon: String(editForm.no_telepon ?? "").trim(),
      alamat: String(editForm.alamat ?? "").trim(),
    };

    const requiredFields = [
      { key: "full_name", label: "Nama lengkap" },
      { key: "kelas", label: "Kelas" },
      { key: "tanggal_lahir", label: "Tanggal lahir" },
      { key: "jenis_kelamin", label: "Jenis kelamin" },
      { key: "no_telepon", label: "No. Telepon" },
      { key: "alamat", label: "Alamat" },
    ];

    const nextErrors: Record<string, boolean> = {};
    requiredFields.forEach((field) => {
      const key = field.key as keyof typeof normalizedEditData;
      const currentValue = normalizedEditData[key];
      const originalValue = String(
        originalEditForm[key as keyof typeof originalEditForm] ?? "",
      ).trim();

      // Hanya tampilkan error jika field awalnya ada isinya tapi kemudian dihapus
      if (originalValue && !currentValue) {
        nextErrors[key] = true;
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setEditValidationErrors(nextErrors);
      toast.error("Lengkapi semua field wajib sebelum menyimpan");
      return;
    }

    if (!PHONE_NUMBER_REGEX.test(normalizedEditData.no_telepon)) {
      setEditValidationErrors((prev) => ({ ...prev, no_telepon: true }));
      setEditPhoneError("No. Telepon hanya boleh berisi angka.");
      toast.error("No. Telepon hanya boleh berisi angka");
      return;
    }

    setEditValidationErrors({});
    setEditPhoneError("");

    // Client-side validation for optional new password
    if (
      editForm.password &&
      editForm.password.trim().length > 0 &&
      editForm.password.trim().length < 6
    ) {
      setShowEditPasswordError(true);
      toast.error("Password baru minimal 6 karakter");
      return;
    }

    setShowEditPasswordError(false);

    setSaving(true);
    try {
      const updateData: any = {
        id: editingId,
        full_name: normalizedEditData.full_name,
        kelas: normalizedEditData.kelas,
        tanggal_lahir: normalizedEditData.tanggal_lahir,
        jenis_kelamin: normalizedEditData.jenis_kelamin,
        no_telepon: normalizedEditData.no_telepon,
        alamat: normalizedEditData.alamat,
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

      // Optimistic UI update so edited data appears immediately.
      setSiswa((prev) =>
        prev.map((s) =>
          s.id === targetId
            ? {
                ...s,
                full_name: normalizedEditData.full_name,
                kelas: normalizedEditData.kelas,
                tanggal_lahir: normalizedEditData.tanggal_lahir,
                jenis_kelamin: normalizedEditData.jenis_kelamin,
                no_telepon: normalizedEditData.no_telepon,
                alamat: normalizedEditData.alamat,
              }
            : s,
        ),
      );
      setFilteredSiswa((prev) =>
        prev.map((s) =>
          s.id === targetId
            ? {
                ...s,
                full_name: normalizedEditData.full_name,
                kelas: normalizedEditData.kelas,
                tanggal_lahir: normalizedEditData.tanggal_lahir,
                jenis_kelamin: normalizedEditData.jenis_kelamin,
                no_telepon: normalizedEditData.no_telepon,
                alamat: normalizedEditData.alamat,
              }
            : s,
        ),
      );

      toast.success("Data siswa berhasil diupdate");
      setEditingId(null);
      setEditForm({});
      setEditValidationErrors({});
      setEditPhoneError("");
      setShowEditPasswordError(false);
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
    setDeleteTarget({ id, name });
  }

  async function confirmDeleteSiswa() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    // Optimistic update - langsung hapus dari UI
    const previousSiswa = [...siswa];
    const previousFiltered = [...filteredSiswa];

    setSiswa((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setFilteredSiswa((prev) => prev.filter((s) => s.id !== deleteTarget.id));

    try {
      const response = await fetch(`/api/admin/siswa?id=${deleteTarget.id}`, {
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
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Error deleting siswa:", err);
      toast.error(err.message || "Gagal menghapus siswa");
    } finally {
      setIsDeleting(false);
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

        const normalizeHeader = (value: string) =>
          String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

        const getByAliases = (row: any, aliases: string[]) => {
          const entries = Object.entries(row || {});
          const normalizedAliasSet = new Set(aliases.map(normalizeHeader));
          for (const [key, val] of entries) {
            if (normalizedAliasSet.has(normalizeHeader(key))) {
              return val;
            }
          }
          return "";
        };

        // Validate data structure
        const validatedData = data.map((row: any, index) => {
          const rowNum = index + 2; // Excel row number (header is row 1)
          return {
            full_name: getByAliases(row, ["nama", "full name", "full_name"]),
            email: getByAliases(row, ["email", "akun"]),
            password: getByAliases(row, ["password", "kata sandi", "sandi"]),
            no_telepon: getByAliases(row, [
              "no telepon",
              "nomor telepon",
              "no hp",
              "nomor hp",
              "telepon",
              "phone",
              "no_telepon",
            ]),
            kelas: getByAliases(row, ["kelas", "class"]),
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

  // Handle template download for siswa bulk import
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nama", "Email", "Password", "No Telepon", "Kelas"],
      [
        "Contoh Siswa",
        "siswa@sekolah.com",
        "password123",
        "08123456789",
        "X RPL",
      ],
    ]);
    ws["!cols"] = [
      { wch: 24 },
      { wch: 28 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
    XLSX.writeFile(wb, "template_import_siswa.xlsx");
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

    const newAccounts: Array<{
      id: string;
      full_name: string;
      email: string;
      temporaryPassword: string;
    }> = [];

    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      setUploadProgress(Math.round(((i + 1) / excelData.length) * 100));

      const fullName = String(row.full_name ?? "").trim();
      const email = String(row.email ?? "").trim();
      const password = String(row.password ?? "").trim();
      const noTelepon = String(row.no_telepon ?? "").trim();
      const kelas = String(row.kelas ?? "").trim();

      // Validate required fields
      if (!fullName || !email || !password) {
        results.failed++;
        results.errors.push(
          `Baris ${row.rowNum}: Data tidak lengkap (Nama, Email, dan Password harus diisi)`,
        );
        continue;
      }

      try {
        const response = await fetch("/api/admin/siswa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            full_name: fullName,
            password,
            no_telepon: noTelepon || null,
            kelas: kelas || null,
            sendEmail: false,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          results.failed++;
          if (data.error === "email_exists") {
            results.errors.push(
              `Baris ${row.rowNum}: Email ${row.email} sudah terdaftar`,
            );
          } else {
            results.errors.push(
              `Baris ${row.rowNum}: ${data.error || "Gagal menambahkan"}`,
            );
          }
          continue;
        }

        results.success++;
        newAccounts.push({
          id: data.id,
          full_name: fullName,
          email: data.email || email,
          temporaryPassword: password,
        });
      } catch (err: any) {
        results.failed++;
        results.errors.push(
          `Baris ${row.rowNum}: ${err.message || "Terjadi kesalahan"}`,
        );
      }
    }

    // Save new accounts to state
    if (newAccounts.length > 0) {
      setCreatedAccounts((prev) => {
        const next = [...newAccounts, ...prev];
        localStorage.setItem(
          "admin_created_accounts_siswa",
          JSON.stringify(next),
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
    const normalizedPhone = String(addForm.no_telepon ?? "").trim();

    if (
      !addForm.full_name.trim() ||
      !addForm.email.trim() ||
      !addForm.password.trim()
    ) {
      toast.error("Nama, email, dan password harus diisi");
      return;
    }

    if (normalizedPhone && !PHONE_NUMBER_REGEX.test(normalizedPhone)) {
      setAddPhoneError("No. Telepon hanya boleh berisi angka.");
      toast.error("No. Telepon hanya boleh berisi angka");
      return;
    }

    setAddPhoneError("");

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/siswa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addForm.email.trim(),
          full_name: addForm.full_name.trim(),
          password: addForm.password.trim(),
          no_telepon: normalizedPhone || null,
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
          JSON.stringify(next),
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
      setAddPhoneError("");

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
        `/api/admin/materi-progress?siswa_id=${siswaId}`,
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

  const isEditPasswordTooShort =
    showEditPasswordError &&
    !!editForm.password &&
    editForm.password.trim().length > 0 &&
    editForm.password.trim().length < 6;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Kelola Siswa</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedKelasFilter === "all" ? (
              <>
                <strong className="text-green-600 font-semibold">
                  {siswa.length}
                </strong>{" "}
                siswa terdaftar
              </>
            ) : (
              <>
                <strong className="text-green-600 font-semibold">
                  {filteredSiswa.length}
                </strong>{" "}
                siswa di kelas{" "}
                <strong className="text-green-600 font-semibold">
                  {selectedKelasFilter}
                </strong>
              </>
            )}
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-green-600 hover:bg-green-700 rounded-lg px-5 py-2.5 transition hover:scale-[1.02]"
        >
          <Plus size={16} className="mr-2" />
          Tambah Siswa
        </Button>
      </div>
      {/* Filter by Kelas */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap mr-1">
            Kelas:
          </span>
          <button
            onClick={() => setSelectedKelasFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
              selectedKelasFilter === "all"
                ? "bg-green-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  selectedKelasFilter === kelas.name
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {kelas.name} ({count})
              </button>
            );
          })}
          {getSiswaCountByKelas()["Belum Ada Kelas"] > 0 && (
            <button
              onClick={() => setSelectedKelasFilter("Belum Ada Kelas")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                selectedKelasFilter === "Belum Ada Kelas"
                  ? "bg-yellow-500 text-white shadow-sm"
                  : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
              }`}
            >
              Belum Ada Kelas ({getSiswaCountByKelas()["Belum Ada Kelas"]})
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <Input
            type="text"
            placeholder="Cari siswa berdasarkan nama, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
          />
        </div>
      </div>

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
        <div className="grid gap-3">
          {filteredSiswa.map((s) => (
            <div
              key={s.id}
              className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {editingId === s.id ? (
                // Edit Mode
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* Edit Header */}
                  <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {s.full_name ? s.full_name.charAt(0).toUpperCase() : "S"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {s.full_name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {s.email}
                      </p>
                    </div>
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 flex-shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* All fields in one compact 2-col grid */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {/* Nama Lengkap */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Nama Lengkap
                      </label>
                      <div className="relative">
                        <User
                          size={12}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <Input
                          value={editForm.full_name || ""}
                          onChange={(e) => {
                            setEditForm({
                              ...editForm,
                              full_name: e.target.value,
                            });
                            clearEditValidationError("full_name");
                          }}
                          placeholder="Nama lengkap"
                          className={`h-8 text-sm pl-7 transition ${
                            editValidationErrors.full_name
                              ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                              : "border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                          }`}
                        />
                      </div>
                      {editValidationErrors.full_name && (
                        <p className="mt-1 text-[11px] text-red-600">
                          Nama lengkap wajib diisi.
                        </p>
                      )}
                    </div>
                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail
                          size={12}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <Input
                          value={s.email}
                          disabled
                          className="h-8 text-sm pl-7 bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    {/* Kelas */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Kelas
                      </label>
                      <div className="relative">
                        <GraduationCap
                          size={12}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                        />
                        <select
                          value={editForm.kelas || ""}
                          onChange={(e) => {
                            setEditForm({ ...editForm, kelas: e.target.value });
                            clearEditValidationError("kelas");
                          }}
                          className={`w-full pl-7 pr-2 h-8 rounded-md border bg-white text-sm text-gray-700 focus:outline-none transition ${
                            editValidationErrors.kelas
                              ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                              : "border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                          }`}
                        >
                          <option value="">Pilih Kelas</option>
                          {kelasOptions.map((kelas) => (
                            <option key={kelas.id} value={kelas.name}>
                              {kelas.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {editValidationErrors.kelas && (
                        <p className="mt-1 text-[11px] text-red-600">
                          Kelas wajib diisi.
                        </p>
                      )}
                    </div>
                    {/* Tanggal Lahir */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Tanggal Lahir
                      </label>
                      <div className="relative">
                        <Calendar
                          size={12}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <Input
                          type="date"
                          value={editForm.tanggal_lahir || ""}
                          onChange={(e) => {
                            setEditForm({
                              ...editForm,
                              tanggal_lahir: e.target.value,
                            });
                            clearEditValidationError("tanggal_lahir");
                          }}
                          className={`h-8 text-sm pl-7 transition ${
                            editValidationErrors.tanggal_lahir
                              ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                              : "border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                          }`}
                        />
                      </div>
                      {editValidationErrors.tanggal_lahir && (
                        <p className="mt-1 text-[11px] text-red-600">
                          Tanggal lahir wajib diisi.
                        </p>
                      )}
                    </div>
                    {/* Jenis Kelamin */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Jenis Kelamin
                      </label>
                      <div className="relative">
                        <User
                          size={12}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                        />
                        <select
                          value={editForm.jenis_kelamin || ""}
                          onChange={(e) => {
                            setEditForm({
                              ...editForm,
                              jenis_kelamin: e.target.value,
                            });
                            clearEditValidationError("jenis_kelamin");
                          }}
                          className={`w-full pl-7 pr-2 h-8 rounded-md border bg-white text-sm text-gray-700 focus:outline-none transition ${
                            editValidationErrors.jenis_kelamin
                              ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                              : "border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                          }`}
                        >
                          <option value="">Pilih jenis kelamin</option>
                          <option value="L">Laki-laki</option>
                          <option value="P">Perempuan</option>
                        </select>
                      </div>
                      {editValidationErrors.jenis_kelamin && (
                        <p className="mt-1 text-[11px] text-red-600">
                          Jenis kelamin wajib diisi.
                        </p>
                      )}
                    </div>
                    {/* No. Telepon */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        No. Telepon
                      </label>
                      <div className="relative">
                        <Phone
                          size={12}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <Input
                          value={editForm.no_telepon || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value && /\D/.test(value)) {
                              setEditPhoneError(
                                "No. Telepon hanya boleh berisi angka.",
                              );
                            } else {
                              setEditPhoneError("");
                            }
                            setEditForm({
                              ...editForm,
                              no_telepon: value,
                            });
                            if (value.trim()) {
                              clearEditValidationError("no_telepon");
                            }
                          }}
                          inputMode="numeric"
                          placeholder="08xxxxxxxxxx"
                          className={`h-8 text-sm pl-7 transition ${
                            editValidationErrors.no_telepon
                              ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                              : "border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                          }`}
                        />
                      </div>
                      {(editValidationErrors.no_telepon ||
                        !!editPhoneError) && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {editPhoneError || "No. Telepon wajib diisi."}
                        </p>
                      )}
                    </div>
                    {/* Alamat — full width */}
                    <div className="col-span-2">
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Alamat
                      </label>
                      <div className="relative">
                        <MapPin
                          size={12}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <Input
                          value={editForm.alamat || ""}
                          onChange={(e) => {
                            setEditForm({
                              ...editForm,
                              alamat: e.target.value,
                            });
                            clearEditValidationError("alamat");
                          }}
                          placeholder="Alamat lengkap"
                          className={`h-8 text-sm pl-7 transition ${
                            editValidationErrors.alamat
                              ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                              : "border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                          }`}
                        />
                      </div>
                      {editValidationErrors.alamat && (
                        <p className="mt-1 text-[11px] text-red-600">
                          Alamat wajib diisi.
                        </p>
                      )}
                    </div>
                    {/* Password row — current pw left, new pw right */}
                    <div className="col-span-2 grid grid-cols-2 gap-x-3 pt-1 border-t border-gray-100 mt-1">
                      {/* Current password (read-only display) */}
                      {(() => {
                        const currentPw = userPasswords.get(s.id)?.password;
                        const tempPw = getTemporaryPassword({
                          id: s.id,
                          email: s.email,
                        });
                        const displayPw = currentPw || tempPw;
                        return (
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">
                              Password Saat Ini
                            </label>
                            <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-gray-100 bg-gray-50">
                              <Key
                                size={11}
                                className="text-gray-400 flex-shrink-0"
                              />
                              {displayPw ? (
                                <code className="text-xs font-mono text-gray-700 flex-1 truncate">
                                  {displayPw}
                                </code>
                              ) : (
                                <span className="text-[11px] text-gray-400 italic flex-1">
                                  Belum tersimpan
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => getUserPassword(s.id)}
                                className="text-gray-400 hover:text-green-600 transition flex-shrink-0"
                                title="Refresh"
                              >
                                <RefreshCw size={10} />
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                      {/* New password input */}
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">
                          Password Baru{" "}
                          <span className="text-gray-400 font-normal">
                            (opsional)
                          </span>
                        </label>
                        <div className="relative">
                          <Lock
                            size={12}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                          <Input
                            type={showEditPassword ? "text" : "password"}
                            value={editForm.password || ""}
                            onChange={(e) => {
                              const password = e.target.value;
                              setEditForm({
                                ...editForm,
                                password,
                              });
                              if (
                                !password.trim() ||
                                password.trim().length >= 6
                              ) {
                                setShowEditPasswordError(false);
                              }
                            }}
                            placeholder="Min. 6 karakter"
                            className={`h-8 text-sm pl-7 pr-8 transition ${
                              isEditPasswordTooShort
                                ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                : "border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowEditPassword(!showEditPassword)
                            }
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                          >
                            {showEditPassword ? (
                              <EyeOff size={12} />
                            ) : (
                              <Eye size={12} />
                            )}
                          </button>
                        </div>
                        {isEditPasswordTooShort && (
                          <p className="mt-1 text-[11px] text-red-600">
                            Password minimal 6 karakter.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                    <Button
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={saving}
                      className="h-8 text-sm px-3 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={saveEdit}
                      disabled={saving}
                      className="h-8 text-sm px-4 bg-green-600 hover:bg-green-700 rounded-lg min-w-[90px] transition"
                    >
                      {saving ? (
                        <span className="flex items-center gap-1.5">
                          <svg
                            className="animate-spin h-3.5 w-3.5 text-white"
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
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Save size={13} />
                          Simpan
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {s.full_name ? s.full_name.charAt(0).toUpperCase() : "S"}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                          {s.full_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail size={11} className="flex-shrink-0" />{" "}
                            {s.email}
                          </span>
                          {s.kelas ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-md border border-green-100 font-medium">
                              <GraduationCap size={10} /> {s.kelas}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-md border border-yellow-100">
                              Belum ada kelas
                            </span>
                          )}
                          {s.jenis_kelamin && (
                            <span className="text-xs text-gray-400">
                              {s.jenis_kelamin === "L"
                                ? "Laki-laki"
                                : "Perempuan"}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar size={10} className="flex-shrink-0" />
                            {new Date(s.created_at).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => fetchProgress(s.id)}
                          title="Lihat Progress Materi"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150"
                        >
                          <BookOpen size={14} />
                        </button>
                        <button
                          onClick={() => startEdit(s)}
                          title="Edit"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-all duration-150"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.full_name)}
                          title="Hapus"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                        >
                          <Trash2 size={14} />
                        </button>
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
                        <div className="mt-3 pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Key size={11} className="text-gray-400" />
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                              Password
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Temp password from localStorage */}
                            {hasPassword && (
                              <code className="text-xs font-mono bg-green-50 text-green-700 px-2.5 py-1 rounded-lg border border-green-100">
                                {tempPassword}
                              </code>
                            )}

                            {/* Current password from DB — always render once loaded */}
                            {currentPassword !== undefined ? (
                              currentPassword.password ? (
                                <div className="flex items-center gap-1.5">
                                  <code className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                                    {currentPassword.password}
                                  </code>
                                  {currentPassword.updatedAt && (
                                    <span className="text-xs text-gray-400">
                                      {new Date(
                                        currentPassword.updatedAt,
                                      ).toLocaleString("id-ID", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                      })}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => getUserPassword(s.id)}
                                    title="Refresh password"
                                    className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all duration-150"
                                  >
                                    <RefreshCw size={10} />
                                  </button>
                                </div>
                              ) : (
                                !hasPassword && (
                                  <span className="text-xs text-gray-400 italic">
                                    Belum tersimpan — atur password baru lewat
                                    edit
                                  </span>
                                )
                              )
                            ) : passwordLoadingUsers.has(s.id) ? (
                              !hasPassword && (
                                <span className="text-xs text-gray-300">
                                  Memuat...
                                </span>
                              )
                            ) : (
                              !hasPassword && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-gray-300">
                                    Tidak ada password tersimpan
                                  </span>
                                  <button
                                    onClick={() => getUserPassword(s.id)}
                                    className="text-xs text-green-600 hover:underline"
                                  >
                                    Coba lagi
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
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
            setShowAddPassword(false);
            setIsDragOver(false);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
          <DialogHeader className="space-y-1 pb-1">
            <DialogTitle className="text-[30px] leading-tight font-semibold text-gray-900 tracking-tight">
              Tambah Siswa Baru
            </DialogTitle>
            <DialogDescription className="text-[13px] text-gray-500">
              Tambahkan akun siswa untuk mengakses sistem pembelajaran.
            </DialogDescription>
          </DialogHeader>

          {/* Mode Selection */}
          {!createdAccount && !uploadResults && (
            <div className="flex gap-0.5 mb-5 p-1 bg-gray-100 rounded-xl border border-gray-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddMode("single")}
                className={`flex-1 rounded-lg py-2.5 text-sm transition-all duration-150 ${
                  addMode === "single"
                    ? "bg-green-600 text-white shadow-sm hover:bg-green-700"
                    : "text-gray-600 hover:bg-white"
                }`}
              >
                <User size={16} className="mr-2" />
                Tambah Satuan
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddMode("bulk")}
                className={`flex-1 rounded-lg py-2.5 text-sm transition-all duration-150 ${
                  addMode === "bulk"
                    ? "bg-green-600 text-white shadow-sm hover:bg-green-700"
                    : "text-gray-600 hover:bg-white"
                }`}
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
            <div className="space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <Input
                    value={addForm.full_name}
                    onChange={(e) =>
                      setAddForm({ ...addForm, full_name: e.target.value })
                    }
                    placeholder="Nama lengkap siswa"
                    className="pl-9 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition py-2.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <Input
                    type="email"
                    value={addForm.email}
                    onChange={(e) =>
                      setAddForm({ ...addForm, email: e.target.value })
                    }
                    placeholder="email@siswa.com"
                    className="pl-9 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition py-2.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <Input
                    type={showAddPassword ? "text" : "password"}
                    value={addForm.password}
                    onChange={(e) =>
                      setAddForm({ ...addForm, password: e.target.value })
                    }
                    placeholder="Password untuk siswa"
                    className="pl-9 pr-10 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition py-2.5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showAddPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  No. Telepon
                </label>
                <div className="relative">
                  <Phone
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <Input
                    value={addForm.no_telepon}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && /\D/.test(value)) {
                        setAddPhoneError(
                          "No. Telepon hanya boleh berisi angka.",
                        );
                      } else {
                        setAddPhoneError("");
                      }
                      setAddForm({ ...addForm, no_telepon: value });
                    }}
                    inputMode="numeric"
                    placeholder="08xxxxxxxxxx"
                    className={`pl-9 transition py-2.5 ${
                      addPhoneError
                        ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    }`}
                  />
                </div>
                {addPhoneError && (
                  <p className="mt-1 text-xs text-red-600">{addPhoneError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kelas
                </label>
                <select
                  value={addForm.kelas}
                  onChange={(e) =>
                    setAddForm({ ...addForm, kelas: e.target.value })
                  }
                  className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                >
                  <option value="">Pilih Kelas</option>
                  {kelasOptions.map((kelas) => (
                    <option key={kelas.id} value={kelas.name}>
                      {kelas.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
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
                    setAddPhoneError("");
                    setShowAddPassword(false);
                  }}
                  className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleAddSiswa}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg px-5 py-2.5 transition hover:scale-[1.02]"
                >
                  {isSubmitting ? "Menambahkan..." : "Tambah Siswa"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText size={15} className="text-blue-600" />
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900 mb-1.5">
                        Format File Excel
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        {[
                          {
                            col: "Nama",
                            note: "Nama lengkap siswa",
                            required: true,
                          },
                          {
                            col: "Email / Akun",
                            note: "Alamat email",
                            required: true,
                          },
                          {
                            col: "Password",
                            note: "Password akun",
                            required: true,
                          },
                          {
                            col: "No Telepon",
                            note: "Nomor telepon",
                            required: false,
                          },
                          {
                            col: "Kelas",
                            note: "Nama kelas",
                            required: false,
                          },
                        ].map((item) => (
                          <div
                            key={item.col}
                            className="flex items-center gap-1.5 text-xs"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                item.required ? "bg-blue-500" : "bg-gray-300"
                              }`}
                            />
                            <span className="font-medium text-blue-800">
                              {item.col}
                            </span>
                            <span className="text-blue-600">- {item.note}</span>
                            {item.required ? (
                              <span className="text-red-400 text-[10px] font-medium">
                                wajib
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[10px]">
                                opsional
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-150 flex-shrink-0 shadow-sm"
                  >
                    <Download size={12} />
                    Template
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                  id="excel-upload-siswa"
                />
                {excelFile ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl animate-in fade-in duration-200">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet size={18} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800 truncate">
                        {excelFile.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CheckCircle2 size={12} className="text-green-500" />
                        <p className="text-xs text-green-600">
                          {excelData.length} baris data siap diupload
                        </p>
                        <span className="text-green-300">.</span>
                        <p className="text-xs text-green-500">
                          {(excelFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setExcelFile(null);
                        setExcelData([]);
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="excel-upload-siswa"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file)
                        handleExcelUpload({
                          target: { files: e.dataTransfer.files },
                        } as any);
                    }}
                    className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-200 ${
                      isDragOver
                        ? "border-green-400 bg-green-50 scale-[1.01]"
                        : "border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50/50"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        isDragOver
                          ? "bg-green-100"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <FileUp
                        size={22}
                        className={
                          isDragOver ? "text-green-600" : "text-gray-400"
                        }
                      />
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-sm font-medium transition-colors ${
                          isDragOver ? "text-green-700" : "text-gray-700"
                        }`}
                      >
                        {isDragOver
                          ? "Lepaskan file di sini"
                          : "Klik atau drag & drop file Excel"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        .xlsx atau .xls . Maks 10 MB
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {excelData.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      Preview Data
                    </p>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {excelData.length} baris
                    </span>
                  </div>
                  <div className="border border-gray-100 rounded-xl overflow-hidden max-h-52 overflow-y-auto shadow-sm">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0 border-b border-gray-100">
                        <tr>
                          {[
                            "#",
                            "Nama",
                            "Email",
                            "Password",
                            "Telepon",
                            "Kelas",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-3 py-2 text-left font-medium text-gray-500"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {excelData.slice(0, 10).map((row, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-3 py-2 text-gray-400">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-700">
                              {row.full_name || "-"}
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {row.email || "-"}
                            </td>
                            <td className="px-3 py-2">
                              {row.password ? (
                                <span className="text-gray-400 tracking-widest">
                                  ••••••
                                </span>
                              ) : (
                                <span className="text-red-400">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {row.no_telepon || "-"}
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {row.kelas || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {excelData.length > 10 && (
                      <p className="text-xs text-gray-400 text-center py-2 bg-gray-50 border-t border-gray-100">
                        +{excelData.length - 10} baris lainnya tidak ditampilkan
                      </p>
                    )}
                  </div>
                </div>
              )}

              {isSubmitting && (
                <div className="animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-gray-600">
                      Mengupload data...
                    </p>
                    <p className="text-xs font-semibold text-green-600">
                      {uploadProgress}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setExcelData([]);
                    setExcelFile(null);
                  }}
                  className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg"
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleBulkCreate}
                  disabled={isSubmitting || excelData.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg px-5 py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin w-4 h-4"
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
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Mengupload... {uploadProgress}%
                    </span>
                  ) : (
                    <>
                      <Upload size={15} className="mr-1.5" />
                      Upload{" "}
                      {excelData.length > 0
                        ? `${excelData.length} Siswa`
                        : "Siswa"}
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
                                  },
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
                                    },
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

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-xl border border-gray-100 p-7 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Hapus Siswa
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              {deleteTarget
                ? `Yakin ingin menghapus siswa "${deleteTarget.name}"?`
                : "Yakin ingin menghapus data siswa ini?"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteSiswa}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
