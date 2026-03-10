"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Target,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
  UserCog,
  UserCircle,
  MessageCircle,
  Microscope,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SidebarProps {
  role: "guru" | "siswa" | "admin";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const menuItems = {
    guru: [
      { label: "Dashboard", href: "/guru/dashboard", icon: LayoutDashboard },
      { label: "Kelola Materi", href: "/guru/materi", icon: BookOpen },
      { label: "Kelola Kuis", href: "/guru/asesmen", icon: ClipboardList },
      { label: "Kelola Nilai", href: "/guru/nilai", icon: BarChart3 },
      {
        label: "Progress Simulasi",
        href: "/guru/simulasi-progress",
        icon: Microscope,
      },
    ],
    siswa: [
      { label: "Dashboard", href: "/siswa/dashboard", icon: LayoutDashboard },
      { label: "Akses Materi", href: "/siswa/materi", icon: BookOpen },
      { label: "Akses Kuis", href: "/siswa/asesmen", icon: ClipboardList },
      { label: "Simulasi", href: "/siswa/simulasi", icon: Microscope },
    ],
    admin: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Mata Pelajaran", href: "/admin/mapel", icon: BookOpen },
      { label: "Kelas", href: "/admin/kelas", icon: Users },
      { label: "Guru", href: "/admin/guru", icon: Users },
      { label: "Siswa", href: "/admin/siswa", icon: Users },
    ],
  };

  const items = menuItems[role];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-green-600 text-white rounded-lg"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 shadow-sm p-6 transition-transform duration-300 z-40 flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-center mb-8 pt-2">
          <div className="relative">
            <img
              src="/logo codin.png"
              alt="Codin Logo"
              className="w-24 h-auto"
            />
          </div>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <button
                  onClick={() => setOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-150 ${
                    isActive
                      ? "bg-green-600 text-white font-semibold"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  <Icon size={19} className="shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 pt-4 mt-4 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
          >
            <LogOut size={19} className="shrink-0" />
            <span className="text-sm">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
