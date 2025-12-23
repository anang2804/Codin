"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Mail,
  Calendar,
  Phone,
  MapPin,
  Camera,
  ShieldCheck,
  Zap,
  ChevronRight,
  Save,
  Briefcase,
  X,
  CheckCircle2,
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  jenis_kelamin?: string;
  no_telepon?: string;
  alamat?: string;
}

export default function GuruProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Form states
  const [formData, setFormData] = useState<Partial<Profile>>({});

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
      alert("Gagal memuat profil");
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
      alert("Profil berhasil diperbarui");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      alert("Gagal memperbarui profil");
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-2 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans pb-20">
      <nav className="max-w-4xl mx-auto flex items-center justify-end p-6 mb-4">
        <button
          onClick={() => {
            if (editMode) setFormData({ ...profile });
            setEditMode(!editMode);
          }}
          className={`px-5 py-2 rounded-xl font-bold text-xs tracking-wide transition-all ${
            editMode
              ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
              : "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
          }`}
        >
          {editMode ? "BATAL" : "EDIT PROFIL"}
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="relative group mb-6">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border border-slate-200 bg-white p-1">
              <div className="w-full h-full rounded-full overflow-hidden bg-emerald-50 flex items-center justify-center">
                <User size={60} className="text-emerald-200" />
              </div>
            </div>
            <button className="absolute bottom-1 right-1 p-2.5 bg-white border border-slate-200 text-slate-600 rounded-full shadow-sm hover:text-emerald-600 transition-colors">
              <Camera size={16} />
            </button>
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-slate-800">
              {profile.full_name}
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              {profile.email}
            </p>
          </div>

          <div className="w-full mt-10 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Briefcase size={16} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Role
                </p>
                <p className="text-sm font-bold text-slate-700">
                  Guru / Pengajar
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 space-y-8">
          <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">
              {editMode ? "Ubah Data Diri" : "Informasi Personal"}
            </h3>

            {editMode ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InputMinimal
                    label="Nama Lengkap"
                    value={formData.full_name || ""}
                    onChange={(v) => setFormData({ ...formData, full_name: v })}
                  />
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Jenis Kelamin
                    </label>
                    <select
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium text-slate-700 transition-all text-sm appearance-none"
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Alamat
                  </label>
                  <textarea
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium text-slate-700 transition-all text-sm resize-none"
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
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
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
                <ItemStatic label="No Telepon" value={profile.no_telepon} />
                <ItemStatic
                  label="Alamat Domisili"
                  value={profile.alamat}
                  fullWidth
                />
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                <Lock size={16} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                Pengaturan Keamanan
              </h4>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={14} /> {passwordSuccess}
              </div>
            )}

            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="group w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-emerald-50 transition-all"
              >
                <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-700">
                  Ubah Kata Sandi Akun
                </span>
                <ChevronRight
                  size={14}
                  className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all"
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
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm font-medium"
                  />
                  <input
                    type="password"
                    placeholder="Konfirmasi password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-sm font-medium"
                  />
                </div>
                {passwordError && (
                  <p className="text-[10px] font-bold text-red-500 ml-1">
                    {passwordError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                  >
                    {saving ? "..." : "Update"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordError("");
                    }}
                    className="px-6 text-slate-400 font-bold text-[10px] uppercase hover:text-slate-600"
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
    <div className={`${fullWidth ? "sm:col-span-2" : ""}`}>
      <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5 block">
        {label}
      </label>
      <p className="text-sm font-bold text-slate-700 leading-relaxed border-b border-slate-50 pb-2">
        {value || "-"}
      </p>
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
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <input
        type={type}
        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium text-slate-700 transition-all text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
