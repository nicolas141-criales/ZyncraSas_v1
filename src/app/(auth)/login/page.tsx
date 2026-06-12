"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import styles from "../auth.module.css";
import { IconCheck, IconMail, IconLock } from "@/app/admin/ZyncraIcons";

const features = [
  "Agenda inteligente con recordatorios automáticos",
  "Marketing por WhatsApp sin esfuerzo",
  "Sistema POS y facturación electrónica DIAN",
  "Reseñas Google y gestión de comisiones",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const uid = authData.user?.id;
      // Determine role and redirect accordingly
      const [{ data: platformAdmin }, { data: supplier }] = await Promise.all([
        supabase.from("platform_admins").select("user_id").eq("user_id", uid).maybeSingle(),
        supabase.from("suppliers").select("status").eq("user_id", uid).maybeSingle(),
      ]);

      if (platformAdmin) {
        window.location.href = "/platform";
      } else if (supplier?.status === "approved") {
        window.location.href = "/supplier";
      } else if (supplier?.status === "pending") {
        window.location.href = "/suppliers/pending";
      } else {
        window.location.href = "/admin";
      }
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Left brand panel ── */}
      <div className={styles.brand}>
        <div className={styles.brandLogo}>
          <div className={styles.brandLogoBox}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
              <Image src="/zyncra-icon.png" alt="Zyncra" height={30} width={30} style={{ height: 30, width: "auto" }} />
              <span style={{ fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 21, color: "white", letterSpacing: "-0.6px", lineHeight: 1 }}>Zyncra</span>
            </div>
          </div>
        </div>

        <div className={styles.brandCenter}>
          <h2 className={styles.brandTagline}>
            Gestiona tu negocio.<br />Escala sin límites.
          </h2>
          <div className={styles.brandFeatures}>
            {features.map((f, i) => (
              <div key={i} className={styles.brandFeat}>
                <div className={styles.brandFeatIcon}>
                  <IconCheck size={14} strokeWidth={2.5} />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.brandBottom}>
          © 2025 Zyncra · Hecho en Colombia
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className={styles.form}>
        <div className={styles.card}>
          {/* Logo only on mobile */}
          <div className={styles.logoMobile}>
            <div className={styles.logoMobileBox} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Image src="/zyncra-icon.png" alt="Zyncra" height={26} width={26} style={{ height: 26, width: "auto" }} />
              <span style={{ fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 19, color: "#14111C", letterSpacing: "-0.5px", lineHeight: 1 }}>Zyncra</span>
            </div>
          </div>

          <h1 className={styles.heading}>Bienvenido de vuelta</h1>
          <p className={styles.subheading}>Ingresa a tu panel de control</p>

          {error && (
            <div className={styles.error}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Correo electrónico</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><IconMail size={16} /></span>
                <input type="email" required className={styles.input} placeholder="tu@correo.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Contraseña</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><IconLock size={16} /></span>
                <input type="password" required className={styles.input} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Ingresando..." : "Iniciar sesión →"}
            </button>
          </form>

          <div className={styles.footer}>
            ¿No tienes cuenta?{" "}
            <Link href="/register" className={styles.link}>Regístrate gratis</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
