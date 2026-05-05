import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getAdminClient = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
    return null;
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const ensureAdminCaller = async () => {
  const serverSupabase = await createServerClient();
  const {
    data: { user: caller },
  } = await serverSupabase.auth.getUser();

  if (!caller) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const { data: callerProfile } = await serverSupabase
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const, callerId: caller.id };
};

export async function GET(req: Request) {
  try {
    const auth = await ensureAdminCaller();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server credentials not configured" },
        { status: 500 },
      );
    }

    // allow optional ?role=siswa|guru to filter requests by user role
    let roleParam: string | null = null;
    try {
      const { searchParams } = new URL(req.url);
      roleParam = searchParams.get("role");
    } catch (e) {
      roleParam = null;
    }

    const { data: requests, error: requestError } = await supabaseAdmin
      .from("password_change_requests")
      .select("id, user_id, status, requested_at")
      .eq("status", "pending")
      .order("requested_at", { ascending: true });

    if (requestError) {
      return NextResponse.json(
        { error: requestError.message || "Failed to fetch requests" },
        { status: 500 },
      );
    }

    const userIds = (requests || []).map((r: any) => r.user_id).filter(Boolean);
    let profileRows: any[] = [];

    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, role")
        .in("id", userIds);

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message || "Failed to fetch user profiles" },
          { status: 500 },
        );
      }

      profileRows = profiles || [];
    }

    const profileMap = new Map(profileRows.map((p: any) => [String(p.id), p]));
    const mappedWithRole = (requests || [])
      .map((item: any) => {
        const profile = profileMap.get(String(item.user_id));
        return profile
          ? {
              id: item.id,
              user_id: item.user_id,
              status: item.status,
              requested_at: item.requested_at,
              name: profile?.full_name || "User",
              email: profile?.email || "-",
              role: profile?.role || null,
            }
          : null;
      })
      .filter(Boolean) as Array<any>;

    // if role param is given, filter by role
    const finalList = roleParam
      ? mappedWithRole.filter((r) => String(r.role) === String(roleParam))
      : mappedWithRole;

    return NextResponse.json({ data: finalList });
  } catch (err: any) {
    console.error("Error fetching password change requests:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await ensureAdminCaller();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server credentials not configured" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const requestId = String(body?.requestId ?? "").trim();
    const action = String(body?.action ?? "").trim();
    const note = String(body?.note ?? "").trim();

    if (!requestId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "requestId dan action valid wajib diisi" },
        { status: 400 },
      );
    }

    const { data: requestRow, error: requestError } = await supabaseAdmin
      .from("password_change_requests")
      .select("id, user_id, requested_password, status")
      .eq("id", requestId)
      .single();

    if (requestError || !requestRow) {
      return NextResponse.json(
        { error: "Permintaan tidak ditemukan" },
        { status: 404 },
      );
    }

    if (requestRow.status !== "pending") {
      return NextResponse.json(
        { error: "Permintaan sudah diproses sebelumnya" },
        { status: 400 },
      );
    }

    if (action === "approve") {
      const { error: authUpdateError } =
        await supabaseAdmin.auth.admin.updateUserById(requestRow.user_id, {
          password: requestRow.requested_password,
        });

      if (authUpdateError) {
        return NextResponse.json(
          {
            error: authUpdateError.message || "Gagal memperbarui password auth",
          },
          { status: 500 },
        );
      }

      const now = new Date().toISOString();

      await supabaseAdmin
        .from("profiles")
        .update({
          current_password: requestRow.requested_password,
          password_updated_at: now,
        })
        .eq("id", requestRow.user_id);

      const { error: approveError } = await supabaseAdmin
        .from("password_change_requests")
        .update({
          status: "approved",
          approved_by: auth.callerId,
          approved_at: now,
          notes: note || null,
        })
        .eq("id", requestId);

      if (approveError) {
        return NextResponse.json(
          {
            error: approveError.message || "Gagal menyimpan status persetujuan",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({ ok: true, message: "Permintaan disetujui" });
    }

    const now = new Date().toISOString();
    const { error: rejectError } = await supabaseAdmin
      .from("password_change_requests")
      .update({
        status: "rejected",
        rejected_by: auth.callerId,
        rejected_at: now,
        notes: note || null,
      })
      .eq("id", requestId);

    if (rejectError) {
      return NextResponse.json(
        { error: rejectError.message || "Gagal menolak permintaan" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, message: "Permintaan ditolak" });
  } catch (err: any) {
    console.error("Error processing password change request:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    );
  }
}
