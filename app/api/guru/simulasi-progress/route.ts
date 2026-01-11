import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
        { status: 403 }
      );
    }

    // Get all simulasi
    const { data: simulasiList, error: simulasiError } = await supabase
      .from("simulasi")
      .select("id, name, slug")
      .order("created_at", { ascending: true });

    if (simulasiError) {
      console.error("Error fetching simulasi:", simulasiError);
      return NextResponse.json(
        { error: "Failed to fetch simulasi" },
        { status: 500 }
      );
    }

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
        { status: 500 }
      );
    }

    // Get all progress
    const { data: progressList, error: progressError } = await supabase
      .from("simulasi_progress")
      .select("siswa_id, simulasi_id, completed, completed_at");

    if (progressError) {
      console.error("Error fetching progress:", progressError);
      return NextResponse.json(
        { error: "Failed to fetch progress" },
        { status: 500 }
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
      };
    });

    // Build result
    const result = siswaList?.map((siswa) => ({
      id: siswa.id,
      full_name: siswa.full_name,
      kelas: siswa.kelas,
      simulasi: simulasiList?.map((sim) => ({
        id: sim.id,
        name: sim.name,
        slug: sim.slug,
        completed: progressMap[siswa.id]?.[sim.id]?.completed || false,
        completed_at: progressMap[siswa.id]?.[sim.id]?.completed_at || null,
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
      { status: 500 }
    );
  }
}
