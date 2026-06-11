"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { IconX } from "./ZyncraIcons";

interface Notif {
  id: string;
  title: string;
  body: string;
  tag: string;
  color: string;
  bg: string;
}

function relTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 2) return "Ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
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

    // A — Inasistencias hoy: hora ya pasó y siguen sin atender
    (upcoming ?? [])
      .filter(a => a.appointment_date === today && a.appointment_time.slice(0, 5) < nowHHMM)
      .forEach(a => list.push({
        id: `A_${a.id}`,
        title: "Sin presentarse",
        body: `${(a.clients as any)?.name || "Cliente"} · ${(a.services as any)?.name || "Servicio"} · ${a.appointment_time.slice(0, 5)}`,
        tag: "Hoy",
        color: "#dc2626", bg: "rgba(220,38,38,0.07)",
      }));

    // B — Sin confirmar mañana
    (upcoming ?? [])
      .filter(a => a.appointment_date === tomorrow && a.status === "pending")
      .forEach(a => list.push({
        id: `B_${a.id}`,
        title: "Sin confirmar para mañana",
        body: `${(a.clients as any)?.name || "Cliente"} · ${(a.services as any)?.name || "Servicio"} · ${a.appointment_time.slice(0, 5)}`,
        tag: "Mañana",
        color: "#d97706", bg: "rgba(217,119,6,0.07)",
      }));

    // C — Sin profesional (próximos 7 días)
    (upcoming ?? [])
      .filter(a => !a.professional_id)
      .slice(0, 5)
      .forEach(a => {
        const day = a.appointment_date === today ? "Hoy" : a.appointment_date === tomorrow ? "Mañana" : a.appointment_date;
        list.push({
          id: `C_${a.id}`,
          title: "Sin colaborador asignado",
          body: `${(a.clients as any)?.name || "Cliente"} · ${day} ${a.appointment_time.slice(0, 5)}`,
          tag: day,
          color: "#ea580c", bg: "rgba(234,88,12,0.07)",
        });
      });

    // D — Nuevas citas agendadas en las últimas 8h
    (recent ?? [])
      .filter(a => a.status !== "cancelled")
      .slice(0, 4)
      .forEach(a => list.push({
        id: `D_${a.id}`,
        title: "Nueva cita agendada",
        body: `${(a.clients as any)?.name || "Cliente"} · ${(a.services as any)?.name || "Servicio"} · ${a.appointment_date} ${a.appointment_time.slice(0, 5)}`,
        tag: relTime(a.created_at),
        color: "#2563eb", bg: "rgba(37,99,235,0.07)",
      }));

    // Cancelaciones recientes (por created_at de la última actualización si existe)
    (recent ?? [])
      .filter(a => a.status === "cancelled")
      .slice(0, 3)
      .forEach(a => list.push({
        id: `Dcancel_${a.id}`,
        title: "Cita cancelada",
        body: `${(a.clients as any)?.name || "Cliente"} · ${(a.services as any)?.name || "Servicio"}`,
        tag: relTime(a.created_at),
        color: "#8E879B", bg: "rgba(142,135,155,0.07)",
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
        {/* Heroicons: InboxIcon outline 24px */}
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
          {/* Backdrop */}
          <div onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 8999, background: "rgba(12,10,20,0.18)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }} />

          {/* Drawer */}
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: "360px", maxWidth: "94vw",
            zIndex: 9000, background: "rgba(252,251,254,0.98)",
            backdropFilter: "blur(28px) saturate(1.6)", WebkitBackdropFilter: "blur(28px) saturate(1.6)",
            borderLeft: "1px solid rgba(20,15,30,0.09)", boxShadow: "-16px 0 48px rgba(20,15,30,0.14)",
            display: "flex", flexDirection: "column",
            fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
          }}>
            {/* Header del panel */}
            <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid rgba(20,15,30,0.07)", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#14111C", margin: 0 }}>Notificaciones</h2>
                <p style={{ fontSize: "12px", color: "#8E879B", margin: "2px 0 0" }}>
                  {count === 0 ? "Todo en orden" : `${count} alerta${count !== 1 ? "s" : ""} activa${count !== 1 ? "s" : ""}`}
                </p>
              </div>
              <button onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B", padding: 4, borderRadius: 6, display: "flex" }}>
                <IconX size={18} />
              </button>
            </div>

            {/* Lista */}
            <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
              {count === 0 ? (
                <div style={{ padding: "52px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: "36px", marginBottom: 10, opacity: .3 }}>📭</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#14111C", marginBottom: 4 }}>Sin alertas pendientes</div>
                  <div style={{ fontSize: "12px", color: "#8E879B" }}>Recibirás alertas sobre citas, inasistencias y más.</div>
                </div>
              ) : (
                visible.map((n, i) => (
                  <div key={n.id} style={{
                    padding: "11px 13px", borderRadius: "11px", marginBottom: "6px",
                    background: n.bg, border: `1px solid ${n.color}28`,
                    animation: `znFadeUp .18s ${i * 0.04}s cubic-bezier(.22,1,.36,1) both`,
                    position: "relative",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: n.color }}>{n.title}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: "10px", color: "#8E879B", fontWeight: 600 }}>{n.tag}</span>
                        <button
                          onClick={() => setDismissed(s => new Set([...s, n.id]))}
                          title="Descartar"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B", padding: 0, lineHeight: 1, fontSize: 13 }}>
                          ×
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#564E66", marginTop: "3px", lineHeight: 1.45 }}>{n.body}</div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {count > 0 && (
              <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(20,15,30,0.06)", flexShrink: 0 }}>
                <button
                  onClick={() => { setDismissed(new Set(notifs.map(n => n.id))); setOpen(false); }}
                  style={{ width: "100%", padding: "9px", borderRadius: "9px", border: "1px solid rgba(20,15,30,0.09)", background: "rgba(20,15,30,0.03)", color: "#564E66", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
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
