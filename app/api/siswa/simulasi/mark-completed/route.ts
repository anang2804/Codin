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
        { status: 400 },
      );
    }

    const slugsToTry = getCanonicalSlugs(simulasi_slug);

    // Get simulasi ID from slug
    let { data: simulasi, error: simulasiError } = await supabase
      .from("simulasi")
      .select("id")
      .in("slug", slugsToTry)
      .single();

    if (simulasiError || !simulasi) {
      // Auto-create missing simulasi row with service-role to bypass RLS restrictions.
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
        },
      )
      .select()
      .single();

    if (error) {
      console.error("Error marking simulasi as completed:", error);
      return NextResponse.json(
        { error: "Failed to mark simulasi as completed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in mark-completed API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
