import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";

// ── HTML escaping ────────────────────────────────────────────────────────────
// Use for ANY user-controlled value interpolated into an HTML email/template.
// Prevents HTML/attribute injection (phishing links, markup) in outbound mail.
export function escapeHtml(input: unknown): string {
  const s = input == null ? "" : String(input);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Constant-time secret comparison ──────────────────────────────────────────
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// ── Internal server-to-server secret ─────────────────────────────────────────
// Server callers send `x-internal-secret: <AI_API_SECRET>`.
export function hasInternalSecret(req: NextRequest): boolean {
  const secret = process.env.AI_API_SECRET;
  if (!secret) return false;
  const provided = req.headers.get("x-internal-secret") ?? "";
  return safeEqual(provided, secret);
}

export function internalHeaders(): Record<string, string> {
  const secret = process.env.AI_API_SECRET ?? "";
  return { "Content-Type": "application/json", "x-internal-secret": secret };
}

// ── Authenticated user session (admin pages) ─────────────────────────────────
// Validates a Supabase access token (Authorization: Bearer <jwt>) and returns
// the user id, or null if invalid/absent.
export async function getSessionUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  if (!token) return null;
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

/**
 * Guard for endpoints callable by BOTH internal services and authenticated
 * admins. Accepts a valid internal secret OR a valid user session.
 * Returns a 401 response when neither is present, otherwise null.
 */
export async function requireInternalOrUser(req: NextRequest): Promise<NextResponse | null> {
  if (hasInternalSecret(req)) return null;
  const uid = await getSessionUserId(req);
  if (uid) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// ── Lightweight in-memory rate limiter ───────────────────────────────────────
// Defense-in-depth. Note: on serverless this is per-instance, not global; for
// hard global limits use a shared store (e.g. Upstash/Redis). Still meaningfully
// blunts naive abuse and accidental loops.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

export function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function tooManyRequests(): NextResponse {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}
