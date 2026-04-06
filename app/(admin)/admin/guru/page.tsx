"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Users,
  Mail,
  Calendar,
  UserCog,
  Plus,
  Search,
  Trash2,
  Key,
  Download,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit,
  Save,
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  User,
  Lock,
  Phone,
  MapPin,
  RefreshCw,
  FileText,
  CheckCircle2,
  FileUp,
  X as XIcon,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Guru {
  id: string;
  email: string;
  full_name: string;
  jenis_kelamin?: string | null;
  no_telepon?: string;
  alamat?: string;
  created_at: string;
}

export default function AdminGuruPage() {
  const [guru, setGuru] = useState<Guru[]>([]);
  const [filteredGuru, setFilteredGuru] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Add form state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addMode, setAddMode] = useState<"single" | "bulk">("single");
  const [addForm, setAddForm] = useState({
    full_name: "",
    email: "",
    password: "",
    no_telepon: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
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

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<
    Partial<Guru> & { password?: string }
  >({});
  const [saving, setSaving] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

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
  const [passwordRequestedUsers, setPasswordRequestedUsers] = useState<
    Set<string>
  >(new Set());

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
      const raw = localStorage.getItem("admin_created_accounts_guru");
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
      const raw = localStorage.getItem("admin_created_accounts_guru");
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
      const raw = localStorage.getItem("admin_created_accounts_guru");
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
          "admin_created_accounts_guru",
          JSON.stringify(createdAccounts),
        );
      } catch (e) {
        console.warn("Failed to save created accounts", e);
      }
    }
  }, [createdAccounts]);

  useEffect(() => {
    fetchGuru();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredGuru(guru);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredGuru(
        guru.filter(
          (g) =>
            g.full_name?.toLowerCase().includes(term) ||
            g.email?.toLowerCase().includes(term),
        ),
      );
    }
  }, [searchTerm, guru]);

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
      if (res.ok) {
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
    } finally {
      setPasswordRequestedUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
      setPasswordLoadingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  // Check password status when guru data changes
  useEffect(() => {
    if (guru.length > 0) {
      const allIds = guru.map((g) => g.id);
      checkPasswordStatus(allIds);
      allIds.forEach((userId) => {
        getUserPassword(userId);
      });
    }
  }, [guru]);

  // Auto-refresh password status every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (guru.length > 0) {
        checkPasswordStatus(guru.map((g) => g.id));
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [guru]);

  const fetchGuru = async () => {
    try {
      const res = await fetch(`/api/admin/guru?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch guru");
      setGuru(json.data || []);
      setFilteredGuru(json.data || []);
    } catch (error) {
      console.error("Error fetching guru:", error);
      toast.error("Gagal memuat data guru");
      setGuru([]);
    } finally {
      setLoading(false);
    }
  };

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

        const validatedData = data.map((row: any, index) => {
          const rowNum = index + 2;
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

  // Handle template download
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nama", "Email", "Password", "No Telepon"],
      ["Contoh Guru", "guru@sekolah.com", "password123", "08123456789"],
    ]);
    ws["!cols"] = [{ wch: 24 }, { wch: 28 }, { wch: 16 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Guru");
    XLSX.writeFile(wb, "template_import_guru.xlsx");
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

      if (!row.full_name || !row.email || !row.password) {
        results.failed++;
        results.errors.push(
          `Baris ${row.rowNum}: Data tidak lengkap (Nama, Email, dan Password harus diisi)`,
        );
        continue;
      }

      try {
        const response = await fetch("/api/admin/guru", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: row.email.trim(),
            full_name: row.full_name.trim(),
            password: row.password.trim(),
            no_telepon: row.no_telepon?.trim() || null,
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
          full_name: row.full_name.trim(),
          email: data.email || row.email,
          temporaryPassword: row.password.trim(),
        });
      } catch (err: any) {
        results.failed++;
        results.errors.push(
          `Baris ${row.rowNum}: ${err.message || "Terjadi kesalahan"}`,
        );
      }
    }

    if (newAccounts.length > 0) {
      setCreatedAccounts((prev) => {
        const next = [...newAccounts, ...prev];
        localStorage.setItem(
          "admin_created_accounts_guru",
          JSON.stringify(next),
        );
        return next;
      });
      setSessionCreatedAccounts((prev) => [...newAccounts, ...prev]);
    }

    setUploadResults(results);
    setIsSubmitting(false);

    if (results.success > 0) {
      toast.success(`Berhasil menambahkan ${results.success} guru`);
    }
    if (results.failed > 0) {
      toast.error(`Gagal menambahkan ${results.failed} guru`);
    }

    setTimeout(() => {
      fetchGuru();
    }, 500);
  };

  async function handleAddGuru() {
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
      const response = await fetch("/api/admin/guru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addForm.email.trim(),
          full_name: addForm.full_name.trim(),
          password: addForm.password.trim(),
          no_telepon: addForm.no_telepon?.trim() || null,
          sendEmail: false,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error === "email_exists") {
          throw new Error("Email sudah terdaftar");
        }
        throw new Error(data.error || "Gagal menambahkan guru");
      }
      setCreatedAccount({
        email: data.email,
        password: addForm.password.trim(),
      });
      const newEntry = {
        id: data.id,
        full_name: addForm.full_name.trim(),
        email: data.email || "",
        temporaryPassword: addForm.password.trim(),
      };
      setCreatedAccounts((prev) => {
        const next = [newEntry, ...prev];
        localStorage.setItem(
          "admin_created_accounts_guru",
          JSON.stringify(next),
        );
        return next;
      });
      setSessionCreatedAccounts((prev) => [newEntry, ...prev]);
      toast.success("Guru berhasil ditambahkan!");
      setAddForm({ full_name: "", email: "", password: "", no_telepon: "" });
      setTimeout(() => {
        fetchGuru();
      }, 500);
    } catch (err: any) {
      console.error("Error adding guru:", err);
      toast.error(err.message || "Gagal menambahkan guru");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(guru: Guru) {
    setEditingId(guru.id);
    setEditForm({ ...guru });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit() {
    if (!editingId) return;
    const targetId = editingId;

    // Client-side validation
    if (
      editForm.password &&
      editForm.password.trim().length > 0 &&
      editForm.password.trim().length < 6
    ) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        id: editingId,
        full_name: editForm.full_name,
        jenis_kelamin: editForm.jenis_kelamin ?? null,
        no_telepon: editForm.no_telepon ?? null,
        alamat: editForm.alamat ?? null,
      };

      // Only include password if it's been provided
      if (editForm.password && editForm.password.trim()) {
        updateData.password = editForm.password;
      }

      const response = await fetch("/api/admin/guru", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Failed to update guru");
      }

      // Optimistic UI update so changes appear immediately.
      setGuru((prev) =>
        prev.map((g) =>
          g.id === targetId
            ? {
                ...g,
                full_name: editForm.full_name ?? g.full_name,
                no_telepon: editForm.no_telepon ?? undefined,
                alamat: editForm.alamat ?? undefined,
                jenis_kelamin: editForm.jenis_kelamin ?? null,
              }
            : g,
        ),
      );
      setFilteredGuru((prev) =>
        prev.map((g) =>
          g.id === targetId
            ? {
                ...g,
                full_name: editForm.full_name ?? g.full_name,
                no_telepon: editForm.no_telepon ?? undefined,
                alamat: editForm.alamat ?? undefined,
                jenis_kelamin: editForm.jenis_kelamin ?? null,
              }
            : g,
        ),
      );

      toast.success("Data guru berhasil diupdate");
      setEditingId(null);
      setEditForm({});
      setShowEditPassword(false);
      fetchGuru();
    } catch (err: any) {
      console.error("Error updating guru:", err);
      toast.error(err.message || "Gagal mengupdate data guru");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    setDeleteTarget({ id, name });
  }

  async function confirmDeleteGuru() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    // Optimistic update - langsung hapus dari UI
    const previousGuru = [...guru];
    const previousFiltered = [...filteredGuru];

    setGuru((prev) => prev.filter((g) => g.id !== deleteTarget.id));
    setFilteredGuru((prev) => prev.filter((g) => g.id !== deleteTarget.id));

    try {
      const response = await fetch(`/api/admin/guru?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await response.json();

      if (!response.ok) {
        // Rollback jika gagal
        setGuru(previousGuru);
        setFilteredGuru(previousFiltered);
        throw new Error(json.error || "Failed to delete guru");
      }

      toast.success("Guru berhasil dihapus");
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Error deleting guru:", err);
      toast.error(err.message || "Gagal menghapus guru");
    } finally {
      setIsDeleting(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Disalin ke clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

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
    const pdfTitle = title || `Daftar Akun Guru`;
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
      localStorage.removeItem("admin_created_accounts_guru");
    } catch (e) {
      console.warn("Failed to remove created accounts", e);
    }
    setCreatedAccounts([]);
    setSessionCreatedAccounts([]);
    toast.success("Daftar akun baru berhasil dihapus");
  };

  const combinedDownloadList = (() => {
    let persistedMap = new Map<string, string>();
    try {
      const raw = localStorage.getItem("admin_created_accounts_guru");
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
    for (const g of guru) {
      const email = g.email || "";
      const id = g.id;
      let pw =
        persistedMap.get(`id:${id}`) ||
        persistedMap.get(`email:${normalizeEmail(email)}`) ||
        (id && tempById.get(String(id))) ||
        tempByEmail.get(normalizeEmail(email)) ||
        "";
      list.push({
        id,
        full_name: g.full_name || "",
        email,
        temporaryPassword: pw,
      });
    }
    return list;
  })();

  const isEditPasswordTooShort =
    !!editForm.password &&
    editForm.password.trim().length > 0 &&
    editForm.password.trim().length < 6;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Kelola Guru</h1>
          <p className="text-sm text-gray-500 mt-1">
            Total{" "}
            <span className="font-semibold text-green-600">{guru.length}</span>{" "}
            guru terdaftar
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus size={20} className="mr-2" />
            Tambah Guru
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4 mb-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            type="text"
            placeholder="Cari guru berdasarkan nama, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
          />
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data guru...</p>
        </div>
      ) : filteredGuru.length === 0 ? (
        <Card className="p-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {searchTerm
              ? "Tidak ada guru yang cocok dengan pencarian"
              : "Belum ada guru terdaftar"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredGuru.map((g) => (
            <Card
              key={g.id}
              className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {editingId === g.id ? (
                // Edit Mode
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* Edit Header */}
                  <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {g.full_name ? g.full_name.charAt(0).toUpperCase() : "G"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {g.full_name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {g.email}
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

                  {/* Fields grid */}
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
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              full_name: e.target.value,
                            })
                          }
                          placeholder="Nama lengkap"
                          className="h-8 text-sm pl-7 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
                        />
                      </div>
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
                          value={g.email}
                          disabled
                          className="h-8 text-sm pl-7 bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                        />
                      </div>
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
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              no_telepon: e.target.value,
                            })
                          }
                          placeholder="08xxxxxxxxxx"
                          className="h-8 text-sm pl-7 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
                        />
                      </div>
                    </div>
                    {/* Jenis Kelamin */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        value={editForm.jenis_kelamin || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            jenis_kelamin: e.target.value || null,
                          })
                        }
                        className="h-8 w-full text-sm px-2.5 rounded-md border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition bg-white"
                      >
                        <option value="">Pilih jenis kelamin</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
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
                          onChange={(e) =>
                            setEditForm({ ...editForm, alamat: e.target.value })
                          }
                          placeholder="Alamat lengkap"
                          className="h-8 text-sm pl-7 border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 transition"
                        />
                      </div>
                    </div>
                    {/* Password row — current pw left, new pw right */}
                    <div className="col-span-2 grid grid-cols-2 gap-x-3 pt-1 border-t border-gray-100 mt-1">
                      {/* Current password display */}
                      {(() => {
                        const currentPw = userPasswords.get(g.id)?.password;
                        const tempPw = getTemporaryPassword({
                          id: g.id,
                          email: g.email,
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
                                onClick={() => getUserPassword(g.id)}
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
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                password: e.target.value,
                              })
                            }
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
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 text-sm font-semibold">
                        {(g.full_name || g.email || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {g.full_name}
                        </h3>
                        <div className="flex flex-col gap-1 mt-1 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Mail size={13} />
                            {g.email}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} />
                            Terdaftar:{" "}
                            {new Date(g.created_at).toLocaleDateString("id-ID")}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150"
                        onClick={() => startEdit(g)}
                        title="Edit"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
                        onClick={() => handleDelete(g.id, g.full_name)}
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Password Management Section */}
                  {(() => {
                    const tempPassword = getTemporaryPassword({
                      id: g.id,
                      email: g.email,
                    });
                    const hasPassword = tempPassword.length > 0;
                    const passwordStatus = passwordChangedStatus.get(g.id);
                    const currentPassword = userPasswords.get(g.id);
                    const hasChangedPassword =
                      passwordStatus?.changed ||
                      (currentPassword &&
                        currentPassword.password &&
                        currentPassword.password !== tempPassword);

                    return (
                      <div className="border-t border-gray-100 mt-4 pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Key size={13} className="text-gray-400" />
                          <span className="text-xs font-medium text-gray-500">
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

                          {(hasChangedPassword || currentPassword) && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                {currentPassword &&
                                currentPassword.password !== tempPassword
                                  ? "Password Terbaru"
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
                                        currentPassword.updatedAt,
                                      ).toLocaleString("id-ID", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                      })}
                                    </span>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => getUserPassword(g.id)}
                                    className="text-xs h-6 px-2"
                                    title="Refresh password"
                                  >
                                    🔄
                                  </Button>
                                </div>
                              ) : passwordLoadingUsers.has(g.id) ||
                                !passwordRequestedUsers.has(g.id) ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">
                                    Loading...
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => getUserPassword(g.id)}
                                    className="text-xs h-6 px-2"
                                  >
                                    Muat
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">
                                    Tidak ada password tersimpan
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => getUserPassword(g.id)}
                                    className="text-xs h-6 px-2"
                                  >
                                    Coba lagi
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl border border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Tambah Guru Baru
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Tambahkan akun guru untuk mengakses sistem pembelajaran.
            </p>
          </DialogHeader>

          {/* Mode Selection */}
          {!createdAccount && !uploadResults && (
            <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setAddMode("single")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  addMode === "single"
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-transparent text-gray-600 hover:bg-gray-200"
                }`}
              >
                <User size={15} />
                Tambah Satuan
              </button>
              <button
                type="button"
                onClick={() => setAddMode("bulk")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  addMode === "bulk"
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-transparent text-gray-600 hover:bg-gray-200"
                }`}
              >
                <FileSpreadsheet size={15} />
                Upload Excel
              </button>
            </div>
          )}

          {createdAccount ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-3">
                  ✅ Akun guru berhasil dibuat!
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
                  💾 Simpan password ini dan berikan kepada guru.
                </p>
              </div>
              <Button
                onClick={() => {
                  setCreatedAccount(null);
                  setShowAddDialog(false);
                  setShowPassword(false);
                  fetchGuru();
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Tutup
              </Button>
            </div>
          ) : uploadResults ? (
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
                  fetchGuru();
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Tutup
              </Button>
            </div>
          ) : addMode === "single" ? (
            <div className="space-y-5">
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
                    placeholder="Nama lengkap guru"
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
                    placeholder="email@gmail.com"
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
                    placeholder="Password untuk guru"
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
                    onChange={(e) =>
                      setAddForm({ ...addForm, no_telepon: e.target.value })
                    }
                    placeholder="08xxxxxxxxxx"
                    className="pl-9 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition py-2.5"
                  />
                </div>
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
                    });
                  }}
                  className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleAddGuru}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg px-5 py-2.5 transition hover:scale-[1.02]"
                >
                  {isSubmitting ? "Menambahkan..." : "Tambah Guru"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Template Info + Download */}
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
                            note: "Nama lengkap guru",
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
                            <span className="text-blue-600">— {item.note}</span>
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

              {/* File Upload Dropzone */}
              <div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                  id="excel-upload-guru"
                />
                {excelFile ? (
                  /* File selected — preview card */
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
                        <span className="text-green-300">·</span>
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
                  /* Empty dropzone */
                  <label
                    htmlFor="excel-upload-guru"
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
                        .xlsx atau .xls · Maks 10 MB
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {/* Preview Table */}
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
                          {["#", "Nama", "Email", "Password", "Telepon"].map(
                            (h) => (
                              <th
                                key={h}
                                className="px-3 py-2 text-left font-medium text-gray-500"
                              >
                                {h}
                              </th>
                            ),
                          )}
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
                              {row.full_name || "—"}
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {row.email || "—"}
                            </td>
                            <td className="px-3 py-2">
                              {row.password ? (
                                <span className="text-gray-400 tracking-widest">
                                  ••••••
                                </span>
                              ) : (
                                <span className="text-red-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {row.no_telepon || "—"}
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

              {/* Progress Bar */}
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

              {/* Action Buttons */}
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
                        ? `${excelData.length} Guru`
                        : "Guru"}
                    </>
                  )}
                </Button>
              </div>
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
              Hapus Guru
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              {deleteTarget
                ? `Yakin ingin menghapus guru "${deleteTarget.name}"?`
                : "Yakin ingin menghapus data guru ini?"}
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
              onClick={confirmDeleteGuru}
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
