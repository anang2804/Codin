"use client";

import { useRouter } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

interface UserQuickMenuProps {
  role: "admin" | "guru" | "siswa";
  variant?: "icon" | "avatar";
  avatarUrl?: string | null;
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
}: UserQuickMenuProps) {
  const router = useRouter();
  const supabase = createClient();
  const config = roleConfig[role];
  const profilePath = config.profilePath;

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
            className="w-12 h-12 rounded-full overflow-hidden border border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-sm flex items-center justify-center cursor-pointer transition-all hover:ring-2 hover:ring-emerald-500/30"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle className="h-6 w-6 text-muted-foreground" />
            )}
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

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Akun {config.label}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {profilePath && (
          <DropdownMenuItem onSelect={handleGoProfile}>
            <UserCircle className="h-4 w-4" />
            Profil
          </DropdownMenuItem>
        )}

        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <LogOut className="h-4 w-4" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
