"use client";

import { useState, use, useEffect } from "react";
import styles from "./booking.module.css";
import { supabase } from "@/lib/supabase";

const TIME_SLOTS = [
  "09:00 AM", "09:45 AM", "10:30 AM", "11:15 AM", "01:00 PM", "01:45 PM", "02:30 PM", "03:15 PM"
];

export default function BookingPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const unwrappedParams = use(params);
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [details, setDetails] = useState({ name: "", phone: "", email: "" });
  const [isBooked, setIsBooked] = useState(false);

  useEffect(() => {
    async function loadTenantData() {
      // 1. Fetch Tenant
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', unwrappedParams.tenantId)
        .single();
      
      if (tenantData) {
        setTenant(tenantData);

        // 2. Fetch Services
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('tenant_id', tenantData.id);
        
        if (servicesData) setServices(servicesData);

        // 3. Fetch Professionals
        const { data: profData } = await supabase
          .from('professionals')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .eq('is_active', true);
        
        if (profData) setProfessionals(profData);
      }
      setLoadingData(false);
    }
    loadTenantData();
  }, [unwrappedParams.tenantId]);

  const formatTenantName = (slug: string) => {
    if (tenant?.name) return tenant.name;
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    try {
      // 1. Upsert Client (find or create by phone)
      let clientId;
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', details.phone)
        .eq('tenant_id', tenant.id)
        .single();
        
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient } = await supabase
          .from('clients')
          .insert({
            tenant_id: tenant.id,
            name: details.name,
            phone: details.phone,
            email: details.email
          })
          .select('id')
          .single();
        clientId = newClient?.id;
      }

      // 2. Create Appointment
      if (clientId) {
        await supabase
          .from('appointments')
          .insert({
            tenant_id: tenant.id,
            client_id: clientId,
            service_id: selectedService,
            professional_id: selectedProfessional,
            appointment_date: `2026-05-${selectedDate?.toString().padStart(2, '0')}`,
            appointment_time: selectedTime,
            status: 'pending'
          });
      }

      setIsBooked(true);
    } catch (err) {
      console.error("Error booking:", err);
      alert("Hubo un error al procesar tu reserva.");
    }
  };

  if (isBooked) {
    const serviceName = services.find(s => s.id === selectedService)?.name;
    const profName = professionals.find(p => p.id === selectedProfessional)?.name;
    
    return (
      <main className={styles.wizardContainer}>
        <div className="card" style={{ textAlign: "center", padding: "var(--spacing-2xl) var(--spacing-lg)" }}>
          <div style={{ color: "var(--success)", fontSize: "48px", marginBottom: "var(--spacing-md)" }}>✓</div>
          <h2 className={styles.sectionTitle}>¡Reserva Confirmada!</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "var(--spacing-lg)" }}>
            Gracias, {details.name}. Hemos registrado tu cita.
          </p>
          
          <div style={{ backgroundColor: "var(--bg-base)", padding: "var(--spacing-lg)", borderRadius: "var(--radius-base)", marginBottom: "var(--spacing-xl)", textAlign: "left" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "var(--spacing-md)", borderBottom: "1px solid var(--border-light)", paddingBottom: "8px" }}>Detalles de tu cita</h3>
            <p style={{ marginBottom: "8px" }}><strong>Servicio:</strong> {serviceName}</p>
            <p style={{ marginBottom: "8px" }}><strong>Profesional:</strong> {profName}</p>
            <p style={{ marginBottom: "8px" }}><strong>Fecha:</strong> {selectedDate} de Mayo 2026</p>
            <p style={{ marginBottom: "0" }}><strong>Hora:</strong> {selectedTime}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
            <button 
              className="btn-primary" 
              style={{ backgroundColor: "#25D366", borderColor: "#25D366", color: "white" }}
              onClick={() => window.open(`https://wa.me/1234567890?text=Hola, acabo de reservar una cita para ${serviceName} el ${selectedDate} de Mayo a las ${selectedTime}.`, "_blank")}
            >
              Ir al WhatsApp de la tienda
            </button>
            <button className="btn-secondary" onClick={() => window.location.reload()}>
              Reservar otra cita
            </button>
          </div>
        </div>
      </main>
    );
  }

    if (loadingData) {
      return (
        <main className={styles.wizardContainer} style={{ textAlign: "center", paddingTop: "100px" }}>
          <h2>Cargando disponibilidad...</h2>
        </main>
      );
    }

    return (
      <main className={styles.wizardContainer}>
        <div className={styles.header}>
          {tenant?.settings?.coverImage && (
            <div style={{ 
              width: "100%", height: "200px", backgroundImage: `url(${tenant.settings.coverImage})`, 
              backgroundSize: "cover", backgroundPosition: "center", borderRadius: "var(--radius-base)", marginBottom: "var(--spacing-md)" 
            }} />
          )}
          <h1 className={styles.salonName}>{formatTenantName(unwrappedParams.tenantId)}</h1>
          <p className={styles.subtitle}>Reserva tu cita en 3 simples pasos</p>
        </div>

        <div className={styles.stepIndicator}>
          <div className={`${styles.step} ${step >= 1 ? styles.active : ""} ${step > 1 ? styles.completed : ""}`}>1</div>
          <div className={`${styles.step} ${step >= 2 ? styles.active : ""} ${step > 2 ? styles.completed : ""}`}>2</div>
          <div className={`${styles.step} ${step >= 3 ? styles.active : ""}`}>3</div>
        </div>

        <div className="card">
          {step === 1 && (
            <div>
              <h2 className={styles.sectionTitle}>Selecciona un Servicio</h2>
              <div className={styles.grid}>
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`${styles.serviceCard} ${selectedService === service.id ? styles.selected : ""}`}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <div className={styles.serviceContent}>
                      <div className={styles.serviceName}>{service.name}</div>
                      <div className={styles.serviceDesc}>{service.description}</div>
                      <div className={styles.serviceMeta}>
                        <div className={styles.serviceDuration}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          {service.duration_minutes} min
                        </div>
                        <div className={styles.servicePrice}>${service.price}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            <div className={styles.actions}>
              <div />
              <button className="btn-primary" disabled={!selectedService} onClick={handleNext}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className={styles.sectionTitle}>Fecha y Profesional</h2>
            
            <div className={styles.calendarHeader}>
              <span>Mayo 2026</span>
            </div>
            <div className={styles.calendarGrid}>
              {["D", "L", "M", "M", "J", "V", "S"].map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>{d}</div>
              ))}
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <div 
                  key={day} 
                  className={`${styles.calendarDay} ${selectedDate === day ? styles.selected : ""} ${day < 5 ? styles.disabled : ""}`}
                  onClick={() => day >= 5 && setSelectedDate(day)}
                >
                  {day}
                </div>
              ))}
            </div>

            {selectedDate && (
              <div style={{ marginTop: "var(--spacing-xl)" }}>
                <h3 className={styles.sectionTitle} style={{ fontSize: "16px" }}>¿Con quién te gustaría atenderte?</h3>
                <div className={styles.professionalGrid}>
                  {professionals.map((prof) => (
                    <div 
                      key={prof.id} 
                      className={`${styles.professionalCard} ${selectedProfessional === prof.id ? styles.selected : ""}`}
                      onClick={() => setSelectedProfessional(prof.id)}
                    >
                      <div className={styles.avatar} style={prof.avatar_url ? { backgroundImage: `url(${prof.avatar_url})`, backgroundSize: 'cover' } : {}}>{!prof.avatar_url && prof.name.substring(0, 2).toUpperCase()}</div>
                      <div className={styles.profName}>{prof.name}</div>
                      <div className={styles.profRole}>{prof.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedProfessional && (
              <div style={{ marginTop: "var(--spacing-xl)" }}>
                <h3 className={styles.sectionTitle} style={{ fontSize: "16px" }}>Horarios Disponibles</h3>
                <div className={styles.timeGrid}>
                  {TIME_SLOTS.map((time) => (
                    <div
                      key={time}
                      className={`${styles.timeSlot} ${selectedTime === time ? styles.selected : ""}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <button className="btn-secondary" onClick={handleBack}>Atrás</button>
              <button className="btn-primary" disabled={!selectedDate || !selectedProfessional || !selectedTime} onClick={handleNext}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className={styles.sectionTitle}>Tus Datos</h2>
            <form onSubmit={handleConfirm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  className={styles.inputField} 
                  placeholder="Ej. Juan Pérez"
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Número de WhatsApp</label>
                <input 
                  type="tel" 
                  required
                  className={styles.inputField} 
                  placeholder="+34 600 000 000"
                  value={details.phone}
                  onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Correo Electrónico (Opcional)</label>
                <input 
                  type="email" 
                  className={styles.inputField} 
                  placeholder="juan@ejemplo.com"
                  value={details.email}
                  onChange={(e) => setDetails({ ...details, email: e.target.value })}
                />
              </div>

              <div style={{ padding: "var(--spacing-md)", backgroundColor: "var(--bg-base)", borderRadius: "var(--radius-base)", marginTop: "var(--spacing-lg)" }}>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  <strong>Nota:</strong> Al confirmar, aceptas nuestra política de cancelación de 24 horas. Recibirás un recordatorio por WhatsApp.
                </p>
              </div>

              <div className={styles.actions}>
                <button type="button" className="btn-secondary" onClick={handleBack}>Atrás</button>
                <button type="submit" className="btn-primary">
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
