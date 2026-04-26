import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type SubmissionRow = {
  id: string;
  sub_bab_id: string;
  siswa_id: string;
  file_url: string;
  file_name: string;
  file_size: number | bigint;
  mime_type: string;
  submitted_at: Date;
  updated_at: Date;
};

function normalizeSubmissionRow(row: SubmissionRow | undefined | null) {
  if (!row) return null;

  return {
    ...row,
    file_size:
      typeof row.file_size === "bigint" ? Number(row.file_size) : row.file_size,
  };
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subBabId = searchParams.get("sub_bab_id");

    if (!subBabId) {
      return NextResponse.json(
        { error: "sub_bab_id is required" },
        { status: 400 },
      );
    }

    const rows = await prisma.$queryRaw<SubmissionRow[]>`
      SELECT
        id,
        sub_bab_id,
        siswa_id,
        url_file AS file_url,
        nama_file AS file_name,
        ukuran_file AS file_size,
        tipe_mime AS mime_type,
        dikumpulkan_pada AS submitted_at,
        diperbarui_pada AS updated_at
      FROM materi_pengumpulan_tugas
      WHERE sub_bab_id = CAST(${subBabId} AS uuid)
        AND siswa_id = CAST(${user.id} AS uuid)
      LIMIT 1
    `;

    return NextResponse.json({ data: normalizeSubmissionRow(rows[0]) });
  } catch (error: any) {
    console.error("Error fetching assignment submission:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memuat submission" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sub_bab_id, file_url, file_name, file_size, mime_type } = body;

    if (!sub_bab_id || !file_url || !file_name) {
      return NextResponse.json(
        { error: "sub_bab_id, file_url, and file_name are required" },
        { status: 400 },
      );
    }

    const subBab = await prisma.materiSubBab.findUnique({
      where: { id: sub_bab_id },
      select: { id: true },
    });

    if (!subBab) {
      return NextResponse.json(
        { error: "Sub-bab tidak ditemukan" },
        { status: 404 },
      );
    }

    await prisma.$executeRaw`
      INSERT INTO materi_pengumpulan_tugas (
        id,
        sub_bab_id,
        siswa_id,
        url_file,
        nama_file,
        ukuran_file,
        tipe_mime,
        dikumpulkan_pada,
        diperbarui_pada
      )
      VALUES (
        CAST(${crypto.randomUUID()} AS uuid),
        CAST(${sub_bab_id} AS uuid),
        CAST(${user.id} AS uuid),
        ${file_url},
        ${file_name},
        ${Number(file_size || 0)},
        ${mime_type || "application/octet-stream"},
        NOW(),
        NOW()
      )
      ON CONFLICT (sub_bab_id, siswa_id)
      DO UPDATE SET
        url_file = EXCLUDED.url_file,
        nama_file = EXCLUDED.nama_file,
        ukuran_file = EXCLUDED.ukuran_file,
        tipe_mime = EXCLUDED.tipe_mime,
        dikumpulkan_pada = NOW(),
        diperbarui_pada = NOW()
    `;

    const rows = await prisma.$queryRaw<SubmissionRow[]>`
      SELECT
        id,
        sub_bab_id,
        siswa_id,
        url_file AS file_url,
        nama_file AS file_name,
        ukuran_file AS file_size,
        tipe_mime AS mime_type,
        dikumpulkan_pada AS submitted_at,
        diperbarui_pada AS updated_at
      FROM materi_pengumpulan_tugas
      WHERE sub_bab_id = CAST(${sub_bab_id} AS uuid)
        AND siswa_id = CAST(${user.id} AS uuid)
      LIMIT 1
    `;

    return NextResponse.json({ data: normalizeSubmissionRow(rows[0]) });
  } catch (error: any) {
    console.error("Error saving assignment submission:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menyimpan submission" },
      { status: 500 },
    );
  }
}
