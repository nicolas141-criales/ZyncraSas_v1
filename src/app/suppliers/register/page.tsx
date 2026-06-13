"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  "Uñas y manicura",
  "Barbería",
  "Cabello y peluquería",
  "Spa y masajes",
  "Maquillaje",
  "Cuidado de la piel",
  "Depilación",
  "Insumos generales",
];

export default function SupplierRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    nit: "",
    phone: "",
    city: "",
    address: "",
    description: "",
    categories: [] as string[],
  });

  const set = (k: keyof typeof form, v: string | string[]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const toggleCategory = (c: string) => {
    set("categories",
      form.categories.includes(c)
        ? form.categories.filter(x => x !== c)
        : [...form.categories, c]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (form.categories.length === 0) {
      setError("Selecciona al menos una categoría de productos.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario.");

      const { error: insertError } = await supabase.from("suppliers").insert({
        user_id: authData.user.id,
        email: form.email,
        company_name: form.companyName,
        nit: form.nit || null,
        phone: form.phone,
        city: form.city,
        address: form.address,
        description: form.description,
        categories: form.categories,
        status: "pending",
      });
      if (insertError) throw insertError;

      // Enviar email de "solicitud recibida"
      await fetch("/api/supplier-approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: form.companyName, email: form.email, type: "pending" }),
      });

      router.push("/suppliers/pending");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar.";
      if (msg.includes("already registered")) {
        setError("Este correo ya está registrado. Intenta iniciar sesión.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07071a", display: "flex", fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>
      {/* Left panel */}
      <div style={{
        width: 360, flexShrink: 0, background: "linear-gradient(160deg, #0d0d2b 0%, #07071a 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)", padding: "40px 32px",
        display: "flex", flexDirection: "column",
      }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 48 }}>
          <Image src="/zyncra-icon.png" alt="Zyncra" height={28} width={28} style={{ height: 28, width: "auto" }} />
          <span style={{ fontWeight: 800, fontSize: 19, color: "white", letterSpacing: "-0.5px" }}>Zyncra</span>
        </Link>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#fb0f05", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 12 }}>
            Portal de Proveedores
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "white", lineHeight: 1.25, marginBottom: 16 }}>
            Llega a miles de negocios de belleza en Colombia
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 32 }}>
            Vende tus insumos directamente a salones, barberías, spas y más. Sin intermediarios, con pagos seguros y gestión de pedidos integrada.
          </p>

          {[
            { icon: "📦", text: "Gestiona tu catálogo de productos" },
            { icon: "🛒", text: "Recibe pedidos en tiempo real" },
            { icon: "💳", text: "Pagos confirmados antes de despachar" },
            { icon: "📊", text: "Dashboard de ventas y estadísticas" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
          ¿Ya tienes cuenta?{" "}
          <Link href="/suppliers/login" style={{ color: "#fb0f05", textDecoration: "none", fontWeight: 600 }}>Inicia sesión</Link>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 520 }}>

          {/* Steps */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
            {[1, 2].map(n => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  background: step >= n ? "#fb0f05" : "rgba(255,255,255,0.07)",
                  color: step >= n ? "white" : "rgba(255,255,255,0.3)",
                  border: step >= n ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}>
                  {n}
                </div>
                <span style={{ fontSize: 12, color: step >= n ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                  {n === 1 ? "Cuenta y empresa" : "Categorías"}
                </span>
                {n < 2 && <div style={{ width: 32, height: 1, background: "rgba(255,255,255,0.1)" }} />}
              </div>
            ))}
          </div>

          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, padding: "32px",
          }}>
            {error && (
              <div style={{
                background: "rgba(251,15,5,0.1)", border: "1px solid rgba(251,15,5,0.3)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 20,
                fontSize: 13, color: "#ff7d72",
              }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 4 }}>Crea tu cuenta de proveedor</h2>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Información de acceso y datos de la empresa</p>

                  <Row>
                    <Field label="Correo electrónico">
                      <input type="email" required placeholder="empresa@correo.com" value={form.email}
                        onChange={e => set("email", e.target.value)} style={inputStyle} />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Contraseña">
                      <input type="password" required placeholder="Mínimo 8 caracteres" value={form.password}
                        onChange={e => set("password", e.target.value)} style={inputStyle} minLength={8} />
                    </Field>
                    <Field label="Confirmar contraseña">
                      <input type="password" required placeholder="Repite tu contraseña" value={form.confirmPassword}
                        onChange={e => set("confirmPassword", e.target.value)} style={inputStyle} minLength={8} />
                    </Field>
                  </Row>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", margin: "20px 0" }} />

                  <Row>
                    <Field label="Nombre de la empresa *">
                      <input type="text" required placeholder="Ej: Distribuidora Bella Colombia" value={form.companyName}
                        onChange={e => set("companyName", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="NIT (opcional)">
                      <input type="text" placeholder="900.123.456-7" value={form.nit}
                        onChange={e => set("nit", e.target.value)} style={inputStyle} />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Teléfono / WhatsApp *">
                      <input type="tel" required placeholder="3001234567" value={form.phone}
                        onChange={e => set("phone", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Ciudad *">
                      <input type="text" required placeholder="Bogotá, Medellín..." value={form.city}
                        onChange={e => set("city", e.target.value)} style={inputStyle} />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Dirección">
                      <input type="text" placeholder="Calle 123 #45-67, Bodega 3" value={form.address}
                        onChange={e => set("address", e.target.value)} style={inputStyle} />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Descripción breve del negocio">
                      <textarea placeholder="Qué productos venden, años de experiencia, zona de cobertura..." value={form.description}
                        onChange={e => set("description", e.target.value)}
                        style={{ ...inputStyle, height: 80, resize: "none" } as React.CSSProperties} />
                    </Field>
                  </Row>

                  <button type="button" onClick={() => { setError(null); setStep(2); }}
                    style={btnStyle}>
                    Siguiente →
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 4 }}>Categorías de productos</h2>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
                    Selecciona los tipos de insumos que distribuyes (puedes elegir varias)
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
                    {CATEGORIES.map(cat => {
                      const active = form.categories.includes(cat);
                      return (
                        <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                          style={{
                            padding: "8px 14px", borderRadius: 8, border: "1px solid",
                            fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                            borderColor: active ? "#fb0f05" : "rgba(255,255,255,0.12)",
                            background: active ? "rgba(251,15,5,0.15)" : "rgba(255,255,255,0.03)",
                            color: active ? "#ff7d72" : "rgba(255,255,255,0.5)",
                          }}>
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "14px 16px", marginBottom: 24, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>
                      <strong style={{ color: "rgba(255,255,255,0.6)" }}>Proceso de aprobación:</strong> Una vez enviada tu solicitud, el equipo de Zyncra la revisará en máximo 48 horas hábiles y te notificará por correo electrónico.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="button" onClick={() => setStep(1)}
                      style={{ ...btnStyle, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", flex: 0, padding: "13px 20px" }}>
                      ← Atrás
                    </button>
                    <button type="submit" disabled={loading} style={{ ...btnStyle, flex: 1 }}>
                      {loading ? "Enviando solicitud..." : "Enviar solicitud de registro"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers de UI ──────────────────────────────────────────────────────────────

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.03em" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "white", fontSize: 13, fontWeight: 500,
  outline: "none", boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  width: "100%", padding: "13px", borderRadius: 10,
  background: "linear-gradient(135deg, #fb0f05, #cc0a03)",
  color: "white", fontSize: 14, fontWeight: 700,
  border: "none", cursor: "pointer",
  boxShadow: "0 4px 20px rgba(251,15,5,0.3)",
};
