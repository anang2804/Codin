import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getAdminClient = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars for admin siswa API",
    );
    return null;
  }

  // Debug logging (remove in production)
  console.log("🔑 Supabase Admin Client Config:");
  console.log("  URL:", SUPABASE_URL);
  console.log(
    "  Service Role Key (first 20 chars):",
    SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + "...",
  );
  console.log("  Service Role Key length:", SUPABASE_SERVICE_ROLE_KEY?.length);

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

// Email transporter (SMTP) - optional but required for sending password emails
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT
  ? Number(process.env.SMTP_PORT)
  : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  `no-reply@${
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "") ||
    "example.com"
  }`;

let transporter: any | null = null;
if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn(
    "SMTP not configured. Will create an Ethereal test account for email previews in development. To send real emails, set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS in env.",
  );
}

export async function POST(req: Request) {
  const supabaseAdmin = getAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server credentials not configured" },
      { status: 500 },
    );
  }

  // check that caller is authenticated admin
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
  // Create new siswa (admin only)
  try {
    const body = await req.json();
    let {
      email,
      password: providedPassword,
      full_name,
      sendEmail,
      kelas,
      no_telepon,
    } = body;
    const normalizedPhone = normalizePhoneNumber(no_telepon);

    if (!isValidPhoneNumber(no_telepon)) {
      return NextResponse.json(
        { error: "No. Telepon hanya boleh berisi angka" },
        { status: 400 },
      );
    }

    // If email is not provided by admin, auto-generate one using the student's name
    // Domain can be configured via DEFAULT_STUDENT_EMAIL_DOMAIN in .env.local, otherwise use 'students.example.test'
    const emailDomain =
      process.env.DEFAULT_STUDENT_EMAIL_DOMAIN || "students.example.test";

    // helper to slugify name
    const slugify = (name: string) => {
      return name
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9\s.-]/g, "")
        .trim()
        .replace(/\s+/g, ".")
        .replace(/\.+/g, ".");
    };

    // generate a secure temporary password if not provided
    const generatedPassword =
      providedPassword ||
      randomBytes(9)
        .toString("base64")
        .replace(/\/+|=+|\+/g, "A")
        .slice(0, 12);

    // If email is missing, create a candidate from the name and try to create the user.
    // If collision (email exists), append a short random suffix and retry up to N attempts.
    let created: any = null;
    let createError: any = null;
    const maxAttempts = 6;
    if (!email) {
      const base = slugify(full_name || "siswa") || "siswa";
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const suffix =
          attempt === 0 ? "" : `.${randomBytes(2).toString("hex")}`;
        const candidate = `${base}${suffix}@${emailDomain}`;
        try {
          const res = await supabaseAdmin.auth.admin.createUser({
            email: candidate,
            password: generatedPassword,
            user_metadata: {
              full_name,
              role: "siswa",
            },
            email_confirm: true,
          });
          created = res.data;
          createError = res.error;
          if (!createError && created?.user?.id) {
            email = candidate;
            break;
          }
          // if createError indicates email exists, try next candidate
          const msg = String(createError?.message || "");
          const isEmailExists =
            createError?.status === 409 ||
            createError?.status === 422 ||
            /already|exists|registered/i.test(msg);
          if (!isEmailExists) {
            // unexpected error, stop retrying
            break;
          }
          // otherwise continue to next attempt
        } catch (err: any) {
          createError = err;
          const msg = String(err?.message || "");
          const isEmailExists = /already|exists|registered/i.test(msg);
          if (!isEmailExists) break;
        }
      }
    } else {
      // email provided: create directly
      try {
        const res = await supabaseAdmin.auth.admin.createUser({
          email,
          password: generatedPassword,
          user_metadata: { full_name, role: "siswa" },
          email_confirm: true,
        });
        created = res.data;
        createError = res.error;
      } catch (err: any) {
        console.error("Supabase createUser exception:", err);
        return NextResponse.json(
          { error: `Failed to create user: ${err.message || "Unknown error"}` },
          { status: 500 },
        );
      }
    }

    if (createError) {
      console.error("createUser error:", createError);
      const msg = String(createError.message || "");
      const isEmailExists =
        createError.status === 409 ||
        createError.status === 422 ||
        /already|exists|registered/i.test(msg);
      if (isEmailExists) {
        try {
          const existingProfile = await prisma.profile.findFirst({
            where: { email },
            select: { id: true },
          });
          if (existingProfile?.id) {
            return NextResponse.json(
              { error: "email_exists", id: existingProfile.id },
              { status: 409 },
            );
          }
        } catch (e) {
          console.error(
            "profiles lookup after createUser email_exists error:",
            e,
          );
        }
        return NextResponse.json({ error: "email_exists" }, { status: 409 });
      }

      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    const userId = created.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Failed to get created user id" },
        { status: 500 },
      );
    }

    // Upsert profile row with Prisma
    try {
      await prisma.profile.upsert({
        where: { id: userId },
        update: {
          email,
          full_name,
          role: "siswa",
          kelas: kelas || null,
        },
        create: {
          id: userId,
          email,
          full_name,
          role: "siswa",
          kelas: kelas || null,
        },
      });
    } catch (err) {
      console.error("profiles upsert error:", err);
      // try to cleanup created user
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      return NextResponse.json(
        { error: "Failed to create profile" },
        { status: 500 },
      );
      // try to cleanup created user
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      return NextResponse.json(
        { error: "Failed to create or update profile" },
        { status: 500 },
      );
    }

    // Save current_password to profiles (not in Prisma schema, use supabaseAdmin)
    await supabaseAdmin
      .from("profiles")
      .update({
        no_telepon: normalizedPhone || null,
        current_password: generatedPassword,
        password_updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    // Optionally send email with temporary password. If the client sets sendEmail=false
    // we skip sending and return the generated password in the response so the admin
    // can display or download it. If sendEmail is omitted or true, we try to send.
    let emailError: string | null = null;
    let emailPreviewUrl: string | null = null;

    try {
      if (sendEmail === false) {
        // skip sending email on request from client
        emailPreviewUrl = null;
      } else {
        if (!transporter) {
          // create an Ethereal test account and transporter for previewing emails in dev
          const testAccount = await nodemailer.createTestAccount();
          transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
          console.info(
            "Using Ethereal test account for email preview. Preview URLs will be returned in the API response.",
          );
        }

        const subject = "Akun Smart Learning - Informasi Login";
        const loginUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
        const text = `Halo ${
          full_name || "Siswa"
        },\n\nAkun Anda telah dibuat oleh administrator.\n\nEmail: ${email}\nPassword sementara: ${generatedPassword}\n\nSilakan masuk di ${loginUrl}/auth/login dan ganti password Anda setelah masuk.\n\nJika Anda tidak mengetahui permintaan ini, hubungi administrator.`;
        const html = `<p>Halo ${full_name || "Siswa"},</p>
        <p>Akun Anda telah dibuat oleh administrator.</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password sementara:</strong> <code>${generatedPassword}</code></li>
        </ul>
        <p>Silakan masuk di <a href="${loginUrl}/auth/login">${loginUrl}/auth/login</a> dan ganti password Anda setelah masuk.</p>
        <p>Jika Anda tidak mengetahui permintaan ini, hubungi administrator.</p>`;

        const info = await transporter.sendMail({
          from: EMAIL_FROM,
          to: email,
          subject,
          text,
          html,
        });

        // If using Ethereal (or any transporter that supports test message URLs), provide preview URL.
        const preview = nodemailer.getTestMessageUrl(info);
        if (preview) {
          emailPreviewUrl = preview;
          console.info("Ethereal preview URL:", preview);
        }
      }
    } catch (err: any) {
      console.error("Failed to send email:", err);
      emailError = err?.message || String(err);

      // For development convenience, log the generated temporary password to server console
      // so an admin can copy it if emailing fails. Do NOT do this in production.
      if (process.env.NODE_ENV !== "production") {
        try {
          console.info(`TEMP_PASSWORD_FOR:${email} -> ${generatedPassword}`);
        } catch (e) {
          // ignore logging failure
        }
      }
    }

    // If the caller explicitly asked to skip sending email (sendEmail === false),
    // include the generated temporary password in the response so the admin UI can
    // display it in the table for download/share. This is intentional behaviour for
    // admin-driven account creation. Otherwise, only include the temporary password
    // when email sending failed in non-production (legacy behaviour).
    const resp: any = {
      ok: true,
      id: userId,
      email: email,
      emailError,
      emailPreviewUrl,
    };
    if (sendEmail === false) {
      resp.temporaryPassword = generatedPassword;
    } else if (emailError && process.env.NODE_ENV !== "production") {
      resp.temporaryPassword = generatedPassword;
    }
    return NextResponse.json(resp);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
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

  // Return list of siswa profiles for admin UI. Must be called by an authenticated admin.
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

    const { data: rows, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("role", "siswa")
      .order("created_at", { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    const siswa = (rows || []).map((s: any) => ({
      id: s.id,
      email: s.email,
      full_name: s.full_name,
      kelas: s.kelas ?? null,
      tanggal_lahir: s.tanggal_lahir ?? null,
      jenis_kelamin: s.jenis_kelamin ?? null,
      no_telepon: s.no_telepon ?? null,
      alamat: s.alamat ?? null,
      created_at: s.created_at,
    }));

    return NextResponse.json(
      { data: siswa },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  const supabaseAdmin = getAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server credentials not configured" },
      { status: 500 },
    );
  }

  // Update profile (and optionally email)
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
      kelas,
      jurusan,
      tanggal_lahir,
      jenis_kelamin,
      no_telepon,
      alamat,
      password,
    } = body;
    const normalizedPhone = normalizePhoneNumber(no_telepon);
    if (!id)
      return NextResponse.json({ error: "id required" }, { status: 400 });

    if (no_telepon !== undefined && !isValidPhoneNumber(no_telepon)) {
      return NextResponse.json(
        { error: "No. Telepon hanya boleh berisi angka" },
        { status: 400 },
      );
    }

    const baseUpdates: any = {};
    if (full_name !== undefined) baseUpdates.full_name = full_name;
    if (email !== undefined) baseUpdates.email = email;
    if (kelas !== undefined) baseUpdates.kelas = kelas || null;
    if (tanggal_lahir !== undefined)
      baseUpdates.tanggal_lahir = tanggal_lahir || null;
    if (jenis_kelamin !== undefined)
      baseUpdates.jenis_kelamin = jenis_kelamin || null;

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
  } catch (err) {
    console.error(err);
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "id required" }, { status: 400 });

    // delete user from auth (cascade will handle profile deletion)
    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(id);
    if (deleteAuthError) {
      console.error("delete user error:", deleteAuthError);
      return NextResponse.json(
        { error: deleteAuthError.message },
        { status: 500 },
      );
    }

    // Ensure profile is deleted with Prisma
    await prisma.profile.delete({ where: { id } }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
