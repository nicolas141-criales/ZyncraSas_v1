"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import styles from "./admin.module.css";
import { supabase } from "@/lib/supabase";
import { AdminContext, type Location } from "./admin-context";
import {
  IconGrid, IconCalendar, IconBell, IconChat, IconCreditCard,
  IconBanknotes, IconDocument, IconChartBar, IconStar, IconStorefront,
  IconUsers, IconUserGroup, IconPalette, IconPackage,
  IconCog, IconLogout, IconX, IconServiceBell, IconMapPin,
} from "./ZyncraIcons";
import NotificationsBell from "./NotificationsBell";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Keyframes globales del panel — usados por charts.tsx y las páginas
const ZN_KEYFRAMES = `
@keyframes znFade { from { opacity: 0 } to { opacity: 1 } }
@keyframes znFadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
@keyframes znRise { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes znGrow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes znDraw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes znShimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
@keyframes znSpin { to { transform: rotate(360deg) } }
@keyframes znProgress { 0% { width: 0% } 80% { width: 85% } 100% { width: 100% } }
@keyframes znPulse { 0%,100% { opacity: .4 } 50% { opacity: 1 } }
@keyframes znPop { 0% { transform: scale(.55); opacity: 0 } 65% { transform: scale(1.12) } 100% { transform: scale(1); opacity: 1 } }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
`;

// Nav item types
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  soon?: boolean;
}
interface NavGroup { label: string; items: NavItem[]; }

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Panel",
    items: [
      { href: "/admin",           label: "Resumen",        icon: <IconGrid size={17} /> },
      { href: "/admin/calendar",  label: "Calendario",     icon: <IconCalendar size={17} /> },
      { href: "/admin/reminders", label: "Recordatorios",  icon: <IconBell size={17} /> },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/whatsapp",      label: "Marketing WhatsApp", icon: <IconChat size={17} /> },
      { href: "/admin/reviews-google",label: "Reseñas Google",     icon: <IconStar size={17} /> },
      { href: "/admin/reviews-site",  label: "Reseñas del Negocio",icon: <IconStorefront size={17} /> },
    ],
  },
  {
    label: "Ventas",
    items: [
      { href: "/admin/finanzas",   label: "Módulo Financiero",   icon: <IconChartBar size={17} /> },
      { href: "/admin/pos",        label: "Sistema POS",         icon: <IconCreditCard size={17} /> },
      { href: "/admin/inventario", label: "Inventario",          icon: <IconPackage size={17} /> },
      { href: "/admin/caja",       label: "Sistema de Caja",     icon: <IconBanknotes size={17} /> },
      { href: "/admin/invoices",   label: "Factura Electrónica", icon: <IconDocument size={17} /> },
      { href: "/admin/commissions",label: "Comisiones",          icon: <IconChartBar size={17} /> },
    ],
  },
  {
    label: "Clientes",
    items: [
      { href: "/admin/clients",       label: "Clientes (CRM)",      icon: <IconUsers size={17} /> },
    ],
  },
  {
    label: "Negocio",
    items: [
      { href: "/admin/services",      label: "Servicios",    icon: <IconServiceBell size={17} /> },
      { href: "/admin/professionals", label: "Equipo",       icon: <IconUserGroup size={17} /> },
      { href: "/admin/locations",     label: "Sedes",        icon: <IconMapPin size={17} /> },
      { href: "/admin/branding",      label: "Mi Marca",     icon: <IconPalette size={17} /> },
      { href: "/admin/settings",      label: "Configuración",icon: <IconCog size={17} /> },
    ],
  },
];

// Pages that are coming soon
const COMING_SOON = new Set<string>([]);

interface SaasPlanRow {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  description: string | null;
  features: string[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [tenantInfo, setTenantInfo] = useState<{ id: string; slug: string; name: string; logoUrl: string | null; currency: string; locale: string } | null>(null);

  // Multi-sede state
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationIdState] = useState<string | null>(null);
  const [locationSelectorOpen, setLocationSelectorOpen] = useState(false);

  // Trial state
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [upgradePlans, setUpgradePlans] = useState<SaasPlanRow[]>([]);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: tenants } = await supabase
        .from("tenants").select("id, slug, name, settings").eq("owner_id", session.user.id).limit(1);

      if (tenants && tenants.length > 0) {
        const tenant = tenants[0] as any;
        const [{ data: brandingRows }, { data: subData }, { data: plansData }] = await Promise.all([
          supabase.from("branding").select("logo_url").eq("tenant_id", tenant.id).limit(1),
          supabase.from("saas_subscriptions")
            .select("status, trial_ends_at, saas_plans(name)")
            .eq("tenant_id", tenant.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from("saas_plans")
            .select("id, name, price, billing_cycle, description, features")
            .eq("active", true)
            .gt("price", 0)
            .order("price"),
        ]);

        const currency = tenant.settings?.currency ?? "COP";
        const locale   = tenant.settings?.locale   ?? "es-CO";
        setTenantInfo({ ...tenant, logoUrl: brandingRows?.[0]?.logo_url ?? null, currency, locale });

        // Cargar sedes activas
        const { data: locs } = await supabase
          .from("locations")
          .select("id, name, address, phone, is_active")
          .eq("tenant_id", tenant.id)
          .eq("is_active", true)
          .order("name");
        const locationsList: Location[] = locs ?? [];
        setLocations(locationsList);

        // Restaurar sede guardada o usar la primera
        if (locationsList.length > 0) {
          const saved = typeof window !== "undefined"
            ? localStorage.getItem(`zyncra_loc_${tenant.id}`) : null;
          const valid = locationsList.find(l => l.id === saved);
          setLocationIdState((valid ?? locationsList[0]).id);
        }

        // subData puede ser null si no hay suscripción o si la RLS bloquea la lectura.
        // En ambos casos tratamos al usuario como trial (todos los nuevos empiezan en trial).
        const status = subData?.status ?? "trial";
        const endsAt = subData?.trial_ends_at ?? null;
        const fetchedPlanName = (subData as any)?.saas_plans?.name ?? null;
        setSubStatus(status);
        setTrialEndsAt(endsAt);
        setPlanName(fetchedPlanName);

        if (status === "trial") {
          if (endsAt) {
            const daysLeft = Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86400000);
            if (daysLeft <= 0) {
              setTrialExpired(true);
              setUpgradePlans((plansData ?? []).map((p: any) => ({
                ...p,
                features: Array.isArray(p.features) ? p.features : [],
              })));
            }
          }
          // Sin endsAt: muestra banner sin cuenta regresiva (no expira automáticamente)
        }
      }
      setLoadingAuth(false);
    }
    checkAuth();
  }, [router]);

  const trialDaysLeft = subStatus === "trial" && trialEndsAt
    ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)
    : null;

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  const setLocationId = useCallback((id: string) => {
    setLocationIdState(id);
    if (tenantInfo?.id) {
      localStorage.setItem(`zyncra_loc_${tenantInfo.id}`, id);
    }
    setLocationSelectorOpen(false);
  }, [tenantInfo?.id]);

  const refreshCurrency = useCallback(async () => {
    if (!tenantInfo) return;
    const { data: t } = await (supabase as any).from("tenants").select("settings").eq("id", tenantInfo.id).maybeSingle();
    if (t) {
      const currency = t.settings?.currency ?? "COP";
      const locale   = t.settings?.locale   ?? "es-CO";
      setTenantInfo(prev => prev ? { ...prev, currency, locale } : prev);
    }
  }, [tenantInfo]);

  const currentPageLabel = (() => {
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (item.href === pathname) return item.label;
      }
    }
    return "Panel";
  })();

  const currentGroupLabel = (() => {
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (item.href === pathname) return group.label;
      }
    }
    return "Panel";
  })();

  if (loadingAuth) {
    return (
      <div className={`${instrumentSerif.variable} ${jetbrainsMono.variable}`}
        style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 22, background: "#F4F4F9" }}>
        <style>{ZN_KEYFRAMES}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 10, animation: "znFadeUp .5s ease both" }}>
          <Image src="/zyncra-icon.png" alt="Zyncra" height={34} width={34} style={{ height: 34, width: "auto" }} />
          <span style={{
            fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
            fontWeight: 700, fontSize: 23, color: "#14111C", letterSpacing: "-0.6px",
          }}>Zyncra</span>
        </div>
        <div style={{ width: 148, height: 3, borderRadius: 2, background: "rgba(20,15,30,0.07)", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: "40%", borderRadius: 2,
            background: "linear-gradient(90deg,#fb0f05,#0027fe)",
            animation: "znLoader 1.1s cubic-bezier(.45,0,.55,1) infinite",
          }} />
        </div>
        <style>{`@keyframes znLoader { 0% { margin-left: -40% } 100% { margin-left: 100% } }`}</style>
        <p style={{
          color: "#8E879B", fontSize: 13, margin: 0,
          fontFamily: "var(--font-instrument-serif),'Instrument Serif',serif", fontStyle: "italic",
        }}>Preparando tu negocio…</p>
      </div>
    );
  }

  if (!tenantInfo) {
    return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>Error: no se encontró el negocio.</div>;
  }

  const initials = tenantInfo.name.substring(0, 2).toUpperCase();
  const locationName = locations.find(l => l.id === locationId)?.name ?? null;

  return (
    <AdminContext.Provider value={{
      tenantId: tenantInfo.id, tenantSlug: tenantInfo.slug,
      businessName: tenantInfo.name, logoUrl: tenantInfo.logoUrl,
      currency: tenantInfo.currency, locale: tenantInfo.locale, refreshCurrency,
      locationId, locationName, locations, setLocationId,
    }}>
      <div className={`${styles.adminLayout} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
        <style>{ZN_KEYFRAMES}</style>

        {/* Mobile overlay */}
        <div className={`${styles.overlay} ${sidebarOpen ? styles.open : ""}`} onClick={() => setSidebarOpen(false)} />

        {/* ── Sidebar ── */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>

          {/* Logo + Plan badge — fijo */}
          <div className={styles.brand}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                <Image src="/zyncra-icon.png" alt="Zyncra" height={28} width={28}
                  style={{ height: 28, width: "auto" }} />
                <span style={{
                  fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
                  fontWeight: 700, fontSize: 19, color: "white",
                  letterSpacing: "-0.5px", lineHeight: 1,
                }}>Zyncra</span>
                <span style={{
                  fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace",
                  fontSize: 8.5, fontWeight: 600, letterSpacing: "0.14em",
                  color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
                  border: "1px solid rgba(255,255,255,0.16)", borderRadius: 5,
                  padding: "2.5px 6px", marginLeft: 2,
                }}>Panel</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer", padding: 4, display: "none" }}
                className={styles.menuToggle}>
                <IconX size={18} />
              </button>
            </div>

            {/* Plan badge — siempre visible debajo del logo */}
            {(() => {
              const isTrial = subStatus === "trial" || subStatus === null;
              const isActive = subStatus === "active";
              const urgency = isTrial && trialDaysLeft !== null && trialDaysLeft <= 3;
              const displayName = isTrial
                ? "Trial gratuito"
                : (planName ?? (isActive ? "Plan activo" : "Suscripción"));

              return (
                <div style={{
                  marginTop: 12,
                  padding: "9px 11px",
                  borderRadius: 9,
                  background: urgency
                    ? "rgba(248,113,113,0.08)"
                    : "rgba(255,255,255,0.04)",
                  border: urgency
                    ? "1px solid rgba(248,113,113,0.22)"
                    : "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  transition: "background .3s, border-color .3s",
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      color: urgency ? "rgba(248,113,113,0.6)" : "rgba(255,255,255,0.27)",
                      marginBottom: 3,
                      fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace",
                    }}>
                      Plan actual
                    </div>
                    <div style={{
                      fontSize: 12.5, fontWeight: 700, lineHeight: 1,
                      color: urgency ? "#fca5a5" : "rgba(255,255,255,0.80)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
                    }}>
                      {displayName}
                    </div>
                  </div>

                  {/* Indicador derecho */}
                  {isTrial ? (
                    trialDaysLeft !== null ? (
                      <div style={{
                        flexShrink: 0,
                        padding: "3px 8px", borderRadius: 6,
                        background: urgency ? "rgba(248,113,113,0.18)" : "rgba(255,255,255,0.07)",
                        border: urgency ? "1px solid rgba(248,113,113,0.35)" : "1px solid rgba(255,255,255,0.09)",
                        fontSize: 11, fontWeight: 800, lineHeight: 1.2,
                        color: urgency ? "#f87171" : "rgba(255,255,255,0.50)",
                        fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace",
                        textAlign: "center" as const,
                      }}>
                        {trialDaysLeft}d
                      </div>
                    ) : (
                      <div style={{
                        flexShrink: 0,
                        padding: "3px 8px", borderRadius: 6,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                        color: "rgba(255,255,255,0.32)",
                        fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace",
                        textAlign: "center" as const,
                        textTransform: "uppercase" as const,
                      }}>
                        Prueba
                      </div>
                    )
                  ) : (
                    <div style={{
                      flexShrink: 0,
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "3px 8px", borderRadius: 6,
                      background: "rgba(16,185,129,0.10)",
                      border: "1px solid rgba(16,185,129,0.22)",
                    }}>
                      <div style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: "#10b981",
                        boxShadow: "0 0 5px rgba(16,185,129,0.7)",
                      }} />
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                        color: "#34d399", textTransform: "uppercase" as const,
                        fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace",
                      }}>
                        Activo
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Nav groups — scrollable */}
          <div className={styles.sidebarNav}>
            {NAV_GROUPS.map(group => (
              <div key={group.label} className={styles.navGroup}>
                <div className={styles.navGroupLabel}>{group.label}</div>
                {group.items.map(item => {
                  const isActive = pathname === item.href;
                  const isSoon = COMING_SOON.has(item.href);
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                      className={`${styles.navItem} ${isActive ? styles.active : ""}`}>
                      <span className={styles.navIcon}>{item.icon}</span>
                      {item.label}
                      {isSoon && !isActive && <span className={styles.navComingSoon}>Pronto</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Cerrar sesión — fijo */}
          <div className={styles.sidebarBottom}>
            <div className={styles.navLogout} onClick={handleLogout}>
              <IconLogout size={17} />
              Cerrar sesión
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className={styles.mainContent}>
          <main className={styles.contentArea}>
          <header className={styles.header}>
            <button className={styles.menuToggle} onClick={() => setSidebarOpen(o => !o)} aria-label="Menú">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div className={styles.headerTitle}>
              <span className={styles.headerCrumb}>{currentGroupLabel} /</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentPageLabel}</span>
            </div>

            <div className={styles.headerRight}>
              {/* Nombre del salón + selector de sede integrado */}
              <div className={styles.hideMobile} style={{ position: "relative", display: "flex", alignItems: "center" }}>
                {locations.length > 1 ? (
                  <>
                    <button
                      onClick={() => setLocationSelectorOpen(o => !o)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "4px 10px", borderRadius: 8, cursor: "pointer",
                        background: "transparent",
                        border: "1px solid rgba(20,17,28,0.13)",
                        color: "rgba(20,17,28,0.75)",
                        fontSize: 13, fontWeight: 600,
                        fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
                        transition: "background .15s, border-color .15s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ color: "rgba(20,17,28,0.55)", fontWeight: 700 }}>{tenantInfo.name}</span>
                      <span style={{ color: "rgba(20,17,28,0.25)", margin: "0 1px" }}>·</span>
                      <span style={{ fontSize: 10 }}>📍</span>
                      <span style={{ color: "#fb0f05", fontWeight: 700, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {locationName ?? "Sede"}
                      </span>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.4, flexShrink: 0 }}>
                        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>

                    {locationSelectorOpen && (
                      <>
                        <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setLocationSelectorOpen(false)} />
                        <div style={{
                          position: "absolute", top: "calc(100% + 6px)", right: 0,
                          zIndex: 50, minWidth: 210,
                          background: "white",
                          border: "1px solid rgba(20,17,28,0.1)",
                          borderRadius: 10,
                          boxShadow: "0 8px 28px rgba(0,0,0,0.13)",
                          overflow: "hidden",
                        }}>
                          <div style={{
                            padding: "7px 13px 6px",
                            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                            textTransform: "uppercase", color: "rgba(20,17,28,0.32)",
                            fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace",
                            borderBottom: "1px solid rgba(20,17,28,0.06)",
                          }}>
                            Cambiar sede
                          </div>
                          {locations.map(loc => {
                            const active = loc.id === locationId;
                            return (
                              <button
                                key={loc.id}
                                onClick={() => setLocationId(loc.id)}
                                style={{
                                  width: "100%", textAlign: "left",
                                  padding: "9px 14px", border: "none", cursor: "pointer",
                                  background: active ? "rgba(251,15,5,0.05)" : "transparent",
                                  display: "flex", alignItems: "center", gap: 9,
                                  fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
                                }}
                              >
                                <span style={{ fontSize: 13, flexShrink: 0, opacity: active ? 1 : 0.3 }}>📍</span>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{
                                    fontSize: 13, fontWeight: active ? 700 : 500,
                                    color: active ? "#fb0f05" : "rgba(20,17,28,0.75)",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                  }}>
                                    {loc.name}
                                  </div>
                                  {loc.address && (
                                    <div style={{ fontSize: 11, color: "rgba(20,17,28,0.35)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {loc.address}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <span className={styles.tenantBadge}>{tenantInfo.name}</span>
                )}
              </div>
              <NotificationsBell tenantId={tenantInfo.id} />
              {tenantInfo.logoUrl ? (
                <span className={styles.avatarRing}>
                  <img src={tenantInfo.logoUrl} alt={tenantInfo.name}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                </span>
              ) : (
                <div className={styles.avatar}>{initials}</div>
              )}
            </div>
          </header>

            <div key={pathname} className={styles.contentWrap}>{children}</div>
          </main>
        </div>
      </div>
      {/* ── Modal: Trial expirado ── */}
      {trialExpired && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(5,5,16,0.92)",
          backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
          fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
        }}>
          <div style={{
            background: "linear-gradient(180deg, #0e0e22 0%, #07071a 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24,
            padding: "36px 32px",
            maxWidth: 580, width: "100%",
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
          }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 52, marginBottom: 14, lineHeight: 1 }}>⏰</div>
              <h2 style={{
                margin: "0 0 10px",
                fontSize: 24, fontWeight: 800,
                color: "rgba(255,255,255,0.94)",
                letterSpacing: "-0.02em",
              }}>
                Tu período de prueba finalizó
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                Elige un plan para continuar usando todas las funciones de Zyncra sin interrupciones.
              </p>
            </div>

            {/* Plans */}
            {upgradePlans.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {upgradePlans.map((plan, idx) => {
                  const isPopular = idx === Math.floor(upgradePlans.length / 2);
                  const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
                  return (
                    <div key={plan.id} style={{
                      borderRadius: 16, padding: "18px 20px",
                      border: isPopular ? "1.5px solid rgba(251,15,5,0.5)" : "1px solid rgba(255,255,255,0.1)",
                      background: isPopular
                        ? "linear-gradient(135deg, rgba(251,15,5,0.1), rgba(0,39,254,0.05))"
                        : "rgba(255,255,255,0.03)",
                      position: "relative",
                    }}>
                      {isPopular && (
                        <div style={{
                          position: "absolute", top: -11, left: 18,
                          background: "linear-gradient(135deg,#fb0f05,#0027fe)",
                          color: "white", fontSize: 9, fontWeight: 700,
                          padding: "3px 11px", borderRadius: 20, letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}>
                          Más popular
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: plan.features.length > 0 ? 12 : 0 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.94)" }}>{plan.name}</div>
                          {plan.description && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>{plan.description}</div>}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: "#ff7d72" }}>{fmt(plan.price)}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>/{plan.billing_cycle === "monthly" ? "mes" : "año"}</div>
                        </div>
                      </div>
                      {plan.features.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          {plan.features.slice(0, 4).map((f, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                              <span style={{ color: "#34d399", flexShrink: 0 }}>✓</span> {f}
                            </div>
                          ))}
                          {plan.features.length > 4 && (
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>
                              +{plan.features.length - 4} más incluidas
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                textAlign: "center", padding: "20px 0 28px",
                color: "rgba(255,255,255,0.4)", fontSize: 14,
              }}>
                Contacta con nuestro equipo para conocer los planes disponibles.
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a
                href="https://wa.me/573188886055?text=Hola%2C%20quiero%20activar%20un%20plan%20de%20Zyncra"
                target="_blank" rel="noreferrer"
                style={{
                  display: "block", textAlign: "center",
                  padding: "14px 24px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg,#fb0f05,#0027fe)",
                  color: "white", fontWeight: 800, fontSize: 15,
                  textDecoration: "none",
                  boxShadow: "0 6px 24px rgba(251,15,5,0.3)",
                }}>
                💬 Hablar con ventas por WhatsApp
              </a>
              <button
                onClick={() => setTrialExpired(false)}
                style={{
                  padding: "11px", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.35)", fontWeight: 600, fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
                }}>
                Continuar en modo limitado
              </button>
            </div>

            <p style={{
              textAlign: "center", margin: "16px 0 0",
              fontSize: 11, color: "rgba(255,255,255,0.2)",
            }}>
              ¿Problemas? Escríbenos a soporte@zyncra.app
            </p>
          </div>
        </div>
      )}
    </AdminContext.Provider>
  );
}
