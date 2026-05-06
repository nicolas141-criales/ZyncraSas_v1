"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../admin.module.css";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  clients: { name: string } | null;
  services: { name: string } | null;
  professionals: { name: string } | null;
}

function getWeekDays(referenceDate: Date) {
  const days: Date[] = [];
  const start = new Date(referenceDate);
  // Start from Monday
  const day = start.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function toISO(date: Date) {
  return date.toISOString().split("T")[0];
}

const HOURS = Array.from({ length: 11 }, (_, i) => `${(8 + i).toString().padStart(2, "0")}:00`);
const DAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function CalendarPage() {
  const { tenantId } = useAdmin();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekRef, setWeekRef] = useState(new Date());
  
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState({ date: "", time: "", status: "" });
  const [isSaving, setIsSaving] = useState(false);

  const weekDays = getWeekDays(weekRef);
  const startDate = toISO(weekDays[0]);
  const endDate = toISO(weekDays[6]);

  const fetchAppointments = useCallback(async (tid: string, start: string, end: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        clients(name),
        services(name),
        professionals(name)
      `)
      .eq("tenant_id", tid)
      .gte("appointment_date", start)
      .lte("appointment_date", end)
      .order("appointment_date")
      .order("appointment_time");

    if (data) setAppointments(data as any);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tenantId) {
      fetchAppointments(tenantId, startDate, endDate);
    }
  }, [tenantId, startDate, endDate, fetchAppointments]);

  const prevWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() - 7);
    setWeekRef(d);
  };

  const nextWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() + 7);
    setWeekRef(d);
  };

  const goToday = () => setWeekRef(new Date());

  const getAptsForSlot = (date: Date, hour: string) => {
    const dateStr = toISO(date);
    return appointments.filter(a => a.appointment_date === dateStr && a.appointment_time.startsWith(hour.substring(0, 2)));
  };

  const openEditModal = (apt: Appointment) => {
    setSelectedApt(apt);
    setEditForm({ date: apt.appointment_date, time: apt.appointment_time, status: apt.status });
  };

  const saveApt = async () => {
    if (!selectedApt) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("appointments")
      .update({
        appointment_date: editForm.date,
        appointment_time: editForm.time,
        status: editForm.status
      })
      .eq("id", selectedApt.id);
      
    if (!error) {
      setSelectedApt(null);
      fetchAppointments(tenantId!, startDate, endDate);
    } else {
      alert("Error al actualizar la cita.");
    }
    setIsSaving(false);
  };

  const monthLabel = weekDays[0].toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-xl)", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Calendario de Citas</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px", textTransform: "capitalize" }}>{monthLabel}</p>
        </div>
        <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
          <button className="btn-secondary" onClick={prevWeek}>{"‹"}</button>
          <button className="btn-secondary" style={{ width: "80px" }} onClick={goToday}>Hoy</button>
          <button className="btn-secondary" onClick={nextWeek}>{"›"}</button>
        </div>
      </div>

      <div className={styles.listCard} style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: 0 }}>
        <div style={{ overflowX: "auto", flex: 1, display: "flex", flexDirection: "column", WebkitOverflowScrolling: "touch" }}>
          <div style={{ minWidth: "700px", display: "flex", flexDirection: "column", flex: 1 }}>
            {/* Header Row */}
            <div style={{ display: "grid", gridTemplateColumns: "64px repeat(7, 1fr)", borderBottom: "1px solid var(--border-light)", backgroundColor: "var(--bg-base)", flexShrink: 0 }}>
              <div style={{ padding: "var(--spacing-sm)", borderRight: "1px solid var(--border-light)" }}></div>
              {weekDays.map((day, i) => {
                const isToday = toISO(day) === toISO(new Date());
                return (
                  <div key={i} style={{
                    padding: "10px var(--spacing-sm)", textAlign: "center", fontWeight: 600,
                    borderRight: "1px solid var(--border-light)",
                    color: isToday ? "var(--accent-blue)" : "var(--text-primary)",
                    background: isToday ? "rgba(99,102,241,0.06)" : undefined,
                  }}>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>{DAYS_SHORT[i]}</div>
                    <div style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1.2 }}>{day.getDate()}</div>
                  </div>
                );
              })}
            </div>

            {/* Time Slots */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Cargando citas...</div>
              ) : (
                HOURS.map((hour) => (
                  <div key={hour} style={{ display: "grid", gridTemplateColumns: "64px repeat(7, 1fr)", borderBottom: "1px solid var(--border-light)", minHeight: "72px" }}>
                    <div style={{ padding: "8px 6px", textAlign: "center", color: "var(--text-secondary)", fontSize: "11px", borderRight: "1px solid var(--border-light)", flexShrink: 0 }}>
                      {hour}
                    </div>
                    {weekDays.map((day, di) => {
                      const apts = getAptsForSlot(day, hour);
                      return (
                        <div key={di} style={{ borderRight: "1px solid var(--border-light)", position: "relative", padding: "4px" }}>
                          {apts.map((apt, ai) => (
                            <div key={ai} onClick={() => openEditModal(apt)} style={{
                              background: apt.status === "confirmed" ? "rgba(16,185,129,0.15)" : apt.status === "cancelled" ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)",
                              border: `1px solid ${apt.status === "confirmed" ? "rgba(16,185,129,0.4)" : apt.status === "cancelled" ? "rgba(239,68,68,0.4)" : "rgba(99,102,241,0.4)"}`,
                              borderRadius: "6px",
                              padding: "4px 6px",
                              fontSize: "11px",
                              marginBottom: "2px",
                              overflow: "hidden",
                              cursor: "pointer",
                              textDecoration: apt.status === "cancelled" ? "line-through" : "none",
                              opacity: apt.status === "cancelled" ? 0.6 : 1
                            }}>
                              <div style={{ fontWeight: 700, color: apt.status === "confirmed" ? "var(--success)" : apt.status === "cancelled" ? "var(--error)" : "var(--accent-blue)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {apt.appointment_time} {(apt.clients as any)?.name || "Cliente"}
                              </div>
                              <div style={{ color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {(apt.services as any)?.name || "Servicio"}
                              </div>
                            </div>
                          ))}
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

      {selectedApt && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "var(--surface)", padding: "24px", borderRadius: "16px", width: "100%", maxWidth: "400px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Gestionar Cita</h2>
            <div style={{ marginBottom: "20px", fontSize: "14px", color: "var(--text-secondary)" }}>
              <p style={{ marginBottom: "6px" }}><strong>Cliente:</strong> {(selectedApt.clients as any)?.name}</p>
              <p style={{ marginBottom: "6px" }}><strong>Servicio:</strong> {(selectedApt.services as any)?.name}</p>
              <p style={{ marginBottom: "0" }}><strong>Profesional:</strong> {(selectedApt.professionals as any)?.name}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Fecha</label>
                <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-light)", background: "var(--bg-base)", color: "var(--text-primary)", fontSize: "14px" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Hora</label>
                <input type="time" value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-light)", background: "var(--bg-base)", color: "var(--text-primary)", fontSize: "14px" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Estado de la reserva</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-light)", background: "var(--bg-base)", color: "var(--text-primary)", fontSize: "14px" }}>
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button className="btn-secondary" onClick={() => setSelectedApt(null)}>Cerrar</button>
              <button className="btn-primary" onClick={saveApt} disabled={isSaving} style={{ backgroundColor: editForm.status === "cancelled" ? "var(--error)" : undefined, borderColor: editForm.status === "cancelled" ? "var(--error)" : undefined }}>
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
