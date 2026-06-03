"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { IconPlus, IconX, IconClock } from "./ZyncraIcons";

const TIME_SLOTS = [
  "08:00 AM","08:30 AM","09:00 AM","09:30 AM","10:00 AM","10:30 AM",
  "11:00 AM","11:30 AM","12:00 PM","12:30 PM","01:00 PM","01:30 PM",
  "02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM","04:30 PM",
  "05:00 PM","05:30 PM","06:00 PM","06:30 PM","07:00 PM",
];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_SHORT = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"]; // Lunes primero

function to24h(t: string): string {
  const [tp, mod] = t.split(" ");
  let [h, m] = tp.split(":");
  if (h === "12") h = "00";
  if (mod === "PM") h = String(parseInt(h, 10) + 12);
  return `${h.padStart(2, "0")}:${m}:00`;
}
function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }

function slotToKey(time: string) {
  const [h, m] = time.split(":");
  const hr = parseInt(h);
  const suffix = hr >= 12 ? "PM" : "AM";
  const h12 = hr % 12 || 12;
  return `${h12.toString().padStart(2, "0")}:${m} ${suffix}`;
}

interface Props {
  tenantId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function NewAppointmentModal({ tenantId, open, onClose, onCreated }: Props) {
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [profs, setProfs] = useState<any[]>([]);
  const [businessHours, setBusinessHours] = useState<any>(null);

  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [profId, setProfId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [step, setStep] = useState<"form" | "datetime">("form");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga datos al abrir
  useEffect(() => {
    if (!open || !tenantId) return;
    setClientId(""); setClientSearch(""); setSelectedClient(null);
    setServiceId(""); setProfId("");
    setSelectedDate(""); setSelectedTime(""); setError(null);
    setStep("form");
    setCalYear(now.getFullYear()); setCalMonth(now.getMonth());

    Promise.all([
      supabase.from("clients").select("id,name,phone").eq("tenant_id", tenantId).order("name"),
      supabase.from("services").select("id,name").eq("tenant_id", tenantId).order("name"),
      supabase.from("professionals").select("id,name,schedule").eq("tenant_id", tenantId).eq("is_active", true).order("name"),
      supabase.from("tenants").select("settings").eq("id", tenantId).maybeSingle(),
    ]).then(([{data: cls}, {data: svs}, {data: prs}, {data: tenant}]) => {
      setClients(cls ?? []);
      setServices(svs ?? []);
      setProfs(prs ?? []);
      setBusinessHours((tenant as any)?.settings?.schedule ?? null);
    });
  }, [open, tenantId]); // eslint-disable-line

  // Carga slots ocupados cuando cambia profesional o fecha
  useEffect(() => {
    if (!profId || !selectedDate) { setBookedSlots(new Set()); return; }
    setLoadingSlots(true);
    supabase.from("appointments")
      .select("appointment_time")
      .eq("tenant_id", tenantId)
      .eq("appointment_date", selectedDate)
      .eq("professional_id", profId)
      .in("status", ["pending", "confirmed"])
      .then(({ data }) => {
        setBookedSlots(new Set<string>((data ?? []).map((a: any) => slotToKey(a.appointment_time))));
        setLoadingSlots(false);
      });
  }, [profId, selectedDate, tenantId]);

  // Filtrado derivado — sin estado extra
  const searchQuery = clientSearch.trim().toLowerCase();
  const filteredClients = (() => {
    if (searchQuery.length < 1) return [];
    const phoneQuery = searchQuery.replace(/\D/g, "");
    const scored = clients
      .map(c => {
        const name = c.name.toLowerCase();
        const phone = c.phone.replace(/\D/g, "");
        let score = 0;
        if (name === searchQuery) score = 4;                          // coincidencia exacta
        else if (name.startsWith(searchQuery)) score = 3;            // empieza con la búsqueda
        else if (name.split(" ").some((w: string) => w.startsWith(searchQuery))) score = 2; // una palabra empieza
        else if (name.includes(searchQuery)) score = 1;              // contiene en cualquier posición
        else if (phoneQuery && phone.startsWith(phoneQuery)) score = 2;
        else if (phoneQuery && phone.includes(phoneQuery)) score = 1;
        return { c, score };
      })
      .filter(({ score }) => score > 0)   // sin coincidencia = no aparece
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ c }) => c);
    return scored;
  })();

  const selectClient = (c: { id: string; name: string; phone: string }) => {
    setSelectedClient(c);
    setClientId(c.id);
    setClientSearch("");
  };

  // Slots disponibles según horario efectivo (personal del colaborador o del negocio)
  const availableSlots = (() => {
    if (!selectedDate) return TIME_SLOTS;
    const [y, mo, d] = selectedDate.split("-").map(Number);
    const h = getEffectiveHours(new Date(y, mo - 1, d).getDay());
    if (!h || !h.open) return [];
    const start = timeToMin(h.start), end = timeToMin(h.end);
    return TIME_SLOTS.filter(slot => {
      const m = timeToMin(to24h(slot).slice(0, 5));
      return m >= start && m < end;
    });
  })();

  // Calendario
  const rawFirst = new Date(calYear, calMonth, 1).getDay();
  const firstDay = rawFirst === 0 ? 6 : rawFirst - 1; // Offset lunes-primero
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);

  // Returns the effective schedule for a given day of week, respecting the pro's personal schedule
  const getEffectiveHours = (dayOfWeek: number) => {
    const key = String(dayOfWeek);
    if (profId) {
      const prof = profs.find((p: any) => p.id === profId);
      const profDay = prof?.schedule?.[key];
      if (profDay !== undefined) return profDay as { open: boolean; start: string; end: string };
    }
    return (businessHours?.[key] ?? null) as { open: boolean; start: string; end: string } | null;
  };

  const isDayClosed = (day: number) => {
    const h = getEffectiveHours(new Date(calYear, calMonth, day).getDay());
    return h ? !h.open : false;
  };

  const selectDay = (day: number) => {
    const d = new Date(calYear, calMonth, day); d.setHours(0, 0, 0, 0);
    if (d < todayMidnight || isDayClosed(day)) return;
    setSelectedDate(`${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    setSelectedTime("");
  };

  const handleSave = async () => {
    if (!clientId || !profId || !selectedDate || !selectedTime) {
      setError("Completa todos los campos requeridos."); return;
    }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("appointments").insert({
      tenant_id: tenantId, client_id: clientId,
      service_id: serviceId || null, professional_id: profId,
      appointment_date: selectedDate, appointment_time: to24h(selectedTime),
      status: "confirmed",
    });
    setSaving(false);
    if (err) { setError("Error: " + err.message); return; }
    onCreated();
    onClose();
  };

  if (!open) return null;

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 13px", border: "1.5px solid #e8e6e2",
    borderRadius: "10px", fontSize: "14px", background: "rgba(20,15,30,0.025)",
    color: "#14111C", boxSizing: "border-box",
    fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif", outline: "none",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontWeight: 600, fontSize: "11px", color: "#564E66",
    marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(17,17,24,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: "22px", padding: "28px", width: "100%", maxWidth: "520px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", maxHeight: "92vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05" }}>
              <IconPlus size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#14111C", margin: 0 }}>Nueva cita</h2>
              <p style={{ fontSize: "12px", color: "#8E879B", marginTop: "2px" }}>
                {step === "form" ? "Paso 1 de 2 · Cliente, servicio y colaborador" : "Paso 2 de 2 · Fecha y hora disponible"}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B" }}><IconX size={20} /></button>
        </div>

        {/* ── Paso 1: cliente, servicio, colaborador ── */}
        {step === "form" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={lbl}>Cliente *</label>

              {/* Cliente seleccionado */}
              {selectedClient ? (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", border: "1.5px solid #10b981", borderRadius: "11px", background: "rgba(16,185,129,0.05)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#14111C" }}>{selectedClient.name}</div>
                    <div style={{ fontSize: "12px", color: "#8E879B", marginTop: "2px" }}>{selectedClient.phone}</div>
                  </div>
                  <button type="button" onClick={() => { setSelectedClient(null); setClientId(""); setClientSearch(""); }}
                    style={{ background: "rgba(20,15,30,0.05)", border: "none", cursor: "pointer", color: "#564E66", borderRadius: "6px", padding: "4px 6px", display: "flex", alignItems: "center" }}>
                    <IconX size={13} /> <span style={{ fontSize: "11px", marginLeft: "3px", fontWeight: 600 }}>Cambiar</span>
                  </button>
                </div>
              ) : (
                /* Buscador */
                <div>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Escribe nombre o teléfono..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    style={inp}
                  />

                  {/* Resultados inline */}
                  {searchQuery.length >= 1 && (
                    <div style={{ marginTop: "6px", border: "1.5px solid #e8e6e2", borderRadius: "11px", overflow: "hidden", background: "white" }}>
                      {filteredClients.length > 0 ? (
                        filteredClients.map((c, i) => (
                          <button key={c.id} type="button" onMouseDown={() => selectClient(c)}
                            style={{ width: "100%", padding: "11px 14px", border: "none", borderBottom: i < filteredClients.length - 1 ? "1px solid #f0eeeb" : "none", background: "transparent", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", fontFamily: "inherit" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(20,15,30,0.03)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "13px", color: "#14111C" }}>{c.name}</div>
                              <div style={{ fontSize: "12px", color: "#8E879B", marginTop: "1px" }}>{c.phone}</div>
                            </div>
                            <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", background: "rgba(251,15,5,0.08)", color: "#fb0f05", whiteSpace: "nowrap" }}>Seleccionar</span>
                          </button>
                        ))
                      ) : (
                        <div style={{ padding: "16px 14px", fontSize: "13px", color: "#8E879B", textAlign: "center" }}>
                          Sin resultados · Ve a <strong>Clientes</strong> para registrarlo primero
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label style={lbl}>Servicio</label>
              <select value={serviceId} onChange={e => setServiceId(e.target.value)} style={inp}>
                <option value="">— Sin especificar —</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Colaborador * <span style={{ fontWeight: 400, textTransform: "none", color: "#8E879B" }}>(requerido)</span></label>
              <select value={profId} onChange={e => { setProfId(e.target.value); setSelectedDate(""); setSelectedTime(""); }} style={inp}>
                <option value="">— Seleccionar colaborador —</option>
                {profs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {error && <div style={{ background: "#fff0f0", border: "1px solid rgba(251,15,5,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#d90d04" }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
              <button onClick={() => {
                if (!clientId || !profId) { setError("Cliente y colaborador son requeridos."); return; }
                setError(null); setStep("datetime");
              }} className="btn-primary" style={{ padding: "11px 28px" }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 2: fecha y hora ── */}
        {step === "datetime" && (
          <div>
            {/* Mini calendario */}
            <div style={{ background: "rgba(20,15,30,0.02)", border: "1px solid #e8e6e2", borderRadius: "14px", padding: "16px", marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <button onClick={() => { if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11); } else setCalMonth(m => m-1); }}
                  disabled={calYear === now.getFullYear() && calMonth === now.getMonth()}
                  style={{ background: "none", border: "1px solid #e8e6e2", borderRadius: "8px", width: 30, height: 30, cursor: "pointer", fontSize: "14px", color: "#3a3548" }}>‹</button>
                <span style={{ fontWeight: 700, fontSize: "14px", color: "#14111C", textTransform: "capitalize" }}>
                  {MONTHS_ES[calMonth]} {calYear}
                </span>
                <button onClick={() => { if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); } else setCalMonth(m => m+1); }}
                  style={{ background: "none", border: "1px solid #e8e6e2", borderRadius: "8px", width: 30, height: 30, cursor: "pointer", fontSize: "14px", color: "#3a3548" }}>›</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
                {DAYS_SHORT.map(d => <div key={d} style={{ textAlign: "center", fontSize: "10px", fontWeight: 700, color: "#8E879B", padding: "3px 0" }}>{d}</div>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const d = new Date(calYear, calMonth, day); d.setHours(0, 0, 0, 0);
                  const past = d < todayMidnight;
                  const closed = !past && isDayClosed(day);
                  const isoDay = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const sel = selectedDate === isoDay;
                  return (
                    <button key={day} onClick={() => !past && !closed && selectDay(day)} disabled={past || closed}
                      style={{ padding: "6px 2px", borderRadius: "7px", border: sel ? "2px solid #fb0f05" : "1px solid transparent", background: sel ? "#fb0f05" : "transparent", color: sel ? "white" : past || closed ? "#d0ceca" : "#14111C", fontSize: "12px", fontWeight: sel ? 700 : 400, cursor: past || closed ? "not-allowed" : "pointer" }}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slots de tiempo */}
            {selectedDate && (
              <div style={{ marginBottom: "18px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#564E66", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <IconClock size={12} /> Horarios disponibles
                  {loadingSlots && <span style={{ fontWeight: 400, color: "#8E879B" }}>cargando...</span>}
                </div>
                {availableSlots.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#8E879B", textAlign: "center", padding: "14px 0" }}>No hay horarios disponibles este día</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                    {availableSlots.map(slot => {
                      const occupied = bookedSlots.has(slot);
                      const sel = selectedTime === slot;
                      return (
                        <button key={slot} onClick={() => !occupied && setSelectedTime(slot)} disabled={occupied}
                          style={{ padding: "9px 4px", borderRadius: "9px", border: sel ? "2px solid #fb0f05" : "1px solid #e8e6e2", background: sel ? "#fb0f05" : occupied ? "#f7f5f2" : "white", color: sel ? "white" : occupied ? "#c0bdb9" : "#14111C", fontSize: "12px", fontWeight: sel ? 700 : 500, cursor: occupied ? "not-allowed" : "pointer", textDecoration: occupied ? "line-through" : "none", transition: "all .12s" }}>
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {!selectedDate && (
              <p style={{ fontSize: "13px", color: "#8E879B", textAlign: "center", padding: "12px 0 18px" }}>Selecciona un día para ver los horarios disponibles</p>
            )}

            {error && <div style={{ background: "#fff0f0", border: "1px solid rgba(251,15,5,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#d90d04", marginBottom: "14px" }}>{error}</div>}

            <div style={{ display: "flex", gap: "10px", justifyContent: "space-between" }}>
              <button onClick={() => { setStep("form"); setSelectedDate(""); setSelectedTime(""); }} className="btn-secondary">← Atrás</button>
              <button onClick={handleSave} disabled={saving || !selectedDate || !selectedTime} className="btn-primary">
                {saving ? "Guardando..." : "Confirmar cita ✓"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
