import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  throw new Error("Server configuration error: Missing Supabase credentials");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(req: Request) {
  // Check admin authentication
  try {
    const serverSupabase = await createServerClient();
    const {
      data: { user: caller },
    } = await serverSupabase.auth.getUser();
    if (!caller)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const callerProfile = await prisma.profile.findUnique({
      where: { id: caller.id },
      select: { role: true },
    });

    if (callerProfile?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create new guru
  try {
    const body = await req.json();
    let { email, password: providedPassword, full_name, no_telepon } = body;

    const emailDomain =
      process.env.DEFAULT_GURU_EMAIL_DOMAIN || "guru.smksypm4.my.id";

    const slugify = (name: string) => {
      return name
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9\s.-]/g, "")
        .trim()
        .replace(/\s+/g, ".")
        .replace(/\.+/g, ".");
    };

    const generatedPassword =
      providedPassword ||
      randomBytes(9)
        .toString("base64")
        .replace(/\/+|=+|\+/g, "A")
        .slice(0, 12);

    let created: any = null;
    let createError: any = null;
    const maxAttempts = 6;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let candidateEmail = email;
      if (!candidateEmail) {
        const slug = slugify(full_name || "guru");
        const suffix = attempt > 1 ? randomBytes(2).toString("hex") : "";
        candidateEmail = suffix
          ? `${slug}.${suffix}@${emailDomain}`
          : `${slug}@${emailDomain}`;
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: candidateEmail,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {},
      });

      if (!error) {
        created = data;
        email = candidateEmail;
        break;
      }

      createError = error;
      if (error.message?.includes("already") || error.status === 422) {
        if (attempt < maxAttempts) continue;
      }
      break;
    }

    if (!created) {
      throw createError || new Error("Failed to create guru user");
    }

    // Upsert profile using Prisma
    await prisma.profile.upsert({
      where: { id: created.user.id },
      update: {
        email,
        full_name,
        role: "guru",
        phone: no_telepon || null,
      },
      create: {
        id: created.user.id,
        email,
        full_name,
        role: "guru",
        phone: no_telepon || null,
      },
    });

    return NextResponse.json({
      id: created.user.id,
      email,
      full_name,
      temporaryPassword: generatedPassword,
    });
  } catch (err: any) {
    console.error("Error creating guru:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create guru" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  // Check admin authentication
  try {
    const serverSupabase = await createServerClient();
    const {
      data: { user: caller },
    } = await serverSupabase.auth.getUser();
    if (!caller)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const callerProfile = await prisma.profile.findUnique({
      where: { id: caller.id },
      select: { role: true },
    });

    if (callerProfile?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const guru = await prisma.profile.findMany({
      where: { role: "guru" },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(
      { data: guru },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    console.error("Error fetching guru:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch guru" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  // Update guru profile (and optionally email)
  // ensure caller is admin
  try {
    const serverSupabase = await createServerClient();
    const {
      data: { user: caller },
    } = await serverSupabase.auth.getUser();
    if (!caller)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const callerProfile = await prisma.profile.findUnique({
      where: { id: caller.id },
      select: { role: true },
    });
    if (callerProfile?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, email, full_name, password } = body;
    if (!id)
      return NextResponse.json({ error: "id required" }, { status: 400 });

    // Update profiles table with Prisma
    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (email !== undefined) updates.email = email;

    await prisma.profile.update({
      where: { id },
      data: updates,
    });

    // If email changed, update auth user email
    if (email !== undefined) {
      const { error: authError } =
        await supabaseAdmin.auth.admin.updateUserById(id, { email });
      if (authError) {
        console.error("auth update error:", authError);
        return NextResponse.json({ error: authError.message }, { status: 500 });
      }
    }

    // If password provided, update it
    if (password && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password minimal 6 karakter" },
          { status: 400 }
        );
      }
      const { error: passwordError } =
        await supabaseAdmin.auth.admin.updateUserById(id, { password });
      if (passwordError) {
        console.error("password update error:", passwordError);
        return NextResponse.json(
          { error: passwordError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error updating guru:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  // Check admin authentication
  try {
    const serverSupabase = await createServerClient();
    const {
      data: { user: caller },
    } = await serverSupabase.auth.getUser();
    if (!caller)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const callerProfile = await prisma.profile.findUnique({
      where: { id: caller.id },
      select: { role: true },
    });

    if (callerProfile?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting guru:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete guru" },
      { status: 500 }
    );
  }
}
