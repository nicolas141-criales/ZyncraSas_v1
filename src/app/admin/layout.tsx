"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Admin Salon</div>
        
        <nav>
          <Link href="/admin">
            <div className={`${styles.navItem} ${pathname === "/admin" ? styles.active : ""}`}>
              <span>📊</span> Resumen
            </div>
          </Link>
          <Link href="/admin/calendar">
            <div className={`${styles.navItem} ${pathname === "/admin/calendar" ? styles.active : ""}`}>
              <span>📅</span> Calendario
            </div>
          </Link>
          <Link href="/admin/clients">
            <div className={`${styles.navItem} ${pathname === "/admin/clients" ? styles.active : ""}`}>
              <span>👥</span> Clientes (CRM)
            </div>
          </Link>
          <Link href="/admin/services">
            <div className={`${styles.navItem} ${pathname === "/admin/services" ? styles.active : ""}`}>
              <span>✂️</span> Servicios
            </div>
          </Link>
          <Link href="/admin/professionals">
            <div className={`${styles.navItem} ${pathname === "/admin/professionals" ? styles.active : ""}`}>
              <span>🧑‍💼</span> Equipo
            </div>
          </Link>
          <Link href="/admin/settings">
            <div className={`${styles.navItem} ${pathname === "/admin/settings" ? styles.active : ""}`}>
              <span>⚙️</span> Configuración
            </div>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>Panel de Control</div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <span style={{ fontWeight: 500 }}>Dueño Demo</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--accent-blue)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
              DD
            </div>
          </div>
        </header>

        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
    </div>
  );
}
