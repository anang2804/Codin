import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch all sub_babs for a bab
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
    const babId = searchParams.get("bab_id");

    if (!babId) {
      return NextResponse.json(
        { error: "bab_id is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const bab = await prisma.materiBab.findUnique({
      where: { id: babId },
      include: { materi: true },
    });

    if (!bab || bab.materi.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch sub_babs
    const subBabs = await prisma.materiSubBab.findMany({
      where: { bab_id: babId },
      orderBy: { order_index: "asc" },
    });

    return NextResponse.json(
      { data: subBabs },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching sub_babs:", error);
    return NextResponse.json(
      { error: "Failed to fetch sub_babs" },
      { status: 500 }
    );
  }
}

// POST - Create new sub_bab
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
    const { bab_id, title, content, content_type, content_url, duration } =
      body;

    if (!bab_id || !title || !content_type) {
      return NextResponse.json(
        { error: "bab_id, title, and content_type are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const bab = await prisma.materiBab.findUnique({
      where: { id: bab_id },
      include: { materi: true },
    });

    if (!bab || bab.materi.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get max order_index
    const maxSubBab = await prisma.materiSubBab.findFirst({
      where: { bab_id },
      orderBy: { order_index: "desc" },
    });

    const orderIndex = maxSubBab ? maxSubBab.order_index + 1 : 0;

    // Create sub_bab
    const subBab = await prisma.materiSubBab.create({
      data: {
        bab_id,
        title,
        content: content_type === "text" ? content : null,
        content_type,
        content_url: content_type !== "text" ? content_url : null,
        duration: duration || 0,
        order_index: orderIndex,
      },
    });

    return NextResponse.json({ data: subBab }, { status: 201 });
  } catch (error) {
    console.error("Error creating sub_bab:", error);
    return NextResponse.json(
      { error: "Failed to create sub_bab" },
      { status: 500 }
    );
  }
}

// PUT - Update sub_bab
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
    const { id, title, content, content_type, content_url, duration } = body;

    if (!id || !title || !content_type) {
      return NextResponse.json(
        { error: "id, title, and content_type are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const subBab = await prisma.materiSubBab.findUnique({
      where: { id },
      include: {
        bab: {
          include: { materi: true },
        },
      },
    });

    if (!subBab || subBab.bab.materi.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update sub_bab
    const updatedSubBab = await prisma.materiSubBab.update({
      where: { id },
      data: {
        title,
        content: content_type === "text" ? content : null,
        content_type,
        content_url: content_type !== "text" ? content_url : null,
        duration: duration || 0,
      },
    });

    return NextResponse.json({ data: updatedSubBab });
  } catch (error) {
    console.error("Error updating sub_bab:", error);
    return NextResponse.json(
      { error: "Failed to update sub_bab" },
      { status: 500 }
    );
  }
}

// DELETE - Delete sub_bab
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
    const subBab = await prisma.materiSubBab.findUnique({
      where: { id },
      include: {
        bab: {
          include: { materi: true },
        },
      },
    });

    if (!subBab || subBab.bab.materi.created_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete sub_bab
    await prisma.materiSubBab.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Sub-bab deleted successfully" });
  } catch (error) {
    console.error("Error deleting sub_bab:", error);
    return NextResponse.json(
      { error: "Failed to delete sub_bab" },
      { status: 500 }
    );
  }
}
