"use client";

import { useState, use, useEffect, Fragment } from "react";
import styles from "./booking.module.css";
import { supabase } from "@/lib/supabase";

/* ─── Constants ─── */
const TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM",
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

type FieldType = "text" | "number" | "date" | "select" | "boolean";

interface CustomField {
  id: string;
  name: string;
  field_key: string;
  field_type: FieldType;
  required: boolean;
  options: string[];
}

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

// Converts "YYYY-MM-DD" + "09:00 AM" → "20260601T090000" (floating local time for calendar)
function toCalDT(date: string, time: string): string {
  const [timePart, mod] = time.split(" ");
  let [h, m] = timePart.split(":");
  if (h === "12") h = "00";
  if (mod === "PM") h = String(parseInt(h, 10) + 12);
  const [y, mo, d] = date.split("-");
  return `${y}${mo}${d}T${h.padStart(2, "0")}${m}00`;
}

function addCalMins(dtStr: string, mins: number): string {
  const d = new Date(
    parseInt(dtStr.slice(0, 4)), parseInt(dtStr.slice(4, 6)) - 1, parseInt(dtStr.slice(6, 8)),
    parseInt(dtStr.slice(9, 11)), parseInt(dtStr.slice(11, 13)) + mins
  );
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
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
const StarIcon = ({ filled, size = 32 }: { filled: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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
  const [serviceFields, setServiceFields] = useState<CustomField[]>([]);
  const [reviewSettings, setReviewSettings] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [businessHours, setBusinessHours] = useState<Record<string, { open: boolean; start: string; end: string }> | null>(null);

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  // Booking selections
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>("any");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Contact details
  const [details, setDetails] = useState({ name: "", phone: "", email: "" });
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [bookedClientId, setBookedClientId] = useState<string | null>(null);

  // Post-booking review
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

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

      const [
        { data: svcData },
        { data: profData },
        { data: brandData },
        { data: reviewData },
      ] = await Promise.all([
        supabase.from("services").select("*").eq("tenant_id", tenantData.id).order("name"),
        supabase.from("professionals").select("*").eq("tenant_id", tenantData.id).eq("is_active", true),
        supabase.from("branding").select("*").eq("tenant_id", tenantData.id).limit(1),
        supabase.from("google_review_settings").select("*").eq("tenant_id", tenantData.id).limit(1),
      ]);

      if (svcData) setServices(svcData);
      if (profData) setProfessionals(profData);
      if (brandData && brandData.length > 0) setBranding(brandData[0]);
      if (reviewData && reviewData.length > 0) setReviewSettings(reviewData[0]);
      // El horario viene de tenants.settings.schedule (mismo campo que la app mobile)
      if (tenantData.settings?.schedule) setBusinessHours(tenantData.settings.schedule);
      setLoadingData(false);
    }
    load();
  }, [slug]);

  /* ─── Load booked slots when date or professional changes ─── */
  useEffect(() => {
    if (!tenant || !selectedDate) {
      setBookedSlots(new Set());
      return;
    }
    async function fetchSlots() {
      setLoadingSlots(true);

      const toKey = (time: string) => {
        const [h, m] = time.split(":");
        const hr = parseInt(h);
        const suffix = hr >= 12 ? "PM" : "AM";
        const h12 = hr % 12 || 12;
        return `${h12.toString().padStart(2, "0")}:${m} ${suffix}`;
      };

      if (selectedProfessional === "any") {
        // Trae todas las citas del día con su profesional
        const { data } = await supabase
          .from("appointments")
          .select("appointment_time, professional_id")
          .eq("tenant_id", tenant.id)
          .eq("appointment_date", selectedDate)
          .in("status", ["pending", "confirmed"]);

        const totalProfs = professionals.length;
        const booked = new Set<string>();

        if (totalProfs > 0 && data) {
          // Agrupa por horario: cuántos profesionales distintos están ocupados
          const slotBusy: Record<string, Set<string>> = {};
          for (const a of data as any[]) {
            const key = toKey(a.appointment_time);
            if (!slotBusy[key]) slotBusy[key] = new Set();
            if (a.professional_id) slotBusy[key].add(a.professional_id);
          }
          // Solo bloquea si TODOS los profesionales están ocupados en ese horario
          for (const [key, busy] of Object.entries(slotBusy)) {
            if (busy.size >= totalProfs) booked.add(key);
          }
        }
        setBookedSlots(booked);
      } else {
        // Profesional específico: solo sus citas
        const { data } = await supabase
          .from("appointments")
          .select("appointment_time")
          .eq("tenant_id", tenant.id)
          .eq("appointment_date", selectedDate)
          .eq("professional_id", selectedProfessional!)
          .in("status", ["pending", "confirmed"]);

        setBookedSlots(new Set<string>((data ?? []).map((a: any) => toKey(a.appointment_time))));
      }
      setLoadingSlots(false);
    }
    fetchSlots();
  }, [tenant, selectedDate, selectedProfessional]);

  /* ─── Cargar campos del servicio seleccionado ─── */
  useEffect(() => {
    if (!selectedService) { setServiceFields([]); return; }
    supabase
      .from("custom_fields").select("*")
      .eq("service_id", selectedService)
      .eq("active", true)
      .order("position")
      .then(({ data }) => {
        setServiceFields((data ?? []).map((f: any) => ({ ...f, options: Array.isArray(f.options) ? f.options : [] })));
      });
  }, [selectedService]);

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

  const timeToMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

  // Returns the effective schedule for a given day of week.
  // When a specific professional is selected and has their own schedule, that takes precedence.
  const getEffectiveHours = (dayOfWeek: number) => {
    const key = String(dayOfWeek);
    if (selectedProfessional && selectedProfessional !== "any") {
      const prof = professionals.find(p => p.id === selectedProfessional);
      const profDay = (prof as any)?.schedule?.[key];
      if (profDay !== undefined) return profDay as { open: boolean; start: string; end: string };
    }
    return (businessHours?.[key] ?? null) as { open: boolean; start: string; end: string } | null;
  };

  // businessHours usa claves "0"-"6" = Date.getDay() (mismo esquema que app mobile)
  const isDayClosed = (day: number) => {
    const h = getEffectiveHours(new Date(calYear, calMonth, day).getDay());
    return h ? !h.open : false;
  };

  const availableSlots = (() => {
    if (!selectedDate) return TIME_SLOTS;
    const [y, mo, d] = selectedDate.split("-").map(Number);
    const h = getEffectiveHours(new Date(y, mo - 1, d).getDay());
    if (!h) return TIME_SLOTS; // sin horario configurado → mostrar todo
    if (!h.open) return [];    // día explícitamente cerrado → sin slots
    const start = timeToMin(h.start), end = timeToMin(h.end);
    return TIME_SLOTS.filter(slot => {
      const m = timeToMin(convertTo24h(slot).slice(0, 5));
      return m >= start && m < end;
    });
  })();

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
        // Asigna el profesional: si eligió uno específico lo usa directamente;
        // si eligió "sin preferencia", elige al libre con menos citas en la semana.
        let profId: string | null = null;
        if (selectedProfessional !== "any") {
          profId = selectedProfessional;
        } else if (professionals.length > 0) {
          const timeStr = selectedTime ? convertTo24h(selectedTime) : "09:00:00";
          const [dy, dmo, dd] = selectedDate!.split("-").map(Number);
          const dayOfWeek = new Date(dy, dmo - 1, dd).getDay();
          const dayKey = String(dayOfWeek);
          const slotMin = timeToMin(timeStr.slice(0, 5));

          // Solo profesionales que trabajan ese día y hora según su horario personal (o el del negocio)
          const workingProfs = professionals.filter((p: any) => {
            const sched = p.schedule ?? businessHours;
            if (!sched) return true;
            const dayH = sched[dayKey];
            if (!dayH || !dayH.open) return false;
            return slotMin >= timeToMin(dayH.start) && slotMin < timeToMin(dayH.end);
          });
          const candidatePool = workingProfs.length > 0 ? workingProfs : professionals;

          // Cuáles profesionales están ocupados a esa hora exacta
          const { data: busyNow } = await supabase
            .from("appointments")
            .select("professional_id")
            .eq("tenant_id", tenant.id)
            .eq("appointment_date", selectedDate!)
            .eq("appointment_time", timeStr)
            .in("status", ["pending", "confirmed"]);

          const busyIds = new Set((busyNow ?? []).map((a: any) => a.professional_id).filter(Boolean));
          const freeProfs = candidatePool.filter((p: any) => !busyIds.has(p.id));
          const pool = freeProfs.length > 0 ? freeProfs : candidatePool;

          if (pool.length === 1) {
            profId = pool[0].id;
          } else {
            // Cuenta citas de la semana por profesional y elige el que menos tenga
            const d = new Date(selectedDate!);
            const dow = d.getDay();
            const mondayOffset = dow === 0 ? -6 : 1 - dow;
            const monday = new Date(d); monday.setDate(d.getDate() + mondayOffset);
            const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
            const toISO = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

            const { data: weekApts } = await supabase
              .from("appointments")
              .select("professional_id")
              .eq("tenant_id", tenant.id)
              .gte("appointment_date", toISO(monday))
              .lte("appointment_date", toISO(sunday))
              .in("status", ["pending", "confirmed"]);

            const countMap: Record<string, number> = {};
            for (const a of weekApts ?? []) {
              if (a.professional_id) countMap[a.professional_id] = (countMap[a.professional_id] || 0) + 1;
            }

            const sorted = [...pool].sort((a: any, b: any) => (countMap[a.id] || 0) - (countMap[b.id] || 0));
            profId = sorted[0].id;
          }
        }

        const { data: apptData } = await supabase.from("appointments").insert({
          tenant_id: tenant.id,
          client_id: clientId,
          service_id: selectedService,
          professional_id: profId,
          appointment_date: selectedDate,
          appointment_time: selectedTime ? convertTo24h(selectedTime) : "09:00:00",
          status: "pending",
        }).select("id").single();

        // Save service field values
        const allFields = [...serviceFields];
        if (allFields.length > 0) {
          const upserts = allFields
            .filter(f => fieldValues[f.id] !== undefined && fieldValues[f.id] !== "")
            .map(f => ({
              tenant_id: tenant.id,
              client_id: clientId,
              field_id: f.id,
              field_key: f.field_key,
              value: fieldValues[f.id],
            }));
          if (upserts.length > 0) {
            await supabase.from("client_field_values").upsert(upserts, { onConflict: "client_id,field_id" });
          }
        }

        setBookedClientId(clientId);
      }
      setIsBooked(true);
    } catch (err) {
      console.error("Booking error:", err);
      alert("Hubo un error al procesar tu reserva. Por favor intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Review submit ─── */
  const handleReviewSubmit = async () => {
    if (!tenant || reviewRating === 0) return;
    setSubmittingReview(true);
    await supabase.from("site_reviews").insert({
      tenant_id: tenant.id,
      client_name: details.name || "Anónimo",
      rating: reviewRating,
      comment: reviewComment || null,
      status: "pending",
    });
    setSubmittingReview(false);
    setReviewSubmitted(true);
  };

  /* ─── Calendar export ─── */
  const addToGoogleCalendar = () => {
    if (!selectedDate || !selectedTime) return;
    const start = toCalDT(selectedDate, selectedTime);
    const end = addCalMins(start, selectedSvc?.duration_minutes ?? 60);
    const profLabel = selectedProfessional === "any" ? "Por asignar" : (selectedProf?.name ?? "");
    const title = encodeURIComponent(`Cita: ${selectedSvc?.name ?? "Servicio"} en ${businessName}`);
    const desc  = encodeURIComponent(`Profesional: ${profLabel}\nReservado con Zyncra`);
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${desc}`,
      "_blank"
    );
  };

  const downloadICS = () => {
    if (!selectedDate || !selectedTime) return;
    const start = toCalDT(selectedDate, selectedTime);
    const end = addCalMins(start, selectedSvc?.duration_minutes ?? 60);
    const profLabel = selectedProfessional === "any" ? "Por asignar" : (selectedProf?.name ?? "");
    const now = new Date();
    const stamp = [
      now.getUTCFullYear(),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
      String(now.getUTCDate()).padStart(2, "0"),
      "T",
      String(now.getUTCHours()).padStart(2, "0"),
      String(now.getUTCMinutes()).padStart(2, "0"),
      String(now.getUTCSeconds()).padStart(2, "0"),
      "Z",
    ].join("");
    const uid = `${selectedDate.replace(/-/g, "")}T${start.slice(9)}@zyncra.app`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Zyncra//Booking//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:Cita: ${selectedSvc?.name ?? "Servicio"} en ${businessName}`,
      `DESCRIPTION:Profesional: ${profLabel}\\nReservado con Zyncra`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "cita-zyncra.ics"; a.click();
    URL.revokeObjectURL(url);
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
            margin: "0 auto 16px", opacity: 0.8,
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
    const showReview = reviewSettings?.show_on_booking && reviewSettings?.google_maps_url;
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
                { label: "Profesional", value: selectedProfessional === "any" ? "Cualquier profesional" : selectedProf?.name },
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

            {/* Add to calendar */}
            <div style={{ background: "rgba(0,39,254,0.04)", border: "1px solid rgba(0,39,254,0.12)", borderRadius: 16, padding: "16px 18px", marginBottom: 20, textAlign: "left" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111118", marginBottom: 12 }}>
                Agregar al calendario
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {/* Google Calendar */}
                <button onClick={addToGoogleCalendar} style={{ flex: 1, minWidth: 130, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e8e6e2", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 12, fontWeight: 700, color: "#1a1a2e", fontFamily: "inherit" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google Calendar
                </button>
                {/* ICS — Apple, Outlook, Yahoo, etc. */}
                <button onClick={downloadICS} style={{ flex: 1, minWidth: 130, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e8e6e2", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 12, fontWeight: 700, color: "#1a1a2e", fontFamily: "inherit" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Apple · Outlook · Otros
                </button>
              </div>
            </div>

            {/* Site review prompt */}
            {!reviewSubmitted && (
              <div style={{ background: "#f7f5f2", border: "1px solid #e8e6e2", borderRadius: 16, padding: "20px", marginBottom: 20, textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111118", marginBottom: 4 }}>¿Cómo fue tu experiencia?</div>
                <div style={{ fontSize: 12, color: "#6b6b80", marginBottom: 14 }}>Tu opinión ayuda al negocio y a otros clientes</div>
                <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 14 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setReviewRating(star)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: star <= reviewRating ? "#fbbf24" : "#d1d5db", transition: "color 0.15s" }}>
                      <StarIcon filled={star <= reviewRating} size={30} />
                    </button>
                  ))}
                </div>
                {reviewRating > 0 && (
                  <>
                    <textarea
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      placeholder="Cuéntanos cómo fue (opcional)..."
                      rows={2}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e8e6e2", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", resize: "none", boxSizing: "border-box", outline: "none", marginBottom: 10 }}
                    />
                    <button onClick={handleReviewSubmit} disabled={submittingReview}
                      style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {submittingReview ? "Enviando..." : "Enviar reseña"}
                    </button>
                  </>
                )}
              </div>
            )}
            {reviewSubmitted && (
              <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
                ¡Gracias por tu reseña! 🌟
              </div>
            )}

            {/* Google Maps review button */}
            {showReview && (
              <a href={reviewSettings.google_maps_url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "white", border: "1.5px solid #e8e6e2", borderRadius: 12, padding: "12px 20px", marginBottom: 10, fontSize: 13, fontWeight: 700, color: "#3a3a48", textDecoration: "none", transition: "box-shadow 0.15s" }}>
                <span style={{ fontSize: 18 }}>⭐</span> Déjanos una reseña en Google
              </a>
            )}

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

          <p className={styles.poweredBy} style={hasDarkBg ? { color: "rgba(255,255,255,0.3)" } : {}}>
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
            </span>
          </div>
        )}

        {/* ─── Main card ─── */}
        <div className={styles.card}>

          {/* ═══════════ STEP 1 – SERVICES ═══════════ */}
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
                        {svc.image_url ? (
                          <img src={svc.image_url} alt={svc.name} className={styles.serviceThumb} />
                        ) : (
                          <div className={styles.serviceIcon}
                            style={{ background: primaryTint, color: primaryColor }}>
                            <SparkleIcon />
                          </div>
                        )}
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
                        <div className={styles.servicePrice} style={{ color: primaryColor }}>
                          ${svc.price}
                        </div>
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

          {/* ═══════════ STEP 2 – PROF / DATE / TIME ═══════════ */}
          {step === 2 && (
            <div>
              <h2 className={styles.stepTitle}>Elige tu profesional y fecha</h2>

              {/* 1. Professional selection */}
              {professionals.length > 0 && (
                <div className={styles.subSection}>
                  <h3 className={styles.subTitle}>¿Con quién te atiendes?</h3>
                  <div className={styles.profGrid}>
                    {/* "Any professional" option */}
                    <div
                      className={`${styles.profCard} ${selectedProfessional === "any" ? styles.profCardSel : ""}`}
                      style={selectedProfessional === "any" ? { borderColor: primaryColor, background: primaryTint, boxShadow: `0 0 0 2px ${primaryColor}` } : {}}
                      onClick={() => { setSelectedProfessional("any"); setSelectedTime(null); }}
                      role="button" tabIndex={0}
                      onKeyDown={e => e.key === "Enter" && (setSelectedProfessional("any"), setSelectedTime(null))}
                    >
                      <div className={styles.profInitials}
                        style={{ background: "linear-gradient(135deg, #94a3b8, #64748b)", fontSize: 22 }}>
                        ✦
                      </div>
                      <div className={styles.profName}>Sin preferencia</div>
                      <div className={styles.profRole}>Cualquiera</div>
                    </div>
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

              {/* 2. Calendar — days blocked/enabled by the selected professional's schedule */}
              <div className={styles.subSection}>
                <h3 className={styles.subTitle}>¿Qué día?</h3>

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
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`e${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const past = isPast(day);
                    const closed = !past && isDayClosed(day);
                    const today = isToday(day);
                    const sel = isSelected(day);
                    return (
                      <button
                        key={day}
                        className={`${styles.calDay} ${past || closed ? styles.calDayPast : ""} ${today && !sel ? styles.calDayToday : ""} ${sel ? styles.calDaySelected : ""}`}
                        style={
                          sel
                            ? { background: primaryColor, borderColor: primaryColor, color: "white" }
                            : today && !closed
                            ? { borderColor: primaryColor, color: primaryColor }
                            : {}
                        }
                        onClick={() => selectDay(day)}
                        disabled={past || closed}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && selectedProfessional && (
                <div className={styles.subSection}>
                  <h3 className={styles.subTitle}>
                    Horarios disponibles
                    {loadingSlots && <span style={{ fontWeight: 400, color: "#a0a0b0", marginLeft: 8 }}>verificando...</span>}
                  </h3>
                  <div className={styles.timeGrid}>
                    {availableSlots.length === 0 && (
                      <p style={{ fontSize: 13, color: "#a0a0b0", gridColumn: "1/-1", textAlign: "center", padding: "12px 0" }}>
                        Este día no hay atención disponible
                      </p>
                    )}
                    {availableSlots.map(time => {
                      const sel = selectedTime === time;
                      const occupied = bookedSlots.has(time);
                      return (
                        <button
                          key={time}
                          className={`${styles.timeSlot} ${sel ? styles.timeSlotSel : ""}`}
                          style={
                            sel
                              ? { background: primaryColor, borderColor: primaryColor, color: "white" }
                              : occupied
                              ? { background: "#f7f5f2", borderColor: "#e8e6e2", color: "#d0ceca", cursor: "not-allowed", textDecoration: "line-through" }
                              : {}
                          }
                          onClick={() => !occupied && setSelectedTime(time)}
                          disabled={occupied}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                  {bookedSlots.size > 0 && (
                    <p style={{ fontSize: 11, color: "#a0a0b0", marginTop: 10, textAlign: "center" }}>
                      Los horarios tachados ya están reservados
                    </p>
                  )}
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

          {/* ═══════════ STEP 3 – CONTACT FORM ═══════════ */}
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

                {/* Campos del servicio seleccionado */}
                {serviceFields.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#a0a0b0", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14, marginTop: 4, borderTop: "1px solid #f0eeeb", paddingTop: 20 }}>
                      Información del servicio
                    </div>
                    {serviceFields.map(f => (
                      <div key={f.id} className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          {f.name}
                          {f.required && <span style={{ color: "#f87171", marginLeft: 4 }}>*</span>}
                        </label>
                        {f.field_type === "boolean" ? (
                          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 0" }}>
                            <input type="checkbox"
                              checked={fieldValues[f.id] === "true"}
                              onChange={e => setFieldValues(v => ({ ...v, [f.id]: e.target.checked ? "true" : "false" }))}
                              style={{ accentColor: primaryColor, width: 18, height: 18 }} />
                            <span style={{ fontSize: 14, color: "#3a3a48" }}>Sí</span>
                          </label>
                        ) : f.field_type === "select" ? (
                          <select required={f.required} value={fieldValues[f.id] ?? ""}
                            onChange={e => setFieldValues(v => ({ ...v, [f.id]: e.target.value }))}
                            className={styles.inputField}>
                            <option value="">— Seleccionar —</option>
                            {f.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input
                            type={f.field_type === "number" ? "number" : f.field_type === "date" ? "date" : "text"}
                            required={f.required}
                            value={fieldValues[f.id] ?? ""}
                            onChange={e => setFieldValues(v => ({ ...v, [f.id]: e.target.value }))}
                            className={styles.inputField}
                          />
                        )}
                      </div>
                    ))}
                  </>
                )}

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
