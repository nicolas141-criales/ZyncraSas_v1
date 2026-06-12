import { NextRequest, NextResponse } from "next/server";
import { serviceDb } from "@/lib/ai-auth";
import { phoneOrFilter } from "@/lib/phone";
import { internalHeaders, rateLimit, clientIp, tooManyRequests } from "@/lib/api-auth";

/**
 * Public booking endpoint for the customer-facing /book/[tenantId] page.
 *
 * Why this exists: the booking page must read availability and create
 * clients/appointments without an authenticated session. Doing that directly
 * from the browser required anon RLS that exposed every tenant's clients and
 * appointments (PII). This route performs those operations server-side with
 * the service-role key, scoped strictly to a single tenant_id, so anon access
 * to `clients`/`appointments` can be revoked entirely.
 *
 * It is unauthenticated by design (public booking) but tightly scoped:
 *  - never returns other clients' data,
 *  - validates the service/professional belong to the tenant,
 *  - rate-limited to blunt enumeration/spam.
 */

function isYmd(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function isHms(s: unknown): s is string {
  return typeof s === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(s);
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`public-booking:${clientIp(req)}`, 40, 60_000)) return tooManyRequests();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body?.action;
  const tenantId = body?.tenant_id;
  if (!tenantId || typeof tenantId !== "string") {
    return NextResponse.json({ error: "tenant_id requerido" }, { status: 400 });
  }

  const db = serviceDb();

  // Confirm the tenant exists (prevents writes against arbitrary ids).
  const { data: tenant } = await db.from("tenants").select("id").eq("id", tenantId).maybeSingle();
  if (!tenant) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

  // ── availability: booked slots for a date ────────────────────────────────
  if (action === "availability") {
    const { date, location_id } = body;
    if (!isYmd(date)) return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });

    let availQ = db
      .from("appointments")
      .select("appointment_time, professional_id")
      .eq("tenant_id", tenantId)
      .eq("appointment_date", date)
      .in("status", ["pending", "confirmed"]);
    if (location_id && typeof location_id === "string") availQ = availQ.eq("location_id", location_id);

    const { data: booked } = await availQ;
    return NextResponse.json({ booked: booked ?? [] });
  }

  // ── create: client + appointment + field values + confirmation email ─────
  if (action === "create") {
    const {
      service_id, professional_id, date, time,
      name, phone, email, field_values, location_id,
    } = body as {
      service_id?: string; professional_id?: string | null;
      date?: string; time?: string;
      name?: string; phone?: string; email?: string;
      field_values?: { field_id: string; field_key: string; value: string }[];
      location_id?: string | null;
    };

    if (!service_id || !isYmd(date) || !isHms(time) || !name || !phone) {
      return NextResponse.json({ error: "Faltan datos de la reserva" }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
    }

    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    const cleanPhone = phone.replace(/\D/g, "").slice(0, 10);

    // Service must belong to this tenant.
    const { data: service } = await db
      .from("services").select("id, name").eq("id", service_id).eq("tenant_id", tenantId).maybeSingle();
    if (!service) return NextResponse.json({ error: "Servicio no válido" }, { status: 404 });

    // Resolve the professional.
    let profId: string | null = null;
    if (professional_id) {
      const { data: prof } = await db
        .from("professionals").select("id").eq("id", professional_id).eq("tenant_id", tenantId).maybeSingle();
      if (!prof) return NextResponse.json({ error: "Profesional no válido" }, { status: 404 });
      // Slot conflict for the chosen professional.
      const { data: conflict } = await db
        .from("appointments").select("id")
        .eq("tenant_id", tenantId).eq("professional_id", professional_id)
        .eq("appointment_date", date).eq("appointment_time", normalizedTime)
        .not("status", "eq", "cancelled").maybeSingle();
      if (conflict) return NextResponse.json({ error: "Ese horario ya está ocupado." }, { status: 409 });
      profId = professional_id;
    } else {
      // "Sin preferencia": pick a professional free at that time, load-balanced
      // by the number of appointments already booked that week.
      let profsQ = db.from("professionals").select("id").eq("tenant_id", tenantId).eq("is_active", true);
      if (location_id && typeof location_id === "string") profsQ = profsQ.eq("location_id", location_id);
      const { data: profs } = await profsQ;
      if (profs?.length) {
        const { data: busyNow } = await db
          .from("appointments").select("professional_id")
          .eq("tenant_id", tenantId).eq("appointment_date", date).eq("appointment_time", normalizedTime)
          .in("status", ["pending", "confirmed"]);
        const busy = new Set((busyNow ?? []).map((a: any) => a.professional_id).filter(Boolean));
        const free = profs.filter((p: any) => !busy.has(p.id));
        const pool = free.length > 0 ? free : profs;

        if (pool.length === 1) {
          profId = pool[0].id;
        } else {
          const d = new Date(`${date}T00:00:00`);
          const dow = d.getDay();
          const monday = new Date(d); monday.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
          const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
          const toISO = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
          const { data: weekApts } = await db
            .from("appointments").select("professional_id")
            .eq("tenant_id", tenantId)
            .gte("appointment_date", toISO(monday)).lte("appointment_date", toISO(sunday))
            .in("status", ["pending", "confirmed"]);
          const count: Record<string, number> = {};
          for (const a of weekApts ?? []) if (a.professional_id) count[a.professional_id] = (count[a.professional_id] || 0) + 1;
          profId = [...pool].sort((a: any, b: any) => (count[a.id] || 0) - (count[b.id] || 0))[0].id;
        }
      }
    }

    // Resolve or create the client (scoped to tenant).
    let clientId: string | null = null;
    const { data: existing } = await db
      .from("clients").select("id").eq("tenant_id", tenantId).or(phoneOrFilter(cleanPhone)).maybeSingle();
    if (existing) {
      clientId = existing.id;
    } else {
      const { data: created } = await db
        .from("clients")
        .insert({ tenant_id: tenantId, name: String(name).slice(0, 120), phone: cleanPhone, email: email || null })
        .select("id").single();
      clientId = created?.id ?? null;
    }
    if (!clientId) return NextResponse.json({ error: "No se pudo registrar el cliente" }, { status: 500 });

    // Create the appointment.
    const { data: appt, error: apptErr } = await db
      .from("appointments")
      .insert({
        tenant_id: tenantId,
        client_id: clientId,
        service_id,
        professional_id: profId,
        appointment_date: date,
        appointment_time: normalizedTime,
        status: "pending",
        ...(location_id ? { location_id } : {}),
      })
      .select("id, manage_token")
      .single();

    if (apptErr || !appt) {
      return NextResponse.json({ error: "No se pudo crear la cita" }, { status: 500 });
    }

    // Persist custom field values (best-effort).
    if (Array.isArray(field_values) && field_values.length > 0) {
      const upserts = field_values
        .filter(f => f && f.field_id && f.value !== undefined && f.value !== "")
        .map(f => ({
          tenant_id: tenantId,
          client_id: clientId,
          field_id: f.field_id,
          field_key: f.field_key,
          value: String(f.value).slice(0, 2000),
        }));
      if (upserts.length > 0) {
        await db.from("client_field_values").upsert(upserts, { onConflict: "client_id,field_id" });
      }
    }

    // Fire-and-forget confirmation email (server-side, authenticated internally).
    const manageToken = (appt as any).manage_token;
    if (email && manageToken) {
      const [{ data: branding }, { data: prof }] = await Promise.all([
        db.from("branding").select("business_name, primary_color, secondary_color").eq("tenant_id", tenantId).maybeSingle(),
        profId ? db.from("professionals").select("name").eq("id", profId).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://zyncra.app").replace(/\/$/, "");
      fetch(`${base}/api/send-confirmation`, {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify({
          email,
          clientName: name,
          businessName: branding?.business_name ?? "",
          service: service.name,
          professional: (prof as any)?.name ?? "—",
          date,
          time,
          primaryColor: branding?.primary_color ?? "#fb0f05",
          secondaryColor: branding?.secondary_color ?? "#0027fe",
          manageToken,
          type: "confirmation",
        }),
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      client_id: clientId,
      professional_id: profId,
      manage_token: manageToken,
    });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
