import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type UserRole = "guru" | "siswa";

type SubmissionScope = {
  submission_id: string;
  siswa_id: string;
  guru_id: string;
};

type CommentRow = {
  id: string;
  submission_id: string;
  sender_id: string;
  sender_name: string | null;
  sender_role: string | null;
  message: string;
  created_at: Date;
};

function isMissingUnreadColumnError(error: unknown) {
  const code = (error as { code?: string })?.code;
  const message = String((error as { message?: string })?.message || "");
  return (
    code === "42703" && message.includes("komentar_terakhir_dibaca_guru_pada")
  );
}

async function markGuruCommentsAsReadSafe(submissionId: string) {
  try {
    await prisma.$executeRaw`
      UPDATE materi_pengumpulan_tugas
      SET
        komentar_terakhir_dibaca_guru_pada = NOW(),
        diperbarui_pada = NOW()
      WHERE id = CAST(${submissionId} AS uuid)
    `;
  } catch (error) {
    if (!isMissingUnreadColumnError(error)) {
      throw error;
    }
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function getUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const role = profile?.role as UserRole | undefined;
  if (role !== "guru" && role !== "siswa") return null;

  return { userId: user.id, role };
}

async function getSubmissionScope(submissionId: string) {
  const rows = await prisma.$queryRaw<SubmissionScope[]>`
    SELECT
      mpt.id AS submission_id,
      mpt.siswa_id,
      m.created_by AS guru_id
    FROM materi_pengumpulan_tugas mpt
    JOIN materi_sub_bab msb ON msb.id = mpt.sub_bab_id
    JOIN materi_bab mb ON mb.id = msb.bab_id
    JOIN materi m ON m.id = mb.materi_id
    WHERE mpt.id = CAST(${submissionId} AS uuid)
    LIMIT 1
  `;

  return rows[0] || null;
}

function canAccessSubmission(
  scope: SubmissionScope,
  userId: string,
  role: UserRole,
) {
  if (role === "guru") return scope.guru_id === userId;
  return scope.siswa_id === userId;
}

export async function GET(request: Request) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const submissionId = (searchParams.get("submission_id") || "").trim();
    const shouldMarkAsRead = searchParams.get("mark_as_read") === "1";

    if (!submissionId) {
      return NextResponse.json(
        { error: "submission_id wajib diisi" },
        { status: 400 },
      );
    }

    if (!isUuid(submissionId)) {
      return NextResponse.json(
        { error: "Format submission_id tidak valid" },
        { status: 400 },
      );
    }

    const scope = await getSubmissionScope(submissionId);
    if (!scope) {
      return NextResponse.json(
        { error: "Submission tidak ditemukan" },
        { status: 404 },
      );
    }

    if (!canAccessSubmission(scope, userContext.userId, userContext.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await prisma.$queryRaw<CommentRow[]>`
      SELECT
        c.id,
        c.submission_id,
        c.sender_id,
        p.full_name AS sender_name,
        p.role AS sender_role,
        c.message,
        c.created_at
      FROM materi_pengumpulan_komentar c
      LEFT JOIN profiles p ON p.id = c.sender_id
      WHERE c.submission_id = CAST(${submissionId} AS uuid)
      ORDER BY c.created_at ASC
    `;

    if (shouldMarkAsRead && userContext.role === "guru") {
      await markGuruCommentsAsReadSafe(submissionId);
    }

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("Error fetching submission comments:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const submissionId = String(body?.submissionId || "").trim();
    const message = String(body?.message || "").trim();

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

    if (!message) {
      return NextResponse.json(
        { error: "Pesan komentar tidak boleh kosong" },
        { status: 400 },
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Pesan komentar maksimal 2000 karakter" },
        { status: 400 },
      );
    }

    const scope = await getSubmissionScope(submissionId);
    if (!scope) {
      return NextResponse.json(
        { error: "Submission tidak ditemukan" },
        { status: 404 },
      );
    }

    if (!canAccessSubmission(scope, userContext.userId, userContext.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const insertedRows = await prisma.$queryRaw<CommentRow[]>`
      INSERT INTO materi_pengumpulan_komentar (
        id,
        submission_id,
        sender_id,
        message,
        created_at
      )
      VALUES (
        CAST(${crypto.randomUUID()} AS uuid),
        CAST(${submissionId} AS uuid),
        CAST(${userContext.userId} AS uuid),
        ${message},
        NOW()
      )
      RETURNING
        id,
        submission_id,
        sender_id,
        NULL::text AS sender_name,
        NULL::text AS sender_role,
        message,
        created_at
    `;

    const result = insertedRows[0];

    if (userContext.role === "guru") {
      await markGuruCommentsAsReadSafe(submissionId);
    } else {
      await prisma.$executeRaw`
        UPDATE materi_pengumpulan_tugas
        SET diperbarui_pada = NOW()
        WHERE id = CAST(${submissionId} AS uuid)
      `;
    }

    const senderProfile = await prisma.profile.findUnique({
      where: { id: userContext.userId },
      select: { full_name: true, role: true },
    });

    return NextResponse.json({
      data: {
        ...result,
        sender_name: senderProfile?.full_name || null,
        sender_role: senderProfile?.role || null,
      },
    });
  } catch (error: any) {
    console.error("Error sending submission comment:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
