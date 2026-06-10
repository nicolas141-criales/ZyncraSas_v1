import { NextRequest, NextResponse } from "next/server";
import { checkAIAuth, serviceDb } from "@/lib/ai-auth";

export async function POST(req: NextRequest) {
  const authErr = checkAIAuth(req);
  if (authErr) return authErr;

  const { appointment_id, date, time, tenant_id } = await req.json();
  if (!appointment_id || !date || !time || !tenant_id) {
    return NextResponse.json({ error: "appointment_id, date, time y tenant_id son requeridos" }, { status: 400 });
  }

  // Reject past dates
  const todayBogota = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }))
    .toISOString().slice(0, 10);
  if (date < todayBogota) {
    return NextResponse.json({ error: "No se puede reagendar a una fecha pasada" }, { status: 400 });
  }

  const db = serviceDb();

  const { data: appt } = await db
    .from("appointments")
    .select("id, status, tenant_id, professional_id, manage_token, clients(name, email), services(name), professionals(name)")
    .eq("id", appointment_id)
    .eq("tenant_id", tenant_id)
    .maybeSingle();

  if (!appt) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  if ((appt as any).status === "cancelled") {
    return NextResponse.json({ error: "No se puede reagendar una cita cancelada" }, { status: 400 });
  }

  const normalizedTime = time.length === 5 ? time + ":00" : time;

  // Check new slot availability
  const { data: conflict } = await db
    .from("appointments")
    .select("id")
    .eq("tenant_id", tenant_id)
    .eq("professional_id", (appt as any).professional_id)
    .eq("appointment_date", date)
    .eq("appointment_time", normalizedTime)
    .not("status", "eq", "cancelled")
    .neq("id", appointment_id)
    .maybeSingle();

  if (conflict) {
    return NextResponse.json({ error: "Ese horario ya está ocupado. Por favor elige otro." }, { status: 409 });
  }

  const { error: updErr } = await db
    .from("appointments")
    .update({ appointment_date: date, appointment_time: normalizedTime, status: "pending" })
    .eq("id", appointment_id);

  if (updErr) return NextResponse.json({ error: "Error al reagendar" }, { status: 500 });

  // Fire-and-forget modification email
  const client = (appt as any).clients as { name?: string; email?: string } | null;
  if (client?.email && (appt as any).manage_token) {
    const { data: branding } = await db
      .from("branding").select("business_name, primary_color").eq("tenant_id", tenant_id).maybeSingle();

    const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://zyncra.app").replace(/\/$/, "");
    fetch(`${base}/api/send-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email:        client.email,
        clientName:   client.name,
        businessName: branding?.business_name ?? "",
        service:      ((appt as any).services as any)?.name ?? "",
        professional: ((appt as any).professionals as any)?.name ?? "",
        date,
        time,
        primaryColor: branding?.primary_color ?? "#14111C",
        manageToken:  (appt as any).manage_token,
        type:         "modification",
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, appointment: { id: appointment_id, date, time } });
}
