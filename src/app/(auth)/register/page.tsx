"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import styles from "../auth.module.css";

// Función auxiliar para crear un slug a partir del nombre del negocio
const createSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remover caracteres especiales
    .replace(/[\s_-]+/g, "-") // Reemplazar espacios con guiones
    .replace(/^-+|-+$/g, ""); // Quitar guiones al inicio o final
};

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

    // 1. Validaciones Locales
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
      // 1. Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Crear el tenant para este usuario
        const slug = createSlug(businessName);
        
        const { error: tenantError } = await supabase
          .from("tenants")
          .insert([
            {
              owner_id: authData.user.id,
              name: businessName,
              slug: slug,
            }
          ]);

        if (tenantError) {
          // Si el slug ya existe, podríamos intentar con un sufijo, pero para el MVP lanzamos error
          if (tenantError.code === "23505") {
            throw new Error("El nombre de este negocio ya está en uso. Por favor elige otro.");
          }
          throw tenantError;
        }

        // 3. Redirigir al dashboard
        router.push("/admin");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error al registrar tu cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Crea tu cuenta</h1>
        <p className={styles.subtitle}>Empieza a gestionar tu salón en minutos</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleRegister}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre de tu Negocio</label>
            <input
              type="text"
              required
              className={styles.input}
              placeholder="Ej: Mi Salón VIP"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Correo Electrónico</label>
            <input
              type="email"
              required
              className={styles.input}
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Contraseña</label>
            <input
              type="password"
              required
              className={styles.input}
              placeholder="Mínimo 6 caracteres, 1 mayúscula y 1 número"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Código de Autorización</label>
            <input
              type="text"
              required
              className={styles.input}
              placeholder="Ingresa el código beta"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <div className={styles.footer}>
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className={styles.link}>
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
