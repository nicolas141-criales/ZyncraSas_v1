"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "./admin.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
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
          {[
            { href: "/admin", icon: "📊", label: "Resumen" },
            { href: "/admin/calendar", icon: "📅", label: "Calendario" },
            { href: "/admin/clients", icon: "👥", label: "Clientes (CRM)" },
            { href: "/admin/services", icon: "✂️", label: "Servicios" },
            { href: "/admin/professionals", icon: "🧑‍💼", label: "Equipo" },
            { href: "/admin/settings", icon: "⚙️", label: "Configuración" },
          ].map((item) => (
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
            <span style={{ fontWeight: 500, fontSize: "14px", display: "var(--hide-mobile, block)" }}>
              Dueño Demo
            </span>
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
              DD
            </div>
          </div>
        </header>

        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  );
}
