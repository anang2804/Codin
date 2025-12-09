import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch all materi by guru
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const mapelId = searchParams.get("mapel_id");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {
      created_by: user.id,
    };

    if (mapelId) {
      where.mapel_id = mapelId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch materi with relations
    const materi = await prisma.materi.findMany({
      where,
      include: {
        mapel: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        creator: {
          select: {
            full_name: true,
            email: true,
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

    return NextResponse.json(
      { data: materi },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching materi:", error);
    return NextResponse.json(
      { error: "Failed to fetch materi" },
      { status: 500 }
    );
  }
}

// POST - Create new materi
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
    const { title, description, mapel_id, thumbnail_url } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const materi = await prisma.materi.create({
      data: {
        title,
        description,
        mapel_id: mapel_id || null,
        thumbnail_url: thumbnail_url || null,
        created_by: user.id,
      },
      include: {
        mapel: true,
        creator: {
          select: {
            full_name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ data: materi }, { status: 201 });
  } catch (error) {
    console.error("Error creating materi:", error);
    return NextResponse.json(
      { error: "Failed to create materi" },
      { status: 500 }
    );
  }
}

// PUT - Update materi
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, mapel_id, thumbnail_url } = body;

    if (!id || !title) {
      return NextResponse.json(
        { error: "ID and title are required" },
        { status: 400 }
      );
    }

    // Check ownership
    const existing = await prisma.materi.findUnique({
      where: { id },
    });

    if (!existing || existing.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const materi = await prisma.materi.update({
      where: { id },
      data: {
        title,
        description,
        mapel_id: mapel_id || null,
        thumbnail_url: thumbnail_url || null,
      },
      include: {
        mapel: true,
      },
    });

    return NextResponse.json({ data: materi });
  } catch (error) {
    console.error("Error updating materi:", error);
    return NextResponse.json(
      { error: "Failed to update materi" },
      { status: 500 }
    );
  }
}

// DELETE - Delete materi
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Check ownership
    const existing = await prisma.materi.findUnique({
      where: { id },
    });

    if (!existing || existing.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.materi.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Materi deleted successfully" });
  } catch (error) {
    console.error("Error deleting materi:", error);
    return NextResponse.json(
      { error: "Failed to delete materi" },
      { status: 500 }
    );
  }
}
