import { createBrowserClient } from "@supabase/ssr";

type AuthScope = "admin" | "guru" | "siswa" | "shared";

function sanitize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

function resolveScope(pathname: string, override?: AuthScope): AuthScope {
  if (override) return override;
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/guru")) return "guru";
  if (pathname.startsWith("/siswa")) return "siswa";
  return "shared";
}

export function createClient(scopeOverride?: AuthScope) {
  const host =
    typeof window !== "undefined" ? window.location.hostname : "local";
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const hostKey = sanitize(host);
  const scope = resolveScope(pathname, scopeOverride);
  const cookieKey = `sb-${hostKey}-${scope}-auth-token`;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: cookieKey,
      },
      global: {
        headers: {
          "x-client-host": host,
        },
      },
      auth: {
        storageKey: cookieKey,
      },
    },
  );
}
