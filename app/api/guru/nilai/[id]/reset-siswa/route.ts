import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getAdminClient = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars for guru reset API",
    );
    return null;
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabaseAdmin = getAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server credentials not configured" },
      { status: 500 },
    );
  }

  try {
    const serverSupabase = await createServerClient();
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await serverSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["guru", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: asesmenId } = await params;
    const body = await request.json().catch(() => ({}));
    const siswaId = String(body?.siswa_id ?? "").trim();

    if (!asesmenId || !siswaId) {
      return NextResponse.json(
        { error: "asesmen_id and siswa_id are required" },
        { status: 400 },
      );
    }

    const [{ error: jawabanError }, { error: nilaiError }] = await Promise.all([
      supabaseAdmin
        .from("jawaban_siswa")
        .delete()
        .eq("asesmen_id", asesmenId)
        .eq("siswa_id", siswaId),
      supabaseAdmin
        .from("nilai")
        .delete()
        .eq("asesmen_id", asesmenId)
        .eq("siswa_id", siswaId),
    ]);

    if (jawabanError) {
      console.error("Failed to delete jawaban_siswa:", jawabanError);
      return NextResponse.json(
        { error: jawabanError.message || "Failed to delete jawaban" },
        { status: 500 },
      );
    }

    if (nilaiError) {
      console.error("Failed to delete nilai:", nilaiError);
      return NextResponse.json(
        { error: nilaiError.message || "Failed to delete nilai" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in reset-siswa API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
