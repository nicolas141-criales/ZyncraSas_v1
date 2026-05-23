"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import { supabase } from "@/lib/supabase";
import { AdminContext } from "./admin-context";
import {
  IconGrid, IconCalendar, IconBell, IconChat, IconCreditCard,
  IconBanknotes, IconDocument, IconChartBar, IconStar, IconStorefront,
  IconSliders, IconUsers, IconScissors, IconUserGroup, IconPalette,
  IconCog, IconLogout, IconX,
} from "./ZyncraIcons";

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
      { href: "/admin/custom-fields", label: "Campos Personalizados",icon: <IconSliders size={17} /> },
    ],
  },
  {
    label: "Negocio",
    items: [
      { href: "/admin/services",      label: "Servicios",    icon: <IconScissors size={17} /> },
      { href: "/admin/professionals", label: "Equipo",       icon: <IconUserGroup size={17} /> },
      { href: "/admin/branding",      label: "Mi Marca",     icon: <IconPalette size={17} /> },
      { href: "/admin/settings",      label: "Configuración",icon: <IconCog size={17} /> },
    ],
  },
];

// Pages that are coming soon
const COMING_SOON = new Set([
  "/admin/reminders", "/admin/whatsapp", "/admin/reviews-google",
  "/admin/reviews-site",
  "/admin/invoices", "/admin/custom-fields",
]);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [tenantInfo, setTenantInfo] = useState<{ id: string; slug: string; name: string; logoUrl: string | null } | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: tenants } = await supabase
        .from("tenants").select("id, slug, name").eq("owner_id", session.user.id).limit(1);

      if (tenants && tenants.length > 0) {
        const tenant = tenants[0];
        const { data: brandingRows } = await supabase
          .from("branding").select("logo_url").eq("tenant_id", tenant.id).limit(1);
        setTenantInfo({ ...tenant, logoUrl: brandingRows?.[0]?.logo_url ?? null });
      }
      setLoadingAuth(false);
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  if (loadingAuth) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, background: "#f7f5f2" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e8e6e2", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "#a0a0b0", fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Cargando...</p>
      </div>
    );
  }

  if (!tenantInfo) {
    return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>Error: no se encontró el negocio.</div>;
  }

  const initials = tenantInfo.name.substring(0, 2).toUpperCase();

  return (
    <AdminContext.Provider value={{ tenantId: tenantInfo.id, tenantSlug: tenantInfo.slug, businessName: tenantInfo.name, logoUrl: tenantInfo.logoUrl }}>
      <div className={styles.adminLayout}>

        {/* Mobile overlay */}
        <div className={`${styles.overlay} ${sidebarOpen ? styles.open : ""}`} onClick={() => setSidebarOpen(false)} />

        {/* ── Sidebar ── */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
          <div className={styles.sidebarInner}>

            {/* Logo */}
            <div className={styles.brand}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ background: "white", borderRadius: 10, padding: "6px 12px", display: "inline-flex" }}>
                  <Image src="/zyncra-logo.png" alt="Zyncra" height={26} width={80}
                    style={{ height: 26, width: "auto" }} />
                </div>
                <div />
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
          <header className={styles.header}>
            <button className={styles.menuToggle} onClick={() => setSidebarOpen(o => !o)} aria-label="Menú">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div className={styles.headerTitle}>Panel de Control</div>

            <div className={styles.headerRight}>
              <span className={`${styles.tenantBadge} ${styles.hideMobile}`}>{tenantInfo.name}</span>
              {tenantInfo.logoUrl ? (
                <img src={tenantInfo.logoUrl} alt={tenantInfo.name}
                  style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid #e8e6e2" }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className={styles.avatar}>{initials}</div>
              )}
            </div>
          </header>

          <main className={styles.contentArea}>{children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
