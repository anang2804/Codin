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
  nilai_tugas: number | null;
  komentar_guru: string | null;
  has_unread_komentar_siswa: boolean | null;
};

function normalizeRows(rows: PengumpulanTugasRow[]) {
  return rows.map((row) => ({
    ...row,
    file_size:
      typeof row.file_size === "bigint"
        ? Number(row.file_size)
        : (row.file_size ?? 0),
    has_unread_komentar_siswa: !!row.has_unread_komentar_siswa,
  }));
}

function isMissingUnreadColumnError(error: unknown) {
  const code = (error as { code?: string })?.code;
  const message = String((error as { message?: string })?.message || "");
  return (
    code === "42703" && message.includes("komentar_terakhir_dibaca_guru_pada")
  );
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

    let rows: PengumpulanTugasRow[] = [];

    try {
      rows = await prisma.$queryRaw<PengumpulanTugasRow[]>`
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
        siswa.kelas AS siswa_kelas,
        mpt.nilai_tugas,
        mpt.komentar_guru,
        EXISTS (
          SELECT 1
          FROM materi_pengumpulan_komentar c
          WHERE c.submission_id = mpt.id
            AND c.sender_id = siswa.id
            AND (
              mpt.komentar_terakhir_dibaca_guru_pada IS NULL
              OR c.created_at > mpt.komentar_terakhir_dibaca_guru_pada
            )
        ) AS has_unread_komentar_siswa
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
    } catch (error) {
      if (!isMissingUnreadColumnError(error)) {
        throw error;
      }

      rows = await prisma.$queryRaw<PengumpulanTugasRow[]>`
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
          siswa.kelas AS siswa_kelas,
          mpt.nilai_tugas,
          mpt.komentar_guru,
          FALSE AS has_unread_komentar_siswa
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
    }

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

type UpdatePengumpulanPayload = {
  submissionId?: string;
  nilai?: number | null;
  komentarGuru?: string | null;
};

function sanitizeNilai(nilai: UpdatePengumpulanPayload["nilai"]) {
  if (nilai === null || typeof nilai === "undefined") {
    return null;
  }

  if (typeof nilai !== "number" || Number.isNaN(nilai)) {
    throw new Error("Nilai harus berupa angka");
  }

  if (!Number.isInteger(nilai) || nilai < 0 || nilai > 100) {
    throw new Error("Nilai harus bilangan bulat 0-100");
  }

  return nilai;
}

function sanitizeKomentar(
  komentarGuru: UpdatePengumpulanPayload["komentarGuru"],
) {
  if (komentarGuru === null || typeof komentarGuru === "undefined") {
    return null;
  }

  if (typeof komentarGuru !== "string") {
    throw new Error("Komentar tidak valid");
  }

  const sanitized = komentarGuru.trim();
  if (sanitized.length === 0) return null;

  if (sanitized.length > 2000) {
    throw new Error("Komentar maksimal 2000 karakter");
  }

  return sanitized;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function PUT(request: Request) {
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

    const body = (await request.json()) as UpdatePengumpulanPayload;
    const submissionId = (body.submissionId || "").trim();

    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId wajib diisi" },
        { status: 400 },
      );
    }

    if (!isUuid(submissionId)) {
      return NextResponse.json(
        { error: "Format submissionId tidak valid" },
        { status: 400 },
      );
    }

    const nilai = sanitizeNilai(body.nilai);
    const komentarGuru = sanitizeKomentar(body.komentarGuru);

    const updatedRows = await prisma.$queryRaw<
      Array<{
        id: string;
        nilai_tugas: number | null;
        komentar_guru: string | null;
        updated_at: Date | null;
      }>
    >`
      UPDATE materi_pengumpulan_tugas mpt
      SET
        nilai_tugas = ${nilai},
        komentar_guru = ${komentarGuru},
        diperbarui_pada = NOW()
      FROM materi_sub_bab msb
      JOIN materi_bab mb ON mb.id = msb.bab_id
      JOIN materi m ON m.id = mb.materi_id
      WHERE mpt.id = CAST(${submissionId} AS uuid)
        AND mpt.sub_bab_id = msb.id
        AND m.created_by = CAST(${user.id} AS uuid)
      RETURNING
        mpt.id,
        mpt.nilai_tugas,
        mpt.komentar_guru,
        mpt.diperbarui_pada AS updated_at
    `;

    if (updatedRows.length === 0) {
      return NextResponse.json(
        { error: "Data pengumpulan tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: updatedRows[0] });
  } catch (error: any) {
    if (error instanceof Error) {
      const knownValidationErrors = [
        "Nilai harus berupa angka",
        "Nilai harus bilangan bulat 0-100",
        "Komentar tidak valid",
        "Komentar maksimal 2000 karakter",
        "Format submissionId tidak valid",
      ];

      if (knownValidationErrors.includes(error.message)) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    console.error("Error updating pengumpulan tugas guru:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
