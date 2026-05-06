"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data.user) {
        router.push("/admin");
      }
    } catch (err: any) {
      setError("Credenciales inválidas o error de conexión.");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logo}>
          <span>Antigravity</span>Booking
        </div>
        
        <h1 className={styles.title}>Iniciar Sesión</h1>
        <p className={styles.subtitle}>Accede al panel de administración de tu salón</p>

        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Correo Electrónico</label>
            <input 
              type="email" 
              className={styles.input} 
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Contraseña</label>
            <input 
              type="password" 
              className={styles.input} 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: "100%", marginTop: "var(--spacing-md)" }}
            disabled={isLoading}
          >
            {isLoading ? "Verificando..." : "Entrar al Dashboard"}
          </button>

          {error && <div className={styles.errorMsg}>{error}</div>}
        </form>
      </div>
    </div>
  );
}
