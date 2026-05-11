import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/password-hash";

const SAME_PASSWORD_ERROR =
  "New password should be different from the old password.";

function translatePasswordError(message?: string) {
  if (!message) return "Terjadi kesalahan pada server";
  if (message.includes(SAME_PASSWORD_ERROR)) {
    return "Password baru harus berbeda dari password lama.";
  }
  return message;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, password } = await request.json();

    if (!currentPassword) {
      return NextResponse.json(
        { error: "currentPassword is required" },
        { status: 400 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "password is required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
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

    const { error: verifyError, data: verifyData } =
      await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

    if (verifyError || !verifyData.user) {
      return NextResponse.json(
        { error: "Password saat ini tidak sesuai" },
        { status: 400 },
      );
    }

    if (verifyData.user.id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        password_changed_at: new Date().toISOString(),
      },
    });

    if (updateError) {
      return NextResponse.json(
        { error: translatePasswordError(updateError.message) },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);
    const { error: profileHashError } = await supabase
      .from("profiles")
      .update({
        password: passwordHash,
        password_updated_at: now,
      })
      .eq("id", user.id);

    if (profileHashError) {
      return NextResponse.json(
        {
          error:
            profileHashError.message ||
            "Failed to save hashed password metadata. Jalankan scripts/044_add_current_password_hash.sql",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: translatePasswordError(error?.message) },
      { status: 500 },
    );
  }
}
