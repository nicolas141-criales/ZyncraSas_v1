import { NextRequest, NextResponse } from "next/server";
import { checkAIAuth, serviceDb } from "@/lib/ai-auth";

export async function POST(req: NextRequest) {
  const authErr = checkAIAuth(req);
  if (authErr) return authErr;

  const { appointment_id, tenant_id } = await req.json();
  if (!appointment_id || !tenant_id) {
    return NextResponse.json({ error: "appointment_id y tenant_id son requeridos" }, { status: 400 });
  }

  const db = serviceDb();

  const { data: appt } = await db
    .from("appointments")
    .select("id, status, tenant_id, manage_token, appointment_date, appointment_time, clients(name, email), services(name), professionals(name)")
    .eq("id", appointment_id)
    .eq("tenant_id", tenant_id)
    .maybeSingle();

  if (!appt) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  if ((appt as any).status === "cancelled") {
    return NextResponse.json({ error: "La cita ya está cancelada" }, { status: 400 });
  }

  const { error: updErr } = await db
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointment_id);

  if (updErr) return NextResponse.json({ error: "Error al cancelar" }, { status: 500 });

  // Fire-and-forget cancellation email
  const client = (appt as any).clients as { name?: string; email?: string } | null;
  if (client?.email) {
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
        date:         (appt as any).appointment_date,
        time:         (appt as any).appointment_time,
        type:         "cancellation",
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, cancelled: true });
}
