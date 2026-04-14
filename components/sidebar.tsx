"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Target,
  BarChart3,
  Users,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  UserCog,
  UserCircle,
  MessageCircle,
  Microscope,
} from "lucide-react";
import { useEffect, useState } from "react";

interface SidebarProps {
  role: "guru" | "siswa" | "admin";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  // Sync collapsed state with CSS variable and localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Always start desktop in collapsed mode so hover-expand is consistent.
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const initialCollapsed = isDesktop ? true : false;
    setCollapsed(initialCollapsed);

    const width = initialCollapsed ? "4.5rem" : "16rem";
    document.documentElement.style.setProperty("--sidebar-width", width);

    window.localStorage.setItem("sidebar_collapsed", String(initialCollapsed));
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("sidebar_collapsed", String(next));
        const width = next ? "4.5rem" : "16rem";
        document.documentElement.style.setProperty("--sidebar-width", width);
      }
      return next;
    });
  };

  const menuItems = {
    guru: [
      { label: "Dashboard", href: "/guru/dashboard", icon: LayoutDashboard },
      { label: "Kelola Materi", href: "/guru/materi", icon: BookOpen },
      { label: "Kelola Kuis", href: "/guru/asesmen", icon: ClipboardList },
      { label: "Kelola Nilai", href: "/guru/nilai", icon: BarChart3 },
      {
        label: "Progress Materi",
        href: "/guru/materi-progress",
        icon: Target,
      },
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

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-[70] p-2 text-green-600 bg-transparent rounded-lg"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`sidebar-shell fixed left-0 top-0 h-screen bg-card border-r border-border shadow-sm p-4 md:p-6 transition-transform duration-300 z-[60] ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${collapsed ? "sidebar-collapsed" : ""}`}
      >
        <div className="relative h-full flex flex-col">
          <div className="flex items-center justify-between mb-6 pt-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src="/logo codin.png"
                alt="Codin Logo"
                className="logo-compact h-8 w-auto md:h-9 object-contain"
              />
              <img
                src="/codin nama.png"
                alt="Codin Full Logo"
                className="logo-full h-16 w-auto md:h-18 object-contain"
              />
            </div>
          </div>

          {/* Desktop collapse toggle - placed near bottom so it doesn't overlap icons */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card text-muted-foreground hover:text-green-600 hover:border-green-500 shadow-sm absolute -right-4 bottom-6"
            aria-label={collapsed ? "Perbesar sidebar" : "Sempitkan sidebar"}
          >
            {collapsed ? (
              <ChevronsRight size={18} />
            ) : (
              <ChevronsLeft size={18} />
            )}
          </button>

          <nav className="space-y-3 flex-1 overflow-y-auto mt-3 -mx-2">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    onClick={() => setOpen(false)}
                    className={`sidebar-item w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 ease-out ${
                      isActive
                        ? "bg-green-600/10 text-green-700 border border-green-200"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground md:hover:translate-x-1"
                    }`}
                  >
                    <Icon size={20} className="shrink-0" />
                    <span className="sidebar-label text-sm font-medium">
                      {item.label}
                    </span>
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
