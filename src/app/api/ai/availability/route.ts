import { NextRequest, NextResponse } from "next/server";
import { checkAIAuth, serviceDb } from "@/lib/ai-auth";

// Static 30-min slots matching the public booking page (08:00 – 19:00)
const SLOT_START = 8 * 60;   // 08:00
const SLOT_END   = 19 * 60;  // 19:00
const INTERVAL   = 30;

function timeToMin(t: string) {
  const [h, m] = t.substring(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function minToTime(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  const authErr = checkAIAuth(req);
  if (authErr) return authErr;

  const { tenant_id, service_id, date, professional_id } = await req.json();

  if (!tenant_id || !service_id || !date) {
    return NextResponse.json({ error: "tenant_id, service_id y date son requeridos" }, { status: 400 });
  }

  const db = serviceDb();

  const { data: service } = await db
    .from("services")
    .select("id, name, duration_minutes")
    .eq("id", service_id)
    .eq("tenant_id", tenant_id)
    .maybeSingle();

  if (!service) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }

  const duration = service.duration_minutes ?? 60;

  // Get professionals
  let profsQuery = db
    .from("professionals")
    .select("id, name")
    .eq("tenant_id", tenant_id);

  if (professional_id) {
    profsQuery = profsQuery.eq("id", professional_id);
  }

  const { data: profs } = await profsQuery;
  if (!profs?.length) return NextResponse.json({ slots: [] });

  // Get booked appointments for that date
  const profIds = profs.map((p: any) => p.id);
  const { data: booked } = await db
    .from("appointments")
    .select("professional_id, appointment_time, services(duration_minutes)")
    .eq("tenant_id", tenant_id)
    .eq("appointment_date", date)
    .in("professional_id", profIds)
    .not("status", "eq", "cancelled");

  const slots: { time: string; professional_id: string; professional_name: string }[] = [];

  for (const prof of profs) {
    const profBooked = (booked ?? []).filter((a: any) => a.professional_id === prof.id);

    let cur = SLOT_START;
    while (cur + duration <= SLOT_END) {
      const slotEnd = cur + duration;
      const free = profBooked.every((a: any) => {
        const aStart = timeToMin(a.appointment_time);
        const aDur: number = (a.services as any)?.duration_minutes ?? 60;
        return slotEnd <= aStart || cur >= aStart + aDur;
      });

      if (free) {
        slots.push({ time: minToTime(cur), professional_id: prof.id, professional_name: prof.name });
      }
      cur += INTERVAL;
    }
  }

  slots.sort((a, b) => a.time.localeCompare(b.time));

  return NextResponse.json({ slots, service_name: service.name, date });
}
