import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch all babs for a materi
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
    const materiId = searchParams.get("materi_id");

    if (!materiId) {
      return NextResponse.json(
        { error: "materi_id is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const materi = await prisma.materi.findUnique({
      where: { id: materiId },
    });

    if (!materi || materi.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch babs with sub_babs
    const babs = await prisma.materiBab.findMany({
      where: { materi_id: materiId },
      include: {
        sub_babs: {
          orderBy: { order_index: "asc" },
        },
      },
      orderBy: { order_index: "asc" },
    });

    return NextResponse.json(
      { data: babs },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching babs:", error);
    return NextResponse.json(
      { error: "Failed to fetch babs" },
      { status: 500 }
    );
  }
}

// POST - Create new bab
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
    const { materi_id, title, description } = body;

    if (!materi_id || !title) {
      return NextResponse.json(
        { error: "materi_id and title are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const materi = await prisma.materi.findUnique({
      where: { id: materi_id },
    });

    if (!materi || materi.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get max order_index
    const maxBab = await prisma.materiBab.findFirst({
      where: { materi_id },
      orderBy: { order_index: "desc" },
    });

    const orderIndex = maxBab ? maxBab.order_index + 1 : 0;

    // Create bab
    const bab = await prisma.materiBab.create({
      data: {
        materi_id,
        title,
        description,
        order_index: orderIndex,
      },
      include: {
        sub_babs: true,
      },
    });

    return NextResponse.json({ data: bab }, { status: 201 });
  } catch (error) {
    console.error("Error creating bab:", error);
    return NextResponse.json(
      { error: "Failed to create bab" },
      { status: 500 }
    );
  }
}

// PUT - Update bab
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
    const { id, title, description } = body;

    if (!id || !title) {
      return NextResponse.json(
        { error: "id and title are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const bab = await prisma.materiBab.findUnique({
      where: { id },
      include: { materi: true },
    });

    if (!bab || bab.materi.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update bab
    const updatedBab = await prisma.materiBab.update({
      where: { id },
      data: {
        title,
        description,
      },
      include: {
        sub_babs: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    return NextResponse.json({ data: updatedBab });
  } catch (error) {
    console.error("Error updating bab:", error);
    return NextResponse.json(
      { error: "Failed to update bab" },
      { status: 500 }
    );
  }
}

// DELETE - Delete bab
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
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify ownership
    const bab = await prisma.materiBab.findUnique({
      where: { id },
      include: { materi: true },
    });

    if (!bab || bab.materi.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete bab (cascade will delete sub_babs)
    await prisma.materiBab.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Bab deleted successfully" });
  } catch (error) {
    console.error("Error deleting bab:", error);
    return NextResponse.json(
      { error: "Failed to delete bab" },
      { status: 500 }
    );
  }
}
