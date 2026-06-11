import { NextRequest, NextResponse } from "next/server";
import { internalHeaders } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

type Params = Promise<{ token: string }>;

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // Service role required: this token-based flow reads/updates appointments that
  // anon can no longer access under the hardened RLS. No anon fallback.
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
) as any;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { token } = await params;

  const { data: appt, error } = await db()
    .from("appointments")
    .select(`
      id, status, appointment_date, appointment_time, manage_token, tenant_id, professional_id,
      clients   (name, email, phone),
      services  (name, duration_minutes),
      professionals (name, schedule)
    `)
    .eq("manage_token", token)
    .maybeSingle();

  if (error || !appt) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const [{ data: tenant }, { data: branding }] = await Promise.all([
    db().from("tenants").select("name, settings").eq("id", appt.tenant_id).maybeSingle(),
    db().from("branding").select("business_name, primary_color, secondary_color, logo_url").eq("tenant_id", appt.tenant_id).maybeSingle(),
  ]);

  return NextResponse.json({ appt, tenant, branding });
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { token } = await params;
  const body = await req.json();
  const { action, date, time } = body;

  const { data: appt, error } = await db()
    .from("appointments")
    .select("id, status, tenant_id, professional_id, service_id, appointment_date, appointment_time, clients(name,email), services(name,duration_minutes), professionals(name)")
    .eq("manage_token", token)
    .maybeSingle();

  if (error || !appt) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  if (appt.status === "cancelled") {
    return NextResponse.json({ error: "Esta cita ya fue cancelada" }, { status: 400 });
  }

  if (action === "cancel") {
    const { error: updErr } = await db()
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appt.id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    if (appt.clients?.email) {
      const { data: branding } = await db()
        .from("branding")
        .select("business_name, primary_color")
        .eq("tenant_id", appt.tenant_id)
        .maybeSingle();

      const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://zyncra.app").replace(/\/$/, "");
      fetch(`${base}/api/send-confirmation`, {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify({
          email:        appt.clients.email,
          clientName:   appt.clients.name,
          businessName: branding?.business_name ?? "",
          service:      appt.services?.name      ?? "",
          professional: appt.professionals?.name ?? "",
          date:         appt.appointment_date,
          time:         appt.appointment_time,
          primaryColor: branding?.primary_color  ?? "#fb0f05",
          manageToken:  token,
          type:         "cancellation",
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, action: "cancelled" });
  }

  if (action === "reschedule") {
    if (!date || !time) {
      return NextResponse.json({ error: "Fecha y hora requeridas" }, { status: 400 });
    }

    const { error: updErr } = await db()
      .from("appointments")
      .update({ appointment_date: date, appointment_time: time, status: "pending" })
      .eq("id", appt.id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // Send updated confirmation email
    if (appt.clients?.email) {
      const { data: branding } = await db()
        .from("branding")
        .select("business_name, primary_color, secondary_color")
        .eq("tenant_id", appt.tenant_id)
        .maybeSingle();

      const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
      await fetch(`${base}/api/send-confirmation`, {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify({
          email:          appt.clients.email,
          clientName:     appt.clients.name,
          businessName:   branding?.business_name  ?? "Negocio",
          service:        appt.services?.name       ?? "",
          professional:   appt.professionals?.name  ?? "",
          date,
          time,
          primaryColor:   branding?.primary_color   ?? "#fb0f05",
          secondaryColor: branding?.secondary_color  ?? "#0027fe",
          manageToken:    token,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, action: "rescheduled" });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
