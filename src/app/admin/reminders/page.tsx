"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  clients: { id: string; name: string; phone: string | null } | null;
  services: { name: string } | null;
  professionals: { name: string } | null;
}

interface ReminderLog {
  id: string;
  client_name: string;
  client_phone: string | null;
  sent_via: string;
  created_at: string;
}

interface ReminderSettings {
  message_template: string;
  hours_before: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAYS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

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
  const d = new Date((appt.appointment_date) + "T00:00:00");
  return template
    .replace(/{{nombre}}/g, appt.clients?.name ?? "")
    .replace(/{{servicio}}/g, appt.services?.name ?? "")
    .replace(/{{profesional}}/g, appt.professionals?.name ?? "")
    .replace(/{{fecha}}/g, `${DAYS_ES[d.getDay()]} ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`)
    .replace(/{{hora}}/g, fmt12(appt.appointment_time));
}

function waLink(phone: string, msg: string) {
  const p = phone.replace(/\D/g, "");
  const full = p.startsWith("57") ? p : `57${p}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(msg)}`;
}

const DEFAULT_TEMPLATE =
  `Hola {{nombre}} 👋\n\nTe recordamos que tienes una cita agendada:\n\n📅 {{fecha}}\n⏰ {{hora}}\n💆 {{servicio}}\n\n¡Te esperamos! Si necesitas cambiar la hora, escríbenos.`;

// ── Main ──────────────────────────────────────────────────────────────────────

export default function RemindersPage() {
  const { tenantId } = useAdmin();
  const [tab, setTab] = useState<"proximas" | "config" | "historial">("proximas");

  // Upcoming appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  const [daysAhead, setDaysAhead] = useState(3);

  // Settings
  const [settings, setSettings] = useState<ReminderSettings>({ message_template: DEFAULT_TEMPLATE, hours_before: 24 });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // History
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load settings
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("reminder_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (data) setSettings({ message_template: data.message_template ?? DEFAULT_TEMPLATE, hours_before: data.hours_before ?? 24 });
    }
    load();
  }, [tenantId]);

  // Load upcoming appointments
  const loadAppts = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);
    const futureStr = future.toISOString().split("T")[0];

    const { data } = await supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, status, clients(id, name, phone), services(name), professionals(name)")
      .eq("tenant_id", tenantId)
      .gte("appointment_date", today)
      .lte("appointment_date", futureStr)
      .in("status", ["pending", "confirmed"])
      .order("appointment_date")
      .order("appointment_time");

    setAppointments((data as Appointment[]) ?? []);
    setLoading(false);
  }, [tenantId, daysAhead]);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    const { data } = await supabase
      .from("reminder_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(100);
    setLogs((data as ReminderLog[]) ?? []);
    setLoadingLogs(false);
  }, [tenantId]);

  useEffect(() => { if (tab === "proximas") loadAppts(); }, [tab, loadAppts]);
  useEffect(() => { if (tab === "historial") loadLogs(); }, [tab, loadLogs]);

  // Group by date
  const grouped = appointments.reduce((acc, a) => {
    const key = a.appointment_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {} as Record<string, Appointment[]>);

  async function logSent(appt: Appointment) {
    await supabase.from("reminder_logs").insert({
      tenant_id: tenantId,
      appointment_id: appt.id,
      client_name: appt.clients?.name ?? "",
      client_phone: appt.clients?.phone ?? null,
      sent_via: "whatsapp",
    });
    setSentSet(prev => new Set([...prev, appt.id]));
  }

  async function saveSettings() {
    setSavingSettings(true);
    setSettingsMsg(null);
    const { error } = await supabase.from("reminder_settings").upsert({
      tenant_id: tenantId,
      message_template: settings.message_template,
      hours_before: settings.hours_before,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id" });
    setSavingSettings(false);
    setSettingsMsg(error ? { type: "err", text: error.message } : { type: "ok", text: "Configuración guardada." });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "0 0 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Recordatorios</h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
          Envía recordatorios de cita a tus clientes por WhatsApp
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f0f0f5", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {(["proximas", "config", "historial"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: tab === t ? "white" : "transparent",
            color: tab === t ? "#1a1a2e" : "#6b7280",
            boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            transition: "all .2s",
          }}>
            {t === "proximas" ? "Próximas citas" : t === "config" ? "Configuración" : "Historial"}
          </button>
        ))}
      </div>

      {/* ── Tab: Próximas citas ────────────────────────────────────────────── */}
      {tab === "proximas" && (
        <div style={{ maxWidth: 760 }}>
          {/* Days filter */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Mostrar citas de los próximos:</span>
            {[1, 3, 7].map(d => (
              <button key={d} onClick={() => setDaysAhead(d)} style={{
                padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: daysAhead === d ? "#fb0f05" : "#f0f0f5",
                color: daysAhead === d ? "white" : "#6b7280",
              }}>
                {d === 1 ? "Hoy" : `${d} días`}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#9b9bb0" }}>Cargando citas...</div>
          ) : appointments.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#9b9bb0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
              <div style={{ fontWeight: 600, color: "#6b7280" }}>Sin citas próximas</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>No hay citas en el período seleccionado</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {Object.entries(grouped).map(([date, appts]) => (
                <div key={date}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {fmtApptDate(date)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {appts.map(appt => {
                      const hasPhone = !!appt.clients?.phone;
                      const wasSent = sentSet.has(appt.id);
                      const msg = applyVars(settings.message_template, appt);
                      return (
                        <div key={appt.id} style={{ background: "white", borderRadius: 14, padding: "16px 20px", border: "1px solid #e8e6e2", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>{appt.clients?.name ?? "—"}</span>
                              <span style={{ fontSize: 12, color: "#9b9bb0" }}>{fmt12(appt.appointment_time)}</span>
                            </div>
                            <div style={{ fontSize: 13, color: "#6b7280" }}>
                              {appt.services?.name ?? "—"}{appt.professionals?.name ? ` · ${appt.professionals.name}` : ""}
                            </div>
                            {!hasPhone && (
                              <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 4 }}>⚠ Sin teléfono registrado</div>
                            )}
                          </div>
                          {wasSent ? (
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#25D366" }}>✓ Enviado</span>
                          ) : hasPhone ? (
                            <a href={waLink(appt.clients!.phone!, msg)} target="_blank" rel="noopener noreferrer"
                              onClick={() => logSent(appt)}
                              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "#25D366", color: "white", fontWeight: 700, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
                              Recordatorio WhatsApp
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: "#d1d5db" }}>Sin teléfono</span>
                          )}
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

      {/* ── Tab: Configuración ─────────────────────────────────────────────── */}
      {tab === "config" && (
        <div style={{ maxWidth: 640 }}>
          <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid #e8e6e2", marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>Mensaje de recordatorio</h3>
            <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 14px" }}>
              Variables: <code style={codeStyle}>{"{{nombre}}"}</code> · <code style={codeStyle}>{"{{servicio}}"}</code> · <code style={codeStyle}>{"{{fecha}}"}</code> · <code style={codeStyle}>{"{{hora}}"}</code> · <code style={codeStyle}>{"{{profesional}}"}</code>
            </p>
            <textarea value={settings.message_template}
              onChange={e => setSettings(s => ({ ...s, message_template: e.target.value }))}
              style={{ ...inputStyle, minHeight: 160, resize: "vertical" }} />
            <button onClick={() => setSettings(s => ({ ...s, message_template: DEFAULT_TEMPLATE }))}
              style={{ background: "none", border: "none", color: "#9b9bb0", fontSize: 12, cursor: "pointer", marginTop: 4 }}>
              Restaurar mensaje por defecto
            </button>
          </div>

          {/* Preview */}
          <div style={{ background: "#f0fdf4", borderRadius: 14, padding: 20, border: "1px solid #bbf7d0", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Vista previa</div>
            <div style={{ background: "#dcfce7", borderRadius: "4px 12px 12px 12px", padding: "12px 14px", fontSize: 13, color: "#1a1a2e", whiteSpace: "pre-wrap", lineHeight: 1.7, maxWidth: 340 }}>
              {settings.message_template
                .replace(/{{nombre}}/g, "María García")
                .replace(/{{servicio}}/g, "Corte de cabello")
                .replace(/{{profesional}}/g, "Laura")
                .replace(/{{fecha}}/g, "Lunes 25 de May")
                .replace(/{{hora}}/g, "10:30 AM")}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={saveSettings} disabled={savingSettings} style={btnPrimary}>
              {savingSettings ? "Guardando..." : "Guardar configuración"}
            </button>
            {settingsMsg && (
              <span style={{ fontSize: 13, fontWeight: 600, color: settingsMsg.type === "ok" ? "#388e3c" : "#c62828" }}>
                {settingsMsg.type === "ok" ? "✓ " : "✕ "}{settingsMsg.text}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Historial ─────────────────────────────────────────────────── */}
      {tab === "historial" && (
        <div style={{ maxWidth: 680 }}>
          {loadingLogs ? (
            <div style={{ textAlign: "center", padding: 60, color: "#9b9bb0" }}>Cargando...</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#9b9bb0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
              <div style={{ fontWeight: 600, color: "#6b7280" }}>Sin recordatorios enviados</div>
            </div>
          ) : (
            <>
              <div style={{ background: "white", borderRadius: 12, padding: "10px 20px", border: "1px solid #e8e6e2", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>Total enviados: </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{logs.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {logs.map(l => (
                  <div key={l.id} style={{ background: "white", borderRadius: 12, padding: "12px 18px", border: "1px solid #e8e6e2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e" }}>{l.client_name}</div>
                      <div style={{ fontSize: 12, color: "#9b9bb0" }}>{l.client_phone ?? "Sin teléfono"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{fmtDate(l.created_at)}</div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "#e8f5e9", color: "#388e3c" }}>WhatsApp</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const codeStyle: React.CSSProperties = { background: "#f0f0f5", padding: "1px 5px", borderRadius: 4, fontSize: 12 };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e8e6e2",
  fontSize: 14, color: "#1a1a2e", background: "white", boxSizing: "border-box",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};
const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "9px 20px", borderRadius: 10, border: "none",
  background: "#fb0f05", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
};
