import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export function checkAIAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.AI_API_SECRET;
  if (!secret) return null;
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any;
}
