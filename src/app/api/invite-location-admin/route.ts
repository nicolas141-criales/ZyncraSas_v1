import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const adminDb = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any;

export async function POST(req: NextRequest) {
  const { email, name, locationId, tenantId, requestingUserId } = await req.json();

  if (!email || !locationId || !tenantId || !requestingUserId) {
    return NextResponse.json({ error: "Parámetros incompletos." }, { status: 400 });
  }

  const db = adminDb();

  // Verify requesting user owns the tenant
  const { data: tenant } = await db
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .eq("owner_id", requestingUserId)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: "Sin permisos." }, { status: 403 });
  }

  // Upsert the location_admins row (email + location_id unique)
  const { error: upsertError } = await db.from("location_admins").upsert({
    tenant_id: tenantId,
    location_id: locationId,
    email: email.toLowerCase().trim(),
    name: name?.trim() || email.split("@")[0],
    is_active: true,
    invited_at: new Date().toISOString(),
    accepted_at: null,
    user_id: null,
  }, { onConflict: "email,location_id" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Send Supabase invite email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zyncra.app";
  const { error: inviteError } = await db.auth.admin.inviteUserByEmail(
    email.toLowerCase().trim(),
    {
      redirectTo: `${appUrl}/admin`,
      data: { role: "location_admin", tenant_id: tenantId, location_id: locationId },
    }
  );

  if (inviteError) {
    // If user already exists, that's fine — they'll log in normally
    if (!inviteError.message?.includes("already been registered")) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
