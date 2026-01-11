import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Ambil progress simulasi siswa
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ambil progress tertinggi
    const { data: progress, error } = await supabase
      .from("simulasi_progress")
      .select("*")
      .eq("siswa_id", user.id)
      .order("current_stage", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json({
      current_stage: progress?.current_stage || 1,
      progress: progress || null,
    });
  } catch (error: any) {
    console.error("Error fetching simulation progress:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

// POST - Update/Unlock tahap berikutnya
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { simulasi_id, next_stage } = body;

    if (!simulasi_id || !next_stage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validasi bahwa next_stage valid (1-5)
    if (next_stage < 1 || next_stage > 5) {
      return NextResponse.json(
        { error: "Invalid stage number" },
        { status: 400 }
      );
    }

    // Cek progress saat ini
    const { data: currentProgress } = await supabase
      .from("simulasi_progress")
      .select("current_stage")
      .eq("siswa_id", user.id)
      .order("current_stage", { ascending: false })
      .limit(1)
      .single();

    // Validasi bahwa siswa tidak melompat tahap
    if (currentProgress && next_stage > currentProgress.current_stage + 1) {
      return NextResponse.json(
        { error: "Cannot skip stages" },
        { status: 400 }
      );
    }

    // Update atau insert progress
    const { data, error } = await supabase
      .from("simulasi_progress")
      .upsert(
        {
          siswa_id: user.id,
          simulasi_id: simulasi_id,
          current_stage: next_stage,
          completed: next_stage === 5,
          completed_at: next_stage === 5 ? new Date().toISOString() : null,
          last_accessed: new Date().toISOString(),
        },
        {
          onConflict: "siswa_id,simulasi_id",
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      current_stage: next_stage,
      data,
    });
  } catch (error: any) {
    console.error("Error updating simulation progress:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update progress" },
      { status: 500 }
    );
  }
}
