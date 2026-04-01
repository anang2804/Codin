import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const host =
    typeof window !== "undefined" ? window.location.hostname : "local";
  const hostKey = host.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: `sb-${hostKey}-auth-token`,
      },
      global: {
        headers: {
          "x-client-host": host,
        },
      },
      auth: {
        storageKey: `sb-${hostKey}-auth-token`,
      },
    },
  );
}
