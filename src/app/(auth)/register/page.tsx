"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import styles from "../auth.module.css";
import { IconCheck } from "@/app/admin/ZyncraIcons";

const TRIAL_CODE = "freetrialzyncra";

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
    steps: [
      { title: "Tu negocio",   subtitle: "Cuéntanos sobre lo que haces" },
      { title: "Tu operación", subtitle: "¿Cómo trabajas día a día?" },
      { title: "Tus retos",    subtitle: "¿Qué quieres mejorar?" },
      { title: "Tu cuenta",    subtitle: "¡Solo faltan tus datos!" },
      { title: "Tu plan",      subtitle: "Activa tu acceso" },
    ],
    features: ["Sin tarjeta de crédito", "Plan personalizado para ti", "Soporte en español incluido"],
    successTitle: "¡Tu cuenta\nestá lista!",
    successSub: "Tu período de prueba está activo. Empieza a gestionar todo en minutos.",
    s1heading: "¿Qué tipo de negocio tienes?",
    s1sub: "Esto nos ayuda a personalizar todo para ti",
    bizNameLabel: "Nombre de tu negocio",
    bizNamePlaceholder: "Ej: Black Fade Barbershop",
    countryLabel: "País de operación",
    continueBtn: "Continuar →",
    loginPrompt: "¿Ya tienes cuenta?",
    loginLink: "Inicia sesión",
    s2heading: "¿Cómo funciona tu negocio?",
    s2sub: "Datos clave para calibrar tu plan perfecto",
    teamQ: "¿Cuántas personas trabajan contigo?",
    apptQ: "¿Cuántas citas atiendes por día?",
    multiQ: "¿Tienes más de una sede?",
    yesMulti: "Sí, varias sedes",
    noMulti: "No, solo una",
    backBtn: "← Atrás",
    s3heading: "¿Qué quieres mejorar?",
    s3sub: "Elige hasta 3 prioridades para tu negocio",
    goalsCount: (n: number) => `${n}/3 seleccionados`,
    s4heading: "Crea tu cuenta",
    s4sub: "Un paso más para empezar a gestionar tu negocio",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "tu@correo.com",
    whatsappLabel: "WhatsApp",
    optional: "(opcional)",
    whatsappPlaceholder: "+57 300 000 0000",
    passwordLabel: "Contraseña",
    passwordPlaceholder: "Mín. 6 caracteres, 1 mayúscula, 1 número",
    createBtn: (loading: boolean) => loading ? "Creando tu cuenta..." : "Crear cuenta →",
    termsText: "Al registrarte aceptas los",
    termsLink: "Términos de uso",
    andText: "y la",
    privacyLink: "Política de privacidad",
    s5heading: "Elige tu plan",
    s5sub: "Durante nuestro lanzamiento, el acceso es por invitación con un código especial",
    trialLabel: "Trial — 30 días gratuitos",
    trialDesc: "Acceso completo a todas las funciones de Zyncra sin costo durante 30 días.",
    trialFeatures: [
      "Agenda y calendario ilimitado",
      "Gestión de clientes (CRM)",
      "Sistema POS y cobros",
      "Recordatorios automáticos",
      "WhatsApp Marketing",
      "Reportes y finanzas",
    ],
    trialCodeLabel: "Código de activación",
    trialCodePlaceholder: "Ingresa tu código aquí",
    trialCodeError: "Código incorrecto. Verifica e intenta de nuevo.",
    activateBtn: (loading: boolean) => loading ? "Activando..." : "Activar 30 días gratis →",
    paidComingSoon: "Planes de pago — Próximamente",
    s6heading: "¡Listo!",
    s6sub: "Tu cuenta está activa. Tienes 30 días para explorar todo Zyncra.",
    goPanel: "Ir a mi panel →",
    footerTrial: "30 días de prueba — sin tarjeta de crédito",
    pwError: "La contraseña debe tener mínimo 6 caracteres, 1 mayúscula y 1 número.",
    dupError: "El nombre de este negocio ya está en uso.",
    genericError: "Ocurrió un error al crear tu cuenta.",
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
  },
  en: {
    steps: [
      { title: "Your business",   subtitle: "Tell us about what you do" },
      { title: "Your operation",  subtitle: "How do you work day to day?" },
      { title: "Your goals",      subtitle: "What do you want to improve?" },
      { title: "Your account",    subtitle: "Just your details left!" },
      { title: "Your plan",       subtitle: "Activate your access" },
    ],
    features: ["No credit card required", "Personalized plan for you", "Support included"],
    successTitle: "You're all set!",
    successSub: "Your trial is active. Start managing everything in minutes.",
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
    createBtn: (loading: boolean) => loading ? "Creating your account..." : "Create account →",
    termsText: "By registering you accept the",
    termsLink: "Terms of use",
    andText: "and the",
    privacyLink: "Privacy policy",
    s5heading: "Choose your plan",
    s5sub: "During our launch, access is by invitation with a special code",
    trialLabel: "Trial — 30 days free",
    trialDesc: "Full access to all Zyncra features at no cost for 30 days.",
    trialFeatures: [
      "Unlimited scheduling & calendar",
      "Client management (CRM)",
      "POS & payments",
      "Automatic reminders",
      "WhatsApp Marketing",
      "Reports & finances",
    ],
    trialCodeLabel: "Activation code",
    trialCodePlaceholder: "Enter your code here",
    trialCodeError: "Incorrect code. Please check and try again.",
    activateBtn: (loading: boolean) => loading ? "Activating..." : "Activate 30 days free →",
    paidComingSoon: "Paid plans — Coming soon",
    s6heading: "All done!",
    s6sub: "Your account is active. You have 30 days to explore everything Zyncra has to offer.",
    goPanel: "Go to my panel →",
    footerTrial: "30-day trial — no credit card required",
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
  },
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface SaasPlan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  description: string | null;
  features: string[];
  active: boolean;
}

// ── Plan logic ────────────────────────────────────────────────────────────────

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

  // Step 5 - plan activation
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [trialCodeDB, setTrialCodeDB] = useState(TRIAL_CODE);
  const [trialDaysDB, setTrialDaysDB] = useState(14);

  const TRIAL_FEATURES = [
    "Agenda y calendario ilimitado",
    "Gestión de clientes (CRM)",
    "Sistema POS y cobros",
    "Recordatorios automáticos",
    "WhatsApp Marketing",
    "Reportes y finanzas",
  ];

  useEffect(() => {
    if (step !== 5) return;
    async function fetchStep5() {
      const [{ data: plansData }, { data: settingsData }] = await Promise.all([
        // Paid plans to show as "Próximamente"
        supabase.from("saas_plans").select("*").eq("active", true).gt("price", 0).order("price"),
        supabase.from("platform_settings").select("key, value"),
      ]);
      setPlans((plansData ?? []).map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
      })));
      if (settingsData && settingsData.length > 0) {
        const m = new Map((settingsData as any[]).map(s => [s.key as string, s.value as string]));
        if (m.has("trial_code")) setTrialCodeDB(m.get("trial_code")!.toLowerCase());
        if (m.has("trial_days")) setTrialDaysDB(Number(m.get("trial_days")) || 14);
      }
    }
    fetchStep5();
  }, [step]);

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
              owner_email: email,
              owner_phone: whatsapp || null,
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

          setTenantId(tenantData.id);
        }

        setStep(5);
      }
    } catch (err: unknown) {
      setError((err as Error).message || t.genericError);
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePlan = async () => {
    if (!tenantId) return;
    setCodeError(null);
    setActivateError(null);

    // Validate activation code
    if (promoCode.trim().toLowerCase() !== trialCodeDB) {
      setCodeError(t.trialCodeError);
      return;
    }

    setActivating(true);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDaysDB);

    // Try free plan first, then any plan (cheapest), to satisfy plan_id FK if NOT NULL
    const { data: planData } = await supabase
      .from("saas_plans")
      .select("id")
      .order("price", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("saas_subscriptions").insert({
      tenant_id: tenantId,
      plan_id: planData?.id ?? null,
      status: "trial",
      amount: 0,
      trial_ends_at: trialEndsAt.toISOString(),
    });

    setActivating(false);
    if (error) {
      setActivateError("No se pudo activar el trial. Verifica el código o intenta de nuevo.");
      return;
    }
    setStep(6);
  };

  const meta = t.steps[Math.min(step - 1, 4)];

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
          {step < 6 ? (
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
                <div className={styles.wizardProgressBar} style={{ width: "20%" }} />
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
                <div className={styles.wizardProgressBar} style={{ width: "40%" }} />
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
                <div className={styles.wizardProgressBar} style={{ width: "60%" }} />
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
                <div className={styles.wizardProgressBar} style={{ width: "80%" }} />
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

          {/* ── Step 5: Plan selection ── */}
          {step === 5 && (
            <>
              <div className={styles.wizardProgress}>
                <div className={styles.wizardProgressBar} style={{ width: "95%" }} />
              </div>
              <h1 className={styles.heading}>{t.s5heading}</h1>
              <p className={styles.subheading} style={{ marginBottom: 24 }}>
                Empieza gratis, sin tarjeta de crédito. Cancela cuando quieras.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>

                {/* ── Trial card (always available) ── */}
                <div style={{
                  border: "2px solid #fb0f05",
                  borderRadius: 16,
                  padding: "20px 20px",
                  background: "rgba(251,15,5,0.03)",
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute", top: -11, left: 16,
                    background: "linear-gradient(135deg,#fb0f05,#0027fe)",
                    color: "white", fontSize: 10, fontWeight: 700,
                    padding: "3px 12px", borderRadius: 20,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>
                    ✓ Disponible ahora
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%",
                        background: "#fb0f05", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "white" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#14111C" }}>Trial — 14 días gratis</div>
                        <div style={{ fontSize: 12, color: "#8E879B", marginTop: 2 }}>Acceso completo a todas las funciones</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#fb0f05" }}>Gratis</div>
                      <div style={{ fontSize: 11, color: "#8E879B" }}>14 días</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginLeft: 28, marginBottom: 18 }}>
                    {TRIAL_FEATURES.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#3a3548" }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: "50%", background: "#fb0f05",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <IconCheck size={9} strokeWidth={3} />
                        </div>
                        {f}
                      </div>
                    ))}
                  </div>

                  {/* Código de activación */}
                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: 16 }}>
                    <label style={{
                      display: "block", fontSize: 11, fontWeight: 700, color: "#8E879B",
                      marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>
                      {t.trialCodeLabel}
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      style={{ paddingLeft: 14, fontFamily: "monospace", letterSpacing: "0.05em" }}
                      placeholder={t.trialCodePlaceholder}
                      value={promoCode}
                      onChange={e => { setPromoCode(e.target.value); setCodeError(null); }}
                      onKeyDown={e => e.key === "Enter" && handleActivatePlan()}
                      autoFocus
                    />
                    {codeError && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>⚠</span> {codeError}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Paid plans (locked) ── */}
                {plans.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ fontSize: 12, color: "#a0a0b8", fontWeight: 600, textAlign: "center", margin: "4px 0 0" }}>
                      Planes de pago — próximamente
                    </p>
                    {plans.map(plan => (
                      <div key={plan.id} style={{
                        border: "1.5px solid rgba(0,0,0,0.08)",
                        borderRadius: 14, padding: "14px 18px",
                        background: "rgba(0,0,0,0.02)",
                        opacity: 0.55, position: "relative",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div style={{ position: "absolute", top: -10, right: 14,
                          background: "rgba(0,0,0,0.12)", color: "white",
                          fontSize: 9, fontWeight: 700, padding: "2px 9px",
                          borderRadius: 20, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          Próximamente
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#14111C" }}>{plan.name}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#14111C" }}>
                          {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(plan.price)}
                          <span style={{ fontSize: 11, color: "#8E879B", fontWeight: 400 }}>/mes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {activateError && (
                <div style={{ marginBottom: 12, fontSize: 13, color: "#ef4444", fontWeight: 600,
                  background: "rgba(239,68,68,0.07)", borderRadius: 10, padding: "10px 14px",
                  border: "1px solid rgba(239,68,68,0.2)" }}>
                  ⚠ {activateError}
                </div>
              )}

              <button
                className={styles.button}
                disabled={activating}
                onClick={handleActivatePlan}
              >
                {activating ? "Activando..." : "Activar 14 días gratis →"}
              </button>

              <p style={{ fontSize: 12, color: "#8E879B", textAlign: "center", marginTop: 14 }}>
                Sin tarjeta de crédito · Cancela cuando quieras
              </p>
            </>
          )}

          {/* ── Step 6: Success ── */}
          {step === 6 && (
            <>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 16 }}>🎉</div>
                <h1 className={styles.heading}>{t.s6heading}</h1>
                <p className={styles.subheading}>{t.s6sub}</p>
              </div>

              <div style={{
                background: "rgba(251,15,5,0.05)", border: "1.5px solid rgba(251,15,5,0.14)",
                borderRadius: 14, padding: "16px 20px", marginBottom: 24,
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <div style={{ fontSize: 32, lineHeight: 1 }}>⏳</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#14111C" }}>Trial activo — 14 días</div>
                  <div style={{ fontSize: 12, color: "#8E879B", marginTop: 2 }}>
                    Vence el {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
              </div>

              <button className={styles.button} onClick={() => { window.location.href = "/admin"; }}>
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
