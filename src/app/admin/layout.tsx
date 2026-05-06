"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import { supabase } from "@/lib/supabase";
import { AdminContext } from "./admin-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [tenantInfo, setTenantInfo] = useState<{ id: string, slug: string, name: string, logoUrl: string | null } | null>(null);

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, slug, name")
        .eq("owner_id", session.user.id)
        .limit(1);

      if (tenants && tenants.length > 0) {
        const tenant = tenants[0];
        // Also fetch logo from branding
        const { data: brandingRows } = await supabase
          .from("branding")
          .select("logo_url")
          .eq("tenant_id", tenant.id)
          .limit(1);

        const logoUrl = brandingRows && brandingRows.length > 0 ? brandingRows[0].logo_url : null;

        setTenantInfo({
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          logoUrl: logoUrl,
        });
      } else {
        console.error("No tenant found for this user.");
      }

      setLoadingAuth(false);
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loadingAuth) {
    return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>Cargando...</div>;
  }

  if (!tenantInfo) {
    return <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>Error: No se encontró la información de tu salón.</div>;
  }

  const navItems = [
    { href: "/admin", icon: "📊", label: "Resumen" },
    { href: "/admin/calendar", icon: "📅", label: "Calendario" },
    { href: "/admin/clients", icon: "👥", label: "Clientes (CRM)" },
    { href: "/admin/services", icon: "✂️", label: "Servicios" },
    { href: "/admin/professionals", icon: "🧑‍💼", label: "Equipo" },
    { href: "/admin/branding", icon: "🎨", label: "Mi Marca" },
    { href: "/admin/settings", icon: "⚙️", label: "Configuración" },
  ];

  return (
    <AdminContext.Provider value={{ tenantId: tenantInfo.id, tenantSlug: tenantInfo.slug, businessName: tenantInfo.name, logoUrl: tenantInfo.logoUrl }}>
      <div className={styles.adminLayout}>
        {/* Mobile Overlay */}
        <div
          className={`${styles.overlay} ${sidebarOpen ? styles.open : ""}`}
          onClick={closeSidebar}
        />

        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
          <div className={styles.brand}>◆ BookSalon</div>

          <nav>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={closeSidebar}>
                <div
                  className={`${styles.navItem} ${
                    pathname === item.href ? styles.active : ""
                  }`}
                >
                  <span>{item.icon}</span> {item.label}
                </div>
              </Link>
            ))}
            
            <div 
              className={styles.navItem} 
              style={{ marginTop: "auto", color: "#ef4444", cursor: "pointer" }} 
              onClick={handleLogout}
            >
              <span>🚪</span> Cerrar Sesión
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className={styles.mainContent}>
          <header className={styles.header}>
            {/* Hamburger */}
            <button
              className={styles.menuToggle}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Abrir menú"
            >
              {sidebarOpen ? "✕" : "☰"}
            </button>

            <div className={styles.headerTitle}>Panel de Control</div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span className={styles.hideMobile} style={{ fontWeight: 500, fontSize: "14px" }}>
                {tenantInfo.name}
              </span>
              {/* Dynamic Logo or Initials */}
              {tenantInfo.logoUrl ? (
                <img
                  src={tenantInfo.logoUrl}
                  alt={tenantInfo.name}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid var(--border-light)",
                    flexShrink: 0,
                  }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "var(--accent-blue)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "13px",
                    flexShrink: 0,
                  }}
                >
                  {tenantInfo.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </header>

          <main className={styles.contentArea}>{children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
