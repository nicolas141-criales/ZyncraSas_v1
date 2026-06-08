"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";

/* ─── Constants ─── */
const TIME_SLOTS = [
  "08:00 AM","08:30 AM","09:00 AM","09:30 AM","10:00 AM","10:30 AM",
  "11:00 AM","11:30 AM","12:00 PM","12:30 PM","01:00 PM","01:30 PM",
  "02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM","04:30 PM",
  "05:00 PM","05:30 PM","06:00 PM","06:30 PM","07:00 PM",
];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_SHORT = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];
const DAYS_LONG  = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const MONTHS_LONG = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

/* ─── Helpers ─── */
function to12h(t: string) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}
function to24h(t: string) {
  const [tp, mod] = t.split(" ");
  let [h, m] = tp.split(":");
  if (h === "12") h = "00";
  if (mod === "PM") h = String(parseInt(h, 10) + 12);
  return `${h.padStart(2, "0")}:${m}:00`;
}
function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_LONG[dt.getDay()]} ${d} de ${MONTHS_LONG[m - 1]} de ${y}`;
}
function slotKey(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2,"0")}:${String(m).padStart(2,"0")} ${suffix}`;
}

/* ─── Page ─── */
export default function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [appt,   setAppt]         = useState<any>(null);
  const [tenant, setTenant]       = useState<any>(null);
  const [branding, setBranding]   = useState<any>(null);

  // action flow
  const [view, setView] = useState<"menu" | "cancel" | "reschedule" | "done">("menu");
  const [doneMsg, setDoneMsg]     = useState("");
  const [working, setWorking]     = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // reschedule state
  const now = new Date();
  const [calYear,  setCalYear]    = useState(now.getFullYear());
  const [calMonth, setCalMonth]   = useState(now.getMonth());
  const [selDate,  setSelDate]    = useState<string | null>(null);
  const [selTime,  setSelTime]    = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  /* load appointment */
  useEffect(() => {
    fetch(`/api/manage/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setNotFound(true); setLoading(false); return; }
        setAppt(data.appt);
        setTenant(data.tenant);
        setBranding(data.branding);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });

    // check URL action param
    const url = new URL(window.location.href);
    const action = url.searchParams.get("action");
    if (action === "cancel" || action === "reschedule") setView(action);
  }, [token]);

  /* load booked slots when date changes (reschedule) */
  useEffect(() => {
    if (!selDate || !appt?.professional_id) { setBookedSlots(new Set()); return; }
    setLoadingSlots(true);
    supabase.from("appointments")
      .select("appointment_time")
      .eq("tenant_id", appt.tenant_id)
      .eq("appointment_date", selDate)
      .eq("professional_id", appt.professional_id)
      .neq("id", appt.id)
      .in("status", ["pending", "confirmed"])
      .then(({ data }) => {
        setBookedSlots(new Set((data ?? []).map((a: any) => slotKey(a.appointment_time))));
        setLoadingSlots(false);
      });
  }, [selDate, appt]);

  /* derived */
  const primaryColor   = branding?.primary_color   ?? "#fb0f05";
  const secondaryColor = branding?.secondary_color  ?? "#0027fe";
  const businessName   = branding?.business_name || tenant?.name || "Zyncra";

  const businessHours: Record<string, { open: boolean; start: string; end: string }> | null =
    tenant?.settings?.schedule ?? null;

  // professional's own schedule overrides business hours
  const profSchedule: Record<string, { open: boolean; start: string; end: string }> | null =
    (appt?.professionals as any)?.schedule ?? null;

  const getEffectiveHours = (dayOfWeek: number) => {
    const key = String(dayOfWeek);
    if (profSchedule?.[key]) return profSchedule[key];
    return businessHours?.[key] ?? null;
  };

  const isDayClosed = (year: number, month: number, day: number) => {
    const h = getEffectiveHours(new Date(year, month, day).getDay());
    return h ? !h.open : false;
  };

  const availableSlots = (() => {
    if (!selDate) return TIME_SLOTS;
    const [y, mo, d] = selDate.split("-").map(Number);
    const h = getEffectiveHours(new Date(y, mo - 1, d).getDay());
    if (!h) return TIME_SLOTS;
    if (!h.open) return [];
    const start = timeToMin(h.start), end = timeToMin(h.end);
    return TIME_SLOTS.filter(slot => {
      const m = timeToMin(to24h(slot).slice(0, 5));
      return m >= start && m < end;
    });
  })();

  // calendar
  const rawFirst   = new Date(calYear, calMonth, 1).getDay();
  const firstDay   = rawFirst === 0 ? 6 : rawFirst - 1;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);

  const selectDay = (day: number) => {
    const d = new Date(calYear, calMonth, day); d.setHours(0,0,0,0);
    if (d < todayMidnight || isDayClosed(calYear, calMonth, day)) return;
    const iso = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    setSelDate(iso); setSelTime(null);
  };

  /* actions */
  const handleCancel = async () => {
    setWorking(true); setActionError(null);
    const res = await fetch(`/api/manage/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    const data = await res.json();
    setWorking(false);
    if (!res.ok) { setActionError(data.error ?? "Error al cancelar"); return; }
    setDoneMsg("Tu cita ha sido cancelada correctamente.");
    setView("done");
  };

  const handleReschedule = async () => {
    if (!selDate || !selTime) return;
    setWorking(true); setActionError(null);
    const res = await fetch(`/api/manage/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reschedule", date: selDate, time: to24h(selTime) }),
    });
    const data = await res.json();
    setWorking(false);
    if (!res.ok) { setActionError(data.error ?? "Error al reagendar"); return; }
    setDoneMsg(`Tu cita ha sido reagendada para el ${formatDate(selDate)} a las ${selTime}.`);
    setView("done");
  };

  /* ── Styles shared ── */
  const cardStyle: React.CSSProperties = {
    background: "white", borderRadius: 20, padding: "28px 24px",
    boxShadow: "0 4px 32px rgba(0,0,0,0.08)", maxWidth: 480, margin: "0 auto",
    fontFamily: "'Segoe UI', 'Inter', sans-serif",
  };

  const btnPrimary: React.CSSProperties = {
    display: "block", width: "100%", padding: "13px 24px", borderRadius: 11,
    border: "none", background: `linear-gradient(135deg,${primaryColor},${secondaryColor})`,
    color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
    fontFamily: "inherit", textAlign: "center", marginBottom: 10,
  };
  const btnSecondary: React.CSSProperties = {
    display: "block", width: "100%", padding: "12px 24px", borderRadius: 11,
    border: "1.5px solid #e8e6e2", background: "white",
    color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer",
    fontFamily: "inherit", textAlign: "center", marginBottom: 10,
  };
  const btnDanger: React.CSSProperties = {
    display: "block", width: "100%", padding: "13px 24px", borderRadius: 11,
    border: "none", background: "#ef4444", color: "white",
    fontWeight: 700, fontSize: 14, cursor: "pointer",
    fontFamily: "inherit", textAlign: "center", marginBottom: 10,
  };

  /* ── Summary box ── */
  const Summary = () => (
    <div style={{ background: "#f7f5f2", borderRadius: 12, padding: "14px 18px", marginBottom: 22 }}>
      {[
        ["Servicio",    (appt.services as any)?.name ?? "—"],
        ["Profesional", (appt.professionals as any)?.name ?? "—"],
        ["Fecha",       formatDate(appt.appointment_date)],
        ["Hora",        to12h(appt.appointment_time)],
      ].map(([label, value]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #ede9e4" }}>
          <span style={{ fontSize: 13, color: "#6b6b80", fontWeight: 600 }}>{label}</span>
          <span style={{ fontSize: 13, color: "#111118", fontWeight: 500, textTransform: "capitalize" }}>{value}</span>
        </div>
      ))}
    </div>
  );

  /* ── Loading ── */
  if (loading) return (
    <main style={{ minHeight: "100vh", background: "#f4f4f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", fontFamily: "sans-serif" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #e8e6e2", borderTopColor: "#fb0f05", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "#6b6b80", fontSize: 14 }}>Cargando tu cita...</p>
      </div>
    </main>
  );

  /* ── Not found ── */
  if (notFound || !appt) return (
    <main style={{ minHeight: "100vh", background: "#f4f4f9", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ ...cardStyle, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111118", marginBottom: 8 }}>Cita no encontrada</h2>
        <p style={{ fontSize: 14, color: "#6b6b80" }}>El enlace puede haber expirado o ser incorrecto.</p>
      </div>
    </main>
  );

  /* ── Already cancelled ── */
  if (appt.status === "cancelled" && view !== "done") return (
    <main style={{ minHeight: "100vh", background: "#f4f4f9", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ ...cardStyle, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111118", marginBottom: 8 }}>Esta cita ya fue cancelada</h2>
        <p style={{ fontSize: 14, color: "#6b6b80" }}>Si necesitas una nueva cita, reserva de nuevo desde la página del negocio.</p>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#f4f4f9", fontFamily: "'Segoe UI','Inter',sans-serif" }}>

      {/* Branded header */}
      <div style={{ background: primaryColor, padding: "32px 24px 28px", textAlign: "center" }}>
        {branding?.logo_url && (
          <img
            src={branding.logo_url}
            alt={businessName}
            style={{ height: 60, maxWidth: 200, objectFit: "contain", display: "block", margin: "0 auto 12px", borderRadius: 10 }}
          />
        )}
        <p style={{ color: "white", fontWeight: 800, fontSize: 20, margin: 0, letterSpacing: "-0.025em" }}>
          {businessName}
        </p>
      </div>

      <div style={{ padding: "24px 16px 40px" }}>
      <div style={cardStyle}>

        {/* ── DONE ── */}
        {view === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg,${primaryColor},${secondaryColor})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✓</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111118", marginBottom: 8 }}>¡Listo!</h2>
            <p style={{ fontSize: 14, color: "#6b6b80", marginBottom: 24, textTransform: "capitalize" }}>{doneMsg}</p>
          </div>
        )}

        {/* ── MENU ── */}
        {view === "menu" && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111118", margin: "0 0 6px" }}>Gestionar cita</h2>
            <p style={{ fontSize: 13, color: "#6b6b80", margin: "0 0 20px" }}>¿Qué deseas hacer con tu cita?</p>
            <Summary />
            <button style={btnPrimary} onClick={() => setView("reschedule")}>📅 Reagendar cita</button>
            <button style={btnSecondary} onClick={() => setView("cancel")}>Cancelar cita</button>
          </>
        )}

        {/* ── CANCEL ── */}
        {view === "cancel" && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111118", margin: "0 0 6px" }}>Cancelar cita</h2>
            <p style={{ fontSize: 13, color: "#6b6b80", margin: "0 0 20px" }}>Revisa los detalles antes de confirmar la cancelación.</p>
            <Summary />
            {actionError && (
              <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 14 }}>
                {actionError}
              </div>
            )}
            <button style={btnDanger} onClick={handleCancel} disabled={working}>
              {working ? "Cancelando..." : "Confirmar cancelación"}
            </button>
            <button style={btnSecondary} onClick={() => setView("menu")} disabled={working}>← Volver</button>
          </>
        )}

        {/* ── RESCHEDULE ── */}
        {view === "reschedule" && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111118", margin: "0 0 6px" }}>Reagendar cita</h2>
            <p style={{ fontSize: 13, color: "#6b6b80", margin: "0 0 20px" }}>Elige una nueva fecha y hora disponible.</p>

            {/* Mini calendar */}
            <div style={{ background: "rgba(20,15,30,.02)", border: "1px solid #e8e6e2", borderRadius: 14, padding: 16, marginBottom: 18 }}>
              {/* Nav */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <button onClick={() => { if (calMonth === 0) { setCalYear(y=>y-1); setCalMonth(11); } else setCalMonth(m=>m-1); }}
                  disabled={calYear === now.getFullYear() && calMonth === now.getMonth()}
                  style={{ background: "none", border: "1px solid #e8e6e2", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 14, color: "#3a3548" }}>‹</button>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#14111C", textTransform: "capitalize" }}>
                  {MONTHS_ES[calMonth]} {calYear}
                </span>
                <button onClick={() => { if (calMonth === 11) { setCalYear(y=>y+1); setCalMonth(0); } else setCalMonth(m=>m+1); }}
                  style={{ background: "none", border: "1px solid #e8e6e2", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 14, color: "#3a3548" }}>›</button>
              </div>
              {/* Days header */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
                {DAYS_SHORT.map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#8E879B", padding: "3px 0" }}>{d}</div>
                ))}
              </div>
              {/* Days grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const d = new Date(calYear, calMonth, day); d.setHours(0,0,0,0);
                  const past   = d < todayMidnight;
                  const closed = !past && isDayClosed(calYear, calMonth, day);
                  const iso    = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const sel    = selDate === iso;
                  return (
                    <button key={day} onClick={() => selectDay(day)} disabled={past || closed}
                      style={{ padding: "6px 2px", borderRadius: 7, border: sel ? `2px solid ${primaryColor}` : "1px solid transparent", background: sel ? primaryColor : "transparent", color: sel ? "white" : (past || closed) ? "#d0ceca" : "#14111C", fontSize: 12, fontWeight: sel ? 700 : 400, cursor: (past || closed) ? "not-allowed" : "pointer" }}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selDate && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#564E66", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
                  Horarios disponibles {loadingSlots && <span style={{ fontWeight: 400, color: "#8E879B" }}>cargando...</span>}
                </div>
                {availableSlots.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#8E879B", textAlign: "center", padding: "12px 0" }}>No hay atención disponible este día</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                    {availableSlots.map(slot => {
                      const occupied = bookedSlots.has(slot);
                      const sel = selTime === slot;
                      return (
                        <button key={slot} onClick={() => !occupied && setSelTime(slot)} disabled={occupied}
                          style={{ padding: "9px 4px", borderRadius: 9, border: sel ? `2px solid ${primaryColor}` : "1px solid #e8e6e2", background: sel ? primaryColor : occupied ? "#f7f5f2" : "white", color: sel ? "white" : occupied ? "#c0bdb9" : "#14111C", fontSize: 12, fontWeight: sel ? 700 : 500, cursor: occupied ? "not-allowed" : "pointer", textDecoration: occupied ? "line-through" : "none", transition: "all .12s", fontFamily: "inherit" }}>
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {!selDate && (
              <p style={{ fontSize: 13, color: "#8E879B", textAlign: "center", padding: "8px 0 16px" }}>Selecciona un día para ver los horarios</p>
            )}

            {actionError && (
              <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 14 }}>
                {actionError}
              </div>
            )}

            <button style={{ ...btnPrimary, opacity: (!selDate || !selTime || working) ? 0.5 : 1 }}
              onClick={handleReschedule} disabled={!selDate || !selTime || working}>
              {working ? "Reagendando..." : "Confirmar reagendamiento ✓"}
            </button>
            <button style={btnSecondary} onClick={() => setView("menu")} disabled={working}>← Volver</button>
          </>
        )}

      </div>

      {/* Zyncra footer */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <p style={{ fontSize: 12, color: "#b0b0c0", margin: "0 0 6px" }}>Agenda gestionada con</p>
        <a href="https://zyncra.app" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <img src="/zyncra-icon.png" alt="Zyncra" width={20} height={20} style={{ borderRadius: 5, verticalAlign: "middle" }} />
          <span style={{ fontSize: 15, fontWeight: 800, color: "#fb0f05", verticalAlign: "middle" }}>Zyncra</span>
        </a>
      </div>
      </div>
    </main>
  );
}
