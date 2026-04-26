import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type PengumpulanTugasRow = {
  id: string | null;
  sub_bab_id: string;
  bab_id: string;
  siswa_id: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | bigint | null;
  mime_type: string | null;
  submitted_at: Date | null;
  updated_at: Date | null;
  sub_bab_title: string;
  bab_title: string;
  materi_id: string;
  materi_title: string;
  siswa_name: string | null;
  siswa_kelas: string | null;
};

function normalizeRows(rows: PengumpulanTugasRow[]) {
  return rows.map((row) => ({
    ...row,
    file_size:
      typeof row.file_size === "bigint"
        ? Number(row.file_size)
        : (row.file_size ?? 0),
  }));
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (profile?.role !== "guru") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await prisma.$queryRaw<PengumpulanTugasRow[]>`
      SELECT
        mpt.id,
        msb.id AS sub_bab_id,
        mb.id AS bab_id,
        siswa.id AS siswa_id,
        mpt.url_file AS file_url,
        mpt.nama_file AS file_name,
        mpt.ukuran_file AS file_size,
        mpt.tipe_mime AS mime_type,
        mpt.dikumpulkan_pada AS submitted_at,
        mpt.diperbarui_pada AS updated_at,
        msb.title AS sub_bab_title,
        mb.title AS bab_title,
        m.id AS materi_id,
        m.title AS materi_title,
        siswa.full_name AS siswa_name,
        siswa.kelas AS siswa_kelas
      FROM materi_sub_bab msb
      JOIN materi_bab mb ON mb.id = msb.bab_id
      JOIN materi m ON m.id = mb.materi_id
      LEFT JOIN kelas k ON k.id = m.kelas_id
      LEFT JOIN profiles siswa
        ON siswa.role = 'siswa'
        AND siswa.kelas IS NOT NULL
        AND k.name IS NOT NULL
        AND (
          LOWER(TRIM(siswa.kelas)) = LOWER(TRIM(k.name))
          OR LOWER(TRIM(siswa.kelas)) LIKE LOWER(TRIM(k.name)) || '%'
          OR LOWER(TRIM(k.name)) LIKE LOWER(TRIM(siswa.kelas)) || '%'
        )
      LEFT JOIN materi_pengumpulan_tugas mpt
        ON mpt.sub_bab_id = msb.id
        AND mpt.siswa_id = siswa.id
      WHERE m.created_by = CAST(${user.id} AS uuid)
        AND msb.content_type = 'assignment'
      ORDER BY COALESCE(mpt.dikumpulkan_pada, msb.created_at) DESC
    `;

    const normalizedRows = normalizeRows(rows);

    const rowsWithSubmission = normalizedRows.filter((r) => !!r.id);
    const total_pengumpulan = rowsWithSubmission.length;
    const total_siswa = new Set(
      normalizedRows.map((r) => r.siswa_id).filter(Boolean),
    ).size;
    const total_materi = new Set(normalizedRows.map((r) => r.materi_id)).size;
    const total_tugas = new Set(normalizedRows.map((r) => r.sub_bab_id)).size;

    return NextResponse.json(
      {
        summary: {
          total_pengumpulan,
          total_siswa,
          total_materi,
          total_tugas,
        },
        data: normalizedRows,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (error: any) {
    console.error("Error fetching pengumpulan tugas guru:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
