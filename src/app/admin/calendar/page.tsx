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
                        <div key={ai} style={{
                          background: apt.status === "confirmed" ? "rgba(16,185,129,0.15)" : "rgba(99,102,241,0.15)",
                          border: `1px solid ${apt.status === "confirmed" ? "rgba(16,185,129,0.4)" : "rgba(99,102,241,0.4)"}`,
                          borderRadius: "6px",
                          padding: "4px 6px",
                          fontSize: "11px",
                          marginBottom: "2px",
                          overflow: "hidden",
                        }}>
                          <div style={{ fontWeight: 700, color: apt.status === "confirmed" ? "var(--success)" : "var(--accent-blue)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
  );
}
