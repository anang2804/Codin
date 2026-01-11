import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const simulasi_slug = searchParams.get("simulasi_slug");

    if (!simulasi_slug) {
      return NextResponse.json(
        { error: "simulasi_slug is required" },
        { status: 400 }
      );
    }

    // Get simulasi ID from slug
    const { data: simulasi, error: simulasiError } = await supabase
      .from("simulasi")
      .select("id")
      .eq("slug", simulasi_slug)
      .single();

    if (simulasiError || !simulasi) {
      return NextResponse.json({ completed: false }, { status: 200 });
    }

    // Check if user has completed this simulasi
    const { data: progress, error } = await supabase
      .from("simulasi_progress")
      .select("completed, completed_at")
      .eq("siswa_id", user.id)
      .eq("simulasi_id", simulasi.id)
      .single();

    if (error || !progress) {
      return NextResponse.json({ completed: false });
    }

    return NextResponse.json({
      completed: progress.completed,
      completed_at: progress.completed_at,
    });
  } catch (error) {
    console.error("Error in check-completed API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
