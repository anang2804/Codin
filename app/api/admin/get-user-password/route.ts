import { NextRequest, NextResponse } from "next/server";

// Disable caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error:
        "Endpoint dinonaktifkan karena kebijakan keamanan. Password plaintext tidak tersedia.",
      password: null,
      updatedAt: null,
    },
    { status: 410 },
  );
}
