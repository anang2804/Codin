import { NextResponse } from "next/server";
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
    const body = await req.json();
    const email = String(body?.email ?? "").trim();

    if (!email) {
      return NextResponse.json(
        { error: "Email tidak boleh kosong" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
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

    // Find user by email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Gagal memproses permintaan" },
        { status: 500 },
      );
    }

    // If email not found, we still return success for security reasons
    // (don't reveal whether email exists in system)
    if (!profile) {
      return NextResponse.json({
        ok: true,
        message:
          "Jika email terdaftar di sistem kami, admin akan menghubungi Anda dalam 1×24 jam kerja.",
      });
    }

    // Check if there's already a pending request
    const { data: existingRequest, error: existingError } = await supabaseAdmin
      .from("forgot_password_requests")
      .select("id")
      .eq("user_id", profile.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing requests:", existingError);
      return NextResponse.json(
        { error: "Gagal memproses permintaan" },
        { status: 500 },
      );
    }

    if (existingRequest) {
      return NextResponse.json(
        {
          error:
            "Anda sudah memiliki permintaan lupa sandi yang menunggu konfirmasi admin. Silakan tunggu atau hubungi admin langsung.",
        },
        { status: 400 },
      );
    }

    // Create forgot password request
    const { error: insertError } = await supabaseAdmin
      .from("forgot_password_requests")
      .insert({
        user_id: profile.id,
        email: profile.email,
        status: "pending",
      });

    if (insertError) {
      console.error("Error creating forgot password request:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Gagal membuat permintaan" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Permintaan Anda telah dikirim. Admin akan menghubungi Anda melalui email dalam 1×24 jam kerja.",
    });
  } catch (err: any) {
    console.error("Error submitting forgot password request:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    );
  }
}
