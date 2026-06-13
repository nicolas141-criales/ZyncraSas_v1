"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SupplierLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const uid = data.user?.id;

      // Verificar que sea proveedor
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("status")
        .eq("user_id", uid)
        .maybeSingle();

      if (!supplier) {
        await supabase.auth.signOut();
        setError("No encontramos una cuenta de proveedor con este correo.");
        return;
      }

      if (supplier.status === "pending") {
        router.push("/suppliers/pending");
        return;
      }

      if (supplier.status === "rejected" || supplier.status === "suspended") {
        await supabase.auth.signOut();
        setError("Tu cuenta está " + (supplier.status === "rejected" ? "rechazada" : "suspendida") + ". Contacta a soporte.");
        return;
      }

      // approved → portal
      window.location.href = "/supplier";
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  const F = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

  return (
    <div style={{
      minHeight: "100vh", background: "#07071a",
      display: "flex", fontFamily: F,
    }}>
      {/* Panel izquierdo */}
      <div style={{
        width: 340, flexShrink: 0,
        background: "linear-gradient(160deg, #0d0d2b 0%, #07071a 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        padding: "40px 32px", display: "flex", flexDirection: "column",
      }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 48 }}>
          <Image src="/zyncra-icon.png" alt="Zyncra" height={28} width={28} style={{ height: 28, width: "auto" }} />
          <span style={{ fontWeight: 800, fontSize: 19, color: "white", letterSpacing: "-0.5px" }}>Zyncra</span>
        </Link>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#fb0f05", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 12 }}>
            Portal de Proveedores
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "white", lineHeight: 1.25, marginBottom: 14 }}>
            Gestiona tu catálogo y pedidos
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 28 }}>
            Desde aquí controlas tus productos, recibes pedidos y confirmas pagos de los negocios que te compran.
          </p>
          {[
            { icon: "📦", text: "Catálogo de productos" },
            { icon: "🛒", text: "Pedidos en tiempo real" },
            { icon: "💳", text: "Confirmación de pagos" },
            { icon: "📊", text: "Dashboard de ventas" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 17 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
          ¿Eres un negocio?{" "}
          <Link href="/login" style={{ color: "#fb0f05", textDecoration: "none", fontWeight: 600 }}>
            Ingresa aquí
          </Link>
        </div>
      </div>

      {/* Panel derecho */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          <h2 style={{ fontSize: 24, fontWeight: 800, color: "white", marginBottom: 4, letterSpacing: "-0.5px" }}>
            Bienvenido de vuelta
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 28 }}>
            Ingresa a tu portal de proveedor
          </p>

          {error && (
            <div style={{
              background: "rgba(251,15,5,0.1)", border: "1px solid rgba(251,15,5,0.3)",
              borderRadius: 8, padding: "11px 14px", marginBottom: 20,
              fontSize: 13, color: "#ff7d72", fontWeight: 500,
            }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Correo electrónico</label>
              <input
                type="email" required autoComplete="email"
                placeholder="tu@empresa.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Contraseña</label>
              <input
                type="password" required autoComplete="current-password"
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "13px", borderRadius: 10, border: "none", cursor: "pointer",
              marginTop: 4,
              background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #fb0f05, #cc0a03)",
              color: loading ? "rgba(255,255,255,0.4)" : "white",
              fontSize: 14, fontWeight: 700,
              boxShadow: loading ? "none" : "0 4px 20px rgba(251,15,5,0.3)",
              transition: "all .15s",
            }}>
              {loading ? "Verificando..." : "Ingresar al portal →"}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>¿No tienes cuenta?{" "}</span>
            <Link href="/suppliers/register" style={{ fontSize: 13, color: "#fb0f05", textDecoration: "none", fontWeight: 600 }}>
              Regístrate como proveedor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "rgba(255,255,255,0.45)", marginBottom: 6, letterSpacing: "0.03em",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 13px", borderRadius: 9,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "white", fontSize: 13, fontWeight: 500,
  outline: "none", boxSizing: "border-box",
};
