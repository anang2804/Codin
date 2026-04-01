import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_HOSTS = {
  admin: process.env.NEXT_PUBLIC_ADMIN_HOST?.toLowerCase(),
  guru: process.env.NEXT_PUBLIC_GURU_HOST?.toLowerCase(),
  siswa: process.env.NEXT_PUBLIC_SISWA_HOST?.toLowerCase(),
} as const;

type RoleKey = keyof typeof ROLE_HOSTS;

function getRoleByHost(hostname: string): RoleKey | null {
  const entries = Object.entries(ROLE_HOSTS) as Array<
    [RoleKey, string | undefined]
  >;
  for (const [role, roleHost] of entries) {
    if (!roleHost) continue;
    if (hostname === roleHost) return role;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const hostname = (request.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase();
  const roleByHost = getRoleByHost(hostname);

  if (roleByHost) {
    const pathname = request.nextUrl.pathname;
    const rolePrefix = `/${roleByHost}`;

    // On role-specific host, force app navigation into the matching role namespace.
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `${rolePrefix}/dashboard`;
      return NextResponse.redirect(url);
    }

    if (
      !pathname.startsWith(rolePrefix) &&
      !pathname.startsWith("/auth") &&
      !pathname.startsWith("/api")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `${rolePrefix}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
