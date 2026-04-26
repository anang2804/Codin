"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Camera,
  ChevronRight,
  ArrowLeft,
  Briefcase,
  Phone,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { compressImageFile } from "@/lib/utils/image-compression";

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
  const [profileErrors, setProfileErrors] = useState<
    Partial<
      Record<"full_name" | "jenis_kelamin" | "no_telepon" | "alamat", string>
    >
  >({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Form states
  const [formData, setFormData] = useState<Partial<Profile>>({});

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

  const isValidPhoneNumber = (value?: string | null) => {
    const normalized = String(value ?? "").trim();
    return /^\d+$/.test(normalized);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("Format gambar tidak didukung (gunakan JPG, PNG, atau WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 10MB");
      return;
    }

    try {
      setUploadingAvatar(true);
      const supabase = createClient();

      const compressed = await compressImageFile(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.78,
        targetType: "image/webp",
      });
      const uploadFile = compressed.file;

      if (uploadFile.size > 5 * 1024 * 1024) {
        toast.error(
          "Ukuran foto setelah kompresi masih terlalu besar (maks. 5MB)",
        );
        return;
      }

      const ext = uploadFile.name.split(".").pop();
      const path = `avatars/${profile.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("learning-materials")
        .upload(path, uploadFile, {
          upsert: true,
          contentType: uploadFile.type,
        });

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
      toast.success("Foto profil berhasil diperbarui");
    } catch (err: any) {
      const message = err?.message || "Gagal mengupload foto";
      console.error("Avatar upload error:", message);
      toast.error(message);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      toast.error("Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    const nextErrors: Partial<
      Record<"full_name" | "jenis_kelamin" | "no_telepon" | "alamat", string>
    > = {};

    if (!formData.full_name?.trim()) {
      nextErrors.full_name = "Nama lengkap wajib diisi.";
    }

    if (!normalizeGender(formData.jenis_kelamin)) {
      nextErrors.jenis_kelamin = "Jenis kelamin wajib dipilih.";
    }

    if (!isValidPhoneNumber(formData.no_telepon)) {
      nextErrors.no_telepon = "No telepon hanya boleh berisi angka.";
    }

    if (!formData.alamat?.trim()) {
      nextErrors.alamat = "Alamat wajib diisi.";
    }

    setProfileErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

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
      setProfileErrors({});
      setEditMode(false);
      toast.success("Profil berhasil diperbarui");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileErrors({});
    setFormData({ ...profile });
    setEditMode(false);
  };

  const handleBack = () => {
    if (editMode) {
      const nextErrors: Partial<
        Record<"full_name" | "jenis_kelamin" | "no_telepon" | "alamat", string>
      > = {};

      if (!formData.full_name?.trim()) {
        nextErrors.full_name = "Nama lengkap wajib diisi.";
      }

      if (!normalizeGender(formData.jenis_kelamin)) {
        nextErrors.jenis_kelamin = "Jenis kelamin wajib dipilih.";
      }

      if (!isValidPhoneNumber(formData.no_telepon)) {
        nextErrors.no_telepon = "No telepon hanya boleh berisi angka.";
      }

      if (!formData.alamat?.trim()) {
        nextErrors.alamat = "Alamat wajib diisi.";
      }

      setProfileErrors(nextErrors);

      if (Object.keys(nextErrors).length > 0) {
        return;
      }
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/guru/dashboard");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!oldPassword) {
      setPasswordError("Password saat ini wajib diisi");
      return;
    }

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
        body: JSON.stringify({
          currentPassword: oldPassword,
          password: newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengubah password");

      setPasswordSuccess("Password berhasil diubah!");
      setOldPassword("");
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
    <div className="bg-muted/20 pb-6">
      <div className="max-w-5xl mx-auto px-6 pt-4">
        <button
          type="button"
          onClick={handleBack}
          className="mb-3 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="w-full md:w-[300px] shrink-0 space-y-3">
            <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col items-center text-center">
              <div className="relative group mb-4">
                <div className="w-24 h-24 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={40} className="text-emerald-300" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0.5 right-0.5 w-7 h-7 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:border-emerald-300 hover:text-emerald-600 text-muted-foreground transition-colors duration-200 disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <div className="w-3 h-3 border-2 border-border border-t-emerald-500 rounded-full animate-spin" />
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

              <h2 className="text-base font-semibold text-foreground leading-tight">
                {profile.full_name}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {profile.email}
              </p>

              <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-full">
                <Briefcase size={11} />
                Guru / Pengajar
              </span>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Briefcase size={17} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Peran
                  </p>
                  <h3 className="text-sm font-semibold text-foreground">
                    Guru / Pengajar
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 min-w-0">
            <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
                    Akun
                  </p>
                  <h3 className="text-sm font-semibold text-foreground">
                    {editMode ? "Ubah Data Diri" : "Informasi Guru"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (editMode) {
                      handleCancelEdit();
                      return;
                    }
                    setEditMode(true);
                  }}
                  className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 ${
                    editMode
                      ? "bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
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
                      error={profileErrors.full_name}
                      onChange={(v) =>
                        setFormData({ ...formData, full_name: v })
                      }
                    />
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">
                        Jenis Kelamin
                      </label>
                      <select
                        className={`w-full h-11 px-4 bg-background border rounded-xl outline-none focus:border-emerald-500 text-sm text-foreground transition-all appearance-none ${
                          profileErrors.jenis_kelamin
                            ? "border-red-500"
                            : "border-border"
                        }`}
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
                      {profileErrors.jenis_kelamin ? (
                        <p className="text-xs text-red-500 mt-1">
                          {profileErrors.jenis_kelamin}
                        </p>
                      ) : null}
                    </div>
                    <InputMinimal
                      label="No Telepon"
                      value={formData.no_telepon || ""}
                      error={profileErrors.no_telepon}
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
                      className={`w-full p-3 bg-background border rounded-xl outline-none focus:border-emerald-500 text-sm text-foreground transition-all resize-none ${
                        profileErrors.alamat
                          ? "border-red-500"
                          : "border-border"
                      }`}
                      rows={3}
                      value={formData.alamat || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, alamat: e.target.value })
                      }
                    />
                    {profileErrors.alamat ? (
                      <p className="text-xs text-red-500 mt-1">
                        {profileErrors.alamat}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
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
                  <ItemStatic
                    label="No Telepon"
                    value={profile.no_telepon}
                    icon={<Phone size={14} className="text-muted-foreground" />}
                  />
                  <ItemStatic
                    label="Alamat Domisili"
                    value={profile.alamat}
                    icon={
                      <MapPin size={14} className="text-muted-foreground" />
                    }
                    fullWidth
                  />
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Lock size={15} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    Keamanan
                  </p>
                  <h4 className="text-sm font-semibold text-gray-800">
                    Pengaturan Keamanan
                  </h4>
                </div>
              </div>

              {passwordSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold">
                  {passwordSuccess}
                </div>
              )}

              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="group w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-100 transition-all duration-200"
                >
                  <span className="text-sm font-medium text-gray-600 group-hover:text-emerald-700">
                    Ubah Kata Sandi Akun
                  </span>
                  <ChevronRight
                    size={15}
                    className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all"
                  />
                </button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        placeholder="Password saat ini"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full h-11 px-4 pr-10 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                        aria-label={
                          showOldPassword
                            ? "Sembunyikan password"
                            : "Tampilkan password"
                        }
                      >
                        {showOldPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Password baru"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-11 px-4 pr-10 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                        aria-label={
                          showNewPassword
                            ? "Sembunyikan password"
                            : "Tampilkan password"
                        }
                      >
                        {showNewPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Konfirmasi password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-11 px-4 pr-10 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                        aria-label={
                          showConfirmPassword
                            ? "Sembunyikan password"
                            : "Tampilkan password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-red-500">{passwordError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {saving ? "Menyimpan..." : "Update Password"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setOldPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordError("");
                      }}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-sm font-medium transition-colors"
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
    </div>
  );
}

function ItemStatic({
  label,
  value,
  icon,
  fullWidth,
}: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
        {label}
      </p>
      <div className="flex items-start gap-2">
        {icon ? <span className="mt-0.5">{icon}</span> : null}
        <p className="text-sm font-medium text-foreground">{value || "-"}</p>
      </div>
    </div>
  );
}

function InputMinimal({
  label,
  value,
  onChange,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">
        {label}
      </label>
      <input
        type={type}
        className={`w-full h-11 px-4 bg-gray-50 border rounded-xl outline-none focus:border-emerald-500 focus:bg-white text-sm text-foreground transition-all ${
          error ? "border-red-500" : "border-gray-200"
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
