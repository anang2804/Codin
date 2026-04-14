"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

interface UserQuickMenuProps {
  role: "admin" | "guru" | "siswa";
  variant?: "icon" | "avatar";
  avatarUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
}

const roleConfig = {
  admin: {
    label: "Admin",
    profilePath: null as string | null,
  },
  guru: {
    label: "Guru",
    profilePath: "/guru/profile",
  },
  siswa: {
    label: "Siswa",
    profilePath: "/siswa/profile",
  },
};

export default function UserQuickMenu({
  role,
  variant = "icon",
  avatarUrl,
  fullName,
  email,
}: UserQuickMenuProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const supabase = createClient();
  const config = roleConfig[role];
  const profilePath = config.profilePath;

  const displayName = useMemo(() => {
    const name = fullName?.trim();
    if (name) return name;
    return `Akun ${config.label}`;
  }, [config.label, fullName]);

  const displayEmail = useMemo(() => {
    const value = email?.trim();
    if (value) return value;
    return `${role}@smartlearning.local`;
  }, [email, role]);

  const initials = useMemo(() => {
    const name = displayName.trim();
    if (!name) return "";
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const second = parts.length > 1 ? (parts[1][0] ?? "") : "";
    return (first + second).toUpperCase();
  }, [displayName]);

  const isDarkMode = resolvedTheme === "dark";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleGoProfile = () => {
    if (!profilePath) return;
    router.push(profilePath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "avatar" ? (
          <button
            type="button"
            aria-label="Buka menu akun"
            className="group flex items-center gap-3 cursor-pointer bg-transparent px-1 py-1"
          >
            <div className="h-10 w-10 rounded-full overflow-hidden border border-border bg-card/95 flex items-center justify-center transition-all group-hover:ring-2 group-hover:ring-emerald-500/30">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold tracking-wide text-emerald-700 bg-emerald-100 w-full h-full flex items-center justify-center">
                  {initials || "?"}
                </span>
              )}
            </div>
            <div className="hidden sm:flex flex-col items-start text-left min-w-0">
              <span className="text-sm font-semibold text-foreground leading-tight truncate max-w-[150px]">
                {displayName}
              </span>
              <span className="text-xs text-muted-foreground leading-tight truncate max-w-[180px]">
                {displayEmail}
              </span>
            </div>
          </button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            className="rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70"
            aria-label="Buka menu akun"
          >
            <UserCircle className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60 p-0 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-3 py-3">
          <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-border bg-card/95 flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold tracking-wide text-emerald-700 bg-emerald-100 w-full h-full flex items-center justify-center">
                {initials || "?"}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {displayEmail}
            </p>
          </div>
        </div>

        <div className="p-1">
          {profilePath && (
            <DropdownMenuItem onSelect={handleGoProfile}>
              <UserCircle className="h-4 w-4" />
              Lihat Profil
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onSelect={() => setTheme(isDarkMode ? "light" : "dark")}
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {isDarkMode ? "Mode terang" : "Mode gelap"}
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />
        <div className="p-3">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
