"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";

// ── Types ─────────────────────────────────────────────────────────────────────

interface InvoiceSettings {
  environment: "sandbox" | "production";
  factus_client_id: string;
  factus_client_secret: string;
  factus_username: string;
  factus_password: string;
  numbering_range_id: number | "";
  nit: string;
  dv: string;
  company_name: string;
  address: string;
  municipality_id: number | "";
  phone: string;
}

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  tax_rate: string;
  is_excluded: number;
}

interface CustomerForm {
  id_type: number;
  id_number: string;
  name: string;
  surname: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  municipality_id: number | "";
}

interface Invoice {
  id: string;
  number: string;
  cufe: string;
  status: string;
  customer_name: string;
  customer_id: string;
  payment_method: string;
  subtotal: number;
  tax_total: number;
  total: number;
  pdf_url: string | null;
  notes: string | null;
  created_at: string;
  invoice_items?: { name: string; quantity: number; price: number; tax_rate: string; total: number }[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MUNICIPALITIES = [
  { id: 149,   label: "Bogotá D.C." },
  { id: 76001, label: "Cali" },
  { id: 5001,  label: "Medellín" },
  { id: 8001,  label: "Barranquilla" },
  { id: 13001, label: "Cartagena" },
  { id: 54001, label: "Cúcuta" },
  { id: 68001, label: "Bucaramanga" },
  { id: 17001, label: "Manizales" },
  { id: 41001, label: "Neiva" },
  { id: 73001, label: "Ibagué" },
  { id: 63001, label: "Armenia" },
  { id: 66001, label: "Pereira" },
  { id: 52001, label: "Pasto" },
  { id: 23001, label: "Montería" },
  { id: 15001, label: "Tunja" },
  { id: 19001, label: "Popayán" },
  { id: 27001, label: "Quibdó" },
  { id: 70001, label: "Sincelejo" },
  { id: 50001, label: "Villavicencio" },
  { id: 91001, label: "Leticia" },
];

const ID_TYPES = [
  { id: 13, label: "Cédula de Ciudadanía" },
  { id: 31, label: "NIT" },
  { id: 22, label: "Cédula de Extranjería" },
  { id: 41, label: "Pasaporte" },
  { id: 12, label: "Tarjeta de Identidad" },
];

const PAYMENT_METHODS = [
  { code: "10", label: "Efectivo" },
  { code: "49", label: "Tarjeta débito/crédito" },
  { code: "47", label: "Transferencia bancaria" },
  { code: "42", label: "Débito bancario (PSE/Nequi)" },
];

const TAX_OPTIONS = [
  { value: "0.00", label: "0% — Excluido de IVA", is_excluded: 1 },
  { value: "19.00", label: "19% — IVA general", is_excluded: 0 },
  { value: "5.00", label: "5% — IVA reducido", is_excluded: 0 },
];

const EMPTY_SETTINGS: InvoiceSettings = {
  environment: "sandbox",
  factus_client_id: "",
  factus_client_secret: "",
  factus_username: "",
  factus_password: "",
  numbering_range_id: "",
  nit: "",
  dv: "",
  company_name: "",
  address: "",
  municipality_id: "",
  phone: "",
};

const EMPTY_CUSTOMER: CustomerForm = {
  id_type: 13,
  id_number: "",
  name: "",
  surname: "",
  company: "",
  email: "",
  phone: "",
  address: "",
  municipality_id: 149,
};

// ── Helpers ───────────────────────────────────────────────────────────────────


function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    sent:     { label: "Enviada",   bg: "#e8f5e9", color: "#388e3c" },
    accepted: { label: "Aceptada",  bg: "#e3f2fd", color: "#1565c0" },
    rejected: { label: "Rechazada", bg: "#fce4ec", color: "#c62828" },
    draft:    { label: "Borrador",  bg: "#f5f5f5", color: "#757575" },
  };
  const s = map[status] ?? map.draft;
  return (
    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const { tenantId, currency, locale } = useAdmin();
  const fmt     = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  const [tab, setTab] = useState<"config" | "nueva" | "historial">("config");

  // Settings
  const [settings, setSettings] = useState<InvoiceSettings>(EMPTY_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [testingConn, setTestingConn] = useState(false);

  // Invoice form
  const [customer, setCustomer] = useState<CustomerForm>(EMPTY_CUSTOMER);
  const [items, setItems] = useState<InvoiceItem[]>([{ name: "", quantity: 1, price: 0, tax_rate: "0.00", is_excluded: 1 }]);
  const [paymentMethod, setPaymentMethod] = useState("10");
  const [notes, setNotes] = useState("");
  const [emitting, setEmitting] = useState(false);
  const [successModal, setSuccessModal] = useState<{ cufe: string; number: string; pdf_url?: string } | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // History
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase
        .from("invoice_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (data) {
        setSettings({
          environment: data.environment ?? "sandbox",
          factus_client_id: data.factus_client_id ?? "",
          factus_client_secret: data.factus_client_secret ?? "",
          factus_username: data.factus_username ?? "",
          factus_password: data.factus_password ?? "",
          numbering_range_id: data.numbering_range_id ?? "",
          nit: data.nit ?? "",
          dv: data.dv ?? "",
          company_name: data.company_name ?? "",
          address: data.address ?? "",
          municipality_id: data.municipality_id ?? "",
          phone: data.phone ?? "",
        });
      }
    }
    loadSettings();
  }, [tenantId]);

  const loadInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    const { data } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(100);
    setInvoices((data as Invoice[]) ?? []);
    setLoadingInvoices(false);
  }, [tenantId]);

  useEffect(() => {
    if (tab === "historial") loadInvoices();
  }, [tab, loadInvoices]);

  // ── Save settings ──────────────────────────────────────────────────────────
  async function saveSettings() {
    setSavingSettings(true);
    setSettingsMsg(null);
    const { error } = await supabase.from("invoice_settings").upsert({
      tenant_id: tenantId,
      ...settings,
      numbering_range_id: settings.numbering_range_id || null,
      municipality_id: settings.municipality_id || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id" });
    setSavingSettings(false);
    if (error) setSettingsMsg({ type: "err", text: error.message });
    else setSettingsMsg({ type: "ok", text: "Configuración guardada correctamente." });
  }

  // ── Test connection ────────────────────────────────────────────────────────
  async function testConnection() {
    setTestingConn(true);
    setSettingsMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/factus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", supabaseToken: session?.access_token, tenantId }),
      });
      const json = await res.json();
      if (res.ok) setSettingsMsg({ type: "ok", text: "Conexión con Factus exitosa." });
      else setSettingsMsg({ type: "err", text: json.error ?? "Error al conectar." });
    } catch {
      setSettingsMsg({ type: "err", text: "Error de red." });
    }
    setTestingConn(false);
  }

  // ── Items helpers ──────────────────────────────────────────────────────────
  function addItem() {
    setItems(prev => [...prev, { name: "", quantity: 1, price: 0, tax_rate: "0.00", is_excluded: 1 }]);
  }
  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  }
  function updateItem(i: number, field: keyof InvoiceItem, value: string | number) {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      if (field === "tax_rate") {
        const opt = TAX_OPTIONS.find(o => o.value === value);
        return { ...item, tax_rate: String(value), is_excluded: opt?.is_excluded ?? 1 };
      }
      return { ...item, [field]: value };
    }));
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const taxTotal = items.reduce((s, i) => {
    const rate = parseFloat(i.tax_rate) || 0;
    return s + (i.price * i.quantity * rate) / 100;
  }, 0);
  const total = subtotal + taxTotal;

  // ── Emit invoice ───────────────────────────────────────────────────────────
  async function emitInvoice() {
    setInvoiceError(null);
    if (!customer.id_number || !customer.name) {
      setInvoiceError("Completa el número y nombre del cliente."); return;
    }
    if (items.some(i => !i.name || i.price <= 0)) {
      setInvoiceError("Todos los ítems necesitan nombre y precio mayor a 0."); return;
    }
    setEmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/factus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          supabaseToken: session?.access_token,
          tenantId,
          invoiceData: { customer, items, paymentMethod, notes },
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setSuccessModal({ cufe: json.cufe, number: json.number, pdf_url: json.pdf_url });
        setCustomer(EMPTY_CUSTOMER);
        setItems([{ name: "", quantity: 1, price: 0, tax_rate: "0.00", is_excluded: 1 }]);
        setNotes("");
      } else {
        setInvoiceError(json.error ?? "Error al emitir la factura.");
      }
    } catch {
      setInvoiceError("Error de red al conectar con Factus.");
    }
    setEmitting(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#14111C", margin: 0 }}>Factura Electrónica DIAN</h1>
        <p style={{ color: "#564E66", fontSize: 14, margin: "4px 0 0" }}>
          Emite facturas electrónicas validadas por la DIAN vía Factus
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f0f0f5", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {(["config", "nueva", "historial"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: tab === t ? "#14111C" : "transparent",
            color: tab === t ? "#fff" : "#564E66",
            boxShadow: tab === t ? "0 2px 8px rgba(20,15,30,0.18)" : "none",
            transition: "all .2s",
          }}>
            {t === "config" ? "Configuración" : t === "nueva" ? "Nueva Factura" : "Historial"}
          </button>
        ))}
      </div>

      {/* ── Tab: Configuración ─────────────────────────────────────────────── */}
      {tab === "config" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 860 }}>

          {/* Factus credentials */}
          <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid rgba(20,15,30,0.08)", gridColumn: "1 / -1" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#14111C" }}>
              Credenciales Factus
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Ambiente</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {(["sandbox", "production"] as const).map(env => (
                    <button key={env} onClick={() => setSettings(s => ({ ...s, environment: env }))}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 8, border: "2px solid",
                        borderColor: settings.environment === env ? "#fb0f05" : "rgba(20,15,30,0.08)",
                        background: settings.environment === env ? "#fff5f5" : "white",
                        color: settings.environment === env ? "#fb0f05" : "#564E66",
                        fontWeight: 600, fontSize: 13, cursor: "pointer",
                      }}>
                      {env === "sandbox" ? "Sandbox (Pruebas)" : "Producción"}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Client ID" value={settings.factus_client_id} onChange={v => setSettings(s => ({ ...s, factus_client_id: v }))} />
              <Field label="Client Secret" value={settings.factus_client_secret} onChange={v => setSettings(s => ({ ...s, factus_client_secret: v }))} type="password" />
              <Field label="Usuario (email Factus)" value={settings.factus_username} onChange={v => setSettings(s => ({ ...s, factus_username: v }))} />
              <Field label="Contraseña Factus" value={settings.factus_password} onChange={v => setSettings(s => ({ ...s, factus_password: v }))} type="password" />
              <Field label="ID de Rango de Numeración DIAN" value={String(settings.numbering_range_id)} onChange={v => setSettings(s => ({ ...s, numbering_range_id: v ? Number(v) : "" }))} type="number" />
            </div>
          </div>

          {/* Emisor data */}
          <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid rgba(20,15,30,0.08)", gridColumn: "1 / -1" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#14111C" }}>
              Datos del Emisor
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="NIT" value={settings.nit} onChange={v => setSettings(s => ({ ...s, nit: v }))} />
              <Field label="Dígito de verificación (DV)" value={settings.dv} onChange={v => setSettings(s => ({ ...s, dv: v }))} />
              <Field label="Razón Social" value={settings.company_name} onChange={v => setSettings(s => ({ ...s, company_name: v }))} />
              <Field label="Teléfono" value={settings.phone} onChange={v => setSettings(s => ({ ...s, phone: v }))} />
              <Field label="Dirección" value={settings.address} onChange={v => setSettings(s => ({ ...s, address: v }))} />
              <div>
                <label style={labelStyle}>Municipio</label>
                <select value={settings.municipality_id} onChange={e => setSettings(s => ({ ...s, municipality_id: e.target.value ? Number(e.target.value) : "" }))}
                  style={inputStyle}>
                  <option value="">Seleccionar...</option>
                  {MUNICIPALITIES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={saveSettings} disabled={savingSettings} style={btnPrimary}>
              {savingSettings ? "Guardando..." : "Guardar configuración"}
            </button>
            <button onClick={testConnection} disabled={testingConn} style={btnSecondary}>
              {testingConn ? "Probando..." : "Probar conexión"}
            </button>
            {settingsMsg && (
              <span style={{ fontSize: 13, color: settingsMsg.type === "ok" ? "#388e3c" : "#c62828", fontWeight: 600 }}>
                {settingsMsg.type === "ok" ? "✓ " : "✕ "}{settingsMsg.text}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Nueva Factura ─────────────────────────────────────────────── */}
      {tab === "nueva" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, maxWidth: 1000 }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Customer */}
            <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid rgba(20,15,30,0.08)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#14111C" }}>Datos del Cliente</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Tipo de documento</label>
                  <select value={customer.id_type} onChange={e => setCustomer(c => ({ ...c, id_type: Number(e.target.value) }))}
                    style={inputStyle}>
                    {ID_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <Field label="Número de documento" value={customer.id_number}
                  onChange={v => setCustomer(c => ({ ...c, id_number: v }))} />
                <Field label="Nombres" value={customer.name}
                  onChange={v => setCustomer(c => ({ ...c, name: v }))} />
                <Field label="Apellidos" value={customer.surname}
                  onChange={v => setCustomer(c => ({ ...c, surname: v }))} />
                <Field label="Empresa / Razón social" value={customer.company}
                  onChange={v => setCustomer(c => ({ ...c, company: v }))} />
                <Field label="Email" value={customer.email} type="email"
                  onChange={v => setCustomer(c => ({ ...c, email: v }))} />
                <Field label="Teléfono" value={customer.phone}
                  onChange={v => setCustomer(c => ({ ...c, phone: v }))} />
                <Field label="Dirección" value={customer.address}
                  onChange={v => setCustomer(c => ({ ...c, address: v }))} />
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Municipio</label>
                  <select value={customer.municipality_id} onChange={e => setCustomer(c => ({ ...c, municipality_id: Number(e.target.value) }))}
                    style={inputStyle}>
                    {MUNICIPALITIES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Items */}
            <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid rgba(20,15,30,0.08)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#14111C" }}>Ítems / Servicios</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 110px 130px 28px", gap: 8, alignItems: "end" }}>
                    <div>
                      {i === 0 && <label style={labelStyle}>Descripción</label>}
                      <input value={item.name} onChange={e => updateItem(i, "name", e.target.value)}
                        placeholder="Nombre del ítem" style={inputStyle} />
                    </div>
                    <div>
                      {i === 0 && <label style={labelStyle}>Cant.</label>}
                      <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, "quantity", Number(e.target.value))}
                        style={inputStyle} />
                    </div>
                    <div>
                      {i === 0 && <label style={labelStyle}>Precio unit.</label>}
                      <input type="number" min="0" value={item.price} onChange={e => updateItem(i, "price", Number(e.target.value))}
                        style={inputStyle} />
                    </div>
                    <div>
                      {i === 0 && <label style={labelStyle}>IVA</label>}
                      <select value={item.tax_rate} onChange={e => updateItem(i, "tax_rate", e.target.value)}
                        style={{ ...inputStyle, fontSize: 12 }}>
                        {TAX_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <button onClick={() => removeItem(i)} disabled={items.length === 1}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", fontSize: 18, padding: "0 2px", opacity: items.length === 1 ? 0.3 : 1, lineHeight: 1, marginTop: i === 0 ? 20 : 0 }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addItem} style={{ ...btnSecondary, marginTop: 14, fontSize: 13 }}>
                + Agregar ítem
              </button>
            </div>

            {/* Notes */}
            <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid rgba(20,15,30,0.08)" }}>
              <label style={labelStyle}>Notas / Observaciones</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Observaciones para la factura (opcional)"
                style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} />
            </div>
          </div>

          {/* Right column — summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid rgba(20,15,30,0.08)", position: "sticky", top: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#14111C" }}>Resumen</h3>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Método de pago</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={inputStyle}>
                  {PAYMENT_METHODS.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 0", borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0", marginBottom: 16 }}>
                <Row label="Subtotal" value={fmt(subtotal)} />
                <Row label={`IVA`} value={fmt(taxTotal)} />
                <Row label="Total" value={fmt(total)} bold />
              </div>

              {invoiceError && (
                <div style={{ background: "#fce4ec", color: "#c62828", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 12, fontWeight: 500 }}>
                  {invoiceError}
                </div>
              )}

              <button onClick={emitInvoice} disabled={emitting} style={{ ...btnPrimary, width: "100%", justifyContent: "center" }}>
                {emitting ? "Emitiendo..." : "Emitir Factura"}
              </button>
              <p style={{ color: "#9b9bb0", fontSize: 11, margin: "8px 0 0", textAlign: "center" }}>
                Se enviará a la DIAN vía Factus
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Historial ─────────────────────────────────────────────────── */}
      {tab === "historial" && (
        <div style={{ maxWidth: 900 }}>
          {loadingInvoices ? (
            <div style={{ textAlign: "center", padding: 60, color: "#9b9bb0" }}>Cargando facturas...</div>
          ) : invoices.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#9b9bb0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
              <div style={{ fontWeight: 600, color: "#564E66" }}>Sin facturas aún</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Las facturas emitidas aparecerán aquí</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {invoices.map(inv => (
                <div key={inv.id} style={{ background: "white", borderRadius: 14, border: "1px solid rgba(20,15,30,0.08)", overflow: "hidden" }}>
                  <div onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                    style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: "90px 1fr auto auto auto", gap: 12, alignItems: "center", cursor: "pointer" }}>
                    <div style={{ fontWeight: 700, color: "#fb0f05", fontSize: 14 }}>#{inv.number || "—"}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#14111C" }}>{inv.customer_name}</div>
                      <div style={{ fontSize: 12, color: "#9b9bb0" }}>{fmtDate(inv.created_at)}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#14111C" }}>{fmt(inv.total)}</div>
                    <StatusBadge status={inv.status} />
                    <span style={{ color: "#9b9bb0", fontSize: 14 }}>{expandedId === inv.id ? "▲" : "▼"}</span>
                  </div>
                  {expandedId === inv.id && (
                    <div style={{ borderTop: "1px solid #f0f0f0", padding: "16px 20px", background: "#fafafa" }}>
                      {inv.cufe && (
                        <div style={{ marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#564E66" }}>CUFE: </span>
                          <span style={{ fontSize: 11, color: "#14111C", wordBreak: "break-all", fontFamily: "monospace" }}>{inv.cufe}</span>
                        </div>
                      )}
                      {inv.invoice_items && inv.invoice_items.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#564E66", marginBottom: 6 }}>Ítems:</div>
                          {inv.invoice_items.map((it, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#4a4a6a", padding: "2px 0" }}>
                              <span>{it.name} × {it.quantity}</span>
                              <span>{fmt(it.total)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {inv.pdf_url && (
                          <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" style={btnPrimary}>
                            Descargar PDF
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Success Modal ──────────────────────────────────────────────────── */}
      {successModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(12,12,20,0.45)", backdropFilter: "blur(16px) saturate(1.4)", WebkitBackdropFilter: "blur(16px) saturate(1.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 32, maxWidth: 480, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#14111C", margin: "0 0 8px" }}>¡Factura emitida!</h2>
            <p style={{ color: "#564E66", fontSize: 14, margin: "0 0 16px" }}>La factura fue enviada exitosamente a la DIAN.</p>
            {successModal.number && (
              <div style={{ background: "#f0f9ff", borderRadius: 10, padding: "10px 16px", marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#564E66" }}>Número de factura</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1565c0" }}>#{successModal.number}</div>
              </div>
            )}
            {successModal.cufe && (
              <div style={{ background: "#f5f5f5", borderRadius: 10, padding: "10px 16px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "#564E66", marginBottom: 4 }}>CUFE</div>
                <div style={{ fontSize: 11, color: "#14111C", wordBreak: "break-all", fontFamily: "monospace" }}>{successModal.cufe}</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {successModal.pdf_url && (
                <a href={successModal.pdf_url} target="_blank" rel="noopener noreferrer" style={btnPrimary}>
                  Descargar PDF
                </a>
              )}
              <button onClick={() => { setSuccessModal(null); setTab("historial"); loadInvoices(); }}
                style={btnSecondary}>
                Ver historial
              </button>
              <button onClick={() => setSuccessModal(null)} style={btnSecondary}>
                Nueva factura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 400, color: bold ? "#14111C" : "#564E66" }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#564E66", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(20,15,30,0.08)",
  fontSize: 14, color: "#14111C", background: "white", boxSizing: "border-box", outline: "none",
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
  padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(20,15,30,0.08)",
  background: "white", color: "#4a4a6a", fontWeight: 600, fontSize: 14,
  cursor: "pointer", textDecoration: "none",
};
