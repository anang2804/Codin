import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const mapel = await prisma.mapel.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        guru_id: true,
        created_at: true,
        created_by: true,
        guru: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        data: mapel,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching mapel:", error);
    return NextResponse.json(
      { error: "Failed to fetch mapel" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, description, guru_id } = body;

    const newMapel = await prisma.mapel.create({
      data: {
        name,
        code,
        description,
        guru_id: guru_id || null,
        created_by: user.id,
      },
    });

    return NextResponse.json({ success: true, data: newMapel });
  } catch (error: any) {
    console.error("Error creating mapel:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create mapel" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, code, description, guru_id } = body;

    const updatedMapel = await prisma.mapel.update({
      where: { id },
      data: {
        name,
        code,
        description,
        guru_id: guru_id || null,
      },
    });

    return NextResponse.json({ success: true, data: updatedMapel });
  } catch (error: any) {
    console.error("Error updating mapel:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update mapel" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.mapel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting mapel:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete mapel" },
      { status: 500 }
    );
  }
}
