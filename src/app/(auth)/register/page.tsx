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

// ── Countries ─────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: "CO", flag: "🇨🇴", name: "Colombia",          currency: "COP", locale: "es-CO" },
  { code: "MX", flag: "🇲🇽", name: "México",            currency: "MXN", locale: "es-MX" },
  { code: "AR", flag: "🇦🇷", name: "Argentina",         currency: "ARS", locale: "es-AR" },
  { code: "CL", flag: "🇨🇱", name: "Chile",             currency: "CLP", locale: "es-CL" },
  { code: "PE", flag: "🇵🇪", name: "Perú",              currency: "PEN", locale: "es-PE" },
  { code: "EC", flag: "🇪🇨", name: "Ecuador",           currency: "USD", locale: "es-EC" },
  { code: "VE", flag: "🇻🇪", name: "Venezuela",         currency: "VES", locale: "es-VE" },
  { code: "BO", flag: "🇧🇴", name: "Bolivia",           currency: "BOB", locale: "es-BO" },
  { code: "PY", flag: "🇵🇾", name: "Paraguay",          currency: "PYG", locale: "es-PY" },
  { code: "UY", flag: "🇺🇾", name: "Uruguay",           currency: "UYU", locale: "es-UY" },
  { code: "CR", flag: "🇨🇷", name: "Costa Rica",        currency: "CRC", locale: "es-CR" },
  { code: "PA", flag: "🇵🇦", name: "Panamá",            currency: "PAB", locale: "es-PA" },
  { code: "GT", flag: "🇬🇹", name: "Guatemala",         currency: "GTQ", locale: "es-GT" },
  { code: "DO", flag: "🇩🇴", name: "Rep. Dominicana",   currency: "DOP", locale: "es-DO" },
  { code: "US", flag: "🇺🇸", name: "United States",     currency: "USD", locale: "en-US" },
  { code: "ES", flag: "🇪🇸", name: "España",            currency: "EUR", locale: "es-ES" },
] as const;

// ── i18n ──────────────────────────────────────────────────────────────────────

const I18N = {
  es: {
    // Steps meta
    steps: [
      { title: "Tu negocio",   subtitle: "Cuéntanos sobre lo que haces" },
      { title: "Tu operación", subtitle: "¿Cómo trabajas día a día?" },
      { title: "Tus retos",    subtitle: "¿Qué quieres mejorar?" },
      { title: "Tu cuenta",    subtitle: "¡Solo faltan tus datos!" },
    ],
    // Left panel
    features: ["14 días gratis, sin tarjeta", "Plan personalizado para ti", "Soporte en español incluido"],
    successTitle: "¡Tu cuenta\nestá lista!",
    successSub: "Hemos elegido el plan perfecto para tu negocio. Empieza a gestionar todo en minutos.",
    // Step 1
    s1heading: "¿Qué tipo de negocio tienes?",
    s1sub: "Esto nos ayuda a personalizar todo para ti",
    bizNameLabel: "Nombre de tu negocio",
    bizNamePlaceholder: "Ej: Black Fade Barbershop",
    countryLabel: "País de operación",
    continueBtn: "Continuar →",
    loginPrompt: "¿Ya tienes cuenta?",
    loginLink: "Inicia sesión",
    // Step 2
    s2heading: "¿Cómo funciona tu negocio?",
    s2sub: "Datos clave para calibrar tu plan perfecto",
    teamQ: "¿Cuántas personas trabajan contigo?",
    apptQ: "¿Cuántas citas atiendes por día?",
    multiQ: "¿Tienes más de una sede?",
    yesMulti: "Sí, varias sedes",
    noMulti: "No, solo una",
    backBtn: "← Atrás",
    // Step 3
    s3heading: "¿Qué quieres mejorar?",
    s3sub: "Elige hasta 3 prioridades para tu negocio",
    goalsCount: (n: number) => `${n}/3 seleccionados`,
    // Step 4
    s4heading: "Crea tu cuenta",
    s4sub: "Un paso más para empezar a gestionar tu negocio",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "tu@correo.com",
    whatsappLabel: "WhatsApp",
    optional: "(opcional)",
    whatsappPlaceholder: "+57 300 000 0000",
    passwordLabel: "Contraseña",
    passwordPlaceholder: "Mín. 6 caracteres, 1 mayúscula, 1 número",
    createBtn: (loading: boolean) => loading ? "Creando tu cuenta..." : "Crear cuenta gratis →",
    termsText: "Al registrarte aceptas los",
    termsLink: "Términos de uso",
    andText: "y la",
    privacyLink: "Política de privacidad",
    // Step 5
    s5heading: "¡Cuenta creada!",
    s5sub: "Basado en tu perfil, este es tu plan ideal",
    planTag: "Plan recomendado",
    freeTrial: "14 días gratis",
    planTip: "Puedes cambiar de plan en cualquier momento desde tu panel de configuración.",
    goPanel: "Ir a mi panel →",
    footerTrial: "Prueba gratuita de 14 días — sin tarjeta de crédito",
    // Errors
    pwError: "La contraseña debe tener mínimo 6 caracteres, 1 mayúscula y 1 número.",
    dupError: "El nombre de este negocio ya está en uso.",
    genericError: "Ocurrió un error al crear tu cuenta.",
    // Data
    bizTypes: [
      { id: "barberia",  emoji: "💈", label: "Barbería" },
      { id: "salon",     emoji: "✂️", label: "Salón de belleza" },
      { id: "spa",       emoji: "💆", label: "Spa" },
      { id: "manicure",  emoji: "💅", label: "Manicure & Pedicure" },
      { id: "estetica",  emoji: "🏥", label: "Centro estético" },
      { id: "masajes",   emoji: "🧘", label: "Masajes & Bienestar" },
      { id: "tatuajes",  emoji: "🎨", label: "Tatuajes & Piercing" },
      { id: "otro",      emoji: "🏪", label: "Otro" },
    ],
    collabOpts: [
      { id: "solo", label: "Solo yo",      icon: "🙋" },
      { id: "2-3",  label: "2-3 personas", icon: "👫" },
      { id: "4-7",  label: "4-7 personas", icon: "👨‍👩‍👧‍👦" },
      { id: "8+",   label: "8 o más",      icon: "🏢" },
    ],
    apptOpts: [
      { id: "<5",    label: "Menos de 5", icon: "🌱" },
      { id: "5-15",  label: "5 a 15",     icon: "📊" },
      { id: "16-30", label: "16 a 30",    icon: "🔥" },
      { id: "30+",   label: "Más de 30",  icon: "⚡" },
    ],
    goals: [
      { id: "noshows",     emoji: "🚫", label: "Reducir no-shows" },
      { id: "whatsapp",    emoji: "💬", label: "Agenda por WhatsApp" },
      { id: "pos",         emoji: "💳", label: "POS y cobros" },
      { id: "billing",     emoji: "📄", label: "Facturas DIAN" },
      { id: "reviews",     emoji: "⭐", label: "Reseñas Google" },
      { id: "commissions", emoji: "💰", label: "Comisiones de equipo" },
      { id: "marketing",   emoji: "📣", label: "Marketing automático" },
      { id: "team",        emoji: "👥", label: "Gestionar equipo" },
    ],
    plans: {
      Esencial:     { price: "$99.900/mes",  reasons: ["Agenda digital y recordatorios automáticos", "Gestión de clientes ilimitados", "WhatsApp para confirmaciones de cita", "Reportes básicos de tu negocio"] },
      Pro:          { price: "$199.900/mes", reasons: ["Todo lo del plan Esencial +", "POS y cobros integrados", "Comisiones automáticas del equipo", "Campañas de WhatsApp Marketing"] },
      Personalizado:{ price: "A medida",     reasons: ["Múltiples sedes centralizadas", "Equipo grande sin restricciones", "Facturación integrada", "Soporte dedicado y onboarding"] },
    },
  },
  en: {
    steps: [
      { title: "Your business",   subtitle: "Tell us about what you do" },
      { title: "Your operation",  subtitle: "How do you work day to day?" },
      { title: "Your goals",      subtitle: "What do you want to improve?" },
      { title: "Your account",    subtitle: "Just your details left!" },
    ],
    features: ["14 days free, no credit card", "Personalized plan for you", "Support included"],
    successTitle: "Your account\nis ready!",
    successSub: "We have chosen the perfect plan for your business. Start managing everything in minutes.",
    s1heading: "What type of business do you have?",
    s1sub: "This helps us personalize everything for you",
    bizNameLabel: "Business name",
    bizNamePlaceholder: "E.g: Black Fade Barbershop",
    countryLabel: "Country of operation",
    continueBtn: "Continue →",
    loginPrompt: "Already have an account?",
    loginLink: "Sign in",
    s2heading: "How does your business work?",
    s2sub: "Key data to calibrate your perfect plan",
    teamQ: "How many people work with you?",
    apptQ: "How many appointments do you handle per day?",
    multiQ: "Do you have more than one location?",
    yesMulti: "Yes, multiple locations",
    noMulti: "No, just one",
    backBtn: "← Back",
    s3heading: "What do you want to improve?",
    s3sub: "Choose up to 3 priorities for your business",
    goalsCount: (n: number) => `${n}/3 selected`,
    s4heading: "Create your account",
    s4sub: "One more step to start managing your business",
    emailLabel: "Email address",
    emailPlaceholder: "you@email.com",
    whatsappLabel: "WhatsApp",
    optional: "(optional)",
    whatsappPlaceholder: "+1 555 000 0000",
    passwordLabel: "Password",
    passwordPlaceholder: "Min. 6 chars, 1 uppercase, 1 number",
    createBtn: (loading: boolean) => loading ? "Creating your account..." : "Create free account →",
    termsText: "By registering you accept the",
    termsLink: "Terms of use",
    andText: "and the",
    privacyLink: "Privacy policy",
    s5heading: "Account created!",
    s5sub: "Based on your profile, here is your ideal plan",
    planTag: "Recommended plan",
    freeTrial: "14-day free trial",
    planTip: "You can change your plan at any time from your settings panel.",
    goPanel: "Go to my panel →",
    footerTrial: "14-day free trial — no credit card required",
    pwError: "Password must have at least 6 characters, 1 uppercase letter and 1 number.",
    dupError: "This business name is already in use.",
    genericError: "An error occurred while creating your account.",
    bizTypes: [
      { id: "barberia",  emoji: "💈", label: "Barbershop" },
      { id: "salon",     emoji: "✂️", label: "Beauty Salon" },
      { id: "spa",       emoji: "💆", label: "Spa" },
      { id: "manicure",  emoji: "💅", label: "Manicure & Pedicure" },
      { id: "estetica",  emoji: "🏥", label: "Aesthetic Center" },
      { id: "masajes",   emoji: "🧘", label: "Massage & Wellness" },
      { id: "tatuajes",  emoji: "🎨", label: "Tattoos & Piercing" },
      { id: "otro",      emoji: "🏪", label: "Other" },
    ],
    collabOpts: [
      { id: "solo", label: "Just me",       icon: "🙋" },
      { id: "2-3",  label: "2-3 people",    icon: "👫" },
      { id: "4-7",  label: "4-7 people",    icon: "👨‍👩‍👧‍👦" },
      { id: "8+",   label: "8 or more",     icon: "🏢" },
    ],
    apptOpts: [
      { id: "<5",    label: "Fewer than 5", icon: "🌱" },
      { id: "5-15",  label: "5 to 15",      icon: "📊" },
      { id: "16-30", label: "16 to 30",     icon: "🔥" },
      { id: "30+",   label: "More than 30", icon: "⚡" },
    ],
    goals: [
      { id: "noshows",     emoji: "🚫", label: "Reduce no-shows" },
      { id: "whatsapp",    emoji: "💬", label: "WhatsApp scheduling" },
      { id: "pos",         emoji: "💳", label: "POS & payments" },
      { id: "billing",     emoji: "📄", label: "Electronic invoices" },
      { id: "reviews",     emoji: "⭐", label: "Google reviews" },
      { id: "commissions", emoji: "💰", label: "Team commissions" },
      { id: "marketing",   emoji: "📣", label: "Automated marketing" },
      { id: "team",        emoji: "👥", label: "Manage team" },
    ],
    plans: {
      Esencial:     { price: "$99.900/mo",  reasons: ["Digital scheduling & auto reminders", "Unlimited client management", "WhatsApp appointment confirmations", "Basic business reports"] },
      Pro:          { price: "$199.900/mo", reasons: ["Everything in Esencial +", "Integrated POS & payments", "Automatic team commissions", "WhatsApp Marketing campaigns"] },
      Personalizado:{ price: "Custom",      reasons: ["Multiple centralized locations", "Large team, no restrictions", "Integrated billing", "Dedicated support & onboarding"] },
    },
  },
} as const;

// ── Plan logic ────────────────────────────────────────────────────────────────

const PLAN_COLORS = {
  Esencial:     { color: "#111118", bg: "#f5f4f2", accent: "rgba(0,0,0,.08)" },
  Pro:          { color: "#fb0f05", bg: "rgba(251,15,5,.06)", accent: "rgba(251,15,5,.14)" },
  Personalizado:{ color: "#0027fe", bg: "rgba(0,39,254,.06)", accent: "rgba(0,39,254,.14)" },
} as const;

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [bizType, setBizType] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [country, setCountry] = useState("CO");

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

  // Derived language + translations
  const selectedCountry = COUNTRIES.find(c => c.code === country) ?? COUNTRIES[0];
  const lang: "en" | "es" = selectedCountry.locale.startsWith("en") ? "en" : "es";
  const t = I18N[lang];

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
      setError(t.pwError);
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
          .insert([{
            owner_id: authData.user.id,
            name: businessName,
            slug,
            settings: {
              country: selectedCountry.code,
              currency: selectedCountry.currency,
              locale: selectedCountry.locale,
            },
          }])
          .select()
          .single();

        if (tenantError) {
          if (tenantError.code === "23505") throw new Error(t.dupError);
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
      setError((err as Error).message || t.genericError);
    } finally {
      setLoading(false);
    }
  };

  const meta = t.steps[Math.min(step - 1, 3)];
  const planColors = PLAN_COLORS[plan];
  const planI18n = t.plans[plan];

  return (
    <div className={styles.page}>
      {/* ── Left brand panel ── */}
      <div className={styles.brand}>
        <div className={styles.brandLogo}>
          <div className={styles.brandLogoBox} style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
            <Image src="/zyncra-icon.png" alt="Zyncra" height={32} width={32}
              style={{ height: 32, width: "auto" }} />
            <span style={{
              fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
              fontWeight: 800, fontSize: 22, color: "white",
              letterSpacing: "-0.6px", lineHeight: 1,
            }}>Zyncra</span>
          </div>
        </div>

        <div className={styles.brandCenter}>
          {step < 5 ? (
            <>
              <div className={styles.stepDots}>
                {t.steps.map((m, i) => (
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
                {t.features.map((f, i) => (
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
              <h2 className={styles.brandTagline} style={{ whiteSpace: "pre-line" }}>{t.successTitle}</h2>
              <p style={{ color: "rgba(255,255,255,.72)", fontSize: 14, lineHeight: 1.65, marginTop: 12 }}>
                {t.successSub}
              </p>
            </>
          )}
        </div>

        <div className={styles.brandBottom}>© 2025 Zyncra</div>
      </div>

      {/* ── Right form panel ── */}
      <div className={styles.form}>
        <div className={styles.wizard}>
          <div className={styles.logoMobile}>
            <div className={styles.logoMobileBox} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Image src="/zyncra-icon.png" alt="Zyncra" height={26} width={26}
                style={{ height: 26, width: "auto" }} />
              <span style={{
                fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
                fontWeight: 800, fontSize: 19, color: "#14111C",
                letterSpacing: "-0.5px", lineHeight: 1,
              }}>Zyncra</span>
            </div>
          </div>

          {/* ── Step 1: Business type ── */}
          {step === 1 && (
            <>
              <div className={styles.wizardProgress}>
                <div className={styles.wizardProgressBar} style={{ width: "25%" }} />
              </div>
              <h1 className={styles.heading}>{t.s1heading}</h1>
              <p className={styles.subheading}>{t.s1sub}</p>

              <div className={styles.bizGrid}>
                {t.bizTypes.map(b => (
                  <button key={b.id} type="button"
                    className={`${styles.bizCard} ${bizType === b.id ? styles.bizCardActive : ""}`}
                    onClick={() => setBizType(b.id)}>
                    <span className={styles.bizEmoji}>{b.emoji}</span>
                    <span className={styles.bizLabel}>{b.label}</span>
                  </button>
                ))}
              </div>

              <div className={styles.formGroup} style={{ marginTop: 20 }}>
                <label className={styles.label}>{t.bizNameLabel}</label>
                <input type="text" className={styles.input} style={{ paddingLeft: 14 }}
                  placeholder={t.bizNamePlaceholder}
                  value={businessName} onChange={e => setBusinessName(e.target.value)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t.countryLabel}</label>
                <select
                  value={country}
                  onChange={e => { setCountry(e.target.value); }}
                  className={styles.input}
                  style={{ paddingLeft: 14, cursor: "pointer" }}
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag}  {c.name} — {c.currency}
                    </option>
                  ))}
                </select>
              </div>

              <button className={styles.button} disabled={!canContinue()} onClick={() => setStep(2)}>
                {t.continueBtn}
              </button>

              <div className={styles.footer}>
                {t.loginPrompt}{" "}
                <Link href="/login" className={styles.link}>{t.loginLink}</Link>
              </div>
            </>
          )}

          {/* ── Step 2: Operation ── */}
          {step === 2 && (
            <>
              <div className={styles.wizardProgress}>
                <div className={styles.wizardProgressBar} style={{ width: "50%" }} />
              </div>
              <h1 className={styles.heading}>{t.s2heading}</h1>
              <p className={styles.subheading}>{t.s2sub}</p>

              <p className={styles.groupLabel}>{t.teamQ}</p>
              <div className={styles.opGrid}>
                {t.collabOpts.map(o => (
                  <button key={o.id} type="button"
                    className={`${styles.opCard} ${collaborators === o.id ? styles.opCardActive : ""}`}
                    onClick={() => setCollaborators(o.id)}>
                    <span className={styles.opIcon}>{o.icon}</span>
                    <span className={styles.opLabel}>{o.label}</span>
                  </button>
                ))}
              </div>

              <p className={styles.groupLabel} style={{ marginTop: 22 }}>{t.apptQ}</p>
              <div className={styles.opGrid}>
                {t.apptOpts.map(o => (
                  <button key={o.id} type="button"
                    className={`${styles.opCard} ${appointments === o.id ? styles.opCardActive : ""}`}
                    onClick={() => setAppointments(o.id)}>
                    <span className={styles.opIcon}>{o.icon}</span>
                    <span className={styles.opLabel}>{o.label}</span>
                  </button>
                ))}
              </div>

              <p className={styles.groupLabel} style={{ marginTop: 22 }}>{t.multiQ}</p>
              <div style={{ display: "flex", gap: 12 }}>
                {[{ val: true, label: t.yesMulti }, { val: false, label: t.noMulti }].map(o => (
                  <button key={String(o.val)} type="button"
                    className={`${styles.opCard} ${multiSede === o.val ? styles.opCardActive : ""}`}
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => setMultiSede(o.val)}>
                    <span className={styles.opLabel}>{o.label}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button className={styles.btnBack} onClick={() => setStep(1)}>{t.backBtn}</button>
                <button className={styles.button} disabled={!canContinue()} onClick={() => setStep(3)} style={{ flex: 1 }}>
                  {t.continueBtn}
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
              <h1 className={styles.heading}>{t.s3heading}</h1>
              <p className={styles.subheading}>{t.s3sub}</p>

              <div className={styles.goalGrid}>
                {t.goals.map(g => (
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
                {t.goalsCount(goals.length)}
              </p>

              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button className={styles.btnBack} onClick={() => setStep(2)}>{t.backBtn}</button>
                <button className={styles.button} disabled={goals.length === 0} onClick={() => setStep(4)} style={{ flex: 1 }}>
                  {t.continueBtn}
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
              <h1 className={styles.heading}>{t.s4heading}</h1>
              <p className={styles.subheading}>{t.s4sub}</p>

              {error && (
                <div className={styles.error}>
                  <span>⚠</span> {error}
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>{t.emailLabel}</label>
                <input type="email" required className={styles.input} style={{ paddingLeft: 14 }}
                  placeholder={t.emailPlaceholder}
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  {t.whatsappLabel}{" "}
                  <span style={{ color: "#a0a0b0", fontWeight: 400 }}>{t.optional}</span>
                </label>
                <input type="tel" className={styles.input} style={{ paddingLeft: 14 }}
                  placeholder={t.whatsappPlaceholder}
                  value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t.passwordLabel}</label>
                <input type="password" required className={styles.input} style={{ paddingLeft: 14 }}
                  placeholder={t.passwordPlaceholder}
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button className={styles.btnBack} onClick={() => setStep(3)}>{t.backBtn}</button>
                <button className={styles.button}
                  disabled={loading || !email || !password}
                  onClick={handleRegister}
                  style={{ flex: 1 }}>
                  {t.createBtn(loading)}
                </button>
              </div>

              <p style={{ fontSize: 12, color: "#8E879B", textAlign: "center", marginTop: 16, lineHeight: 1.55 }}>
                {t.termsText}{" "}
                <Link href="#" className={styles.link}>{t.termsLink}</Link> {t.andText}{" "}
                <Link href="#" className={styles.link}>{t.privacyLink}</Link>
              </p>
            </>
          )}

          {/* ── Step 5: Plan recommendation ── */}
          {step === 5 && (
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 12 }}>🎉</div>
                <h1 className={styles.heading}>{t.s5heading}</h1>
                <p className={styles.subheading}>{t.s5sub}</p>
              </div>

              <div style={{
                background: planColors.bg,
                border: `1.5px solid ${planColors.accent}`,
                borderRadius: 16,
                padding: "24px 20px",
                marginBottom: 20,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: planColors.color, marginBottom: 4 }}>
                      {t.planTag}
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "#14111C", letterSpacing: "-.03em" }}>
                      Plan {plan}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: planColors.color }}>{planI18n.price}</div>
                    <div style={{ fontSize: 11, color: "#a0a0b0", marginTop: 2 }}>{t.freeTrial}</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {planI18n.reasons.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#3a3548" }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: planColors.color, display: "flex",
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
                {t.planTip}
              </div>

              <button className={styles.button} onClick={() => router.push("/admin")}>
                {t.goPanel}
              </button>

              <div className={styles.footer}>
                {t.footerTrial}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
