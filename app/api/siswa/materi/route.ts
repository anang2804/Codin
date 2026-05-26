import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/siswa/materi
 * Fetch materi yang accessible untuk siswa berdasarkan kelas mereka
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student's profile and kelas
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        kelas: true,
      },
    });

    if (!profile || profile.role !== "siswa") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const studentKelas = profile.kelas;

    // Find kelas_id from kelas name if student has a kelas
    let kelasId: string | null = null;
    if (studentKelas) {
      const kelas = await prisma.kelas.findFirst({
        where: { name: studentKelas },
        select: { id: true },
      });
      kelasId = kelas?.id || null;
    }

    // Fetch all materi (both unrestricted and for student's kelas)
    // Query 1: Get all unrestricted materi
    const unrestrictedMateri = await prisma.materi.findMany({
      where: { kelas_id: null },
      include: {
        mapel: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            full_name: true,
          },
        },
        _count: {
          select: {
            babs: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Query 2: Get materi for student's kelas (if they have one)
    const restrictedMateri = kelasId
      ? await prisma.materi.findMany({
          where: { kelas_id: kelasId },
          include: {
            mapel: {
              select: {
                id: true,
                name: true,
              },
            },
            creator: {
              select: {
                full_name: true,
              },
            },
            _count: {
              select: {
                babs: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
        })
      : [];

    // Combine and remove duplicates
    const allMateri = [...unrestrictedMateri, ...restrictedMateri];
    const uniqueMateriMap = new Map(allMateri.map((m) => [m.id, m]));
    const materi = Array.from(uniqueMateriMap.values());

    return NextResponse.json(
      { data: materi },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching materi untuk siswa:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to fetch materi",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
