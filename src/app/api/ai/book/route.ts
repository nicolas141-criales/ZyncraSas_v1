import { NextRequest, NextResponse } from "next/server";
import { internalHeaders } from "@/lib/api-auth";
import { checkAIAuth, serviceDb } from "@/lib/ai-auth";
import { phoneOrFilter } from "@/lib/phone";

export async function POST(req: NextRequest) {
  const authErr = checkAIAuth(req);
  if (authErr) return authErr;

  const {
    tenant_id, service_id, professional_id,
    client_id, client_name, client_phone, client_email,
    date, time,
  } = await req.json();

  if (!tenant_id || !service_id || !professional_id || !date || !time) {
    return NextResponse.json({ error: "Faltan campos requeridos: tenant_id, service_id, professional_id, date, time" }, { status: 400 });
  }
  if (!client_id && !client_phone) {
    return NextResponse.json({ error: "Se requiere client_id o client_phone" }, { status: 400 });
  }

  const db = serviceDb();

  // Validate service and professional belong to this tenant
  const [{ data: service }, { data: professional }] = await Promise.all([
    db.from("services").select("id, name, duration_minutes").eq("id", service_id).eq("tenant_id", tenant_id).maybeSingle(),
    db.from("professionals").select("id, name").eq("id", professional_id).eq("tenant_id", tenant_id).maybeSingle(),
  ]);

  if (!service || !professional) {
    return NextResponse.json({ error: "Servicio o profesional no válido para este negocio" }, { status: 404 });
  }

  const normalizedTime = time.length === 5 ? time + ":00" : time;

  // Duplicate booking guard
  const { data: conflict } = await db
    .from("appointments")
    .select("id")
    .eq("tenant_id", tenant_id)
    .eq("professional_id", professional_id)
    .eq("appointment_date", date)
    .eq("appointment_time", normalizedTime)
    .not("status", "eq", "cancelled")
    .maybeSingle();

  if (conflict) {
    return NextResponse.json({ error: "Ese horario ya está ocupado. Por favor elige otro horario." }, { status: 409 });
  }

  // Resolve client
  let resolvedClientId = client_id as string | null;
  if (!resolvedClientId && client_phone) {
    const { data: existing } = await db
      .from("clients")
      .select("id")
      .eq("tenant_id", tenant_id)
      .or(phoneOrFilter(client_phone))
      .maybeSingle();

    if (existing) {
      resolvedClientId = existing.id;
    } else {
      const { data: created, error: createErr } = await db
        .from("clients")
        .insert({ tenant_id, name: client_name ?? client_phone, phone: client_phone, email: client_email ?? null })
        .select("id")
        .single();

      if (createErr || !created) {
        return NextResponse.json({ error: "Error al registrar el cliente" }, { status: 500 });
      }
      resolvedClientId = created.id;
    }
  }

  // Create appointment
  const { data: appt, error: insertErr } = await db
    .from("appointments")
    .insert({
      tenant_id,
      service_id,
      professional_id,
      client_id: resolvedClientId,
      appointment_date: date,
      appointment_time: normalizedTime,
      status: "pending",
    })
    .select("id, manage_token, appointment_date, appointment_time")
    .single();

  if (insertErr?.code === "23505") {
    return NextResponse.json({ error: "Ese horario ya no está disponible. Por favor elige otro horario." }, { status: 409 });
  }
  if (insertErr || !appt) {
    return NextResponse.json({ error: "Error al crear la cita" }, { status: 500 });
  }

  // Fire-and-forget confirmation email
  if ((appt as any).manage_token) {
    const [{ data: branding }, { data: clientData }] = await Promise.all([
      db.from("branding").select("business_name, primary_color").eq("tenant_id", tenant_id).maybeSingle(),
      db.from("clients").select("name, email").eq("id", resolvedClientId!).maybeSingle(),
    ]);

    if (clientData?.email) {
      const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://zyncra.app").replace(/\/$/, "");
      fetch(`${base}/api/send-confirmation`, {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify({
          email:        clientData.email,
          clientName:   clientData.name,
          businessName: branding?.business_name ?? "",
          service:      service.name,
          professional: professional.name,
          date,
          time,
          primaryColor: branding?.primary_color ?? "#14111C",
          manageToken:  (appt as any).manage_token,
          type:         "confirmation",
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({
    ok: true,
    appointment: {
      id:           (appt as any).id,
      date:         (appt as any).appointment_date,
      time:         (appt as any).appointment_time,
      service:      service.name,
      professional: professional.name,
      manage_token: (appt as any).manage_token,
    },
  });
}
