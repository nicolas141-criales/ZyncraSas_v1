"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import styles from "../auth.module.css";
import { IconCheck, IconMail, IconLock, IconStorefront } from "@/app/admin/ZyncraIcons";

const createSlug = (name: string) =>
  name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

const features = [
  "14 días gratis, sin tarjeta de crédito",
  "Configuración en menos de 5 minutos",
  "Agenda, POS y WhatsApp en un solo lugar",
  "Soporte en español incluido",
];

export default function RegisterPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (authCode !== "booksalon") {
      setError("Código de autorización inválido.");
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      setError("La contraseña debe tener mínimo 6 caracteres, 1 mayúscula y 1 número.");
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      if (authData.user) {
        const slug = createSlug(businessName);
        const { error: tenantError } = await supabase.from("tenants").insert([
          { owner_id: authData.user.id, name: businessName, slug },
        ]);
        if (tenantError) {
          if (tenantError.code === "23505") throw new Error("El nombre de este negocio ya está en uso.");
          throw tenantError;
        }
        router.push("/admin");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Ocurrió un error al crear tu cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Left brand panel ── */}
      <div className={styles.brand}>
        <div className={styles.brandLogo}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "7px 14px", display: "inline-flex" }}>
            <Image src="/zyncra-logo.png" alt="Zyncra" height={28} width={86} style={{ height: 28, width: "auto" }} />
          </div>
        </div>

        <div className={styles.brandCenter}>
          <h2 className={styles.brandTagline}>
            Empieza gratis.<br />Crece sin límites.
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
          <div className={styles.logoMobile}>
            <Image src="/zyncra-logo.png" alt="Zyncra" height={32} width={98} style={{ height: 32, width: "auto" }} />
          </div>

          <h1 className={styles.heading}>Crea tu cuenta</h1>
          <p className={styles.subheading}>Empieza a gestionar tu negocio en minutos</p>

          {error && (
            <div className={styles.error}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre de tu negocio</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><IconStorefront size={16} /></span>
                <input type="text" required className={styles.input} placeholder="Ej: Spa & Bienestar Nova"
                  value={businessName} onChange={e => setBusinessName(e.target.value)} />
              </div>
            </div>

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
                <input type="password" required className={styles.input} placeholder="Mín. 6 caracteres, 1 mayúscula, 1 número"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Código beta</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><IconLock size={16} /></span>
                <input type="text" required className={styles.input} placeholder="Código de acceso"
                  value={authCode} onChange={e => setAuthCode(e.target.value)} />
              </div>
            </div>

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta gratis →"}
            </button>
          </form>

          <div className={styles.footer}>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className={styles.link}>Inicia sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
