import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "NOT SET",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "NOT SET",
    // Show first/last 10 chars untuk verify
    serviceRoleKeyPreview: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(
          0,
          10
        )}...${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(
          process.env.SUPABASE_SERVICE_ROLE_KEY.length - 10
        )}`
      : "NOT SET",
  });
}
