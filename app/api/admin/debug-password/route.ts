import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error:
        "Endpoint dinonaktifkan karena kebijakan keamanan. Password plaintext tidak boleh diekspos.",
    },
    { status: 410 },
  );
}
