import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

type AuthScope = "admin" | "guru" | "siswa" | "shared";

function resolveScope(pathname: string, roleQuery: string | null): AuthScope {
  if (pathname.startsWith("/admin") || roleQuery === "admin") return "admin";
  if (pathname.startsWith("/guru") || roleQuery === "guru") return "guru";
  if (pathname.startsWith("/siswa") || roleQuery === "siswa") return "siswa";
  return "shared";
}

function resolveCookieName(
  hostKey: string,
  scope: AuthScope,
  cookieNames: string[],
): string {
  const preferred = `sb-${hostKey}-${scope}-auth-token`;
  const candidates = [
    preferred,
    `sb-${hostKey}-admin-auth-token`,
    `sb-${hostKey}-guru-auth-token`,
    `sb-${hostKey}-siswa-auth-token`,
    `sb-${hostKey}-shared-auth-token`,
  ];

  for (const candidate of candidates) {
    if (
      cookieNames.some(
        (name) => name === candidate || name.startsWith(`${candidate}.`),
      )
    ) {
      return candidate;
    }
  }

  return preferred;
}

export async function createClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const hostHeader = headerStore.get("host") || "local";
  const host = hostHeader.split(":")[0].toLowerCase();
  const hostKey = host.replace(/[^a-z0-9-]/g, "-");
  const pathname = headerStore.get("x-pathname") || "";
  const roleQuery = headerStore.get("x-role") || null;
  const scope = resolveScope(pathname, roleQuery);
  const cookieName = resolveCookieName(
    hostKey,
    scope,
    cookieStore.getAll().map((cookie) => cookie.name),
  );

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: cookieName,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Ignored
          }
        },
      },
    },
  );
}
