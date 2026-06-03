"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconCalendar, IconX } from "../ZyncraIcons";

interface Appointment {
  id: string;
  client_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  clients: { name: string } | null;
  services: { name: string } | null;
  professionals: { name: string } | null;
}

function getWeekDays(ref: Date): Date[] {
  const start = new Date(ref);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function toISO(d: Date) { return d.toISOString().split("T")[0]; }
function fmt12(time: string) {
  const [h, m] = time.split(":");
  const hr = parseInt(h); const ampm = hr >= 12 ? "PM" : "AM";
  return `${hr % 12 || 12}:${m} ${ampm}`;
}

const HOURS = Array.from({ length: 11 }, (_, i) => `${(8 + i).toString().padStart(2, "0")}:00`);
const DAYS_SHORT = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const STATUS_MAP: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending:   { label: "Pendiente",  bg: "rgba(251,15,5,0.10)",   color: "#fb0f05",  border: "rgba(251,15,5,0.30)"   },
  confirmed: { label: "Confirmada", bg: "rgba(16,185,129,0.10)", color: "#10b981",  border: "rgba(16,185,129,0.30)" },
  completed: { label: "Completada", bg: "rgba(99,102,241,0.10)", color: "#6366f1",  border: "rgba(99,102,241,0.30)" },
  cancelled: { label: "Cancelada",  bg: "rgba(100,116,139,0.08)",color: "#94a3b8",  border: "rgba(100,116,139,0.20)"},
};

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 13px", border: "1.5px solid #e8e6e2",
  borderRadius: "10px", fontSize: "14px", background: "rgba(20,15,30,0.025)",
  color: "#14111C", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", outline: "none",
  boxSizing: "border-box",
};

export default function CalendarPage() {
  const { tenantId } = useAdmin();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekRef, setWeekRef] = useState(new Date());
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState({ date: "", time: "", status: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [aptFields, setAptFields] = useState<{ name: string; value: string }[]>([]);

  const weekDays = getWeekDays(weekRef);
  const startDate = toISO(weekDays[0]);
  const endDate = toISO(weekDays[6]);

  const fetchAppointments = useCallback(async (tid: string, s: string, e: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("id,client_id,service_id,appointment_date,appointment_time,status,clients(name),services(name),professionals(name)")
      .eq("tenant_id", tid).gte("appointment_date", s).lte("appointment_date", e)
      .order("appointment_date").order("appointment_time");
    if (data) setAppointments(data as any);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tenantId) fetchAppointments(tenantId, startDate, endDate);
  }, [tenantId, startDate, endDate, fetchAppointments]);

  const prevWeek = () => { const d = new Date(weekRef); d.setDate(d.getDate() - 7); setWeekRef(d); };
  const nextWeek = () => { const d = new Date(weekRef); d.setDate(d.getDate() + 7); setWeekRef(d); };

  const getApts = (date: Date, hour: string) => {
    const ds = toISO(date);
    return appointments.filter(a => a.appointment_date === ds && a.appointment_time.startsWith(hour.substring(0, 2)));
  };

  const openEdit = async (apt: Appointment) => {
    setSelectedApt(apt);
    setEditForm({ date: apt.appointment_date, time: apt.appointment_time.substring(0, 5), status: apt.status });
    setAptFields([]);

    const [{ data: fields }, { data: values }] = await Promise.all([
      supabase.from("custom_fields").select("id, name").eq("service_id", apt.service_id).eq("active", true).order("position"),
      supabase.from("client_field_values").select("field_id, value").eq("client_id", apt.client_id),
    ]);

    if (fields && values) {
      const valMap = Object.fromEntries((values as any[]).map(v => [v.field_id, v.value]));
      setAptFields(
        (fields as any[])
          .filter(f => valMap[f.id] !== undefined && valMap[f.id] !== null && valMap[f.id] !== "")
          .map(f => ({ name: f.name, value: valMap[f.id] === "true" ? "Sí" : valMap[f.id] === "false" ? "No" : valMap[f.id] }))
      );
    }
  };

  const saveApt = async () => {
    if (!selectedApt) return;
    setIsSaving(true);
    const { error } = await supabase.from("appointments")
      .update({ appointment_date: editForm.date, appointment_time: editForm.time, status: editForm.status })
      .eq("id", selectedApt.id);
    if (!error) { setSelectedApt(null); fetchAppointments(tenantId!, startDate, endDate); }
    else alert("Error al actualizar la cita.");
    setIsSaving(false);
  };

  const monthLabel = weekDays[0].toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const todayStr = toISO(new Date());
  const totalWeek = appointments.length;

  return (
    <div style={{ fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", height: "100%", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
            <IconCalendar size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#14111C", letterSpacing: "-0.5px", margin: 0 }}>Calendario</h1>
            <p style={{ color: "#8E879B", fontSize: "13px", marginTop: "2px", textTransform: "capitalize" }}>
              {monthLabel} · {totalWeek} cita{totalWeek !== 1 ? "s" : ""} esta semana
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={prevWeek} style={{ width: "36px", height: "36px", border: "1.5px solid #e8e6e2", borderRadius: "10px", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#3a3548" }}>‹</button>
          <button onClick={() => setWeekRef(new Date())} style={{ height: "36px", padding: "0 16px", border: "1.5px solid #e8e6e2", borderRadius: "10px", background: "white", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#3a3548", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>Hoy</button>
          <button onClick={nextWeek} style={{ width: "36px", height: "36px", border: "1.5px solid #e8e6e2", borderRadius: "10px", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#3a3548" }}>›</button>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ background: "white", border: "1px solid #e8e6e2", borderRadius: "18px", overflow: "hidden", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ overflowX: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ minWidth: "700px", display: "flex", flexDirection: "column", flex: 1 }}>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "56px repeat(7, 1fr)", borderBottom: "1px solid #f0eeeb", flexShrink: 0, background: "#fafaf8" }}>
              <div style={{ borderRight: "1px solid #f0eeeb" }} />
              {weekDays.map((day, i) => {
                const isToday = toISO(day) === todayStr;
                return (
                  <div key={i} style={{ padding: "12px 8px", textAlign: "center", borderRight: "1px solid #f0eeeb", background: isToday ? "rgba(251,15,5,0.04)" : undefined }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: isToday ? "#fb0f05" : "#8E879B", letterSpacing: "0.05em" }}>{DAYS_SHORT[i]}</div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: isToday ? "#fb0f05" : "#14111C", lineHeight: 1.2, marginTop: "2px" }}>{day.getDate()}</div>
                    {isToday && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fb0f05", margin: "4px auto 0" }} />}
                  </div>
                );
              })}
            </div>

            {/* Time rows */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading ? (
                <div style={{ padding: "60px", textAlign: "center", color: "#8E879B", fontSize: "14px" }}>Cargando citas…</div>
              ) : (
                HOURS.map(hour => (
                  <div key={hour} style={{ display: "grid", gridTemplateColumns: "56px repeat(7, 1fr)", borderBottom: "1px solid #f7f5f2", minHeight: "72px" }}>
                    <div style={{ padding: "10px 8px 0", textAlign: "right", color: "#c0bdb9", fontSize: "11px", fontWeight: 600, borderRight: "1px solid #f0eeeb", flexShrink: 0 }}>{hour}</div>
                    {weekDays.map((day, di) => {
                      const apts = getApts(day, hour);
                      const isToday = toISO(day) === todayStr;
                      return (
                        <div key={di} style={{ borderRight: "1px solid #f0eeeb", padding: "4px", background: isToday ? "rgba(251,15,5,0.015)" : undefined }}>
                          {apts.map((apt, ai) => {
                            const s = STATUS_MAP[apt.status] || STATUS_MAP.pending;
                            return (
                              <div key={ai} onClick={() => openEdit(apt)} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: "8px", padding: "5px 7px", fontSize: "11px", marginBottom: "3px", cursor: "pointer", overflow: "hidden", opacity: apt.status === "cancelled" ? 0.55 : 1, transition: "opacity 0.15s" }}
                                onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
                                onMouseLeave={e => (e.currentTarget.style.opacity = apt.status === "cancelled" ? "0.55" : "1")}>
                                <div style={{ fontWeight: 700, color: s.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {fmt12(apt.appointment_time)} · {(apt.clients as any)?.name || "Cliente"}
                                </div>
                                <div style={{ color: "#564E66", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "1px" }}>
                                  {(apt.services as any)?.name || "Servicio"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {selectedApt && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(17,17,24,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedApt(null); }}>
          <div style={{ background: "white", borderRadius: "22px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#14111C", margin: 0 }}>Gestionar cita</h2>
                <p style={{ fontSize: "13px", color: "#8E879B", marginTop: "3px" }}>
                  {(selectedApt.clients as any)?.name} · {(selectedApt.services as any)?.name}
                </p>
              </div>
              <button onClick={() => setSelectedApt(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B" }}><IconX size={20} /></button>
            </div>

            {/* Info row */}
            <div style={{ background: "rgba(20,15,30,0.025)", border: "1px solid #e8e6e2", borderRadius: "12px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#564E66", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span><strong style={{ color: "#14111C" }}>Cliente:</strong> {(selectedApt.clients as any)?.name || "—"}</span>
              <span><strong style={{ color: "#14111C" }}>Servicio:</strong> {(selectedApt.services as any)?.name || "—"}</span>
              <span><strong style={{ color: "#14111C" }}>Profesional:</strong> {(selectedApt.professionals as any)?.name || "—"}</span>
              {aptFields.length > 0 && (
                <>
                  <div style={{ borderTop: "1px solid #e8e6e2", marginTop: "6px", paddingTop: "8px", fontSize: "10px", fontWeight: 700, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Información del servicio
                  </div>
                  {aptFields.map(f => (
                    <span key={f.name}><strong style={{ color: "#14111C" }}>{f.name}:</strong> {f.value}</span>
                  ))}
                </>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#564E66", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "7px" }}>Fecha</label>
                <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#564E66", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "7px" }}>Hora</label>
                <input type="time" value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#564E66", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "7px" }}>Estado</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={{ ...inp }}>
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setSelectedApt(null)}>Cancelar</button>
              <button className="btn-primary" onClick={saveApt} disabled={isSaving}
                style={editForm.status === "cancelled" ? { background: "#ef4444" } : {}}>
                {isSaving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
