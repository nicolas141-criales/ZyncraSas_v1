import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

type Params = Promise<{ token: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { token } = await params;

  const { data: appt, error } = await supabaseAdmin
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
    supabaseAdmin.from("tenants").select("name, settings").eq("id", appt.tenant_id).maybeSingle(),
    supabaseAdmin.from("branding").select("business_name, primary_color, secondary_color, logo_url").eq("tenant_id", appt.tenant_id).maybeSingle(),
  ]);

  return NextResponse.json({ appt, tenant, branding });
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { token } = await params;
  const body = await req.json();
  const { action, date, time } = body;

  const { data: appt, error } = await supabaseAdmin
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
    const { error: updErr } = await supabaseAdmin
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appt.id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "cancelled" });
  }

  if (action === "reschedule") {
    if (!date || !time) {
      return NextResponse.json({ error: "Fecha y hora requeridas" }, { status: 400 });
    }

    const { error: updErr } = await supabaseAdmin
      .from("appointments")
      .update({ appointment_date: date, appointment_time: time, status: "pending" })
      .eq("id", appt.id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // Send updated confirmation email
    const client = appt.clients as any;
    const service = appt.services as any;
    const professional = appt.professionals as any;

    if (client?.email) {
      const [{ data: branding }] = await Promise.all([
        supabaseAdmin.from("branding").select("business_name,primary_color,secondary_color").eq("tenant_id", appt.tenant_id).maybeSingle(),
      ]);

      const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
      await fetch(`${base}/api/send-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:         client.email,
          clientName:    client.name,
          businessName:  (branding as any)?.business_name ?? "Negocio",
          service:       service?.name ?? "",
          professional:  professional?.name ?? "",
          date,
          time,
          primaryColor:  (branding as any)?.primary_color  ?? "#fb0f05",
          secondaryColor:(branding as any)?.secondary_color ?? "#0027fe",
          manageToken:   token,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, action: "rescheduled" });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
