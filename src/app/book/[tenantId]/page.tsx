"use client";

import { useState, use, useEffect, Fragment } from "react";
import styles from "./booking.module.css";
import { supabase } from "@/lib/supabase";

/* ─── Constants ─── */
const TIME_SLOTS = [
  "08:00 AM", "08:45 AM", "09:30 AM", "10:15 AM",
  "11:00 AM", "11:45 AM", "12:30 PM", "01:15 PM",
  "02:00 PM", "02:45 PM", "03:30 PM", "04:15 PM",
  "05:00 PM", "05:45 PM", "06:30 PM",
];

const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DAYS_SHORT = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];

const STEPS = [
  { n: 1, label: "Servicio" },
  { n: 2, label: "Fecha y hora" },
  { n: 3, label: "Tus datos" },
];

/* ─── Helpers ─── */
function hexToRgba(hex: string, alpha: number): string {
  try {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch {
    return `rgba(251,15,5,${alpha})`;
  }
}

function formatDateLong(year: number, month: number, day: number): string {
  const date = new Date(year, month, day);
  const dayNames = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  return `${dayNames[date.getDay()]} ${day} de ${MONTHS_ES[month]}`;
}

function convertTo24h(timeStr: string): string {
  const [timePart, modifier] = timeStr.split(" ");
  let [hours, minutes] = timePart.split(":");
  if (hours === "12") hours = "00";
  if (modifier === "PM") hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, "0")}:${minutes}:00`;
}

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

/* ─── SVG Icons ─── */
const CheckIcon = ({ size = 12, stroke = "white", strokeWidth = 3 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);
const ClockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
  </svg>
);
const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
  </svg>
);
const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

/* ─── Main Component ─── */
export default function BookingPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId: slug } = use(params);

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [branding, setBranding] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // ISO "YYYY-MM-DD"
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [details, setDetails] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  /* ─── Data loading ─── */
  useEffect(() => {
    async function load() {
      const { data: tenants } = await supabase
        .from("tenants").select("*").eq("slug", slug).limit(1);

      if (!tenants || tenants.length === 0) {
        setNotFound(true);
        setLoadingData(false);
        return;
      }

      const tenantData = tenants[0];
      setTenant(tenantData);

      const [{ data: svcData }, { data: profData }, { data: brandData }] = await Promise.all([
        supabase.from("services").select("*").eq("tenant_id", tenantData.id).order("name"),
        supabase.from("professionals").select("*").eq("tenant_id", tenantData.id).eq("is_active", true),
        supabase.from("branding").select("*").eq("tenant_id", tenantData.id).limit(1),
      ]);

      if (svcData) setServices(svcData);
      if (profData) setProfessionals(profData);
      if (brandData && brandData.length > 0) setBranding(brandData[0]);
      setLoadingData(false);
    }
    load();
  }, [slug]);

  /* ─── Brand tokens ─── */
  const primaryColor = branding?.primary_color || "#fb0f05";
  const secondaryColor = branding?.secondary_color || "#0027fe";
  const businessName = branding?.business_name || tenant?.name ||
    slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const businessPhone = branding?.phone || tenant?.phone;
  const hasDarkBg = !!branding?.background_image_url;

  const primaryTint = hexToRgba(primaryColor, 0.08);
  const primaryTintMed = hexToRgba(primaryColor, 0.15);

  const cssVars = {
    "--accent-blue": primaryColor,
    "--accent-secondary": secondaryColor,
    "--accent-tint": primaryTint,
    "--accent-tint-med": primaryTintMed,
  } as React.CSSProperties;

  /* ─── Calendar helpers ─── */
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);

  const isPast = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    d.setHours(0, 0, 0, 0);
    return d < todayMidnight;
  };
  const isToday = (day: number) =>
    calYear === now.getFullYear() && calMonth === now.getMonth() && day === now.getDate();
  const isSelected = (day: number) =>
    selectedDate === `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const canGoPrev = !(calYear === now.getFullYear() && calMonth === now.getMonth());
  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    if (isPast(day)) return;
    const iso = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(iso);
    setSelectedProfessional(null);
    setSelectedTime(null);
  };

  /* ─── Booking submit ─── */
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !selectedDate) return;
    setSubmitting(true);
    try {
      const cleanPhone = details.phone.replace(/\D/g, "").slice(0, 10);

      const { data: existing } = await supabase
        .from("clients").select("id")
        .eq("phone", cleanPhone).eq("tenant_id", tenant.id).maybeSingle();

      let clientId = existing?.id;
      if (!clientId) {
        const { data: newClient } = await supabase
          .from("clients")
          .insert({ tenant_id: tenant.id, name: details.name, phone: cleanPhone, email: details.email })
          .select("id").single();
        clientId = newClient?.id;
      }

      if (clientId) {
        await supabase.from("appointments").insert({
          tenant_id: tenant.id,
          client_id: clientId,
          service_id: selectedService,
          professional_id: selectedProfessional,
          appointment_date: selectedDate,
          appointment_time: selectedTime ? convertTo24h(selectedTime) : "09:00:00",
          status: "pending",
        });
      }
      setIsBooked(true);
    } catch (err) {
      console.error("Booking error:", err);
      alert("Hubo un error al procesar tu reserva. Por favor intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Derived display values ─── */
  const selectedSvc = services.find(s => s.id === selectedService);
  const selectedProf = professionals.find(p => p.id === selectedProfessional);
  const selectedDateDisplay = selectedDate ? (() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return formatDateLong(y, m - 1, d);
  })() : null;

  /* ─── Page background ─── */
  const pageBg = branding?.background_image_url
    ? `linear-gradient(rgba(5,8,20,0.88), rgba(5,8,20,0.88)), url('${branding.background_image_url}') center/cover no-repeat fixed`
    : "#f7f5f2";

  /* ─── Header sub-component ─── */
  const Header = () => (
    <div className={styles.header}>
      {branding?.logo_url ? (
        <div className={styles.logoWrap}>
          <img
            src={branding.logo_url} alt={businessName}
            style={{
              width: `${branding.logo_size || 85}%`,
              height: `${branding.logo_size || 85}%`,
              objectFit: "contain",
              objectPosition: branding.logo_object_position || "center",
            }}
          />
        </div>
      ) : (
        <div
          className={styles.businessName}
          style={hasDarkBg
            ? { color: "white" }
            : { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          {businessName}
        </div>
      )}
      <p className={styles.subtitle} style={hasDarkBg ? { color: "rgba(255,255,255,0.65)" } : {}}>
        {branding?.welcome_message || "Reserva tu cita en minutos"}
      </p>
    </div>
  );

  /* ─── Loading ─── */
  if (loadingData) {
    return (
      <main style={{ minHeight: "100vh", background: "#f7f5f2", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "50%",
            background: "linear-gradient(135deg, #fb0f05, #0027fe)",
            margin: "0 auto 16px",
            opacity: 0.8,
          }} />
          <p style={{ color: "#6b6b80", fontSize: "14px", fontWeight: 600 }}>Cargando disponibilidad…</p>
        </div>
      </main>
    );
  }

  /* ─── Not found ─── */
  if (notFound) {
    return (
      <main style={{ minHeight: "100vh", background: "#f7f5f2", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "24px" }}>
        <div style={{ textAlign: "center", maxWidth: "360px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111118", marginBottom: "8px" }}>Negocio no encontrado</h2>
          <p style={{ fontSize: "14px", color: "#6b6b80" }}>El enlace que usas no corresponde a ningún negocio registrado en Zyncra.</p>
        </div>
      </main>
    );
  }

  /* ─── Confirmation screen ─── */
  if (isBooked) {
    return (
      <main className={styles.pageWrapper} style={{ ...cssVars, background: pageBg }}>
        <div className={styles.container}>
          <Header />

          <div className={styles.card} style={{ textAlign: "center", padding: "36px 28px" }}>
            {/* Check circle */}
            <div className={styles.confirmIcon}
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
              <CheckIcon size={32} strokeWidth={2.5} />
            </div>

            <h2 className={styles.confirmTitle}>¡Cita confirmada!</h2>
            <p className={styles.confirmSubtitle}>
              Gracias, <strong>{details.name}</strong>. Tu cita ha sido registrada con éxito.
            </p>

            {/* Summary */}
            <div className={styles.confirmSummary}>
              {[
                { label: "Servicio", value: selectedSvc?.name },
                { label: "Profesional", value: selectedProf?.name },
                { label: "Fecha", value: selectedDateDisplay, capitalize: true },
                { label: "Hora", value: selectedTime },
              ].map(({ label, value, capitalize }, idx, arr) => (
                <div key={label} className={styles.confirmRow}
                  style={idx === arr.length - 1 ? { borderBottom: "none" } : {}}>
                  <span className={styles.confirmLabel}>{label}</span>
                  <span className={styles.confirmValue}
                    style={capitalize ? { textTransform: "capitalize" } : {}}>{value}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className={styles.confirmActions}>
              {businessPhone && (
                <a
                  className={styles.whatsappBtn}
                  href={`https://wa.me/${businessPhone.replace(/\D/g, "")}?text=Hola%2C+acabo+de+reservar+una+cita+para+${encodeURIComponent(selectedSvc?.name || "")}+el+${encodeURIComponent(selectedDateDisplay || "")}+a+las+${encodeURIComponent(selectedTime || "")}.`}
                  target="_blank" rel="noopener noreferrer"
                >
                  📲 Confirmar por WhatsApp
                </a>
              )}
              <button className={styles.bookAgainBtn} onClick={() => window.location.reload()}>
                Reservar otra cita
              </button>
            </div>
          </div>

          <p className={styles.poweredBy} style={hasDarkBg ? { color: "rgba(255,255,255,0.35)" } : {}}>
            Reservas con <strong>Zyncra</strong>
          </p>
        </div>
      </main>
    );
  }

  /* ─── Main booking flow ─── */
  return (
    <main className={styles.pageWrapper} style={{ ...cssVars, background: pageBg }}>
      <div className={styles.container}>

        {/* ─── Header ─── */}
        <Header />

        {/* ─── Progress bar ─── */}
        <div className={styles.progressBar}>
          {STEPS.map(({ n, label }, idx) => (
            <Fragment key={n}>
              {idx > 0 && (
                <div className={styles.progressLine}
                  style={{ background: step > idx ? primaryColor : hasDarkBg ? "rgba(255,255,255,0.2)" : "#e8e6e2" }} />
              )}
              <div className={styles.progressStep}>
                <div
                  className={styles.progressDot}
                  style={{
                    background: step > n ? primaryColor
                      : step === n ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                      : hasDarkBg ? "rgba(255,255,255,0.1)" : "white",
                    border: `2px solid ${step >= n ? primaryColor : hasDarkBg ? "rgba(255,255,255,0.25)" : "#e8e6e2"}`,
                    color: step >= n ? "white" : hasDarkBg ? "rgba(255,255,255,0.5)" : "#a0a0b0",
                  }}
                >
                  {step > n ? <CheckIcon /> : n}
                </div>
                <span className={styles.progressLabel}
                  style={{ color: step >= n ? (hasDarkBg ? "white" : "#111118") : (hasDarkBg ? "rgba(255,255,255,0.4)" : "#a0a0b0") }}>
                  {label}
                </span>
              </div>
            </Fragment>
          ))}
        </div>

        {/* ─── Selection summary pill ─── */}
        {step >= 2 && selectedSvc && (
          <div className={styles.selectionPill}
            style={{ background: primaryTint, borderColor: primaryColor + "30" }}>
            <div className={styles.summaryCheck} style={{ background: primaryColor }}>
              <CheckIcon size={10} />
            </div>
            <span className={styles.summaryText}>
              <strong>{selectedSvc.name}</strong>
              {" · "}{selectedSvc.duration_minutes} min · <strong>${selectedSvc.price}</strong>
              {step >= 3 && selectedDateDisplay && (
                <> · <span style={{ textTransform: "capitalize" }}>{selectedDateDisplay}</span></>
              )}
              {step >= 3 && selectedTime && <> · {selectedTime}</>}
              {step >= 3 && selectedProf && <> · {selectedProf.name}</>}
            </span>
          </div>
        )}

        {/* ─── Main card ─── */}
        <div className={styles.card}>

          {/* ═══════════════════════════════ STEP 1 – SERVICES ═══════════════════════════════ */}
          {step === 1 && (
            <div>
              <h2 className={styles.stepTitle}>¿Qué servicio necesitas?</h2>

              {services.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Este negocio aún no tiene servicios disponibles. Contacta directamente.</p>
                </div>
              ) : (
                <div className={styles.serviceList}>
                  {services.map((svc) => {
                    const sel = selectedService === svc.id;
                    return (
                      <div
                        key={svc.id}
                        className={`${styles.serviceRow} ${sel ? styles.serviceRowSelected : ""}`}
                        style={sel ? { borderColor: primaryColor, background: primaryTint } : {}}
                        onClick={() => setSelectedService(svc.id)}
                        role="button" tabIndex={0}
                        onKeyDown={e => e.key === "Enter" && setSelectedService(svc.id)}
                      >
                        {/* Thumb */}
                        {svc.image_url ? (
                          <img src={svc.image_url} alt={svc.name} className={styles.serviceThumb} />
                        ) : (
                          <div className={styles.serviceIcon}
                            style={{ background: primaryTint, color: primaryColor }}>
                            <SparkleIcon />
                          </div>
                        )}

                        {/* Info */}
                        <div className={styles.serviceInfo}>
                          <div className={styles.serviceName}>{svc.name}</div>
                          {svc.description && (
                            <div className={styles.serviceDesc}>{svc.description}</div>
                          )}
                          <div className={styles.serviceMeta}>
                            <span className={styles.durationChip}>
                              <ClockIcon /> {svc.duration_minutes} min
                            </span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className={styles.servicePrice} style={{ color: primaryColor }}>
                          ${svc.price}
                        </div>

                        {/* Check */}
                        {sel && (
                          <div className={styles.serviceCheck} style={{ background: primaryColor }}>
                            <CheckIcon size={11} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className={styles.actions}>
                <div />
                <button
                  className="btn-primary"
                  style={selectedService ? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` } : {}}
                  disabled={!selectedService}
                  onClick={() => setStep(2)}
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════ STEP 2 – DATE / PROF / TIME ════════════════════ */}
          {step === 2 && (
            <div>
              <h2 className={styles.stepTitle}>¿Cuándo te gustaría venir?</h2>

              {/* Calendar navigation */}
              <div className={styles.calNav}>
                <button className={styles.calNavBtn} onClick={prevMonth} disabled={!canGoPrev} aria-label="Mes anterior">
                  <ChevronLeft />
                </button>
                <span className={styles.calMonthLabel}>
                  {MONTHS_ES[calMonth]} {calYear}
                </span>
                <button className={styles.calNavBtn} onClick={nextMonth} aria-label="Mes siguiente">
                  <ChevronRight />
                </button>
              </div>

              {/* Calendar grid */}
              <div className={styles.calGrid}>
                {DAYS_SHORT.map(d => (
                  <div key={d} className={styles.calDayHeader}>{d}</div>
                ))}
                {/* Offset empty cells for first day */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`e${i}`} />
                ))}
                {/* Days */}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const past = isPast(day);
                  const today = isToday(day);
                  const sel = isSelected(day);
                  return (
                    <button
                      key={day}
                      className={`${styles.calDay} ${past ? styles.calDayPast : ""} ${today && !sel ? styles.calDayToday : ""} ${sel ? styles.calDaySelected : ""}`}
                      style={
                        sel
                          ? { background: primaryColor, borderColor: primaryColor, color: "white" }
                          : today
                          ? { borderColor: primaryColor, color: primaryColor }
                          : {}
                      }
                      onClick={() => selectDay(day)}
                      disabled={past}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Professional selection */}
              {selectedDate && professionals.length > 0 && (
                <div className={styles.subSection}>
                  <h3 className={styles.subTitle}>¿Con quién te atiendes?</h3>
                  <div className={styles.profGrid}>
                    {professionals.map(prof => {
                      const sel = selectedProfessional === prof.id;
                      return (
                        <div
                          key={prof.id}
                          className={`${styles.profCard} ${sel ? styles.profCardSel : ""}`}
                          style={sel ? { borderColor: primaryColor, background: primaryTint, boxShadow: `0 0 0 2px ${primaryColor}` } : {}}
                          onClick={() => { setSelectedProfessional(prof.id); setSelectedTime(null); }}
                          role="button" tabIndex={0}
                          onKeyDown={e => e.key === "Enter" && (setSelectedProfessional(prof.id), setSelectedTime(null))}
                        >
                          {prof.avatar_url ? (
                            <img src={prof.avatar_url} alt={prof.name} className={styles.profAvatar} />
                          ) : (
                            <div className={styles.profInitials}
                              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                              {initials(prof.name)}
                            </div>
                          )}
                          <div className={styles.profName}>{prof.name}</div>
                          <div className={styles.profRole}>{prof.role}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Time slots */}
              {selectedDate && selectedProfessional && (
                <div className={styles.subSection}>
                  <h3 className={styles.subTitle}>Horarios disponibles</h3>
                  <div className={styles.timeGrid}>
                    {TIME_SLOTS.map(time => {
                      const sel = selectedTime === time;
                      return (
                        <button
                          key={time}
                          className={`${styles.timeSlot} ${sel ? styles.timeSlotSel : ""}`}
                          style={sel ? { background: primaryColor, borderColor: primaryColor, color: "white" } : {}}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={styles.actions}>
                <button className="btn-secondary" onClick={() => setStep(1)}>← Atrás</button>
                <button
                  className="btn-primary"
                  style={selectedDate && selectedProfessional && selectedTime
                    ? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }
                    : {}}
                  disabled={!selectedDate || !selectedProfessional || !selectedTime}
                  onClick={() => setStep(3)}
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════ STEP 3 – CONTACT FORM ══════════════════════════ */}
          {step === 3 && (
            <div>
              <h2 className={styles.stepTitle}>¿A quién reservamos?</h2>

              <form onSubmit={handleConfirm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nombre completo</label>
                  <input
                    type="text" required autoFocus
                    className={styles.inputField}
                    placeholder="Ej. María García"
                    value={details.name}
                    onChange={e => setDetails({ ...details, name: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    WhatsApp <span className={styles.labelNote}>(10 dígitos, sin código de país)</span>
                  </label>
                  <input
                    type="tel" required
                    className={styles.inputField}
                    placeholder="3000000000"
                    value={details.phone}
                    onChange={e => setDetails({ ...details, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    pattern="\d{10}"
                    title="Ingresa exactamente 10 dígitos sin espacios"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Correo electrónico <span className={styles.labelNote}>(opcional)</span>
                  </label>
                  <input
                    type="email"
                    className={styles.inputField}
                    placeholder="maria@email.com"
                    value={details.email}
                    onChange={e => setDetails({ ...details, email: e.target.value })}
                  />
                </div>

                <div className={styles.policyNote}>
                  <InfoIcon />
                  <span>Recibirás un recordatorio por WhatsApp 24h antes. Política de cancelación de 24 horas.</span>
                </div>

                <div className={styles.actions}>
                  <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
                    ← Atrás
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    {submitting ? "Reservando…" : "Confirmar reserva ✓"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ─── Help CTA ─── */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a
            className={styles.helpLink}
            style={hasDarkBg ? { background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" } : {}}
            href={businessPhone
              ? `https://wa.me/${businessPhone.replace(/\D/g, "")}?text=Hola%2C+no+encuentro+un+horario+disponible%2C+%C2%BFme+pueden+ayudar%3F`
              : `https://wa.me/?text=Hola%2C+quiero+agendar+una+cita`}
            target="_blank" rel="noopener noreferrer"
          >
            💬 ¿No encuentras horario? Contactar al negocio
          </a>
        </div>

        <p className={styles.poweredBy} style={hasDarkBg ? { color: "rgba(255,255,255,0.3)" } : {}}>
          Reservas con <strong>Zyncra</strong>
        </p>
      </div>
    </main>
  );
}
