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
  GraduationCap,
  School,
  Calendar,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  kelas?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  no_telepon?: string;
  alamat?: string;
  avatar_url?: string;
}

interface Kelas {
  id: string;
  name: string;
}

export default function SiswaProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [formData, setFormData] = useState<Partial<Profile>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadProfile();
    loadKelas();
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
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  const loadKelas = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("kelas")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      setKelasList(data || []);
    } catch (error) {
      console.error("Error loading kelas:", error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("Format gambar tidak didukung");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5MB");
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
        throw new Error(uploadError.message || "Gagal upload avatar");
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
        throw new Error(updateError.message || "Gagal menyimpan foto profil");
      }

      setProfile({ ...profile, avatar_url });
      toast.success("Foto profil berhasil diperbarui");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(error.message || "Gagal mengupload foto");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
          kelas: formData.kelas,
          tanggal_lahir: formData.tanggal_lahir,
          jenis_kelamin: formData.jenis_kelamin,
          no_telepon: formData.no_telepon,
          alamat: formData.alamat,
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...formData } as Profile);
      setEditMode(false);
      toast.success("Profil berhasil diperbarui");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!oldPassword) {
      setPasswordError("Password lama wajib diisi");
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

      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: profile?.email || "",
        password: oldPassword,
      });

      if (verifyError) {
        throw new Error("Password lama tidak sesuai");
      }

      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal mengubah password");
      }

      setPasswordSuccess("Password berhasil diubah!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);

      setTimeout(() => {
        setPasswordSuccess("");
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

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/siswa/dashboard");
  };

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
                <GraduationCap size={11} />
                Siswa
              </span>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <School size={17} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Kelas
                  </p>
                  <h3 className="text-sm font-semibold text-foreground">
                    {profile.kelas || "Belum dipilih"}
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
                    {editMode ? "Ubah Data Diri" : "Informasi Siswa"}
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
                      onChange={(v) =>
                        setFormData({ ...formData, full_name: v })
                      }
                    />
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">
                        Kelas
                      </label>
                      <select
                        className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:border-emerald-500 text-sm text-foreground transition-all appearance-none"
                        value={formData.kelas || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, kelas: e.target.value })
                        }
                      >
                        <option value="">Pilih Kelas</option>
                        {kelasList.map((kelas) => (
                          <option key={kelas.id} value={kelas.name}>
                            {kelas.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <InputMinimal
                      label="Tanggal Lahir"
                      type="date"
                      value={formData.tanggal_lahir || ""}
                      onChange={(v) =>
                        setFormData({ ...formData, tanggal_lahir: v })
                      }
                    />
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">
                        Jenis Kelamin
                      </label>
                      <select
                        className="w-full h-11 px-4 bg-background border border-border rounded-xl outline-none focus:border-emerald-500 text-sm text-foreground transition-all appearance-none"
                        value={formData.jenis_kelamin || ""}
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
                      className="w-full p-3 bg-background border border-border rounded-xl outline-none focus:border-emerald-500 text-sm text-foreground transition-all resize-none"
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
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                  <ItemStatic label="Nama Lengkap" value={profile.full_name} />
                  <ItemStatic label="Email" value={profile.email} />
                  <ItemStatic label="Kelas" value={profile.kelas} />
                  <ItemStatic
                    label="Tanggal Lahir"
                    value={formatDate(profile.tanggal_lahir)}
                    icon={
                      <Calendar size={14} className="text-muted-foreground" />
                    }
                  />
                  <ItemStatic
                    label="Jenis Kelamin"
                    value={
                      profile.jenis_kelamin === "L"
                        ? "Laki-laki"
                        : profile.jenis_kelamin === "P"
                          ? "Perempuan"
                          : "-"
                    }
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
                    <input
                      type="password"
                      placeholder="Password lama"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
                    />
                    <input
                      type="password"
                      placeholder="Password baru"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
                    />
                    <input
                      type="password"
                      placeholder="Konfirmasi password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-sm"
                    />
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
                        setPasswordError("");
                      }}
                      className="px-5 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
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
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
        {label}
      </p>
      <div className="flex items-start gap-2">
        {icon ? <span className="mt-0.5">{icon}</span> : null}
        <p className="text-sm font-medium text-gray-800">{value || "-"}</p>
      </div>
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
      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">
        {label}
      </label>
      <input
        type={type}
        className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white text-sm text-gray-700 transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}
