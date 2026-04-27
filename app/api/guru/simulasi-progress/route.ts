import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { SIMULATION_SECTIONS } from "@/lib/simulation-catalog";

// Ambil daftar simulasi dari katalog siswa sebagai sumber utama
const SISWA_SIMULASI_CATALOG = SIMULATION_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({
    slug: item.slug,
    name: item.title,
  })),
);

function isKelasX(kelas: string | null | undefined) {
  const normalized = (kelas || "").trim().toUpperCase();
  if (!normalized) return false;

  const startsWithX = /^X(\b|[\s/-])/.test(normalized);
  const startsWithXI = /^XI(\b|[\s/-])/.test(normalized);
  const startsWithXII = /^XII(\b|[\s/-])/.test(normalized);

  return startsWithX && !startsWithXI && !startsWithXII;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication and role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is guru or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "guru" && profile.role !== "admin")) {
      return NextResponse.json(
        { error: "Forbidden - Guru or Admin access only" },
        { status: 403 },
      );
    }

    // Get simulasi that are currently used in siswa page (source-of-truth by slug)
    const simulasiSlugs = SISWA_SIMULASI_CATALOG.map((sim) => sim.slug);
    const { data: simulasiRows, error: simulasiError } = await supabase
      .from("simulasi")
      .select("id, name, slug")
      .in("slug", simulasiSlugs);

    if (simulasiError) {
      console.error("Error fetching simulasi:", simulasiError);
      return NextResponse.json(
        { error: "Failed to fetch simulasi" },
        { status: 500 },
      );
    }

    const simulasiBySlug = new Map(
      (simulasiRows || []).map((sim) => [sim.slug, sim]),
    );

    const simulasiList = SISWA_SIMULASI_CATALOG.map((catalogItem) => {
      const dbSim = simulasiBySlug.get(catalogItem.slug);
      return {
        id: dbSim?.id || `missing-${catalogItem.slug}`,
        name: dbSim?.name || catalogItem.name,
        slug: catalogItem.slug,
      };
    });

    // Get all siswa
    const { data: siswaList, error: siswaError } = await supabase
      .from("profiles")
      .select("id, full_name, kelas")
      .eq("role", "siswa")
      .order("full_name", { ascending: true });

    if (siswaError) {
      console.error("Error fetching siswa:", siswaError);
      return NextResponse.json(
        { error: "Failed to fetch siswa" },
        { status: 500 },
      );
    }

    // Get all progress
    const { data: progressList, error: progressError } = await supabase
      .from("simulasi_progress")
      .select(
        "siswa_id, simulasi_id, completed, completed_at, attempt_count, first_success_at, success_attempt_no",
      );

    if (progressError) {
      console.error("Error fetching progress:", progressError);
      return NextResponse.json(
        { error: "Failed to fetch progress" },
        { status: 500 },
      );
    }

    const { data: attemptList, error: attemptError } = await supabase
      .from("simulasi_attempts")
      .select("siswa_id, simulasi_id, attempt_no, result, created_at")
      .order("created_at", { ascending: true });

    if (attemptError) {
      console.error("Error fetching attempt history:", attemptError);
      return NextResponse.json(
        { error: "Failed to fetch attempt history" },
        { status: 500 },
      );
    }

    // Build progress map for quick lookup
    const progressMap: Record<string, Record<string, any>> = {};
    progressList?.forEach((p) => {
      if (!progressMap[p.siswa_id]) {
        progressMap[p.siswa_id] = {};
      }
      progressMap[p.siswa_id][p.simulasi_id] = {
        completed: p.completed,
        completed_at: p.completed_at,
        attempt_count: p.attempt_count || 0,
        first_success_at: p.first_success_at || null,
        success_attempt_no: p.success_attempt_no || null,
      };
    });

    const attemptMap: Record<string, Record<string, any[]>> = {};
    attemptList?.forEach((attempt) => {
      if (!attemptMap[attempt.siswa_id]) {
        attemptMap[attempt.siswa_id] = {};
      }

      if (!attemptMap[attempt.siswa_id][attempt.simulasi_id]) {
        attemptMap[attempt.siswa_id][attempt.simulasi_id] = [];
      }

      attemptMap[attempt.siswa_id][attempt.simulasi_id].push({
        attempt_no: attempt.attempt_no,
        result: attempt.result,
        created_at: attempt.created_at,
      });
    });

    const siswaKelasX = (siswaList || []).filter((siswa) =>
      isKelasX(siswa.kelas),
    );

    // Build result (kelas X only)
    const result = siswaKelasX.map((siswa) => ({
      id: siswa.id,
      full_name: siswa.full_name,
      kelas: siswa.kelas,
      simulasi: simulasiList?.map((sim) => ({
        id: sim.id,
        name: sim.name,
        slug: sim.slug,
        completed: progressMap[siswa.id]?.[sim.id]?.completed || false,
        completed_at: progressMap[siswa.id]?.[sim.id]?.completed_at || null,
        attempt_count: progressMap[siswa.id]?.[sim.id]?.attempt_count || 0,
        first_success_at:
          progressMap[siswa.id]?.[sim.id]?.first_success_at || null,
        success_attempt_no:
          progressMap[siswa.id]?.[sim.id]?.success_attempt_no || null,
        attempt_history: attemptMap[siswa.id]?.[sim.id] || [],
      })),
    }));

    return NextResponse.json({
      siswa: result,
      simulasi: simulasiList,
    });
  } catch (error) {
    console.error("Error in simulasi-progress API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
