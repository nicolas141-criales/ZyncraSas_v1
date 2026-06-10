import { NextRequest, NextResponse } from "next/server";
import { checkAIAuth, serviceDb } from "@/lib/ai-auth";

export async function POST(req: NextRequest) {
  const authErr = checkAIAuth(req);
  if (authErr) return authErr;

  const { phone, tenant_id } = await req.json();
  if (!phone || !tenant_id) {
    return NextResponse.json({ error: "phone y tenant_id son requeridos" }, { status: 400 });
  }

  const db = serviceDb();

  // Try multiple phone normalizations
  const digits = phone.replace(/\D/g, "");
  const local  = digits.startsWith("57") ? digits.slice(2) : digits;
  const col    = `57${local}`;

  const { data: client } = await db
    .from("clients")
    .select("id, name, email, phone")
    .eq("tenant_id", tenant_id)
    .or(`phone.eq.${phone},phone.eq.${local},phone.eq.${col}`)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ found: false, client: null, appointments: [] });
  }

  const today = new Date().toISOString().substring(0, 10);
  const { data: appointments } = await db
    .from("appointments")
    .select("id, service_id, appointment_date, appointment_time, status, manage_token, services(name), professionals(name)")
    .eq("client_id", client.id)
    .eq("tenant_id", tenant_id)
    .gte("appointment_date", today)
    .not("status", "eq", "cancelled")
    .order("appointment_date", { ascending: true })
    .limit(5);

  return NextResponse.json({ found: true, client, appointments: appointments ?? [] });
}
