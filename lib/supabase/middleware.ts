import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
    if (cookieNames.some((name) => name === candidate || name.startsWith(`${candidate}.`))) {
      return candidate;
    }
  }

  return preferred;
}

export async function updateSession(request: NextRequest) {
  const host = request.nextUrl.hostname
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const roleQuery = request.nextUrl.searchParams.get("role");
  const scope = resolveScope(request.nextUrl.pathname, roleQuery);
  const cookieName = resolveCookieName(
    host,
    scope,
    request.cookies.getAll().map((cookie) => cookie.name),
  );

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: cookieName,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/api") &&
    request.nextUrl.pathname !== "/"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    if (scope !== "shared") {
      url.searchParams.set("role", scope);
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
