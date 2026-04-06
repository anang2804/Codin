"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Camera,
  ChevronRight,
  Briefcase,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  jenis_kelamin?: string;
  no_telepon?: string;
  alamat?: string;
  avatar_url?: string;
}

export default function GuruProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Form states
  const [formData, setFormData] = useState<Partial<Profile>>({});

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const normalizeGender = (value?: string | null) => {
    if (!value) return "";
    const normalized = value.trim().toLowerCase();
    if (normalized === "l" || normalized === "laki-laki") return "L";
    if (normalized === "p" || normalized === "perempuan") return "P";
    return value;
  };

  const displayGender = (value?: string | null) => {
    const normalized = normalizeGender(value);
    if (normalized === "L") return "Laki-laki";
    if (normalized === "P") return "Perempuan";
    return value || "-";
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      showToast(
        "Format gambar tidak didukung (gunakan JPG, PNG, atau WebP)",
        "error",
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran foto maksimal 5MB", "error");
      return;
    }

    try {
      setUploadingAvatar(true);
      const supabase = createClient();

      const ext = file.name.split(".").pop();
      const path = `avatars/${profile.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("learning-materials")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        throw new Error(uploadError.message || "Gagal upload ke storage");
      }

      const { data: urlData } = supabase.storage
        .from("learning-materials")
        .getPublicUrl(path);

      const avatar_url = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url })
        .eq("id", profile.id);

      if (updateError) {
        throw new Error(updateError.message || "Gagal menyimpan URL foto");
      }

      setProfile({ ...profile, avatar_url });
      showToast("Foto profil berhasil diperbarui");
    } catch (err: any) {
      const message = err?.message || "Gagal mengupload foto";
      console.error("Avatar upload error:", message);
      showToast(message, "error");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData(data);
    } catch (error: any) {
      console.error("Error loading profile:", error);
      showToast("Gagal memuat profil", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      const supabase = createClient();

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          jenis_kelamin: formData.jenis_kelamin,
          no_telepon: formData.no_telepon,
          alamat: formData.alamat,
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...formData });
      setEditMode(false);
      showToast("Profil berhasil diperbarui");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      showToast("Gagal memperbarui profil", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError("Password minimal 8 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Password baru tidak cocok");
      return;
    }

    try {
      setSaving(true);

      // Update password via API
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengubah password");

      setPasswordSuccess("Password berhasil diubah!");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);

      setTimeout(() => {
        loadProfile();
      }, 1000);
    } catch (error: any) {
      setPasswordError(error.message || "Gagal mengubah password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-start gap-3 bg-card border border-border border-l-4 ${
            toast.type === "success" ? "border-green-500" : "border-red-400"
          } rounded-xl shadow-lg px-4 py-3 min-w-[260px] max-w-xs animate-in slide-in-from-right-4 fade-in duration-300`}
        >
          {toast.type === "success" ? (
            <CheckCircle2
              size={18}
              className="text-green-500 mt-0.5 shrink-0"
            />
          ) : (
            <XCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">
              {toast.type === "success" ? "Berhasil" : "Gagal"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {toast.message}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 pt-8 flex flex-col md:flex-row gap-6 items-start">
        {/* ── Left: Profile Card ── */}
        <div className="w-full md:w-[300px] shrink-0">
          <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-8 flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative group mb-5">
              <div className="w-24 h-24 rounded-full bg-green-50 border-2 border-green-100 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-green-300" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0.5 right-0.5 w-7 h-7 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:border-green-300 hover:text-green-600 text-muted-foreground transition-colors duration-200 disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <div className="w-3 h-3 border-2 border-border border-t-green-500 rounded-full animate-spin" />
                ) : (
                  <Camera size={13} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Name & email */}
            <h2 className="text-base font-semibold text-foreground leading-tight">
              {profile.full_name}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {profile.email}
            </p>

            {/* Role badge */}
            <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-green-50 border border-green-100 text-green-700 text-[11px] font-semibold rounded-full">
              <Briefcase size={11} />
              Guru / Pengajar
            </span>
          </div>
        </div>

        {/* ── Right: Detail Cards ── */}
        <div className="flex-1 space-y-5 min-w-0">
          {/* Personal Info Card */}
          <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
                  Akun
                </p>
                <h3 className="text-sm font-semibold text-foreground">
                  {editMode ? "Ubah Data Diri" : "Informasi Personal"}
                </h3>
              </div>
              <button
                onClick={() => {
                  if (editMode) setFormData({ ...profile });
                  setEditMode(!editMode);
                }}
                className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 ${
                  editMode
                    ? "bg-muted text-muted-foreground hover:bg-muted/80"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {editMode ? "Batal" : "Edit Profil"}
              </button>
            </div>

            {editMode ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InputMinimal
                    label="Nama Lengkap"
                    value={formData.full_name || ""}
                    onChange={(v) => setFormData({ ...formData, full_name: v })}
                  />
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">
                      Jenis Kelamin
                    </label>
                    <select
                      className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:border-green-500 text-sm text-foreground transition-all appearance-none"
                      value={normalizeGender(formData.jenis_kelamin)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jenis_kelamin: e.target.value,
                        })
                      }
                    >
                      <option value="">Pilih</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <InputMinimal
                    label="No Telepon"
                    value={formData.no_telepon || ""}
                    onChange={(v) =>
                      setFormData({ ...formData, no_telepon: v })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">
                    Alamat
                  </label>
                  <textarea
                    className="w-full p-3 bg-background border border-border rounded-xl outline-none focus:border-green-500 text-sm text-foreground transition-all resize-none"
                    rows={3}
                    value={formData.alamat || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, alamat: e.target.value })
                    }
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <ItemStatic label="Nama Lengkap" value={profile.full_name} />
                <ItemStatic label="Email" value={profile.email} />
                <ItemStatic
                  label="Jenis Kelamin"
                  value={displayGender(profile.jenis_kelamin)}
                />
                <ItemStatic label="No Telepon" value={profile.no_telepon} />
                <ItemStatic
                  label="Alamat Domisili"
                  value={profile.alamat}
                  fullWidth
                />
              </div>
            )}
          </div>

          {/* Security Card */}
          <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Lock size={15} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Keamanan
                </p>
                <h4 className="text-sm font-semibold text-foreground">
                  Pengaturan Keamanan
                </h4>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={14} /> {passwordSuccess}
              </div>
            )}

            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="group w-full flex items-center justify-between p-4 bg-muted border border-border rounded-xl hover:bg-green-50 dark:hover:bg-emerald-500/10 hover:border-green-100 transition-all duration-200"
              >
                <span className="text-sm font-medium text-muted-foreground group-hover:text-green-700">
                  Ubah Kata Sandi Akun
                </span>
                <ChevronRight
                  size={15}
                  className="text-muted-foreground group-hover:text-green-500 group-hover:translate-x-0.5 transition-all"
                />
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="password"
                    placeholder="Password baru"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:border-green-500 text-sm"
                  />
                  <input
                    type="password"
                    placeholder="Konfirmasi password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:border-green-500 text-sm"
                  />
                </div>
                {passwordError && (
                  <p className="text-xs text-red-500">{passwordError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    {saving ? "Menyimpan..." : "Update Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordError("");
                    }}
                    className="px-5 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemStatic({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground">{value || "-"}</p>
    </div>
  );
}

function InputMinimal({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">
        {label}
      </label>
      <input
        type={type}
        className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:border-green-500 focus:bg-background text-sm text-foreground transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
