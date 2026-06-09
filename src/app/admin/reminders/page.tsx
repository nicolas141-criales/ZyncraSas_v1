"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import {
  IconBell, IconCalendar, IconChat, IconCheck, IconClipboard,
  IconCog, IconPhone, IconSend, IconStar, IconZap,
} from "../ZyncraIcons";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  manage_token: string | null;
  clients: { id: string; name: string; phone: string | null; email: string | null } | null;
  services: { name: string } | null;
  professionals: { id: string; name: string } | null;
}

interface ReminderLog {
  id: string;
  client_name: string;
  client_phone: string | null;
  client_email?: string | null;
  sent_via: string;
  source: "auto" | "manual";
  created_at: string;
}

interface ReminderSettings {
  message_template: string;
  hours_before: number;
  enabled_24h: boolean;
  template_2h: string;
  enabled_2h: boolean;
  template_post: string;
  enabled_post: boolean;
}

interface Professional {
  id: string;
  name: string;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_24H = [
  "Hola {{nombre}} \u{1F44B}",
  "",
  "Te recordamos que tienes una cita agendada:",
  "",
  "\u{1F4C5} {{fecha}}",
  "\u{23F0} {{hora}}",
  "\u{2702} {{servicio}}",
  "",
  "\u{1FAF6} Te esperamos. Si necesitas cambiar la hora, escríbenos.",
].join("\n");

const DEFAULT_2H =
  "Hola {{nombre}} \u{1F44B} Tu cita de {{servicio}} es en 2 horas ({{hora}}). ¡Ya casi! \u{1F514}";

const DEFAULT_POST = [
  "Hola {{nombre}}, gracias por visitarnos hoy \u{1F64F}",
  "",
  "¿Cómo estuvo tu servicio de {{servicio}}? Tu opinión nos ayuda a mejorar. ¡Esperamos verte pronto!",
].join("\n");

const DEFAULT_SETTINGS: ReminderSettings = {
  message_template: DEFAULT_24H,
  hours_before: 24,
  enabled_24h: true,
  template_2h: DEFAULT_2H,
  enabled_2h: false,
  template_post: DEFAULT_POST,
  enabled_post: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAYS_ES   = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MONTHS_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function isCorrupted(s: string): boolean {
  return s.includes("�");
}

function safeTemplate(raw: string | null | undefined, fallback: string): string {
  if (!raw || isCorrupted(raw)) return fallback;
  return raw;
}

function fmtApptDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAYS_ES[d.getDay()]} ${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
}

function fmt12(time: string) {
  const [h, m] = time.split(":");
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

function applyVars(template: string, appt: Appointment) {
  const d = new Date(appt.appointment_date + "T00:00:00");
  return template
    .replace(/{{nombre}}/g,      appt.clients?.name ?? "")
    .replace(/{{servicio}}/g,    appt.services?.name ?? "")
    .replace(/{{profesional}}/g, appt.professionals?.name ?? "")
    .replace(/{{fecha}}/g,       `${DAYS_ES[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`)
    .replace(/{{hora}}/g,        fmt12(appt.appointment_time));
}

function waLink(phone: string, msg: string) {
  const p = phone.replace(/\D/g, "");
  const full = p.startsWith("57") ? p : `57${p}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`;
}

function previewMsg(template: string) {
  return template
    .replace(/{{nombre}}/g,      "María García")
    .replace(/{{servicio}}/g,    "Corte de cabello")
    .replace(/{{profesional}}/g, "Laura")
    .replace(/{{fecha}}/g,       "Lunes 25 de May")
    .replace(/{{hora}}/g,        "10:30 AM");
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "white",
  borderRadius: 14,
  padding: "20px 24px",
  border: "1px solid #e8e6e2",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #e8e6e2",
  fontSize: 14,
  color: "#1a1a2e",
  background: "white",
  boxSizing: "border-box",
  fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "9px 20px",
  borderRadius: 10,
  border: "none",
  background: "#fb0f05",
  color: "white",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 14px",
  borderRadius: 10,
  border: "1px solid #e8e6e2",
  background: "white",
  color: "#6b7280",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: checked ? "#fb0f05" : "#d1d5db",
        position: "relative", transition: "background .2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 23 : 3, width: 18, height: 18,
        borderRadius: "50%", background: "white", transition: "left .2s",
        boxShadow: "0 1px 3px rgba(0,0,0,.2)",
      }} />
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type TemplateKey = "24h" | "2h" | "post";

const TEMPLATE_TABS: { key: TemplateKey; icon: React.ReactNode; label: string; desc: string; color: string }[] = [
  { key: "24h",  icon: <IconBell size={14} />,  label: "Principal",   desc: "24 horas antes",   color: "#3b82f6" },
  { key: "2h",   icon: <IconZap size={14} />,   label: "Urgente",     desc: "2 horas antes",    color: "#f59e0b" },
  { key: "post", icon: <IconStar size={14} />,  label: "Post-visita", desc: "Tras el servicio", color: "#8b5cf6" },
];

export default function RemindersPage() {
  const { tenantId } = useAdmin();
  const [tab, setTab] = useState<"proximas" | "config" | "historial">("proximas");
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey>("24h");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  // sentSet tracks "apptId:templateKey" so each message type is independent
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  // emailSentSet tracks "apptId:templateKey" for email channel
  const [emailSentSet, setEmailSentSet] = useState<Set<string>>(new Set());
  // autoEmailSentSet tracks emails sent automatically by the cron
  const [autoEmailSentSet, setAutoEmailSentSet] = useState<Set<string>>(new Set());
  const [emailSending, setEmailSending] = useState<string | null>(null);
  const [confirmedSet, setConfirmedSet] = useState<Set<string>>(new Set());
  const [daysAhead, setDaysAhead] = useState(3);

  // Returns local date string YYYY-MM-DD (avoids UTC offset issues with toISOString)
  function localISO(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const [profFilter, setProfFilter] = useState("all");
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkIndex, setBulkIndex] = useState(0);
  const [bulkTemplate, setBulkTemplate] = useState<TemplateKey | null>(null);

  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [histSearch, setHistSearch] = useState("");
  const [histPeriod, setHistPeriod] = useState<"all" | "month" | "week">("all");

  // ── Loaders ───────────────────────────────────────────────────────────────

  const loadProfessionals = useCallback(async () => {
    const { data } = await supabase
      .from("professionals")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("name");
    setProfessionals((data as Professional[]) ?? []);
  }, [tenantId]);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase
      .from("reminder_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (data) {
      setSettings({
        message_template: safeTemplate(data.message_template, DEFAULT_24H),
        hours_before:     data.hours_before ?? 24,
        enabled_24h:      data.enabled_24h  ?? true,
        template_2h:      safeTemplate(data.template_2h,   DEFAULT_2H),
        enabled_2h:       data.enabled_2h   ?? false,
        template_post:    safeTemplate(data.template_post, DEFAULT_POST),
        enabled_post:     data.enabled_post ?? false,
      });
    }
  }, [tenantId]);

  const loadAppts = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const today = localISO(now);
    const future = new Date(now);
    future.setDate(future.getDate() + daysAhead);
    const futureStr = localISO(future);
    const { data } = await supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, status, manage_token, clients(id, name, phone, email), services(name), professionals(id, name)")
      .eq("tenant_id", tenantId)
      .gte("appointment_date", today)
      .lte("appointment_date", futureStr)
      .in("status", ["pending", "confirmed"])
      .order("appointment_date")
      .order("appointment_time");
    const fetchedAppts = (data as unknown as Appointment[]) ?? [];
    setAppointments(fetchedAppts);

    // Load reminder logs from DB so sent status persists across reloads
    // and reflects automatic sends by the cron job
    if (fetchedAppts.length > 0) {
      const apptIds = fetchedAppts.map(a => a.id);
      const { data: logsData } = await supabase
        .from("reminder_logs")
        .select("appointment_id, sent_via, source")
        .in("appointment_id", apptIds);

      const newSentSet       = new Set<string>();
      const newEmailSentSet  = new Set<string>();
      const newAutoSet       = new Set<string>();

      (logsData ?? []).forEach((l: any) => {
        const apptId = l.appointment_id as string;
        const sv     = (l.sent_via ?? "") as string;
        if (sv.startsWith("whatsapp-")) {
          const type = sv.replace("whatsapp-", "");
          newSentSet.add(`${apptId}:${type}`);
        } else if (sv.startsWith("email-")) {
          const type = sv.replace("email-", "");
          const key  = `${apptId}:${type}`;
          newEmailSentSet.add(key);
          if (l.source === "auto") newAutoSet.add(key);
        }
      });

      setSentSet(newSentSet);
      setEmailSentSet(newEmailSentSet);
      setAutoEmailSentSet(newAutoSet);
    }

    setLoading(false);
  }, [tenantId, daysAhead]);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    const { data } = await supabase
      .from("reminder_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs((data as ReminderLog[]) ?? []);
    setLoadingLogs(false);
  }, [tenantId]);

  useEffect(() => { loadProfessionals(); loadSettings(); }, [loadProfessionals, loadSettings]);
  useEffect(() => { if (tab === "proximas")  loadAppts(); }, [tab, loadAppts]);
  useEffect(() => { if (tab === "historial") loadLogs();  }, [tab, loadLogs]);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function logSent(appt: Appointment, type: TemplateKey) {
    await supabase.from("reminder_logs").insert({
      tenant_id:      tenantId,
      appointment_id: appt.id,
      client_name:    appt.clients?.name  ?? "",
      client_phone:   appt.clients?.phone ?? null,
      sent_via:       `whatsapp-${type}`,
    });
    setSentSet(prev => new Set([...prev, `${appt.id}:${type}`]));
  }

  async function sendEmailReminder(appt: Appointment, type: TemplateKey) {
    const key = `${appt.id}:${type}`;
    setEmailSending(key);
    try {
      const res = await fetch("/api/send-reminder-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId:   appt.id,
          tenantId,
          clientEmail:     appt.clients?.email,
          clientName:      appt.clients?.name  ?? "",
          clientPhone:     appt.clients?.phone ?? null,
          templateKey:     type,
          serviceName:     appt.services?.name ?? "",
          appointmentDate: appt.appointment_date,
          appointmentTime: appt.appointment_time,
          professionalName: appt.professionals?.name ?? null,
          manageToken:     appt.manage_token ?? null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Error al enviar email: ${err.error ?? res.statusText}`);
        return;
      }
      setEmailSentSet(prev => new Set([...prev, key]));
    } finally {
      setEmailSending(null);
    }
  }

  async function confirmAppointment(appt: Appointment) {
    await supabase.from("appointments").update({ status: "confirmed" }).eq("id", appt.id);
    setConfirmedSet(prev => new Set([...prev, appt.id]));
  }

  async function saveSettings() {
    setSavingSettings(true);
    setSettingsMsg(null);
    const { error } = await supabase.from("reminder_settings").upsert(
      {
        tenant_id:        tenantId,
        message_template: settings.message_template,
        hours_before:     settings.hours_before,
        enabled_24h:      settings.enabled_24h,
        template_2h:      settings.template_2h,
        enabled_2h:       settings.enabled_2h,
        template_post:    settings.template_post,
        enabled_post:     settings.enabled_post,
        updated_at:       new Date().toISOString(),
      },
      { onConflict: "tenant_id" }
    );
    setSavingSettings(false);
    setSettingsMsg(error
      ? { type: "err", text: error.message }
      : { type: "ok", text: "Configuración guardada." }
    );
  }

  function restoreAllDefaults() {
    setSettings(DEFAULT_SETTINGS);
    setSettingsMsg({ type: "ok", text: "Plantillas restauradas. Guarda para aplicar." });
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const filteredAppts = useMemo(() => {
    if (profFilter === "all") return appointments;
    return appointments.filter(a => a.professionals?.id === profFilter);
  }, [appointments, profFilter]);

  const grouped = useMemo(() =>
    filteredAppts.reduce((acc, a) => {
      if (!acc[a.appointment_date]) acc[a.appointment_date] = [];
      acc[a.appointment_date].push(a);
      return acc;
    }, {} as Record<string, Appointment[]>),
  [filteredAppts]);

  // All appointments with phone are eligible for bulk send
  const bulkQueue = useMemo(() =>
    filteredAppts.filter(a => !!a.clients?.phone),
  [filteredAppts]);

  const filteredLogs = useMemo(() => {
    let r = logs;
    if (histSearch) {
      const q = histSearch.toLowerCase();
      r = r.filter(l => l.client_name.toLowerCase().includes(q) || (l.client_phone ?? "").includes(q));
    }
    if (histPeriod !== "all") {
      const cutoff = new Date();
      if (histPeriod === "week")  cutoff.setDate(cutoff.getDate() - 7);
      if (histPeriod === "month") cutoff.setMonth(cutoff.getMonth() - 1);
      r = r.filter(l => new Date(l.created_at) >= cutoff);
    }
    return r;
  }, [logs, histSearch, histPeriod]);

  const bulkCurrent = bulkQueue[bulkIndex];

  const tplMeta: Record<TemplateKey, {
    value: string; enabled: boolean; defaultVal: string;
    enabledKey: keyof ReminderSettings; valueKey: keyof ReminderSettings;
  }> = {
    "24h": { value: settings.message_template, enabled: settings.enabled_24h, defaultVal: DEFAULT_24H, enabledKey: "enabled_24h", valueKey: "message_template" },
    "2h":  { value: settings.template_2h,      enabled: settings.enabled_2h,  defaultVal: DEFAULT_2H,  enabledKey: "enabled_2h",  valueKey: "template_2h" },
    "post":{ value: settings.template_post,    enabled: settings.enabled_post, defaultVal: DEFAULT_POST, enabledKey: "enabled_post", valueKey: "template_post" },
  };

  const current = tplMeta[activeTemplate];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "0 0 48px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(251,15,5,0.07)", borderRadius: 20,
            padding: "4px 14px", marginBottom: 12,
          }}>
            <IconChat size={14} color="#fb0f05" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fb0f05", letterSpacing: ".04em", textTransform: "uppercase" }}>
              WhatsApp
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a2e", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
            Recordatorios
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
            {"Envía recordatorios de cita a tus clientes por WhatsApp"}
          </p>
        </div>

        {/* Main tabs */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 4, marginBottom: 28,
          background: "#f0f0f5", borderRadius: 12, padding: 4,
        }}>
          {(["proximas", "config", "historial"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, transition: "all .2s",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: tab === t ? "white" : "transparent",
              color:      tab === t ? "#1a1a2e" : "#6b7280",
              boxShadow:  tab === t ? "0 1px 4px rgba(0,0,0,.1)" : "none",
            }}>
              {t === "proximas"
                ? <><IconCalendar size={13} /> Próximas</>
                : t === "config"
                ? <><IconCog size={13} /> Configuración</>
                : <><IconClipboard size={13} /> Historial</>}
            </button>
          ))}
        </div>

        {/* ── Proximas citas ─────────────────────────────────────────────── */}
        {tab === "proximas" && (
          <div>
            <div style={{
              display: "flex", gap: 8, marginBottom: 20,
              alignItems: "center", flexWrap: "wrap",
              background: "white", borderRadius: 12, padding: "12px 16px",
              border: "1px solid #e8e6e2",
            }}>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
                {"Período"}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                {([0, 3, 7] as const).map(d => (
                  <button key={d} onClick={() => setDaysAhead(d)} style={{
                    padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 600,
                    background: daysAhead === d ? "#fb0f05" : "#f0f0f5",
                    color:      daysAhead === d ? "white"   : "#6b7280",
                  }}>
                    {d === 0 ? "Hoy" : `${d} días`}
                  </button>
                ))}
              </div>

              {professionals.length > 0 && (
                <select
                  value={profFilter}
                  onChange={e => setProfFilter(e.target.value)}
                  style={{
                    ...inputStyle, width: "auto", padding: "5px 10px", fontSize: 12,
                    fontWeight: 600, cursor: "pointer",
                    color: profFilter === "all" ? "#6b7280" : "#1a1a2e",
                  }}
                >
                  <option value="all">{"Todos los profesionales"}</option>
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}

              {bulkQueue.length > 0 && (
                <button
                  onClick={() => { setBulkIndex(0); setBulkTemplate(null); setBulkOpen(true); }}
                  style={{ ...btnPrimary, marginLeft: "auto", fontSize: 12, padding: "6px 14px" }}
                >
                  <><IconSend size={13} /> {`Enviar a todos (${bulkQueue.length})`}</>
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 60, color: "#9b9bb0" }}>{"Cargando citas..."}</div>
            ) : filteredAppts.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#9b9bb0" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, opacity: 0.35 }}>
                  <IconCalendar size={48} color="#6b7280" />
                </div>
                <div style={{ fontWeight: 700, color: "#6b7280", fontSize: 15 }}>{"Sin citas próximas"}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{"No hay citas en el período seleccionado"}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {Object.entries(grouped).map(([date, appts]) => (
                  <div key={date}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 10,
                      textTransform: "uppercase", letterSpacing: "0.07em",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{ display: "inline-block", width: 28, height: 2, background: "#e8e6e2", borderRadius: 2 }} />
                      {fmtApptDate(date)}
                      <span style={{ display: "inline-block", flex: 1, height: 2, background: "#e8e6e2", borderRadius: 2 }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {appts.map(appt => {
                        const hasPhone    = !!appt.clients?.phone;
                        const hasEmail    = !!appt.clients?.email;
                        const isConfirmed = confirmedSet.has(appt.id) || appt.status === "confirmed";
                        return (
                          <div key={appt.id} style={{
                            ...card, padding: "14px 18px",
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", gap: 12,
                          }}>
                            {/* Client info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                                <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>
                                  {appt.clients?.name ?? "—"}
                                </span>
                                <span style={{ fontSize: 12, color: "#9b9bb0", fontWeight: 600 }}>
                                  {fmt12(appt.appointment_time)}
                                </span>
                                {isConfirmed && (
                                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#e8f5e9", color: "#388e3c" }}>
                                    {"✓ Confirmado"}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 13, color: "#6b7280" }}>
                                {appt.services?.name ?? "—"}
                                {appt.professionals?.name ? ` · ${appt.professionals.name}` : ""}
                              </div>
                              {!hasPhone && (
                                <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 3 }}>
                                  {"⚠ Sin teléfono"}
                                </div>
                              )}
                              {hasEmail && (
                                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                                  {appt.clients!.email}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                              {!isConfirmed && (
                                <button onClick={() => confirmAppointment(appt)} style={btnGhost}>
                                  {"✓ Confirmó"}
                                </button>
                              )}
                              {/* WhatsApp buttons */}
                              {hasPhone ? (
                                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                  {TEMPLATE_TABS.map(t => {
                                    const wasSentThis = sentSet.has(`${appt.id}:${t.key}`);
                                    return wasSentThis ? (
                                      <span key={t.key} style={{
                                        fontSize: 11, fontWeight: 700, color: "#388e3c",
                                        padding: "4px 9px", borderRadius: 8, background: "#f0fdf4",
                                        display: "inline-flex", alignItems: "center", gap: 3,
                                        border: "1px solid #bbf7d0",
                                      }}>
                                        <IconCheck size={9} /> {t.label}
                                      </span>
                                    ) : (
                                      <a key={t.key}
                                        href={waLink(appt.clients!.phone!, applyVars(tplMeta[t.key].value, appt))}
                                        target="_blank" rel="noopener noreferrer"
                                        onClick={() => logSent(appt, t.key)}
                                        title={t.desc}
                                        style={{
                                          display: "inline-flex", alignItems: "center", gap: 4,
                                          padding: "4px 9px", borderRadius: 8,
                                          background: "#25D366", color: "white",
                                          fontWeight: 600, fontSize: 11, textDecoration: "none",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {t.icon}
                                        {t.label}
                                      </a>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span style={{ fontSize: 12, color: "#d1d5db" }}>{"Sin teléfono"}</span>
                              )}

                              {/* Email buttons */}
                              {hasEmail && (
                                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                  {TEMPLATE_TABS.map(t => {
                                    const emailKey = `${appt.id}:${t.key}`;
                                    const emailSent = emailSentSet.has(emailKey);
                                    const isAuto    = autoEmailSentSet.has(emailKey);
                                    const sending   = emailSending === emailKey;
                                    return emailSent ? (
                                      <span key={t.key} style={{
                                        fontSize: 11, fontWeight: 700,
                                        color:      isAuto ? "#7c3aed" : "#1d4ed8",
                                        padding: "4px 9px", borderRadius: 8,
                                        background:  isAuto ? "#ede9fe" : "#eff6ff",
                                        display: "inline-flex", alignItems: "center", gap: 3,
                                        border: `1px solid ${isAuto ? "#c4b5fd" : "#bfdbfe"}`,
                                      }}
                                        title={isAuto ? "Enviado automáticamente por el sistema" : "Enviado manualmente"}
                                      >
                                        <IconCheck size={9} />
                                        {isAuto ? `⚡ Auto` : t.label}
                                      </span>
                                    ) : (
                                      <button key={t.key}
                                        onClick={() => sendEmailReminder(appt, t.key)}
                                        disabled={sending}
                                        title={`Enviar email ${t.desc}`}
                                        style={{
                                          display: "inline-flex", alignItems: "center", gap: 4,
                                          padding: "4px 9px", borderRadius: 8, border: "none",
                                          background: sending ? "#93c5fd" : "#3b82f6", color: "white",
                                          fontWeight: 600, fontSize: 11, cursor: sending ? "wait" : "pointer",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        📧 {sending ? "…" : t.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Configuracion ──────────────────────────────────────────────── */}
        {tab === "config" && (
          <div>
            {/* Anticipacion */}
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e", marginBottom: 4 }}>
                {"Anticipación del recordatorio"}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                {"Cuántas horas antes se envía"}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[1, 2, 4, 12, 24, 48].map(h => (
                  <button key={h} onClick={() => setSettings(s => ({ ...s, hours_before: h }))} style={{
                    padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600,
                    background: settings.hours_before === h ? "#fb0f05" : "#f0f0f5",
                    color:      settings.hours_before === h ? "white"   : "#6b7280",
                  }}>
                    {`${h}h`}
                  </button>
                ))}
              </div>
            </div>

            {/* Variables */}
            <div style={{ background: "#f8f7ff", borderRadius: 10, padding: "10px 14px", marginBottom: 16, border: "1px solid #e8e6f0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>
                {"Variables disponibles"}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["{{nombre}}", "{{servicio}}", "{{fecha}}", "{{hora}}", "{{profesional}}"].map(v => (
                  <code key={v} style={{ background: "white", border: "1px solid #e8e6e2", padding: "2px 8px", borderRadius: 6, fontSize: 12, color: "#1a1a2e", fontFamily: "monospace" }}>
                    {v}
                  </code>
                ))}
              </div>
            </div>

            {/* Template type selector */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
              {TEMPLATE_TABS.map(t => {
                const isActive = activeTemplate === t.key;
                const meta = tplMeta[t.key];
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTemplate(t.key)}
                    style={{
                      padding: "12px 10px", borderRadius: 12, cursor: "pointer",
                      border: isActive ? `2px solid ${t.color}` : "2px solid #e8e6e2",
                      background: isActive ? `${t.color}0d` : "white",
                      textAlign: "center", transition: "all .15s",
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{t.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? t.color : "#1a1a2e" }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: "#9b9bb0", marginTop: 2 }}>{t.desc}</div>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6,
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: meta.enabled ? "#e8f5e9" : "#f0f0f5",
                      color: meta.enabled ? "#388e3c" : "#9b9bb0",
                    }}>
                      {meta.enabled ? "• Activo" : "• Inactivo"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Single editor */}
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #f0f0f5" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>
                    {TEMPLATE_TABS.find(t => t.key === activeTemplate)?.label}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {TEMPLATE_TABS.find(t => t.key === activeTemplate)?.desc}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: current.enabled ? "#388e3c" : "#9b9bb0" }}>
                    {current.enabled ? "Activo" : "Inactivo"}
                  </span>
                  <Toggle
                    checked={current.enabled}
                    onChange={v => setSettings(s => ({ ...s, [current.enabledKey]: v }))}
                  />
                </div>
              </div>

              <textarea
                value={current.value}
                onChange={e => setSettings(s => ({ ...s, [current.valueKey]: e.target.value }))}
                disabled={!current.enabled}
                rows={6}
                style={{ ...inputStyle, resize: "vertical", opacity: current.enabled ? 1 : 0.5, lineHeight: 1.6 }}
              />
              <button
                onClick={() => setSettings(s => ({ ...s, [current.valueKey]: current.defaultVal }))}
                style={{ background: "none", border: "none", color: "#9b9bb0", fontSize: 12, cursor: "pointer", padding: "4px 0", marginTop: 4 }}
              >
                {"Restaurar por defecto"}
              </button>

              {current.enabled && (
                <div style={{ marginTop: 16, background: "#f0fdf4", borderRadius: 10, padding: "12px 16px", border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>
                    {"Vista previa"}
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#25D366", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IconPhone size={14} color="white" />
                    </div>
                    <div style={{ background: "#dcfce7", borderRadius: "4px 12px 12px 12px", padding: "10px 14px", fontSize: 13, color: "#1a1a2e", whiteSpace: "pre-wrap", lineHeight: 1.65, maxWidth: 300, wordBreak: "break-word" }}>
                      {previewMsg(current.value)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={saveSettings} disabled={savingSettings} style={btnPrimary}>
                {savingSettings ? "Guardando..." : "Guardar configuración"}
              </button>
              <button onClick={restoreAllDefaults} style={{ ...btnGhost, color: "#9b9bb0" }}>
                {"Restaurar todas las plantillas"}
              </button>
              {settingsMsg && (
                <span style={{ fontSize: 13, fontWeight: 600, color: settingsMsg.type === "ok" ? "#388e3c" : "#c62828" }}>
                  {settingsMsg.type === "ok" ? "✓ " : "✕ "}{settingsMsg.text}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Historial ──────────────────────────────────────────────────── */}
        {tab === "historial" && (
          <div>
            <div style={{
              display: "flex", gap: 8, marginBottom: 20,
              alignItems: "center", flexWrap: "wrap",
              background: "white", borderRadius: 12, padding: "12px 16px",
              border: "1px solid #e8e6e2",
            }}>
              <input
                type="text"
                placeholder={"Buscar cliente o teléfono..."}
                value={histSearch}
                onChange={e => setHistSearch(e.target.value)}
                style={{ ...inputStyle, width: 220, padding: "7px 12px", fontSize: 13 }}
              />
              <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                {([["all", "Todo"], ["month", "Este mes"], ["week", "Esta semana"]] as const).map(([v, label]) => (
                  <button key={v} onClick={() => setHistPeriod(v)} style={{
                    padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 600,
                    background: histPeriod === v ? "#1a1a2e" : "#f0f0f5",
                    color:      histPeriod === v ? "white"   : "#6b7280",
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {filteredLogs.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                <div style={{ ...card, padding: "18px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e", letterSpacing: "-1px" }}>{filteredLogs.length}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, fontWeight: 600 }}>{"Total"}</div>
                </div>
                <div style={{ ...card, padding: "18px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#25D366", letterSpacing: "-1px" }}>
                    {filteredLogs.filter(l => l.sent_via.startsWith("whatsapp")).length}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, fontWeight: 600 }}>{"WhatsApp"}</div>
                </div>
                <div style={{ ...card, padding: "18px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#3b82f6", letterSpacing: "-1px" }}>
                    {filteredLogs.filter(l => l.sent_via.startsWith("email")).length}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, fontWeight: 600 }}>{"Email"}</div>
                </div>
              </div>
            )}

            {loadingLogs ? (
              <div style={{ textAlign: "center", padding: 60, color: "#9b9bb0" }}>{"Cargando..."}</div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#9b9bb0" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, opacity: 0.35 }}>
                  <IconBell size={48} color="#6b7280" />
                </div>
                <div style={{ fontWeight: 700, color: "#6b7280", fontSize: 15 }}>
                  {histSearch ? "Sin resultados para esa búsqueda" : "Sin recordatorios enviados"}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredLogs.map(l => {
                  const isEmail = l.sent_via.startsWith("email-");
                  const tplKey = l.sent_via.replace("whatsapp-", "").replace("email-", "") as TemplateKey;
                  const tplInfo = TEMPLATE_TABS.find(t => t.key === tplKey);
                  return (
                    <div key={l.id} style={{ ...card, padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e" }}>{l.client_name}</div>
                        <div style={{ fontSize: 12, color: "#9b9bb0" }}>
                          {isEmail ? (l as any).client_email ?? l.client_phone ?? "—" : l.client_phone ?? "Sin teléfono"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{fmtDate(l.created_at)}</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          {l.source === "auto" && (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#ede9fe", color: "#7c3aed" }}>
                              ⚡ Auto
                            </span>
                          )}
                          {isEmail ? (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#eff6ff", color: "#3b82f6" }}>
                              📧 Email
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#e8f5e9", color: "#388e3c" }}>
                              WhatsApp
                            </span>
                          )}
                          {tplInfo && (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${tplInfo.color}15`, color: tplInfo.color }}>
                              {tplInfo.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Bulk modal ──────────────────────────────────────────────────────── */}
      {bulkOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div style={{ background: "white", borderRadius: 20, padding: 28, maxWidth: 440, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,.25)" }}>

            {/* Step 0 — pick template */}
            {!bulkTemplate ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: "#1a1a2e" }}>{"¿Qué mensaje enviar?"}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>
                      {`A ${bulkQueue.length} cliente${bulkQueue.length !== 1 ? "s" : ""} con teléfono`}
                    </div>
                  </div>
                  <button onClick={() => setBulkOpen(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9b9bb0", lineHeight: 1 }}>
                    {"×"}
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {TEMPLATE_TABS.map(t => {
                    const meta = tplMeta[t.key];
                    return (
                      <button
                        key={t.key}
                        onClick={() => setBulkTemplate(t.key)}
                        style={{
                          display: "flex", alignItems: "center", gap: 14,
                          padding: "14px 18px", borderRadius: 14,
                          border: `2px solid ${t.color}30`,
                          background: `${t.color}08`,
                          cursor: "pointer", textAlign: "left", transition: "all .15s",
                        }}
                      >
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                          background: `${t.color}18`, display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ color: t.color }}>{t.icon}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{t.label}</div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 1 }}>{t.desc}</div>
                          <div style={{
                            marginTop: 6, fontSize: 12, color: "#1a1a2e", lineHeight: 1.5,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            opacity: 0.65,
                          }}>
                            {previewMsg(meta.value).split("\n")[0]}
                          </div>
                        </div>
                        <div style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, flexShrink: 0,
                          background: meta.enabled ? "#e8f5e9" : "#f0f0f5",
                          color: meta.enabled ? "#388e3c" : "#9b9bb0",
                        }}>
                          {meta.enabled ? "Activo" : "Inactivo"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : bulkIndex >= bulkQueue.length ? (
              /* Success */
              <>
                <div style={{ textAlign: "center", padding: "16px 0 24px" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IconCheck size={28} color="#10b981" />
                    </div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a2e" }}>{"¡Todo enviado!"}</div>
                  <div style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>
                    {`Se enviaron ${bulkQueue.length} recordatorio${bulkQueue.length !== 1 ? "s" : ""} por WhatsApp.`}
                  </div>
                </div>
                <button onClick={() => setBulkOpen(false)} style={{ ...btnPrimary, width: "100%", justifyContent: "center", fontSize: 15, padding: "12px 0" }}>
                  {"Listo"}
                </button>
              </>
            ) : bulkCurrent ? (
              /* Per-appointment step */
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#6b7280" }}>
                      {`${bulkIndex + 1} de ${bulkQueue.length}`}
                    </span>
                    {(() => {
                      const t = TEMPLATE_TABS.find(t => t.key === bulkTemplate)!;
                      return (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                          background: `${t.color}15`, color: t.color,
                        }}>
                          {t.label} · {t.desc}
                        </span>
                      );
                    })()}
                  </div>
                  <button onClick={() => setBulkOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9b9bb0", lineHeight: 1 }}>
                    {"×"}
                  </button>
                </div>

                <div style={{ background: "#f0f0f5", borderRadius: 100, height: 5, marginBottom: 20 }}>
                  <div style={{
                    background: "#fb0f05", borderRadius: 100, height: 5,
                    width: `${(bulkIndex / bulkQueue.length) * 100}%`,
                    transition: "width .3s",
                  }} />
                </div>

                <div style={{ ...card, marginBottom: 14, padding: "14px 18px" }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e", marginBottom: 3 }}>
                    {bulkCurrent.clients?.name}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    {`${fmtApptDate(bulkCurrent.appointment_date)} · ${fmt12(bulkCurrent.appointment_time)}`}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    {bulkCurrent.services?.name}
                    {bulkCurrent.professionals?.name ? ` · ${bulkCurrent.professionals.name}` : ""}
                  </div>
                  <div style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 600, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                    <IconPhone size={13} color="#6b7280" />
                    {bulkCurrent.clients?.phone}
                  </div>
                </div>

                <div style={{
                  background: "#dcfce7", borderRadius: "4px 12px 12px 12px",
                  padding: "10px 14px", fontSize: 13, color: "#1a1a2e", whiteSpace: "pre-wrap",
                  lineHeight: 1.65, maxHeight: 130, overflowY: "auto", marginBottom: 16,
                }}>
                  {applyVars(tplMeta[bulkTemplate].value, bulkCurrent)}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <a
                    href={waLink(bulkCurrent.clients!.phone!, applyVars(tplMeta[bulkTemplate].value, bulkCurrent))}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => {
                      logSent(bulkCurrent, bulkTemplate);
                      setTimeout(() => setBulkIndex(i => i + 1), 350);
                    }}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "12px 0", borderRadius: 12, background: "#25D366",
                      color: "white", fontWeight: 700, fontSize: 15, textDecoration: "none",
                    }}
                  >
                    {"Abrir WhatsApp"}
                  </a>
                  <button
                    onClick={() => setBulkIndex(i => i + 1)}
                    style={{ ...btnGhost, padding: "12px 16px", whiteSpace: "nowrap" }}
                  >
                    {"Saltar →"}
                  </button>
                </div>
              </>
            ) : null}

          </div>
        </div>
      )}
    </div>
  );
}
