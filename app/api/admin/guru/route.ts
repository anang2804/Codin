import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";

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

const normalizePhoneNumber = (value: unknown) => String(value ?? "").trim();

const isValidPhoneNumber = (value: unknown) => {
  const normalized = normalizePhoneNumber(value);
  return normalized.length === 0 || /^\d+$/.test(normalized);
};

export async function POST(req: Request) {
  const supabaseAdmin = getAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server credentials not configured" },
      { status: 500 },
    );
  }

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
    let {
      email,
      password: providedPassword,
      full_name,
      jenis_kelamin,
      no_telepon,
      nuptk,
    } = body;
    const normalizedPhone = normalizePhoneNumber(no_telepon);
    const normalizedNuptk = String(nuptk ?? "").trim();

    if (!normalizedNuptk) {
      return NextResponse.json({ error: "NUPTK harus diisi" }, { status: 400 });
    }

    if (!/^\d+$/.test(normalizedNuptk)) {
      return NextResponse.json(
        { error: "NUPTK harus berisi angka" },
        { status: 400 },
      );
    }

    if (!isValidPhoneNumber(no_telepon)) {
      return NextResponse.json(
        { error: "No. Telepon hanya boleh berisi angka" },
        { status: 400 },
      );
    }

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
      },
      create: {
        id: created.user.id,
        email,
        full_name,
        role: "guru",
      },
    });

    // Save current_password to profiles (column not in Prisma schema, use supabaseAdmin)
    await supabaseAdmin
      .from("profiles")
      .update({
        nuptk: normalizedNuptk,
        jenis_kelamin: jenis_kelamin || null,
        no_telepon: normalizedPhone || null,
        current_password: generatedPassword,
        password_updated_at: new Date().toISOString(),
      })
      .eq("id", created.user.id);

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
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const supabaseAdmin = getAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server credentials not configured" },
      { status: 500 },
    );
  }

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
    const { data: rows, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("role", "guru")
      .order("created_at", { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    const mapped = (rows || []).map((g: any) => ({
      id: g.id,
      email: g.email,
      full_name: g.full_name,
      nuptk: g.nuptk ?? null,
      created_at: g.created_at,
      jenis_kelamin: g.jenis_kelamin ?? null,
      no_telepon: g.no_telepon ?? null,
      alamat: g.alamat ?? null,
    }));

    return NextResponse.json(
      { data: mapped },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (err: any) {
    console.error("Error fetching guru:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch guru" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  // Update guru profile (and optionally email)
  const supabaseAdmin = getAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server credentials not configured" },
      { status: 500 },
    );
  }

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
    const {
      id,
      email,
      full_name,
      jenis_kelamin,
      password,
      no_telepon,
      alamat,
      nuptk,
    } = body;
    const normalizedPhone = normalizePhoneNumber(no_telepon);
    const normalizedNuptk =
      nuptk !== undefined ? String(nuptk ?? "").trim() : undefined;
    if (!id)
      return NextResponse.json({ error: "id required" }, { status: 400 });

    if (no_telepon !== undefined && !isValidPhoneNumber(no_telepon)) {
      return NextResponse.json(
        { error: "No. Telepon hanya boleh berisi angka" },
        { status: 400 },
      );
    }

    if (nuptk !== undefined) {
      if (!normalizedNuptk) {
        return NextResponse.json(
          { error: "NUPTK harus diisi" },
          { status: 400 },
        );
      }
      if (!/^\d+$/.test(normalizedNuptk)) {
        return NextResponse.json(
          { error: "NUPTK harus berisi angka" },
          { status: 400 },
        );
      }
    }

    const baseUpdates: any = {};
    if (full_name !== undefined) baseUpdates.full_name = full_name;
    if (email !== undefined) baseUpdates.email = email;
    if (nuptk !== undefined) baseUpdates.nuptk = normalizedNuptk || null;

    if (Object.keys(baseUpdates).length > 0) {
      const { error: baseError } = await supabaseAdmin
        .from("profiles")
        .update(baseUpdates)
        .eq("id", id);

      if (baseError) {
        return NextResponse.json(
          { error: baseError.message || "Failed to update profile" },
          { status: 500 },
        );
      }
    }

    const contactUpdates: any = {};
    if (no_telepon !== undefined)
      contactUpdates.no_telepon = normalizedPhone || null;
    if (alamat !== undefined) contactUpdates.alamat = alamat || null;

    if (Object.keys(contactUpdates).length > 0) {
      const { error: contactError } = await supabaseAdmin
        .from("profiles")
        .update(contactUpdates)
        .eq("id", id);

      if (contactError) {
        return NextResponse.json(
          {
            error: contactError.message || "Failed to update no_telepon/alamat",
          },
          { status: 500 },
        );
      }
    }

    if (jenis_kelamin !== undefined) {
      try {
        const { error: genderError } = await supabaseAdmin
          .from("profiles")
          .update({ jenis_kelamin: jenis_kelamin || null })
          .eq("id", id);

        if (genderError) {
          throw genderError;
        }
      } catch (genderErr: any) {
        const msg = String(genderErr?.message || "");
        return NextResponse.json(
          {
            error: /jenis_kelamin|column/i.test(msg)
              ? "Kolom jenis_kelamin belum ada di database production. Jalankan script 003_add_profile_fields.sql"
              : msg || "Failed to update jenis_kelamin",
          },
          { status: 500 },
        );
      }
    }

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
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password minimal 8 karakter" },
          { status: 400 },
        );
      }
      const { error: passwordError } =
        await supabaseAdmin.auth.admin.updateUserById(id, { password });
      if (passwordError) {
        console.error("password update error:", passwordError);
        return NextResponse.json(
          { error: passwordError.message },
          { status: 500 },
        );
      }
      // Save current_password to profiles
      const { error: profilePasswordError } = await supabaseAdmin
        .from("profiles")
        .update({
          current_password: password,
          password_updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (profilePasswordError) {
        const msg = String(profilePasswordError.message || "");
        console.error("profiles password save error:", profilePasswordError);
        return NextResponse.json(
          {
            error: /current_password|password_updated_at|column/i.test(msg)
              ? "Kolom password tracking belum ada di database production. Jalankan script 003_add_password_tracking.sql"
              : msg || "Failed to save password tracking",
          },
          { status: 500 },
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
  const supabaseAdmin = getAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server credentials not configured" },
      { status: 500 },
    );
  }

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
      { status: 500 },
    );
  }
}
