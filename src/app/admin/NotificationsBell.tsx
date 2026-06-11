"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { IconX } from "./ZyncraIcons";

interface Notif {
  id: string;
  type: "inasistencia" | "sin_confirmar" | "sin_profesional" | "nueva_cita" | "cancelacion";
  group: "urgent" | "action" | "activity";
  client: string;
  service: string;
  when: string;
  tag: string;
  color: string;
  iconPath: string;
}

const TYPE_META: Record<Notif["type"], { color: string; iconPath: string }> = {
  inasistencia:    { color: "#dc2626", iconPath: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" },
  sin_confirmar:   { color: "#d97706", iconPath: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  sin_profesional: { color: "#ea580c", iconPath: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" },
  nueva_cita:      { color: "#2563eb", iconPath: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H18v-.008Zm0 2.25h.008v.008H18V15Z" },
  cancelacion:     { color: "#6b7280", iconPath: "M9.75 9.75l4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
};

const GROUP_ORDER: Notif["group"][] = ["urgent", "action", "activity"];
const GROUP_LABELS: Record<Notif["group"], string> = {
  urgent:   "Urgente",
  action:   "Requiere acción",
  activity: "Actividad reciente",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function relTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 2) return "Ahora";
  if (m < 60) return `Hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

function NotifCard({ n, onDismiss }: { n: Notif; onDismiss: () => void }) {
  const meta = TYPE_META[n.type];
  const avatarBg = `${meta.color}18`;
  const ini = initials(n.client);

  const typeLabels: Record<Notif["type"], string> = {
    inasistencia:    "Sin presentarse",
    sin_confirmar:   "Sin confirmar",
    sin_profesional: "Sin colaborador",
    nueva_cita:      "Nueva cita",
    cancelacion:     "Cancelada",
  };

  return (
    <div style={{
      display: "flex", gap: 12, padding: "13px 14px",
      background: "white", borderRadius: "13px", marginBottom: "6px",
      border: "1px solid rgba(20,15,30,0.07)",
      borderLeft: `3px solid ${meta.color}`,
      boxShadow: "0 1px 4px rgba(20,15,30,0.05)",
      position: "relative",
    }}>
      {/* Avatar / icon column */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        {/* Client avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: avatarBg, border: `1.5px solid ${meta.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "12px", fontWeight: 700, color: meta.color, flexShrink: 0,
        }}>
          {ini}
        </div>
        {/* Type icon */}
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: `${meta.color}12`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d={meta.iconPath} />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Type tag + dismiss */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
            color: meta.color, background: `${meta.color}12`,
            padding: "2px 7px", borderRadius: 20,
          }}>
            {typeLabels[n.type]}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "10px", color: "#8E879B", fontWeight: 600 }}>{n.tag}</span>
            <button onClick={onDismiss} title="Descartar"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#c0bdb9", padding: "1px 2px", lineHeight: 1, fontSize: 14, borderRadius: 4 }}
              onMouseEnter={e => (e.currentTarget.style.color = "#8E879B")}
              onMouseLeave={e => (e.currentTarget.style.color = "#c0bdb9")}>
              ×
            </button>
          </div>
        </div>

        {/* Client name */}
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#14111C", lineHeight: 1.3, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {n.client}
        </div>

        {/* Service + when */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11.5px", color: "#564E66" }}>{n.service}</span>
          {n.when && (
            <>
              <span style={{ fontSize: 10, color: "#c0bdb9" }}>·</span>
              <span style={{ fontSize: "11px", color: "#8E879B", fontWeight: 600 }}>{n.when}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsBell({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const load = useCallback(async () => {
    const today    = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const in7      = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const nowHHMM  = `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;
    const since8h  = new Date(Date.now() - 8 * 3600000).toISOString();

    const fmtDate = (date: string, time: string) => {
      const t = time.slice(0, 5);
      if (date === today) return `Hoy ${t}`;
      if (date === tomorrow) return `Mañana ${t}`;
      const d = new Date(date + "T12:00:00");
      return `${d.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" })} ${t}`;
    };

    const [{ data: upcoming }, { data: recent }] = await Promise.all([
      supabase.from("appointments")
        .select("id, appointment_date, appointment_time, status, professional_id, clients(name), services(name)")
        .eq("tenant_id", tenantId)
        .gte("appointment_date", today)
        .lte("appointment_date", in7)
        .in("status", ["pending", "confirmed"]),
      supabase.from("appointments")
        .select("id, appointment_date, appointment_time, status, created_at, clients(name), services(name)")
        .eq("tenant_id", tenantId)
        .gte("created_at", since8h)
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

    const list: Notif[] = [];
    const meta = (type: Notif["type"]) => TYPE_META[type];

    // A — Inasistencias hoy
    (upcoming ?? [])
      .filter(a => a.appointment_date === today && a.appointment_time.slice(0, 5) < nowHHMM)
      .forEach(a => list.push({
        id: `A_${a.id}`, type: "inasistencia", group: "urgent",
        client:  (a.clients as any)?.name  || "Cliente",
        service: (a.services as any)?.name || "Servicio",
        when: `Hoy ${a.appointment_time.slice(0, 5)}`,
        tag: "Hoy",
        ...meta("inasistencia"),
      }));

    // B — Sin confirmar mañana
    (upcoming ?? [])
      .filter(a => a.appointment_date === tomorrow && a.status === "pending")
      .forEach(a => list.push({
        id: `B_${a.id}`, type: "sin_confirmar", group: "action",
        client:  (a.clients as any)?.name  || "Cliente",
        service: (a.services as any)?.name || "Servicio",
        when: `Mañana ${a.appointment_time.slice(0, 5)}`,
        tag: "Mañana",
        ...meta("sin_confirmar"),
      }));

    // C — Sin profesional
    (upcoming ?? [])
      .filter(a => !a.professional_id)
      .slice(0, 5)
      .forEach(a => list.push({
        id: `C_${a.id}`, type: "sin_profesional", group: "action",
        client:  (a.clients as any)?.name  || "Cliente",
        service: (a.services as any)?.name || "Servicio",
        when: fmtDate(a.appointment_date, a.appointment_time),
        tag: a.appointment_date === today ? "Hoy" : a.appointment_date === tomorrow ? "Mañana" : "Próxima",
        ...meta("sin_profesional"),
      }));

    // D — Nuevas citas (últimas 8h)
    (recent ?? [])
      .filter(a => a.status !== "cancelled")
      .slice(0, 4)
      .forEach(a => list.push({
        id: `D_${a.id}`, type: "nueva_cita", group: "activity",
        client:  (a.clients as any)?.name  || "Cliente",
        service: (a.services as any)?.name || "Servicio",
        when: fmtDate(a.appointment_date, a.appointment_time),
        tag: relTime(a.created_at),
        ...meta("nueva_cita"),
      }));

    // Cancelaciones recientes
    (recent ?? [])
      .filter(a => a.status === "cancelled")
      .slice(0, 3)
      .forEach(a => list.push({
        id: `Dcancel_${a.id}`, type: "cancelacion", group: "activity",
        client:  (a.clients as any)?.name  || "Cliente",
        service: (a.services as any)?.name || "Servicio",
        when: "",
        tag: relTime(a.created_at),
        ...meta("cancelacion"),
      }));

    setNotifs(list);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, [tenantId, load]);

  const visible = notifs.filter(n => !dismissed.has(n.id));
  const count = visible.length;
  const dismiss = (id: string) => setDismissed(s => new Set([...s, id]));

  // Group visible notifs
  const grouped = GROUP_ORDER.map(g => ({
    group: g,
    label: GROUP_LABELS[g],
    items: visible.filter(n => n.group === g),
  })).filter(g => g.items.length > 0);

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        title="Notificaciones"
        style={{
          position: "relative", background: "none", border: "none", cursor: "pointer",
          color: "#8E879B", padding: "7px", borderRadius: "9px",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "color .15s, background .15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#14111C"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(20,15,30,0.05)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#8E879B"; (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.1 13.177a2.25 2.25 0 0 0-.1.661Z" />
        </svg>
        {count > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0,
            background: "#fb0f05", color: "white", borderRadius: "50%",
            minWidth: "16px", height: "16px", padding: "0 3px",
            fontSize: "9px", fontWeight: 700, lineHeight: "16px", textAlign: "center",
            fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
            animation: "znPop .3s cubic-bezier(.22,1,.36,1) both",
          }}>
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {isMounted && open && createPortal(
        <>
          <div onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 8999, background: "rgba(12,10,20,0.22)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }} />

          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: "380px", maxWidth: "96vw",
            zIndex: 9000, background: "#F7F6FB",
            borderLeft: "1px solid rgba(20,15,30,0.09)", boxShadow: "-20px 0 60px rgba(20,15,30,0.15)",
            display: "flex", flexDirection: "column",
            fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
          }}>

            {/* Header */}
            <div style={{
              padding: "22px 20px 16px",
              background: "white",
              borderBottom: "1px solid rgba(20,15,30,0.07)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#14111C", margin: "0 0 3px" }}>Notificaciones</h2>
                  <p style={{ fontSize: "12px", color: "#8E879B", margin: 0 }}>
                    {count === 0 ? "Todo en orden por ahora" : `${count} alerta${count !== 1 ? "s" : ""} activa${count !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <button onClick={() => setOpen(false)}
                  style={{ background: "rgba(20,15,30,0.04)", border: "none", cursor: "pointer", color: "#8E879B", padding: 7, borderRadius: 8, display: "flex", marginTop: -2 }}>
                  <IconX size={16} />
                </button>
              </div>

              {/* Summary chips */}
              {count > 0 && (
                <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                  {grouped.map(g => (
                    <span key={g.group} style={{
                      fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                      background: g.items[0].group === "urgent" ? "rgba(220,38,38,0.1)" : g.items[0].group === "action" ? "rgba(217,119,6,0.1)" : "rgba(37,99,235,0.1)",
                      color: g.items[0].group === "urgent" ? "#dc2626" : g.items[0].group === "action" ? "#d97706" : "#2563eb",
                      letterSpacing: "0.04em",
                    }}>
                      {g.label} · {g.items.length}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {count === 0 ? (
                <div style={{ padding: "56px 24px", textAlign: "center" }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(20,15,30,0.04)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c0bdb9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.1 13.177a2.25 2.25 0 0 0-.1.661Z" />
                    </svg>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#14111C", marginBottom: 6 }}>Sin alertas pendientes</div>
                  <div style={{ fontSize: "12px", color: "#8E879B", lineHeight: 1.55 }}>
                    Aquí verás inasistencias, citas sin confirmar,<br />sin colaborador y nueva actividad.
                  </div>
                </div>
              ) : (
                grouped.map((g, gi) => (
                  <div key={g.group} style={{ marginBottom: gi < grouped.length - 1 ? 18 : 0 }}>
                    {/* Group header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {g.label}
                      </span>
                      <div style={{ flex: 1, height: 1, background: "rgba(20,15,30,0.07)" }} />
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#8E879B" }}>{g.items.length}</span>
                    </div>

                    {/* Cards */}
                    {g.items.map((n, i) => (
                      <div key={n.id} style={{ animation: `znFadeUp .18s ${(gi * 4 + i) * 0.04}s cubic-bezier(.22,1,.36,1) both` }}>
                        <NotifCard n={n} onDismiss={() => dismiss(n.id)} />
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {count > 0 && (
              <div style={{ padding: "10px 12px 14px", background: "white", borderTop: "1px solid rgba(20,15,30,0.06)", flexShrink: 0 }}>
                <button
                  onClick={() => { setDismissed(new Set(notifs.map(n => n.id))); setOpen(false); }}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid rgba(20,15,30,0.09)", background: "rgba(20,15,30,0.03)", color: "#564E66", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "background .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(20,15,30,0.07)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(20,15,30,0.03)")}>
                  Marcar todas como vistas
                </button>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
