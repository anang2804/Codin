import { createClient } from "@/lib/supabase/server";
import { SIMULATION_SECTIONS } from "@/lib/simulation-catalog";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getFallbackSimulasiMeta(slug: string) {
  const catalogItem = SIMULATION_SECTIONS.flatMap(
    (section) => section.items,
  ).find((item) => item.slug === slug || item.href.endsWith(`/${slug}`));

  if (catalogItem) {
    const difficultyMap: Record<string, string> = {
      Dasar: "easy",
      Menengah: "medium",
      Lanjutan: "hard",
    };

    return {
      title: catalogItem.title,
      name: catalogItem.title,
      slug: catalogItem.slug,
      url: catalogItem.href,
      category: "Simulasi",
      difficulty: difficultyMap[catalogItem.level] || "medium",
      is_local: true,
    };
  }

  return {
    title: slug.replace(/[-_]/g, " "),
    name: slug.replace(/[-_]/g, " "),
    slug,
    url: `/siswa/simulasi/${slug}`,
    category: "Simulasi",
    difficulty: "medium",
    is_local: true,
  };
}

function getCanonicalSlugs(slug: string) {
  const catalogItem = SIMULATION_SECTIONS.flatMap(
    (section) => section.items,
  ).find((item) => item.slug === slug || item.href.endsWith(`/${slug}`));

  if (!catalogItem) return [slug];
  if (catalogItem.slug === slug) return [slug];
  return [slug, catalogItem.slug];
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { simulasi_slug, result } = await request.json();

    if (!simulasi_slug) {
      return NextResponse.json(
        { error: "simulasi_slug is required" },
        { status: 400 },
      );
    }

    if (result !== "success" && result !== "failed") {
      return NextResponse.json(
        { error: 'result must be either "success" or "failed"' },
        { status: 400 },
      );
    }

    const slugsToTry = getCanonicalSlugs(simulasi_slug);

    let { data: simulasi, error: simulasiError } = await supabase
      .from("simulasi")
      .select("id")
      .in("slug", slugsToTry)
      .single();

    if (simulasiError || !simulasi) {
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing service role env for simulasi auto-create");
        return NextResponse.json(
          { error: "Simulasi belum terdaftar di sistem" },
          { status: 404 },
        );
      }

      const fallbackMeta = getFallbackSimulasiMeta(
        slugsToTry[slugsToTry.length - 1],
      );
      const adminSupabase = createServiceClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        },
      );

      const { data: createdSimulasi, error: createError } = await adminSupabase
        .from("simulasi")
        .upsert(fallbackMeta, { onConflict: "slug" })
        .select("id")
        .single();

      if (createError || !createdSimulasi) {
        console.error("Error creating simulasi fallback:", createError);
        return NextResponse.json(
          { error: "Simulasi belum terdaftar di sistem" },
          { status: 404 },
        );
      }

      simulasi = createdSimulasi;
    }

    const { data: existingProgress, error: progressFetchError } = await supabase
      .from("simulasi_progress")
      .select(
        "id, completed, attempt_count, first_success_at, success_attempt_no",
      )
      .eq("siswa_id", user.id)
      .eq("simulasi_id", simulasi.id)
      .maybeSingle();

    if (progressFetchError) {
      console.error("Error fetching simulasi progress:", progressFetchError);
      return NextResponse.json(
        { error: "Failed to fetch simulation progress" },
        { status: 500 },
      );
    }

    if (existingProgress?.completed) {
      return NextResponse.json({
        success: true,
        counted: false,
        reason: "already_completed",
        attempt_count: existingProgress.attempt_count || 0,
      });
    }

    const nextAttemptNo = (existingProgress?.attempt_count || 0) + 1;
    const now = new Date().toISOString();

    const { error: attemptInsertError } = await supabase
      .from("simulasi_attempts")
      .insert({
        siswa_id: user.id,
        simulasi_id: simulasi.id,
        attempt_no: nextAttemptNo,
        result,
        created_at: now,
      });

    if (attemptInsertError) {
      console.error("Error inserting simulasi attempt:", attemptInsertError);
      return NextResponse.json(
        { error: "Failed to save simulation attempt" },
        { status: 500 },
      );
    }

    const shouldSetFirstSuccess =
      result === "success" && !existingProgress?.first_success_at;

    const { data: updatedProgress, error: progressUpsertError } = await supabase
      .from("simulasi_progress")
      .upsert(
        {
          siswa_id: user.id,
          simulasi_id: simulasi.id,
          last_accessed: now,
          attempt_count: nextAttemptNo,
          first_success_at: shouldSetFirstSuccess
            ? now
            : existingProgress?.first_success_at || null,
          success_attempt_no: shouldSetFirstSuccess
            ? nextAttemptNo
            : existingProgress?.success_attempt_no || null,
        },
        {
          onConflict: "siswa_id,simulasi_id",
        },
      )
      .select("attempt_count, first_success_at, success_attempt_no")
      .single();

    if (progressUpsertError) {
      console.error(
        "Error updating simulasi progress attempt_count:",
        progressUpsertError,
      );
      return NextResponse.json(
        { error: "Failed to update simulation progress" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      counted: true,
      attempt_count: updatedProgress.attempt_count || nextAttemptNo,
      first_success_at: updatedProgress.first_success_at,
      success_attempt_no: updatedProgress.success_attempt_no,
      result,
    });
  } catch (error) {
    console.error("Error in record-attempt API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
