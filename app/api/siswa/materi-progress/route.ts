import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

// Mark sub_bab as complete/incomplete (untuk siswa)
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
    const { sub_bab_id, completed } = body;

    if (!sub_bab_id || completed === undefined) {
      return NextResponse.json(
        { error: "sub_bab_id and completed required" },
        { status: 400 }
      );
    }

    // Ensure database connection
    await prisma.$connect();

    // Upsert sub_bab_progress with Prisma
    const progress = await prisma.subBabProgress.upsert({
      where: {
        siswa_id_sub_bab_id: {
          siswa_id: user.id,
          sub_bab_id: sub_bab_id,
        },
      },
      update: {
        completed,
      },
      create: {
        siswa_id: user.id,
        sub_bab_id,
        completed,
      },
    });

    // Get materi_id from sub_bab via bab
    const subBab = await prisma.materiSubBab.findUnique({
      where: { id: sub_bab_id },
      include: {
        bab: {
          select: { materi_id: true },
        },
      },
    });

    let materiProgress = null;
    if (subBab?.bab) {
      const materiId = subBab.bab.materi_id;

      // Count total sub_bab in this materi
      const totalSubBabs = await prisma.materiSubBab.count({
        where: {
          bab: {
            materi_id: materiId,
          },
        },
      });

      // Count completed sub_bab by this user
      const completedSubBabs = await prisma.subBabProgress.count({
        where: {
          siswa_id: user.id,
          completed: true,
          sub_bab: {
            bab: {
              materi_id: materiId,
            },
          },
        },
      });

      // Calculate progress percentage
      const progressPercentage =
        totalSubBabs > 0
          ? Math.round((completedSubBabs / totalSubBabs) * 100)
          : 0;

      // Upsert materi_progress
      materiProgress = await prisma.materiProgress.upsert({
        where: {
          siswa_id_materi_id: {
            siswa_id: user.id,
            materi_id: materiId,
          },
        },
        update: {
          completed_sub_bab: completedSubBabs,
          total_sub_bab: totalSubBabs,
          progress_percentage: progressPercentage,
          last_read_at: new Date(),
          completed_at: progressPercentage === 100 ? new Date() : null,
        },
        create: {
          siswa_id: user.id,
          materi_id: materiId,
          completed_sub_bab: completedSubBabs,
          total_sub_bab: totalSubBabs,
          progress_percentage: progressPercentage,
          last_read_at: new Date(),
          completed_at: progressPercentage === 100 ? new Date() : null,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      sub_bab_progress: progress,
      materi_progress: materiProgress,
    });
  } catch (error: any) {
    console.error("Error in update progress API:", error);

    // Disconnect and reconnect on error
    try {
      await prisma.$disconnect();
      await prisma.$connect();
    } catch (reconnectError) {
      console.error("Failed to reconnect:", reconnectError);
    }

    // Provide user-friendly error message
    let errorMessage = "Gagal menyimpan progress";
    if (
      error.message?.includes("database") ||
      error.message?.includes("connect")
    ) {
      errorMessage = "Koneksi database terputus. Silakan coba lagi.";
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}

// Get own progress (untuk siswa)
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
    const materiId = searchParams.get("materi_id");
    const subBabId = searchParams.get("sub_bab_id");

    if (subBabId) {
      // Get progress for specific sub_bab
      const progress = await prisma.subBabProgress.findUnique({
        where: {
          siswa_id_sub_bab_id: {
            siswa_id: user.id,
            sub_bab_id: subBabId,
          },
        },
      });

      return NextResponse.json({ data: progress || { completed: false } });
    } else if (materiId) {
      // Get progress for specific materi + all sub_bab progress
      const materiProgress = await prisma.materiProgress.findUnique({
        where: {
          siswa_id_materi_id: {
            siswa_id: user.id,
            materi_id: materiId,
          },
        },
      });

      // Get all sub_bab progress for this materi
      const subBabProgress = await prisma.subBabProgress.findMany({
        where: {
          siswa_id: user.id,
          sub_bab: {
            bab: {
              materi_id: materiId,
            },
          },
        },
        include: {
          sub_bab: {
            select: {
              id: true,
              bab_id: true,
              bab: {
                select: {
                  materi_id: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        materi_progress: materiProgress || null,
        sub_bab_progress: subBabProgress || [],
      });
    } else {
      // Get all progress for this user
      const progress = await prisma.materiProgress.findMany({
        where: { siswa_id: user.id },
        include: {
          materi: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { last_read_at: "desc" },
      });

      return NextResponse.json({ data: progress });
    }
  } catch (error: any) {
    console.error("Error in get progress API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
