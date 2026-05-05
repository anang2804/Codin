import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getAdminClient = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
    return null;
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export async function POST(req: Request) {
  try {
    const serverSupabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await serverSupabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "siswa") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const currentPassword = String(body?.currentPassword ?? "").trim();
    const newPassword = String(body?.newPassword ?? "").trim();

    if (!currentPassword) {
      return NextResponse.json(
        { error: "Password saat ini wajib diisi" },
        { status: 400 },
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        { error: "Password baru wajib diisi" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter" },
        { status: 400 },
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "Email pengguna tidak ditemukan" },
        { status: 400 },
      );
    }

    const { data: verifyData, error: verifyError } =
      await serverSupabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

    if (verifyError || !verifyData?.user || verifyData.user.id !== user.id) {
      return NextResponse.json(
        { error: "Password saat ini tidak sesuai" },
        { status: 400 },
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "Password baru harus berbeda dari password lama" },
        { status: 400 },
      );
    }

    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server credentials not configured" },
        { status: 500 },
      );
    }

    const { data: existingPending } = await supabaseAdmin
      .from("password_change_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending?.id) {
      return NextResponse.json(
        {
          error:
            "Masih ada permintaan perubahan password yang menunggu persetujuan admin",
        },
        { status: 400 },
      );
    }

    const { error: insertError } = await supabaseAdmin
      .from("password_change_requests")
      .insert({
        user_id: user.id,
        requested_password: newPassword,
        status: "pending",
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message || "Gagal membuat permintaan" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Permintaan perubahan password berhasil dikirim ke admin",
    });
  } catch (err: any) {
    console.error("Error submitting password change request:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    );
  }
}
