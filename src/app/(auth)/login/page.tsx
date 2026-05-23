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
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.push("/admin");
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
          <Image src="/zyncra-logo.png" alt="Zyncra" height={34} width={104} style={{ filter: "brightness(0) invert(1)", height: 34, width: "auto" }} />
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
            <Image src="/zyncra-logo.png" alt="Zyncra" height={32} width={98} style={{ height: 32, width: "auto" }} />
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
