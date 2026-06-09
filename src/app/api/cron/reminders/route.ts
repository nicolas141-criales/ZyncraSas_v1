import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000; // UTC-5, no DST

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
) as any;

// Bogotá "wall clock" from a UTC Date
function bogota(utc: Date) {
  return new Date(utc.getTime() + BOGOTA_OFFSET_MS);
}
function isoDate(d: Date)  { return d.toISOString().slice(0, 10); }
function isoTime(d: Date)  { return d.toISOString().slice(11, 19); }

// Returns [{date, minTime, maxTime}] for a UTC window, split across midnight if needed
function dateTimeWindows(utcFrom: Date, utcTo: Date) {
  const bFrom = bogota(utcFrom);
  const bTo   = bogota(utcTo);
  if (isoDate(bFrom) === isoDate(bTo)) {
    return [{ date: isoDate(bFrom), minTime: isoTime(bFrom), maxTime: isoTime(bTo) }];
  }
  // crosses midnight — two windows
  return [
    { date: isoDate(bFrom), minTime: isoTime(bFrom), maxTime: "23:59:59" },
    { date: isoDate(bTo),   minTime: "00:00:00",     maxTime: isoTime(bTo)  },
  ];
}

type ReminderKey = "24h" | "2h" | "post";

interface Window { date: string; minTime: string; maxTime: string; }

async function fetchAppointments(windows: Window[], sentVia: string) {
  const results: any[] = [];
  for (const w of windows) {
    const { data, error } = await db()
      .from("appointments")
      .select(`
        id, tenant_id, appointment_date, appointment_time, manage_token,
        clients   (id, name, email, phone),
        services  (name),
        professionals (name)
      `)
      .in("status", ["pending", "confirmed"])
      .eq("appointment_date", w.date)
      .gte("appointment_time", w.minTime)
      .lte("appointment_time", w.maxTime);

    if (error) { console.error("[cron] query error", error); continue; }

    // filter out already-sent
    for (const appt of data ?? []) {
      const { data: log } = await db()
        .from("reminder_logs")
        .select("id")
        .eq("appointment_id", appt.id)
        .eq("sent_via", sentVia)
        .maybeSingle();
      if (!log) results.push(appt);
    }
  }
  return results;
}

async function sendReminder(appt: any, key: ReminderKey) {
  const client = appt.clients;
  if (!client?.email) return;

  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://zyncra.app").replace(/\/$/, "");
  const res = await fetch(`${base}/api/send-reminder-email`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appointmentId:    appt.id,
      tenantId:         appt.tenant_id,
      clientEmail:      client.email,
      clientName:       client.name,
      clientPhone:      client.phone ?? null,
      templateKey:      key,
      serviceName:      appt.services?.name      ?? "",
      appointmentDate:  appt.appointment_date,
      appointmentTime:  appt.appointment_time,
      professionalName: appt.professionals?.name ?? null,
      manageToken:      appt.manage_token        ?? null,
      source:           "auto",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`[cron] send-reminder-email ${key} failed`, err);
  }
}

export async function GET(req: NextRequest) {
  // Vercel calls with Authorization: Bearer <CRON_SECRET>
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now    = new Date();
  const H      = 60 * 60 * 1000;
  const MIN    = 60 * 1000;

  // 24h window: appointments 23h45m – 24h15m from now
  const w24h   = dateTimeWindows(new Date(now.getTime() + 23*H + 45*MIN), new Date(now.getTime() + 24*H + 15*MIN));
  // 2h window: appointments 1h45m – 2h15m from now
  const w2h    = dateTimeWindows(new Date(now.getTime() +  1*H + 45*MIN), new Date(now.getTime() +  2*H + 15*MIN));
  // post-visit: appointments that ended 20m – 80m ago
  const wPost  = dateTimeWindows(new Date(now.getTime() -     80*MIN), new Date(now.getTime() -     20*MIN));

  const [appts24h, appts2h, apptsPost] = await Promise.all([
    fetchAppointments(w24h,  "email-24h"),
    fetchAppointments(w2h,   "email-2h"),
    fetchAppointments(wPost, "email-post"),
  ]);

  await Promise.all([
    ...appts24h.map(a => sendReminder(a, "24h")),
    ...appts2h .map(a => sendReminder(a, "2h")),
    ...apptsPost.map(a => sendReminder(a, "post")),
  ]);

  const summary = { sent24h: appts24h.length, sent2h: appts2h.length, sentPost: apptsPost.length };
  console.log("[cron/reminders]", summary);
  return NextResponse.json({ ok: true, ...summary });
}
