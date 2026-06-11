import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";

// Constant-time comparison to avoid timing side-channels on the bearer secret.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Fail-CLOSED auth guard for internal AI/automation endpoints.
 * If AI_API_SECRET is missing or the Authorization header doesn't match,
 * the request is rejected. A missing secret must NEVER bypass the check —
 * these routes run with the service-role key and can mutate any tenant's data.
 */
export function checkAIAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.AI_API_SECRET;
  if (!secret) {
    // Misconfiguration: deny rather than expose service-role endpoints.
    console.error("[ai-auth] AI_API_SECRET is not set — denying request (fail-closed).");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (!safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function serviceDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    // Never silently fall back to the anon key: callers of serviceDb() rely on
    // RLS being bypassed. An anon fallback would break behaviour and could run
    // privileged code paths against RLS-restricted data.
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any;
}
