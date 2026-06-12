"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { supabase, authedHeaders } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconCalendar, IconX, IconPlus, IconCreditCard, IconChat } from "../ZyncraIcons";
import NewAppointmentModal from "../NewAppointmentModal";
import { Skel, MONO } from "../charts";

interface Appointment {
  id: string;
  client_id: string;
  service_id: string;
  professional_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
  manage_token: string;
  clients: { name: string; email?: string | null } | null;
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

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmt12(time: string) {
  const [h, m] = time.split(":");
  const hr = parseInt(h); const ampm = hr >= 12 ? "PM" : "AM";
  return `${hr % 12 || 12}:${m} ${ampm}`;
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

const HOURS = Array.from({ length: 13 }, (_, i) => `${(7 + i).toString().padStart(2, "0")}:00`);
const DAYS_SHORT = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const STATUS_MAP: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending:   { label: "Pendiente",  bg: "rgba(245,158,11,0.12)",  color: "#d97706",  border: "rgba(245,158,11,0.4)"   },
  confirmed: { label: "Confirmada", bg: "rgba(59,130,246,0.12)",  color: "#2563eb",  border: "rgba(59,130,246,0.4)"   },
  completed: { label: "Completada", bg: "rgba(16,185,129,0.12)",  color: "#059669",  border: "rgba(16,185,129,0.4)"   },
  cancelled: { label: "Cancelada",  bg: "rgba(100,116,139,0.08)", color: "#8E879B",  border: "rgba(100,116,139,0.20)" },
};
const ALERT_S = { bg: "rgba(239,68,68,0.10)", color: "#dc2626", border: "rgba(239,68,68,0.45)" };

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 13px", border: "1.5px solid rgba(20,15,30,0.08)",
  borderRadius: "10px", fontSize: "14px", background: "rgba(20,15,30,0.025)",
  color: "#14111C", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", outline: "none",
  boxSizing: "border-box",
};

export default function CalendarPage() {
  const { tenantId, locationId } = useAdmin();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"week" | "day" | "professional">("week");
  const [weekRef, setWeekRef] = useState(new Date());
  const [dayRef, setDayRef] = useState(new Date());
  const [profs, setProfs] = useState<{ id: string; name: string }[]>([]);
  const [aptHasFields, setAptHasFields] = useState<Set<string>>(new Set());
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState({ date: "", time: "", status: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [aptFields, setAptFields] = useState<{ name: string; value: string }[]>([]);
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [branding, setBranding] = useState<{ business_name?: string; primary_color?: string } | null>(null);
  const [dragApt, setDragApt] = useState<Appointment | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all"|"pending"|"confirmed"|"completed"|"cancelled">("all");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const weekDays = getWeekDays(weekRef);
  const todayStr = toISO(new Date());

  const startDate = view === "week" ? toISO(weekDays[0]) : toISO(dayRef);
  const endDate   = view === "week" ? toISO(weekDays[6]) : toISO(dayRef);

  // Fetch professionals + branding
  useEffect(() => {
    if (!tenantId) return;
    let q = supabase.from("professionals").select("id, name").eq("tenant_id", tenantId).eq("is_active", true);
    if (locationId) q = q.eq("location_id", locationId);
    q.order("name").then(({ data }) => setProfs(data ?? []));
    supabase.from("branding").select("business_name, primary_color").eq("tenant_id", tenantId).maybeSingle()
      .then(({ data }) => setBranding(data ?? null));
  }, [tenantId, locationId]);

  // Build indicator set: which (client_id, service_id) pairs have field values
  const buildFieldsSet = useCallback(async (apts: Appointment[]) => {
    if (!apts.length) { setAptHasFields(new Set()); return; }
    const serviceIds = [...new Set(apts.map(a => a.service_id).filter(Boolean))];
    const clientIds  = [...new Set(apts.map(a => a.client_id).filter(Boolean))];
    const [{ data: fields }, { data: values }] = await Promise.all([
      supabase.from("custom_fields").select("id, service_id").in("service_id", serviceIds),
      supabase.from("client_field_values").select("field_id, client_id").in("client_id", clientIds),
    ]);
    if (!fields || !values) { setAptHasFields(new Set()); return; }
    const fieldToService: Record<string, string> = Object.fromEntries((fields as any[]).map(f => [f.id, f.service_id]));
    const set = new Set<string>();
    for (const v of values as any[]) {
      const sid = fieldToService[v.field_id];
      if (sid) set.add(`${v.client_id}_${sid}`);
    }
    setAptHasFields(set);
  }, []);

  const fetchAppointments = useCallback(async (tid: string, s: string, e: string) => {
    setLoading(true);
    let q = supabase
      .from("appointments")
      .select("id,client_id,service_id,professional_id,appointment_date,appointment_time,status,manage_token,clients(name,email),services(name),professionals(name)")
      .eq("tenant_id", tid).gte("appointment_date", s).lte("appointment_date", e);
    if (locationId) q = q.eq("location_id", locationId);
    const { data } = await q.order("appointment_date").order("appointment_time");
    const apts = (data ?? []) as unknown as Appointment[];
    setAppointments(apts);
    await buildFieldsSet(apts);
    setLoading(false);
  }, [buildFieldsSet, locationId]);

  useEffect(() => {
    if (tenantId) fetchAppointments(tenantId, startDate, endDate);
  }, [tenantId, locationId, startDate, endDate, fetchAppointments]);

  const hasComment = (apt: Appointment) => aptHasFields.has(`${apt.client_id}_${apt.service_id}`);

  // Navigation
  const prevWeek = () => setWeekRef(d => addDays(d, -7));
  const nextWeek = () => setWeekRef(d => addDays(d, 7));
  const prevDay  = () => setDayRef(d => addDays(d, -1));
  const nextDay  = () => setDayRef(d => addDays(d, 1));
  const goToday  = () => { setWeekRef(new Date()); setDayRef(new Date()); };

  // Helpers for grid
  const filterByStatus = (a: Appointment) => statusFilter === "all" || a.status === statusFilter;

  const getAptsForDay = (dateStr: string, hour: string) =>
    appointments.filter(a => a.appointment_date === dateStr && a.appointment_time.startsWith(hour.substring(0, 2)) && filterByStatus(a));

  const getAptsByProf = (profId: string | null, hour: string) =>
    appointments.filter(a =>
      a.appointment_time.startsWith(hour.substring(0, 2)) &&
      (profId === null ? !a.professional_id : a.professional_id === profId) &&
      filterByStatus(a)
    );

  const isAlertApt = (apt: Appointment) => {
    if (apt.status !== "pending" && apt.status !== "confirmed") return false;
    if (apt.appointment_date < todayStr) return true;
    if (apt.appointment_date === todayStr) return parseInt(apt.appointment_time.substring(0, 2)) < new Date().getHours();
    return false;
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

  const sendChangeEmail = useCallback(async (apt: Appointment, date: string, time: string, type: "modification" | "cancellation") => {
    const clientEmail = (apt.clients as any)?.email as string | null | undefined;
    if (!clientEmail || !apt.manage_token) return;
    fetch("/api/send-confirmation", {
      method: "POST",
      headers: await authedHeaders(),
      body: JSON.stringify({
        email:        clientEmail,
        clientName:   (apt.clients as any)?.name ?? "",
        businessName: branding?.business_name ?? "",
        service:      (apt.services as any)?.name ?? "",
        professional: (apt.professionals as any)?.name ?? "",
        date, time,
        primaryColor: branding?.primary_color ?? "#fb0f05",
        manageToken:  apt.manage_token,
        type,
      }),
    }).catch(() => {});
  }, [branding]);

  const saveApt = async () => {
    if (!selectedApt) return;
    setIsSaving(true);
    const { error } = await supabase.from("appointments")
      .update({ appointment_date: editForm.date, appointment_time: editForm.time, status: editForm.status })
      .eq("id", selectedApt.id);
    if (!error) {
      const dateChanged = editForm.date !== selectedApt.appointment_date
                       || editForm.time !== selectedApt.appointment_time.substring(0, 5);
      const wasCancelled = editForm.status === "cancelled" && selectedApt.status !== "cancelled";
      const emailType = wasCancelled ? "cancellation" : dateChanged ? "modification" : null;
      if (emailType) sendChangeEmail(selectedApt, editForm.date, editForm.time, emailType);
      setSelectedApt(null);
      fetchAppointments(tenantId!, startDate, endDate);
    } else {
      alert("Error al actualizar la cita.");
    }
    setIsSaving(false);
  };

  const flashToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2400); };

  // ── Drag & drop: reagendar arrastrando la cita a otra celda ──
  const rescheduleApt = async (apt: Appointment, newDate: string, newHour: string) => {
    const newTime = `${newHour.substring(0, 2)}:${apt.appointment_time.substring(3, 5)}`;
    if (newDate === apt.appointment_date && newTime === apt.appointment_time.substring(0, 5)) return;
    const prev = appointments;
    setAppointments(list => list.map(a => a.id === apt.id ? { ...a, appointment_date: newDate, appointment_time: `${newTime}:00` } : a));
    const { error } = await supabase.from("appointments")
      .update({ appointment_date: newDate, appointment_time: newTime }).eq("id", apt.id);
    if (error) { setAppointments(prev); flashToast("No se pudo mover la cita"); }
    else { sendChangeEmail(apt, newDate, newTime, "modification"); flashToast("Cita reagendada ✓"); }
  };

  const moveAptToProf = async (apt: Appointment, profId: string, newHour: string) => {
    const newTime = `${newHour.substring(0, 2)}:${apt.appointment_time.substring(3, 5)}`;
    const profName = profs.find(p => p.id === profId)?.name || "";
    const prev = appointments;
    setAppointments(list => list.map(a => a.id === apt.id
      ? { ...a, professional_id: profId, appointment_time: `${newTime}:00`, professionals: { name: profName } }
      : a));
    const { error } = await supabase.from("appointments")
      .update({ professional_id: profId, appointment_time: newTime }).eq("id", apt.id);
    if (error) { setAppointments(prev); flashToast("No se pudo mover la cita"); }
    else flashToast(`Asignada a ${profName} ✓`);
  };

  const dropProps = (key: string, onDropApt: (apt: Appointment) => void) => ({
    onDragOver: (e: React.DragEvent) => { if (dragApt) { e.preventDefault(); if (dragOver !== key) setDragOver(key); } },
    onDragLeave: () => setDragOver(o => (o === key ? null : o)),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); const d = dragApt; setDragApt(null); setDragOver(null); if (d) onDropApt(d); },
  });

  // Shared appointment card renderer — draggable para reagendar
  const aptCard = (apt: Appointment) => {
    const alert = isAlertApt(apt);
    const s = alert ? ALERT_S : (STATUS_MAP[apt.status] || STATUS_MAP.pending);
    const profName = (apt.professionals as any)?.name;
    const draggable = apt.status !== "cancelled";
    const isDragging = dragApt?.id === apt.id;
    return (
      <div key={apt.id} onClick={() => openEdit(apt)}
        draggable={draggable}
        onDragStart={e => { setDragApt(apt); e.dataTransfer.effectAllowed = "move"; }}
        onDragEnd={() => { setDragApt(null); setDragOver(null); }}
        title={alert ? "Sin presentarse — hora ya pasó" : draggable ? "Arrastra para reagendar" : undefined}
        style={{
          background: s.bg,
          border: `1px solid ${s.border}`, borderLeftWidth: 3, borderLeftColor: s.color,
          borderRadius: "7px", padding: "5px 7px 5px 8px", fontSize: "11px", marginBottom: "3px",
          cursor: draggable ? "grab" : "pointer",
          opacity: isDragging ? 0.35 : apt.status === "cancelled" ? 0.55 : 1,
          boxShadow: alert ? `0 0 0 1px ${s.border}` : "0 1px 2px rgba(20,15,30,0.05)",
          transition: "opacity .15s, transform .15s, box-shadow .15s",
          animation: "znFadeUp .3s cubic-bezier(.22,1,.36,1) both",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(20,15,30,0.12)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = alert ? `0 0 0 1px ${s.border}` : "0 1px 2px rgba(20,15,30,0.05)"; }}>
        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 10, color: s.color, flexShrink: 0 }}>{fmt12(apt.appointment_time)}</span>
          <span style={{ fontWeight: 600, color: "#14111C", overflow: "hidden", textOverflow: "ellipsis" }}>{(apt.clients as any)?.name || "Cliente"}</span>
          {hasComment(apt) && (
            <span title="Tiene información adicional" style={{ flexShrink: 0, color: "#2563eb", display: "flex", alignItems: "center" }}>
              <IconChat size={10} />
            </span>
          )}
          {alert && <span title="Sin presentarse" style={{ flexShrink: 0, fontSize: 9, color: s.color }}>⚠</span>}
        </div>
        <div style={{ color: "#564E66", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "1px", fontSize: 10.5 }}>
          {(apt.services as any)?.name || "Servicio"}
        </div>
        {profName && view !== "professional" && (
          <div style={{ color: "#8E879B", fontSize: 9.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "1px" }}>
            {profName}
          </div>
        )}
      </div>
    );
  };

  // Labels
  const monthLabel = view === "week"
    ? weekDays[0].toLocaleDateString("es-CO", { month: "long", year: "numeric" })
    : dayRef.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const filteredCount = statusFilter === "all" ? appointments.length : appointments.filter(a => a.status === statusFilter).length;
  const STATUS_FILTERS: { key: "all"|"pending"|"confirmed"|"completed"|"cancelled"; label: string; color?: string }[] = [
    { key: "all",       label: "Todas" },
    { key: "pending",   label: "Pendiente",  color: STATUS_MAP.pending.color },
    { key: "confirmed", label: "Confirmada", color: STATUS_MAP.confirmed.color },
    { key: "completed", label: "Completada", color: STATUS_MAP.completed.color },
    { key: "cancelled", label: "Cancelada",  color: STATUS_MAP.cancelled.color },
  ];

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", height: "100%", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
            <IconCalendar size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#14111C", letterSpacing: "-0.5px", margin: 0 }}>Calendario</h1>
            <p style={{ color: "#8E879B", fontSize: "13px", marginTop: "2px", textTransform: "capitalize" }}>
              {monthLabel} · {filteredCount} cita{filteredCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Nueva cita */}
          <button onClick={() => setShowNewAppt(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px" }}>
            <IconPlus size={14} color="white" /> Nueva cita
          </button>

          {/* View selector */}
          <div style={{ display: "flex", gap: 2, padding: 3, background: "white", border: "1px solid rgba(20,15,30,0.08)", borderRadius: "11px" }}>
            {([["week","Semana"],["day","Día"],["professional","Colaborador"]] as const).map(([v, label]) => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: "6px 13px", border: "none", borderRadius: 8, cursor: "pointer", background: view === v ? "#14111C" : "transparent", color: view === v ? "white" : "#564E66", fontSize: "12px", fontWeight: 600, fontFamily: "inherit", transition: "background .16s ease, color .16s ease" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Navigation */}
          {view === "week" ? (
            <>
              <button onClick={prevWeek} style={{ width: "36px", height: "36px", border: "1.5px solid rgba(20,15,30,0.08)", borderRadius: "10px", background: "white", cursor: "pointer", fontSize: "16px", color: "#3a3548" }}>‹</button>
              <button onClick={goToday} style={{ height: "36px", padding: "0 16px", border: "1.5px solid rgba(20,15,30,0.08)", borderRadius: "10px", background: "white", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#3a3548", fontFamily: "inherit" }}>Hoy</button>
              <button onClick={nextWeek} style={{ width: "36px", height: "36px", border: "1.5px solid rgba(20,15,30,0.08)", borderRadius: "10px", background: "white", cursor: "pointer", fontSize: "16px", color: "#3a3548" }}>›</button>
            </>
          ) : (
            <>
              <button onClick={prevDay} style={{ width: "36px", height: "36px", border: "1.5px solid rgba(20,15,30,0.08)", borderRadius: "10px", background: "white", cursor: "pointer", fontSize: "16px", color: "#3a3548" }}>‹</button>
              <button onClick={goToday} style={{ height: "36px", padding: "0 16px", border: "1.5px solid rgba(20,15,30,0.08)", borderRadius: "10px", background: "white", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#3a3548", fontFamily: "inherit" }}>Hoy</button>
              <button onClick={nextDay} style={{ width: "36px", height: "36px", border: "1.5px solid rgba(20,15,30,0.08)", borderRadius: "10px", background: "white", cursor: "pointer", fontSize: "16px", color: "#3a3548" }}>›</button>
            </>
          )}
        </div>
      </div>

      {/* Status filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {STATUS_FILTERS.map(f => {
          const active = statusFilter === f.key;
          return (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              style={{
                padding: "5px 13px", borderRadius: 20, border: `1.5px solid ${active ? (f.color || "#14111C") : "rgba(20,15,30,0.10)"}`,
                background: active ? (f.color ? `${f.color}18` : "rgba(20,15,30,0.06)") : "white",
                color: active ? (f.color || "#14111C") : "#8E879B",
                fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer",
                fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
                transition: "all .15s",
              }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div style={{ background: "white", border: "1px solid rgba(20,15,30,0.08)", borderRadius: "18px", overflow: "hidden", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ overflowX: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ minWidth: view === "professional" ? `${56 + (profs.length + 1) * 130}px` : "700px", display: "flex", flexDirection: "column", flex: 1 }}>

            {/* ── WEEK VIEW ── */}
            {view === "week" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "56px repeat(7, 1fr)", borderBottom: "1px solid #f0eeeb", flexShrink: 0, background: "rgba(20,15,30,0.025)" }}>
                  <div style={{ borderRight: "1px solid #f0eeeb" }} />
                  {weekDays.map((day, i) => {
                    const isToday = toISO(day) === todayStr;
                    return (
                      <div key={i} style={{ padding: "12px 8px", textAlign: "center", borderRight: "1px solid #f0eeeb", background: isToday ? "rgba(251,15,5,0.04)" : undefined }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: isToday ? "#fb0f05" : "#8E879B", letterSpacing: "0.05em" }}>{DAYS_SHORT[i]}</div>
                        <div style={{ fontSize: "20px", fontWeight: 700, color: isToday ? "#fb0f05" : "#14111C", lineHeight: 1.2, marginTop: "2px" }}>{day.getDate()}</div>
                        {isToday && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fb0f05", margin: "4px auto 0" }} />}
                      </div>
                    );
                  })}
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {loading ? (
                    <div style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                      {[0, 1, 2, 3, 4].map(i => <Skel key={i} h={52} r={10} />)}
                    </div>
                  ) : (
                    HOURS.map(hour => {
                      const isNowHour = hour.substring(0, 2) === String(new Date().getHours()).padStart(2, "0") && weekDays.some(d => toISO(d) === todayStr);
                      return (
                      <div key={hour} style={{ display: "grid", gridTemplateColumns: "56px repeat(7, 1fr)", borderBottom: "1px solid #f7f5f2", minHeight: "72px" }}>
                        <div style={{ padding: "10px 6px 0", textAlign: "right", color: isNowHour ? "#fb0f05" : "#c0bdb9", fontSize: "10px", fontFamily: MONO, fontWeight: isNowHour ? 700 : 500, borderRight: "1px solid #f0eeeb", position: "relative" }}>
                          {hour}
                          {isNowHour && <span style={{ position: "absolute", right: -3, top: 14, width: 5, height: 5, borderRadius: "50%", background: "#fb0f05" }} />}
                        </div>
                        {weekDays.map((day, di) => {
                          const isToday = toISO(day) === todayStr;
                          const dStr = toISO(day);
                          const key = `${dStr}_${hour}`;
                          const apts = getAptsForDay(dStr, hour);
                          const isOver = dragOver === key;
                          return (
                            <div key={di} {...dropProps(key, a => rescheduleApt(a, dStr, hour))}
                              style={{
                                borderRight: "1px solid #f0eeeb", padding: "4px",
                                background: isOver ? "rgba(0,39,254,0.06)" : isToday ? "rgba(251,15,5,0.015)" : undefined,
                                boxShadow: isOver ? "inset 0 0 0 1.5px rgba(0,39,254,0.35)" : "none",
                                borderRadius: isOver ? 8 : 0, transition: "background .12s, box-shadow .12s",
                              }}>
                              {apts.map(apt => aptCard(apt))}
                            </div>
                          );
                        })}
                      </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* ── DAY VIEW ── */}
            {view === "day" && (
              <>
                <div style={{ borderBottom: "1px solid #f0eeeb", padding: "14px 20px", background: "rgba(20,15,30,0.025)", flexShrink: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: toISO(dayRef) === todayStr ? "#fb0f05" : "#14111C", textTransform: "capitalize" }}>
                    {dayRef.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
                  </div>
                  <div style={{ fontSize: "12px", color: "#8E879B", marginTop: "2px" }}>
                    {appointments.length} cita{appointments.length !== 1 ? "s" : ""} agendada{appointments.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {loading ? <div style={{ padding: "60px", textAlign: "center", color: "#8E879B", fontSize: "14px" }}>Cargando citas…</div> : (
                    HOURS.map(hour => {
                      const dStr = toISO(dayRef);
                      const key = `day_${dStr}_${hour}`;
                      const apts = getAptsForDay(dStr, hour);
                      const isOver = dragOver === key;
                      return (
                        <div key={hour} style={{ display: "grid", gridTemplateColumns: "56px 1fr", borderBottom: "1px solid #f7f5f2", minHeight: "72px" }}>
                          <div style={{ padding: "10px 8px 0", textAlign: "right", color: "#c0bdb9", fontSize: "10px", fontFamily: MONO, fontWeight: 500, borderRight: "1px solid #f0eeeb" }}>{hour}</div>
                          <div {...dropProps(key, a => rescheduleApt(a, dStr, hour))}
                            style={{
                              padding: "4px 8px",
                              background: isOver ? "rgba(0,39,254,0.06)" : undefined,
                              boxShadow: isOver ? "inset 0 0 0 1.5px rgba(0,39,254,0.35)" : "none",
                              borderRadius: isOver ? 8 : 0, transition: "background .12s, box-shadow .12s",
                            }}>
                            {apts.map(apt => aptCard(apt))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* ── PROFESSIONAL VIEW ── */}
            {view === "professional" && (
              <>
                {/* Header with prof names */}
                <div style={{ display: "grid", gridTemplateColumns: `56px repeat(${profs.length}, minmax(130px, 1fr))`, borderBottom: "1px solid #f0eeeb", flexShrink: 0, background: "rgba(20,15,30,0.025)" }}>
                  <div style={{ borderRight: "1px solid #f0eeeb" }} />
                  {profs.map(p => (
                    <div key={p.id} style={{ padding: "12px 8px", textAlign: "center", borderRight: "1px solid #f0eeeb" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(251,15,5,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: "12px", fontWeight: 700, color: "#fb0f05" }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#14111C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {loading ? <div style={{ padding: "60px", textAlign: "center", color: "#8E879B", fontSize: "14px" }}>Cargando citas…</div> : (
                    HOURS.map(hour => (
                      <div key={hour} style={{ display: "grid", gridTemplateColumns: `56px repeat(${profs.length}, minmax(130px, 1fr))`, borderBottom: "1px solid #f7f5f2", minHeight: "72px" }}>
                        <div style={{ padding: "10px 8px 0", textAlign: "right", color: "#c0bdb9", fontSize: "11px", fontWeight: 600, borderRight: "1px solid #f0eeeb" }}>{hour}</div>
                        {profs.map(p => {
                          const key = `prof_${p.id}_${hour}`;
                          const isOver = dragOver === key;
                          return (
                            <div key={p.id} {...dropProps(key, a => moveAptToProf(a, p.id, hour))}
                              style={{
                                borderRight: "1px solid #f0eeeb", padding: "4px",
                                background: isOver ? "rgba(0,39,254,0.06)" : undefined,
                                boxShadow: isOver ? "inset 0 0 0 1.5px rgba(0,39,254,0.35)" : "none",
                                borderRadius: isOver ? 8 : 0, transition: "background .12s, box-shadow .12s",
                              }}>
                              {getAptsByProf(p.id, hour).map(apt => aptCard(apt))}
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 500,
          background: "rgba(12,12,20,0.82)", backdropFilter: "blur(14px) saturate(1.4)", WebkitBackdropFilter: "blur(14px) saturate(1.4)",
          border: "1px solid rgba(255,255,255,0.14)", color: "white", borderRadius: 12,
          padding: "10px 18px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 16px 40px rgba(12,12,20,0.35)", animation: "znFadeUp .25s cubic-bezier(.22,1,.36,1) both",
          fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
        }}>
          {toast}
        </div>
      )}

      {/* Nueva cita modal */}
      <NewAppointmentModal
        tenantId={tenantId ?? ""}
        open={showNewAppt}
        onClose={() => setShowNewAppt(false)}
        onCreated={() => fetchAppointments(tenantId!, startDate, endDate)}
      />

      {/* Edit modal — rendered via portal to escape backdrop-filter stacking context */}
      {isMounted && selectedApt && createPortal(
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "rgba(12,12,20,0.45)", backdropFilter: "blur(16px) saturate(1.4)", WebkitBackdropFilter: "blur(16px) saturate(1.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedApt(null); }}>
          <div style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(32px) saturate(1.6)", WebkitBackdropFilter: "blur(32px) saturate(1.6)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: "22px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#14111C", margin: 0 }}>Gestionar cita</h2>
                <p style={{ fontSize: "13px", color: "#8E879B", marginTop: "3px" }}>
                  {(selectedApt.clients as any)?.name} · {(selectedApt.services as any)?.name}
                </p>
              </div>
              <button onClick={() => setSelectedApt(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B" }}><IconX size={20} /></button>
            </div>

            {/* Info */}
            <div style={{ background: "rgba(20,15,30,0.025)", border: "1px solid rgba(20,15,30,0.08)", borderRadius: "12px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#564E66", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span><strong style={{ color: "#14111C" }}>Cliente:</strong> {(selectedApt.clients as any)?.name || "—"}</span>
              <span><strong style={{ color: "#14111C" }}>Servicio:</strong> {(selectedApt.services as any)?.name || "—"}</span>
              <span><strong style={{ color: "#14111C" }}>Colaborador:</strong> {(selectedApt.professionals as any)?.name || "Sin asignar"}</span>
              {aptFields.length > 0 && (
                <>
                  <div style={{ borderTop: "1px solid rgba(20,15,30,0.08)", marginTop: "6px", paddingTop: "8px", fontSize: "10px", fontWeight: 700, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.07em" }}>
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
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={inp}>
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button className="btn-secondary" onClick={() => setSelectedApt(null)}>Cancelar</button>
              <button className="btn-primary" onClick={saveApt} disabled={isSaving}
                style={editForm.status === "cancelled" ? { background: "#ef4444" } : {}}>
                {isSaving ? "Guardando…" : "Guardar cambios"}
              </button>
              {editForm.status === "confirmed" && (
                <button
                  onClick={() => { setSelectedApt(null); router.push(`/admin/pos?appointment=${selectedApt!.id}`); }}
                  style={{
                    padding: "10px 18px", borderRadius: "10px", border: "none",
                    background: "linear-gradient(135deg, #10b981, #0ea5e9)",
                    color: "white", fontWeight: 700, fontSize: "13px",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                    fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                    boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                  }}>
                  <IconCreditCard size={15} /> Cobrar cita
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
