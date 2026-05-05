import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

function normalizeMapelName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function generateMapelCodeBase(name: string) {
  const normalized = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .trim();

  if (!normalized) {
    return "MAP";
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  const baseCode =
    words.length > 1
      ? words.map((word) => word[0]).join("")
      : words[0].slice(0, 3);

  return baseCode.replace(/[^A-Z0-9]/g, "") || "MAP";
}

async function generateUniqueMapelCode(name: string) {
  const baseCode = generateMapelCodeBase(name);

  const existingMapel = await prisma.mapel.findMany({
    where: {
      code: {
        startsWith: baseCode,
      },
    },
    select: {
      code: true,
    },
  });

  const existingCodes = new Set(existingMapel.map((item) => item.code));

  if (!existingCodes.has(baseCode)) {
    return baseCode;
  }

  let suffix = 2;
  while (existingCodes.has(`${baseCode}${suffix}`)) {
    suffix += 1;
  }

  return `${baseCode}${suffix}`;
}

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
        semester: true,
        tahun_ajaran: true,
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
      },
    );
  } catch (error) {
    console.error("Error fetching mapel:", error);
    return NextResponse.json(
      { error: "Failed to fetch mapel" },
      { status: 500 },
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
    const { name, code, description, guru_id, semester, tahun_ajaran } = body;

    const normalizedName = normalizeMapelName(
      typeof name === "string" ? name : "",
    );

    if (!normalizedName) {
      return NextResponse.json(
        { error: "Nama mata pelajaran wajib diisi" },
        { status: 400 },
      );
    }

    const normalizedCode =
      typeof code === "string" ? code.trim().toUpperCase() : "";
    const finalCode =
      normalizedCode || (await generateUniqueMapelCode(normalizedName));

    const newMapel = await prisma.mapel.create({
      data: {
        name: normalizedName,
        code: finalCode,
        description,
        guru_id: guru_id || null,
        semester: semester || null,
        tahun_ajaran: tahun_ajaran || null,
        created_by: user.id,
      },
    });

    return NextResponse.json({ success: true, data: newMapel });
  } catch (error: any) {
    console.error("Error creating mapel:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create mapel" },
      { status: 500 },
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
    const { id, name, code, description, guru_id, semester, tahun_ajaran } =
      body;

    const normalizedName =
      typeof name === "string" ? normalizeMapelName(name) : "";

    const existingMapel = await prisma.mapel.findUnique({
      where: { id },
      select: { code: true },
    });

    const finalCode =
      typeof code === "string" && code.trim()
        ? code.trim().toUpperCase()
        : existingMapel?.code;

    const updateData: any = {};

    if (normalizedName) updateData.name = normalizedName;
    if (finalCode) updateData.code = finalCode;
    if (description !== undefined) updateData.description = description;
    updateData.guru_id = guru_id || null;
    updateData.semester = semester || null;
    updateData.tahun_ajaran = tahun_ajaran || null;

    const updatedMapel = await prisma.mapel.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedMapel });
  } catch (error: any) {
    console.error("Error updating mapel:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update mapel" },
      { status: 500 },
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
      { status: 500 },
    );
  }
}
