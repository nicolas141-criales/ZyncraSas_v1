import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendReminderEmail, type ReminderTemplateKey } from "@/lib/email";
import { requireInternalOrUser, rateLimit, clientIp, tooManyRequests } from "@/lib/api-auth";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const DAYS_ES   = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MONTHS_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function fmt12(time: string) {
  const [h, m] = time.split(":");
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAYS_ES[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`;
}

export async function POST(req: NextRequest) {
  try {
    // Authn: internal service secret OR an authenticated admin session.
    const authErr = await requireInternalOrUser(req);
    if (authErr) return authErr;
    if (!rateLimit(`send-reminder:${clientIp(req)}`, 60, 60_000)) return tooManyRequests();

    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json();
    const {
      appointmentId,
      tenantId,
      clientEmail,
      clientName,
      clientPhone,
      templateKey,
      serviceName,
      appointmentDate,
      appointmentTime,
      professionalName,
      manageToken,
      source,
    } = body as {
      appointmentId:    string;
      tenantId:         string;
      clientEmail:      string;
      clientName:       string;
      clientPhone?:     string;
      templateKey:      ReminderTemplateKey;
      serviceName:      string;
      appointmentDate:  string;
      appointmentTime:  string;
      professionalName?: string;
      manageToken?:     string | null;
      source?:          "auto" | "manual";
    };

    const manage_url = manageToken ? `https://zyncra.app/manage/${manageToken}` : undefined;

    if (!clientEmail || !templateKey || !appointmentId || !tenantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: branding } = await supabaseAdmin
      .from("branding")
      .select("business_name, logo_url, primary_color")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    await sendReminderEmail(templateKey, clientEmail, clientName, {
      nombre:         clientName,
      servicio:       serviceName,
      fecha:          fmtDate(appointmentDate),
      hora:           fmt12(appointmentTime),
      profesional:    professionalName,
      manage_url,
      business_name:  branding?.business_name  ?? undefined,
      logo_url:       branding?.logo_url        ?? undefined,
      primary_color:  branding?.primary_color   ?? "#1a1a2e",
    });

    await supabaseAdmin.from("reminder_logs").insert({
      tenant_id:      tenantId,
      appointment_id: appointmentId,
      client_name:    clientName,
      client_phone:   clientPhone ?? null,
      client_email:   clientEmail,
      sent_via:       `email-${templateKey}`,
      channel:        "email",
      source:         source ?? "manual",
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[send-reminder-email]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
