"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import styles from "./admin.module.css";
import { supabase } from "@/lib/supabase";
import { AdminContext } from "./admin-context";
import {
  IconGrid, IconCalendar, IconBell, IconChat, IconCreditCard,
  IconBanknotes, IconDocument, IconChartBar, IconStar, IconStorefront,
  IconUsers, IconUserGroup, IconPalette,
  IconCog, IconLogout, IconX, IconServiceBell,
} from "./ZyncraIcons";

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
      { href: "/admin/branding",      label: "Mi Marca",     icon: <IconPalette size={17} /> },
      { href: "/admin/settings",      label: "Configuración",icon: <IconCog size={17} /> },
    ],
  },
];

// Pages that are coming soon
const COMING_SOON = new Set<string>([]);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [tenantInfo, setTenantInfo] = useState<{ id: string; slug: string; name: string; logoUrl: string | null; currency: string; locale: string } | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: tenants } = await supabase
        .from("tenants").select("id, slug, name, settings").eq("owner_id", session.user.id).limit(1);

      if (tenants && tenants.length > 0) {
        const tenant = tenants[0] as any;
        const { data: brandingRows } = await supabase
          .from("branding").select("logo_url").eq("tenant_id", tenant.id).limit(1);
        const currency = tenant.settings?.currency ?? "COP";
        const locale   = tenant.settings?.locale   ?? "es-CO";
        setTenantInfo({ ...tenant, logoUrl: brandingRows?.[0]?.logo_url ?? null, currency, locale });
      }
      setLoadingAuth(false);
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

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

  return (
    <AdminContext.Provider value={{ tenantId: tenantInfo.id, tenantSlug: tenantInfo.slug, businessName: tenantInfo.name, logoUrl: tenantInfo.logoUrl, currency: tenantInfo.currency, locale: tenantInfo.locale, refreshCurrency }}>
      <div className={`${styles.adminLayout} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
        <style>{ZN_KEYFRAMES}</style>

        {/* Mobile overlay */}
        <div className={`${styles.overlay} ${sidebarOpen ? styles.open : ""}`} onClick={() => setSidebarOpen(false)} />

        {/* ── Sidebar ── */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
          <div className={styles.sidebarInner}>

            {/* Logo */}
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
            </div>

            {/* Nav groups */}
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

            {/* Bottom: logout */}
            <div className={styles.sidebarBottom}>
              <div className={styles.navLogout} onClick={handleLogout}>
                <IconLogout size={17} />
                Cerrar sesión
              </div>
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
              <span className={`${styles.tenantBadge} ${styles.hideMobile}`}>{tenantInfo.name}</span>
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
    </AdminContext.Provider>
  );
}
