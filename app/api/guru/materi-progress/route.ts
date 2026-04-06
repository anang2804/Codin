import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

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

    const siswaList = await prisma.profile.findMany({
      where: { role: "siswa" },
      select: {
        id: true,
        full_name: true,
        kelas: true,
      },
      orderBy: { full_name: "asc" },
    });

    const progressRows = await prisma.materiProgress.findMany({
      select: {
        siswa_id: true,
        materi_id: true,
        completed_sub_bab: true,
        total_sub_bab: true,
        progress_percentage: true,
        last_read_at: true,
        completed_at: true,
        materi: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { last_read_at: "desc" },
    });

    const groupedBySiswa = new Map<string, typeof progressRows>();
    for (const row of progressRows) {
      if (!groupedBySiswa.has(row.siswa_id)) {
        groupedBySiswa.set(row.siswa_id, []);
      }
      groupedBySiswa.get(row.siswa_id)?.push(row);
    }

    const siswa = siswaList.map((s) => {
      const rows = groupedBySiswa.get(s.id) || [];
      const materi_started = rows.length;
      const materi_completed = rows.filter(
        (r) => (r.progress_percentage || 0) >= 100,
      ).length;
      const average_progress =
        materi_started > 0
          ? Math.round(
              rows.reduce((sum, r) => sum + (r.progress_percentage || 0), 0) /
                materi_started,
            )
          : 0;

      return {
        id: s.id,
        full_name: s.full_name || "Tanpa Nama",
        kelas: s.kelas || null,
        materi_started,
        materi_completed,
        average_progress,
        progress: rows.map((r) => ({
          materi_id: r.materi_id,
          materi_title: r.materi?.title || "Materi",
          completed_sub_bab: r.completed_sub_bab || 0,
          total_sub_bab: r.total_sub_bab || 0,
          progress_percentage: r.progress_percentage || 0,
          last_read_at: r.last_read_at,
          completed_at: r.completed_at,
        })),
      };
    });

    const total_siswa = siswa.length;
    const active_siswa = siswa.filter((s) => s.materi_started > 0).length;
    const completed_siswa = siswa.filter(
      (s) => s.materi_started > 0 && s.materi_started === s.materi_completed,
    ).length;

    const overall_average =
      total_siswa > 0
        ? Math.round(
            siswa.reduce((sum, s) => sum + (s.average_progress || 0), 0) /
              total_siswa,
          )
        : 0;

    return NextResponse.json(
      {
        summary: {
          total_siswa,
          active_siswa,
          completed_siswa,
          overall_average,
        },
        siswa,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  } catch (error: any) {
    console.error("Error in guru materi progress API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
