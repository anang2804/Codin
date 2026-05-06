import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = "learning-materials";

const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const getAdminClient = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
    return null;
  }

  return createServiceClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

async function ensureAdmin() {
  const serverSupabase = await createServerClient();
  const {
    data: { user: caller },
  } = await serverSupabase.auth.getUser();

  if (!caller) {
    throw new Error("Unauthorized");
  }

  const callerProfile = await prisma.profile.findUnique({
    where: { id: caller.id },
    select: { role: true },
  });

  if (callerProfile?.role !== "admin") {
    throw new Error("Forbidden");
  }

  return caller.id;
}

function toStatus(errorMessage: string) {
  if (errorMessage === "Unauthorized") return 401;
  if (errorMessage === "Forbidden") return 403;
  return 500;
}

const roleOrder: Record<string, number> = {
  admin: 1,
  guru: 2,
  siswa: 3,
};

async function ensureDefaultRows(
  supabaseAdmin: ReturnType<typeof getAdminClient>,
) {
  if (!supabaseAdmin) return;

  const { data: existingRows, error: fetchError } = await supabaseAdmin
    .from("panduan_pengguna")
    .select("id, target_role")
    .in("target_role", ["admin", "guru", "siswa"]);

  if (fetchError) throw fetchError;

  const existingRoles = new Set(
    (existingRows || []).map((row) => row.target_role),
  );
  const rowsToInsert: Array<{
    title: string;
    target_role: "admin" | "guru" | "siswa";
  }> = [];

  if (!existingRoles.has("admin")) {
    rowsToInsert.push({ title: "Panduan Admin", target_role: "admin" });
  }
  if (!existingRoles.has("guru")) {
    rowsToInsert.push({ title: "Panduan Guru", target_role: "guru" });
  }
  if (!existingRoles.has("siswa")) {
    rowsToInsert.push({ title: "Panduan Siswa", target_role: "siswa" });
  }

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from("panduan_pengguna")
      .insert(rowsToInsert);
    if (insertError) throw insertError;
  }
}

export async function GET() {
  const supabaseAdmin = getAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server credentials not configured" },
      { status: 500 },
    );
  }

  try {
    await ensureAdmin();
    await ensureDefaultRows(supabaseAdmin);

    const { data, error } = await supabaseAdmin
      .from("panduan_pengguna")
      .select(
        "id, title, target_role, file_name, file_url, file_path, updated_at",
      )
      .order("target_role", { ascending: true });

    if (error) throw error;

    const sorted = (data || []).sort((a, b) => {
      const aOrder = roleOrder[a.target_role] ?? 99;
      const bOrder = roleOrder[b.target_role] ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return String(a.title || "").localeCompare(String(b.title || ""), "id");
    });

    return NextResponse.json({ data: sorted });
  } catch (error: any) {
    console.error("Error fetching panduan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch panduan" },
      { status: toStatus(error.message || "") },
    );
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

  try {
    const updatedBy = await ensureAdmin();

    const formData = await req.formData();
    const id = String(formData.get("id") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const rawRole = String(formData.get("target_role") || "")
      .trim()
      .toLowerCase();
    const file = formData.get("file") as File | null;

    if (!id || !title || !rawRole) {
      return NextResponse.json(
        { error: "ID, title, dan role wajib diisi" },
        { status: 400 },
      );
    }

    if (!["admin", "guru", "siswa"].includes(rawRole)) {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    }

    const { data: existing, error: fetchExistingError } = await supabaseAdmin
      .from("panduan_pengguna")
      .select("id, file_path")
      .eq("id", id)
      .single();

    if (fetchExistingError || !existing) {
      return NextResponse.json(
        { error: "Data panduan tidak ditemukan" },
        { status: 404 },
      );
    }

    const updatePayload: {
      title: string;
      target_role: string;
      updated_by: string;
      file_name?: string;
      file_url?: string;
      file_path?: string;
    } = {
      title,
      target_role: rawRole,
      updated_by: updatedBy,
    };

    if (file && file.size > 0) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error:
              "Tipe file tidak didukung. Gunakan PDF, DOC, DOCX, PPT, atau PPTX.",
          },
          { status: 400 },
        );
      }

      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Ukuran file maksimal 50MB" },
          { status: 400 },
        );
      }

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).slice(2, 8);
      const cleanName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const filePath = `panduan/${rawRole}/${timestamp}_${randomStr}_${cleanName}`;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
          cacheControl: "3600",
        });

      if (uploadError) {
        throw new Error(uploadError.message || "Gagal upload file");
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      if (existing.file_path) {
        await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .remove([existing.file_path]);
      }

      updatePayload.file_name = file.name;
      updatePayload.file_path = filePath;
      updatePayload.file_url = publicUrlData.publicUrl;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("panduan_pengguna")
      .update(updatePayload)
      .eq("id", id)
      .select(
        "id, title, target_role, file_name, file_url, file_path, updated_at",
      )
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("Error updating panduan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update panduan" },
      { status: toStatus(error.message || "") },
    );
  }
}
