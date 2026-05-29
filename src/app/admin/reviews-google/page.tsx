"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GoogleSettings {
  google_maps_url: string;
  message_template: string;
}

interface ReviewRequest {
  id: string;
  client_name: string;
  client_phone: string | null;
  sent_via: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

// ── Default template ──────────────────────────────────────────────────────────

const DEFAULT_TEMPLATE =
  `Hola {{nombre}} 👋\n\nGracias por visitarnos. Tu opinión nos ayuda a mejorar y a que más personas nos encuentren.\n\n⭐ ¿Nos dejas una reseña en Google? Solo toma 1 minuto:\n{{link}}\n\n¡Gracias de corazón!`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

function buildMessage(template: string, name: string, url: string) {
  return template.replace(/{{nombre}}/g, name).replace(/{{link}}/g, url);
}

function StarDisplay({ n }: { n: number }) {
  return (
    <span style={{ color: "#f59e0b", fontSize: 16 }}>
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ReviewsGooglePage() {
  const { tenantId } = useAdmin();
  const [tab, setTab] = useState<"config" | "solicitar" | "historial">("config");

  // Settings
  const [settings, setSettings] = useState<GoogleSettings>({ google_maps_url: "", message_template: DEFAULT_TEMPLATE });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Request tab
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [msgCopied, setMsgCopied] = useState(false);
  const [logging, setLogging] = useState(false);
  const [logMsg, setLogMsg] = useState<string | null>(null);

  // History
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load settings
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("google_review_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (data) {
        setSettings({
          google_maps_url: data.google_maps_url ?? "",
          message_template: data.message_template ?? DEFAULT_TEMPLATE,
        });
      }
    }
    load();
  }, [tenantId]);

  // Load clients for search
  useEffect(() => {
    if (tab !== "solicitar") return;
    async function loadClients() {
      const { data } = await supabase
        .from("clients")
        .select("id, name, phone, email")
        .eq("tenant_id", tenantId)
        .order("name");
      setClients((data as Client[]) ?? []);
    }
    loadClients();
  }, [tab, tenantId]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("review_requests")
      .select("id, client_name, client_phone, sent_via, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(100);
    setRequests((data as ReviewRequest[]) ?? []);
    setLoadingHistory(false);
  }, [tenantId]);

  useEffect(() => {
    if (tab === "historial") loadHistory();
  }, [tab, loadHistory]);

  // Save settings
  async function saveSettings() {
    setSavingSettings(true);
    setSettingsMsg(null);
    const { error } = await supabase.from("google_review_settings").upsert({
      tenant_id: tenantId,
      ...settings,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id" });
    setSavingSettings(false);
    setSettingsMsg(error
      ? { type: "err", text: error.message }
      : { type: "ok", text: "Configuración guardada." }
    );
  }

  // Copy Google link
  async function copyLink() {
    await navigator.clipboard.writeText(settings.google_maps_url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  // Copy WhatsApp message
  async function copyMessage() {
    if (!selectedClient) return;
    const msg = buildMessage(settings.message_template, selectedClient.name, settings.google_maps_url);
    await navigator.clipboard.writeText(msg);
    setMsgCopied(true);
    setTimeout(() => setMsgCopied(false), 2000);
  }

  // Open WhatsApp
  function openWhatsApp() {
    if (!selectedClient?.phone) return;
    const msg = buildMessage(settings.message_template, selectedClient.name, settings.google_maps_url);
    const phone = selectedClient.phone.replace(/\D/g, "");
    const full = phone.startsWith("57") ? phone : `57${phone}`;
    window.open(`https://wa.me/${full}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  // Log request
  async function logRequest(via: string) {
    if (!selectedClient) return;
    setLogging(true);
    setLogMsg(null);
    const { error } = await supabase.from("review_requests").insert({
      tenant_id: tenantId,
      client_id: selectedClient.id,
      client_name: selectedClient.name,
      client_phone: selectedClient.phone,
      sent_via: via,
    });
    setLogging(false);
    if (error) setLogMsg("Error al registrar.");
    else { setLogMsg("Solicitud registrada."); setSelectedClient(null); setClientSearch(""); }
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.phone ?? "").includes(clientSearch)
  ).slice(0, 8);

  const composedMsg = selectedClient
    ? buildMessage(settings.message_template, selectedClient.name, settings.google_maps_url)
    : "";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "0 0 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Reseñas Google Maps</h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
          Solicita reseñas a tus clientes y mejora tu posicionamiento local
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f0f0f5", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {(["config", "solicitar", "historial"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: tab === t ? "white" : "transparent",
            color: tab === t ? "#1a1a2e" : "#6b7280",
            boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            transition: "all .2s",
          }}>
            {t === "config" ? "Configuración" : t === "solicitar" ? "Solicitar reseña" : "Historial"}
          </button>
        ))}
      </div>

      {/* ── Tab: Configuración ─────────────────────────────────────────────── */}
      {tab === "config" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 680 }}>

          {/* How to get the URL */}
          <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e", marginBottom: 6 }}>
              ¿Cómo obtener el link de reseñas?
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, color: "#78350f", fontSize: 13, lineHeight: 1.7 }}>
              <li>Ve a <strong>Google Business Profile</strong> (business.google.com)</li>
              <li>Selecciona tu negocio → <strong>Obtener más reseñas</strong></li>
              <li>Copia el link corto que aparece</li>
              <li>Pégalo aquí abajo</li>
            </ol>
          </div>

          <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid #e8e6e2" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Link de Google Reviews</h3>
            <label style={labelStyle}>URL directa para dejar reseñas</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={settings.google_maps_url}
                onChange={e => setSettings(s => ({ ...s, google_maps_url: e.target.value }))}
                placeholder="https://g.page/r/..."
                style={{ ...inputStyle, flex: 1 }} />
              <button onClick={copyLink} disabled={!settings.google_maps_url} style={btnSecondary}>
                {linkCopied ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
          </div>

          <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid #e8e6e2" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Mensaje de WhatsApp</h3>
            <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 14px" }}>
              Usa <code style={{ background: "#f0f0f5", padding: "1px 5px", borderRadius: 4 }}>{"{{nombre}}"}</code> y <code style={{ background: "#f0f0f5", padding: "1px 5px", borderRadius: 4 }}>{"{{link}}"}</code> como variables
            </p>
            <textarea value={settings.message_template}
              onChange={e => setSettings(s => ({ ...s, message_template: e.target.value }))}
              style={{ ...inputStyle, minHeight: 140, resize: "vertical", fontFamily: "inherit" }} />
            <button onClick={() => setSettings(s => ({ ...s, message_template: DEFAULT_TEMPLATE }))}
              style={{ background: "none", border: "none", color: "#9b9bb0", fontSize: 12, cursor: "pointer", marginTop: 4 }}>
              Restaurar mensaje por defecto
            </button>
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

      {/* ── Tab: Solicitar reseña ──────────────────────────────────────────── */}
      {tab === "solicitar" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 820 }}>

          {/* Client search */}
          <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid #e8e6e2" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Seleccionar cliente</h3>
            <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              style={{ ...inputStyle, marginBottom: 10 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredClients.length === 0 && clientSearch && (
                <div style={{ color: "#9b9bb0", fontSize: 13, textAlign: "center", padding: 16 }}>Sin resultados</div>
              )}
              {filteredClients.map(c => (
                <button key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(c.name); setLogMsg(null); }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start",
                    padding: "10px 14px", borderRadius: 10, border: "2px solid",
                    borderColor: selectedClient?.id === c.id ? "#fb0f05" : "rgba(20,15,30,0.08)",
                    background: selectedClient?.id === c.id ? "#fff5f5" : "white",
                    cursor: "pointer", textAlign: "left", width: "100%",
                  }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e" }}>{c.name}</span>
                  {c.phone && <span style={{ fontSize: 12, color: "#9b9bb0" }}>{c.phone}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Message preview + actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid #e8e6e2", flex: 1 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Vista previa del mensaje</h3>
              {!selectedClient ? (
                <div style={{ color: "#9b9bb0", fontSize: 13, textAlign: "center", padding: 30 }}>
                  Selecciona un cliente para ver el mensaje
                </div>
              ) : (
                <>
                  <div style={{ background: "#f0fdf4", borderRadius: 10, padding: 14, fontSize: 13, color: "#1a1a2e", lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 14, maxHeight: 200, overflow: "auto" }}>
                    {composedMsg || "(Configura el mensaje y el link de Google primero)"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button onClick={() => { copyMessage(); logRequest("manual"); }} disabled={logging || !settings.google_maps_url}
                      style={{ ...btnSecondary, justifyContent: "center" }}>
                      {msgCopied ? "✓ Copiado" : "Copiar mensaje"}
                    </button>
                    {selectedClient.phone && (
                      <button onClick={() => { openWhatsApp(); logRequest("whatsapp"); }}
                        disabled={!settings.google_maps_url}
                        style={{ ...btnPrimary, justifyContent: "center", background: "#25D366" }}>
                        Abrir WhatsApp
                      </button>
                    )}
                    {logMsg && (
                      <div style={{ textAlign: "center", fontSize: 13, color: "#388e3c", fontWeight: 600 }}>{logMsg}</div>
                    )}
                  </div>
                </>
              )}
            </div>

            {!settings.google_maps_url && (
              <div style={{ background: "#fce4ec", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#c62828" }}>
                Primero configura el link de Google en la pestaña <strong>Configuración</strong>.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Historial ─────────────────────────────────────────────────── */}
      {tab === "historial" && (
        <div style={{ maxWidth: 680 }}>
          {loadingHistory ? (
            <div style={{ textAlign: "center", padding: 60, color: "#9b9bb0" }}>Cargando...</div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#9b9bb0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
              <div style={{ fontWeight: 600, color: "#6b7280" }}>Sin solicitudes aún</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Las solicitudes enviadas aparecerán aquí</div>
            </div>
          ) : (
            <>
              <div style={{ background: "white", borderRadius: 12, padding: "10px 20px", border: "1px solid #e8e6e2", marginBottom: 14, display: "flex", gap: 4 }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>Total solicitadas:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{requests.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {requests.map(r => (
                  <div key={r.id} style={{ background: "white", borderRadius: 12, padding: "14px 20px", border: "1px solid #e8e6e2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e" }}>{r.client_name}</div>
                      <div style={{ fontSize: 12, color: "#9b9bb0" }}>{r.client_phone ?? "—"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{fmtDate(r.created_at)}</div>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                        background: r.sent_via === "whatsapp" ? "#e8f5e9" : "#f0f0f5",
                        color: r.sent_via === "whatsapp" ? "#388e3c" : "#6b7280",
                      }}>
                        {r.sent_via === "whatsapp" ? "WhatsApp" : "Manual"}
                      </span>
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

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280",
  marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e8e6e2",
  fontSize: 14, color: "#1a1a2e", background: "white", boxSizing: "border-box",
  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
};
const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "9px 20px", borderRadius: 10, border: "none",
  background: "#fb0f05", color: "white", fontWeight: 700, fontSize: 14,
  cursor: "pointer", textDecoration: "none",
};
const btnSecondary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "9px 20px", borderRadius: 10, border: "1px solid #e8e6e2",
  background: "white", color: "#4a4a6a", fontWeight: 600, fontSize: 14,
  cursor: "pointer", textDecoration: "none",
};
