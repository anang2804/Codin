import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

async function checkAdminAuth() {
  const serverSupabase = await createClient();
  const {
    data: { user: caller },
  } = await serverSupabase.auth.getUser();

  if (!caller) throw new Error("Unauthorized");

  const callerProfile = await prisma.profile.findUnique({
    where: { id: caller.id },
    select: { role: true },
  });

  if (callerProfile?.role !== "admin") throw new Error("Forbidden");

  return caller;
}

export async function GET(req: Request) {
  try {
    await checkAdminAuth();

    const kelas = await prisma.kelas.findMany({
      select: {
        id: true,
        name: true,
        wali_kelas_id: true,
        created_at: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      { data: kelas },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (err: any) {
    console.error("Error fetching kelas:", err);
    const status =
      err.message === "Unauthorized"
        ? 401
        : err.message === "Forbidden"
        ? 403
        : 500;
    return NextResponse.json(
      { error: err.message || "Failed to fetch kelas" },
      { status }
    );
  }
}

export async function POST(req: Request) {
  try {
    await checkAdminAuth();

    const body = await req.json();
    const { name, wali_kelas_id } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newKelas = await prisma.kelas.create({
      data: {
        name,
        wali_kelas_id: wali_kelas_id || null,
      },
    });

    return NextResponse.json({ data: newKelas });
  } catch (err: any) {
    console.error("Error creating kelas:", err);
    const status =
      err.message === "Unauthorized"
        ? 401
        : err.message === "Forbidden"
        ? 403
        : 500;
    return NextResponse.json(
      { error: err.message || "Failed to create kelas" },
      { status }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await checkAdminAuth();

    const body = await req.json();
    const { id, name, wali_kelas_id } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID and name are required" },
        { status: 400 }
      );
    }

    const updatedKelas = await prisma.kelas.update({
      where: { id },
      data: {
        name,
        wali_kelas_id: wali_kelas_id || null,
      },
    });

    return NextResponse.json({ data: updatedKelas });
  } catch (err: any) {
    console.error("Error updating kelas:", err);
    const status =
      err.message === "Unauthorized"
        ? 401
        : err.message === "Forbidden"
        ? 403
        : 500;
    return NextResponse.json(
      { error: err.message || "Failed to update kelas" },
      { status }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await checkAdminAuth();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.kelas.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting kelas:", err);
    const status =
      err.message === "Unauthorized"
        ? 401
        : err.message === "Forbidden"
        ? 403
        : 500;
    return NextResponse.json(
      { error: err.message || "Failed to delete kelas" },
      { status }
    );
  }
}
