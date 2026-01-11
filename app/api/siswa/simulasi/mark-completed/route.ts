import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

    const { simulasi_slug } = await request.json();

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
      return NextResponse.json(
        { error: "Simulasi not found" },
        { status: 404 }
      );
    }

    // Upsert simulasi progress
    const { data, error } = await supabase
      .from("simulasi_progress")
      .upsert(
        {
          siswa_id: user.id,
          simulasi_id: simulasi.id,
          completed: true,
          completed_at: new Date().toISOString(),
          last_accessed: new Date().toISOString(),
        },
        {
          onConflict: "siswa_id,simulasi_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error marking simulasi as completed:", error);
      return NextResponse.json(
        { error: "Failed to mark simulasi as completed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in mark-completed API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
