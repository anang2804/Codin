import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type AuthScope = "admin" | "guru" | "siswa" | "shared";

function scopePath(scope: AuthScope): string {
  if (scope === "admin") return "/admin";
  if (scope === "guru") return "/guru";
  if (scope === "siswa") return "/siswa";
  return "/";
}

function scopeFromPath(pathname: string): AuthScope {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/guru")) return "guru";
  if (pathname.startsWith("/siswa")) return "siswa";
  if (pathname.startsWith("/api/admin")) return "admin";
  if (pathname.startsWith("/api/guru")) return "guru";
  if (pathname.startsWith("/api/siswa")) return "siswa";
  return "shared";
}

function resolveScope(
  pathname: string,
  roleQuery: string | null,
  referer: string | null,
): AuthScope {
  if (pathname.startsWith("/admin") || roleQuery === "admin") return "admin";
  if (pathname.startsWith("/guru") || roleQuery === "guru") return "guru";
  if (pathname.startsWith("/siswa") || roleQuery === "siswa") return "siswa";

  if (referer) {
    try {
      const refererPath = new URL(referer).pathname;
      const scope = scopeFromPath(refererPath);
      if (scope !== "shared") return scope;
    } catch {
      // ignore invalid referer
    }
  }

  return "shared";
}

function resolveCookieName(
  hostKey: string,
  scope: AuthScope,
  cookieNames: string[],
): string {
  const preferred = `sb-${hostKey}-${scope}-auth-token`;
  const candidates = [preferred];

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

export async function updateSession(request: NextRequest) {
  const host = request.nextUrl.hostname
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const roleQuery = request.nextUrl.searchParams.get("role");
  const referer = request.headers.get("referer");
  const scope = resolveScope(request.nextUrl.pathname, roleQuery, referer);
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
        path: scopePath(scope),
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

  const debugEnabled = process.env.NEXT_PUBLIC_AUTH_DEBUG === "true";

  const applyDebugHeaders = (response: NextResponse) => {
    if (!debugEnabled) return response;
    response.headers.set("x-auth-scope", scope);
    response.headers.set("x-auth-cookie", cookieName);
    response.headers.set("x-auth-user", user ? "1" : "0");
    return response;
  };

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
    return applyDebugHeaders(NextResponse.redirect(url));
  }

  return applyDebugHeaders(supabaseResponse);
}
