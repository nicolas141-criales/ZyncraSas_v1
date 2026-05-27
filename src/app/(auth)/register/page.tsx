"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import styles from "../auth.module.css";
import { IconCheck } from "@/app/admin/ZyncraIcons";

const createSlug = (name: string) =>
  name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

// ── Data ─────────────────────────────────────────────────────────────────────

const BIZ_TYPES = [
  { id: "barberia",  emoji: "💈", label: "Barbería" },
  { id: "salon",     emoji: "✂️", label: "Salón de belleza" },
  { id: "spa",       emoji: "💆", label: "Spa" },
  { id: "manicure",  emoji: "💅", label: "Manicure & Pedicure" },
  { id: "estetica",  emoji: "🏥", label: "Centro estético" },
  { id: "masajes",   emoji: "🧘", label: "Masajes & Bienestar" },
  { id: "tatuajes",  emoji: "🎨", label: "Tatuajes & Piercing" },
  { id: "otro",      emoji: "🏪", label: "Otro" },
];

const COLLAB_OPTS = [
  { id: "solo", label: "Solo yo",      icon: "🙋" },
  { id: "2-3",  label: "2-3 personas", icon: "👫" },
  { id: "4-7",  label: "4-7 personas", icon: "👨‍👩‍👧‍👦" },
  { id: "8+",   label: "8 o más",      icon: "🏢" },
];

const APPT_OPTS = [
  { id: "<5",    label: "Menos de 5", icon: "🌱" },
  { id: "5-15",  label: "5 a 15",     icon: "📊" },
  { id: "16-30", label: "16 a 30",    icon: "🔥" },
  { id: "30+",   label: "Más de 30",  icon: "⚡" },
];

const GOALS = [
  { id: "noshows",     emoji: "🚫", label: "Reducir no-shows" },
  { id: "whatsapp",    emoji: "💬", label: "Agenda por WhatsApp" },
  { id: "pos",         emoji: "💳", label: "POS y cobros" },
  { id: "billing",     emoji: "📄", label: "Facturas DIAN" },
  { id: "reviews",     emoji: "⭐", label: "Reseñas Google" },
  { id: "commissions", emoji: "💰", label: "Comisiones de equipo" },
  { id: "marketing",   emoji: "📣", label: "Marketing automático" },
  { id: "team",        emoji: "👥", label: "Gestionar equipo" },
];

const STEP_META = [
  { title: "Tu negocio",   subtitle: "Cuéntanos sobre lo que haces" },
  { title: "Tu operación", subtitle: "¿Cómo trabajas día a día?" },
  { title: "Tus retos",    subtitle: "¿Qué quieres mejorar?" },
  { title: "Tu cuenta",    subtitle: "¡Solo faltan tus datos!" },
];

const PLAN_INFO = {
  Esencial: {
    price: "$99.900/mes",
    color: "#111118",
    bg: "#f5f4f2",
    accent: "rgba(0,0,0,.08)",
    reasons: [
      "Agenda digital y recordatorios automáticos",
      "Gestión de clientes ilimitados",
      "WhatsApp para confirmaciones de cita",
      "Reportes básicos de tu negocio",
    ],
  },
  Pro: {
    price: "$199.900/mes",
    color: "#fb0f05",
    bg: "rgba(251,15,5,.06)",
    accent: "rgba(251,15,5,.14)",
    reasons: [
      "Todo lo del plan Esencial +",
      "POS y cobros integrados",
      "Comisiones automáticas del equipo",
      "Campañas de WhatsApp Marketing",
    ],
  },
  Personalizado: {
    price: "A medida",
    color: "#0027fe",
    bg: "rgba(0,39,254,.06)",
    accent: "rgba(0,39,254,.14)",
    reasons: [
      "Múltiples sedes centralizadas",
      "Equipo grande sin restricciones",
      "Facturación DIAN integrada",
      "Soporte dedicado y onboarding",
    ],
  },
} as const;

// ── Plan logic ───────────────────────────────────────────────────────────────

function determinePlan(data: { collaborators: string; appointments: string; multiSede: boolean; goals: string[] }): "Esencial" | "Pro" | "Personalizado" {
  if (data.multiSede || data.collaborators === "8+") return "Personalizado";
  const proGoals = ["pos", "billing", "marketing", "commissions"];
  if (
    ["4-7", "8+"].includes(data.collaborators) ||
    ["16-30", "30+"].includes(data.appointments) ||
    data.goals.some(g => proGoals.includes(g))
  ) return "Pro";
  return "Esencial";
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [bizType, setBizType] = useState("");
  const [businessName, setBusinessName] = useState("");

  // Step 2
  const [collaborators, setCollaborators] = useState("");
  const [appointments, setAppointments] = useState("");
  const [multiSede, setMultiSede] = useState<boolean | null>(null);

  // Step 3
  const [goals, setGoals] = useState<string[]>([]);

  // Step 4
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 5
  const [plan, setPlan] = useState<"Esencial" | "Pro" | "Personalizado">("Esencial");

  const toggleGoal = (id: string) => {
    setGoals(prev => {
      if (prev.includes(id)) return prev.filter(g => g !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const canContinue = () => {
    if (step === 1) return bizType !== "" && businessName.trim() !== "";
    if (step === 2) return collaborators !== "" && appointments !== "" && multiSede !== null;
    if (step === 3) return goals.length > 0;
    return false;
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

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
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .insert([{ owner_id: authData.user.id, name: businessName, slug }])
          .select()
          .single();

        if (tenantError) {
          if (tenantError.code === "23505") throw new Error("El nombre de este negocio ya está en uso.");
          throw tenantError;
        }

        if (tenantData) {
          await supabase.from("business_profiles").insert([{
            tenant_id: tenantData.id,
            biz_type: bizType,
            collaborators,
            appointments_per_day: appointments,
            multi_sede: multiSede,
            goals,
            whatsapp: whatsapp || null,
            plan_recommended: determinePlan({ collaborators, appointments, multiSede: multiSede!, goals }),
          }]);
        }

        const recommended = determinePlan({ collaborators, appointments, multiSede: multiSede!, goals });
        setPlan(recommended);
        setStep(5);
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Ocurrió un error al crear tu cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const meta = STEP_META[Math.min(step - 1, 3)];
  const planInfo = PLAN_INFO[plan];

  return (
    <div className={styles.page}>
      {/* ── Left brand panel ── */}
      <div className={styles.brand}>
        <div className={styles.brandLogo}>
          <div className={styles.brandLogoBox}>
            <Image src="/zyncra-logo.png" alt="Zyncra" height={28} width={86} style={{ height: 28, width: "auto" }} />
          </div>
        </div>

        <div className={styles.brandCenter}>
          {step < 5 ? (
            <>
              <div className={styles.stepDots}>
                {STEP_META.map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className={`${styles.stepDot} ${i + 1 === step ? styles.stepDotActive : ""} ${i + 1 < step ? styles.stepDotDone : ""}`}>
                      {i + 1 < step ? <IconCheck size={12} strokeWidth={2.5} /> : <span>{i + 1}</span>}
                    </div>
                    {i + 1 === step && (
                      <span className={styles.stepDotLabel}>{m.title}</span>
                    )}
                  </div>
                ))}
              </div>
              <h2 className={styles.brandTagline} style={{ marginTop: 36 }}>{meta.title}</h2>
              <p style={{ color: "rgba(255,255,255,.72)", fontSize: 14, lineHeight: 1.65, marginTop: 8 }}>
                {meta.subtitle}
              </p>
              <div className={styles.brandFeatures} style={{ marginTop: 28 }}>
                {[
                  "14 días gratis, sin tarjeta",
                  "Plan personalizado para ti",
                  "Soporte en español incluido",
                ].map((f, i) => (
                  <div key={i} className={styles.brandFeat}>
                    <div className={styles.brandFeatIcon}><IconCheck size={13} strokeWidth={2.5} /></div>
                    {f}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 52, marginBottom: 20, lineHeight: 1 }}>🎉</div>
              <h2 className={styles.brandTagline}>¡Tu cuenta<br />está lista!</h2>
              <p style={{ color: "rgba(255,255,255,.72)", fontSize: 14, lineHeight: 1.65, marginTop: 12 }}>
                Hemos elegido el plan perfecto para tu negocio. Empieza a gestionar todo en minutos.
              </p>
            </>
          )}
        </div>

        <div className={styles.brandBottom}>© 2025 Zyncra · Hecho en Colombia</div>
      </div>

      {/* ── Right form panel ── */}
      <div className={styles.form}>
        <div className={styles.wizard}>
          <div className={styles.logoMobile}>
            <div className={styles.logoMobileBox}>
              <Image src="/zyncra-logo.png" alt="Zyncra" height={28} width={86} style={{ height: 28, width: "auto" }} />
            </div>
          </div>

          {/* ── Step 1: Business type ── */}
          {step === 1 && (
            <>
              <div className={styles.wizardProgress}>
                <div className={styles.wizardProgressBar} style={{ width: "25%" }} />
              </div>
              <h1 className={styles.heading}>¿Qué tipo de negocio tienes?</h1>
              <p className={styles.subheading}>Esto nos ayuda a personalizar todo para ti</p>

              <div className={styles.bizGrid}>
                {BIZ_TYPES.map(b => (
                  <button key={b.id} type="button"
                    className={`${styles.bizCard} ${bizType === b.id ? styles.bizCardActive : ""}`}
                    onClick={() => setBizType(b.id)}>
                    <span className={styles.bizEmoji}>{b.emoji}</span>
                    <span className={styles.bizLabel}>{b.label}</span>
                  </button>
                ))}
              </div>

              <div className={styles.formGroup} style={{ marginTop: 20 }}>
                <label className={styles.label}>Nombre de tu negocio</label>
                <input type="text" className={styles.input} style={{ paddingLeft: 14 }}
                  placeholder="Ej: Black Fade Barbershop"
                  value={businessName} onChange={e => setBusinessName(e.target.value)} />
              </div>

              <button className={styles.button} disabled={!canContinue()} onClick={() => setStep(2)}>
                Continuar →
              </button>

              <div className={styles.footer}>
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className={styles.link}>Inicia sesión</Link>
              </div>
            </>
          )}

          {/* ── Step 2: Operation ── */}
          {step === 2 && (
            <>
              <div className={styles.wizardProgress}>
                <div className={styles.wizardProgressBar} style={{ width: "50%" }} />
              </div>
              <h1 className={styles.heading}>¿Cómo funciona tu negocio?</h1>
              <p className={styles.subheading}>Datos clave para calibrar tu plan perfecto</p>

              <p className={styles.groupLabel}>¿Cuántas personas trabajan contigo?</p>
              <div className={styles.opGrid}>
                {COLLAB_OPTS.map(o => (
                  <button key={o.id} type="button"
                    className={`${styles.opCard} ${collaborators === o.id ? styles.opCardActive : ""}`}
                    onClick={() => setCollaborators(o.id)}>
                    <span className={styles.opIcon}>{o.icon}</span>
                    <span className={styles.opLabel}>{o.label}</span>
                  </button>
                ))}
              </div>

              <p className={styles.groupLabel} style={{ marginTop: 22 }}>¿Cuántas citas atiendes por día?</p>
              <div className={styles.opGrid}>
                {APPT_OPTS.map(o => (
                  <button key={o.id} type="button"
                    className={`${styles.opCard} ${appointments === o.id ? styles.opCardActive : ""}`}
                    onClick={() => setAppointments(o.id)}>
                    <span className={styles.opIcon}>{o.icon}</span>
                    <span className={styles.opLabel}>{o.label}</span>
                  </button>
                ))}
              </div>

              <p className={styles.groupLabel} style={{ marginTop: 22 }}>¿Tienes más de una sede?</p>
              <div style={{ display: "flex", gap: 12 }}>
                {[{ val: true, label: "Sí, varias sedes" }, { val: false, label: "No, solo una" }].map(o => (
                  <button key={String(o.val)} type="button"
                    className={`${styles.opCard} ${multiSede === o.val ? styles.opCardActive : ""}`}
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => setMultiSede(o.val)}>
                    <span className={styles.opLabel}>{o.label}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button className={styles.btnBack} onClick={() => setStep(1)}>← Atrás</button>
                <button className={styles.button} disabled={!canContinue()} onClick={() => setStep(3)} style={{ flex: 1 }}>
                  Continuar →
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Goals ── */}
          {step === 3 && (
            <>
              <div className={styles.wizardProgress}>
                <div className={styles.wizardProgressBar} style={{ width: "75%" }} />
              </div>
              <h1 className={styles.heading}>¿Qué quieres mejorar?</h1>
              <p className={styles.subheading}>Elige hasta 3 prioridades para tu negocio</p>

              <div className={styles.goalGrid}>
                {GOALS.map(g => (
                  <button key={g.id} type="button"
                    className={`${styles.goalChip} ${goals.includes(g.id) ? styles.goalChipActive : ""}`}
                    onClick={() => toggleGoal(g.id)}
                    disabled={!goals.includes(g.id) && goals.length >= 3}>
                    <span>{g.emoji}</span>
                    {g.label}
                    {goals.includes(g.id) && <span className={styles.goalCheck}>✓</span>}
                  </button>
                ))}
              </div>

              <p style={{ fontSize: 12, color: "#8E879B", textAlign: "center", marginTop: 14 }}>
                {goals.length}/3 seleccionados
              </p>

              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button className={styles.btnBack} onClick={() => setStep(2)}>← Atrás</button>
                <button className={styles.button} disabled={goals.length === 0} onClick={() => setStep(4)} style={{ flex: 1 }}>
                  Continuar →
                </button>
              </div>
            </>
          )}

          {/* ── Step 4: Account ── */}
          {step === 4 && (
            <>
              <div className={styles.wizardProgress}>
                <div className={styles.wizardProgressBar} style={{ width: "92%" }} />
              </div>
              <h1 className={styles.heading}>Crea tu cuenta</h1>
              <p className={styles.subheading}>Un paso más para empezar a gestionar tu negocio</p>

              {error && (
                <div className={styles.error}>
                  <span>⚠</span> {error}
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>Correo electrónico</label>
                <input type="email" required className={styles.input} style={{ paddingLeft: 14 }}
                  placeholder="tu@correo.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  WhatsApp{" "}
                  <span style={{ color: "#a0a0b0", fontWeight: 400 }}>(opcional)</span>
                </label>
                <input type="tel" className={styles.input} style={{ paddingLeft: 14 }}
                  placeholder="+57 300 000 0000"
                  value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Contraseña</label>
                <input type="password" required className={styles.input} style={{ paddingLeft: 14 }}
                  placeholder="Mín. 6 caracteres, 1 mayúscula, 1 número"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button className={styles.btnBack} onClick={() => setStep(3)}>← Atrás</button>
                <button className={styles.button}
                  disabled={loading || !email || !password}
                  onClick={handleRegister}
                  style={{ flex: 1 }}>
                  {loading ? "Creando tu cuenta..." : "Crear cuenta gratis →"}
                </button>
              </div>

              <p style={{ fontSize: 12, color: "#8E879B", textAlign: "center", marginTop: 16, lineHeight: 1.55 }}>
                Al registrarte aceptas los{" "}
                <Link href="#" className={styles.link}>Términos de uso</Link> y la{" "}
                <Link href="#" className={styles.link}>Política de privacidad</Link>
              </p>
            </>
          )}

          {/* ── Step 5: Plan recommendation ── */}
          {step === 5 && (
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 12 }}>🎉</div>
                <h1 className={styles.heading}>¡Cuenta creada!</h1>
                <p className={styles.subheading}>Basado en tu perfil, este es tu plan ideal</p>
              </div>

              <div style={{
                background: planInfo.bg,
                border: `1.5px solid ${planInfo.accent}`,
                borderRadius: 16,
                padding: "24px 20px",
                marginBottom: 20,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: planInfo.color, marginBottom: 4 }}>
                      Plan recomendado
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "#14111C", letterSpacing: "-.03em" }}>
                      Plan {plan}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: planInfo.color }}>{planInfo.price}</div>
                    <div style={{ fontSize: 11, color: "#a0a0b0", marginTop: 2 }}>14 días gratis</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {planInfo.reasons.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#3a3548" }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: planInfo.color, display: "flex",
                        alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <IconCheck size={11} strokeWidth={3} />
                      </div>
                      {r}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: "rgba(0,39,254,.05)", borderRadius: 12, padding: "14px 16px",
                marginBottom: 20, fontSize: 13, color: "#564E66", lineHeight: 1.55,
                border: "1px solid rgba(0,39,254,.12)",
              }}>
                💡 Puedes cambiar de plan en cualquier momento desde tu panel de configuración.
              </div>

              <button className={styles.button} onClick={() => router.push("/admin")}>
                Ir a mi panel →
              </button>

              <div className={styles.footer}>
                Prueba gratuita de 14 días — sin tarjeta de crédito
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
