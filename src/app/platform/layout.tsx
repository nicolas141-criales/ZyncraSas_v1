"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { IconGrid, IconUsers, IconCreditCard, IconPackage, IconChartBar, IconCog, IconChat } from "../admin/ZyncraIcons";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const NAV: NavItem[] = [
  { href: "/platform",           label: "Dashboard", icon: <IconGrid size={16} /> },
  { href: "/platform/clients",   label: "Clientes",  icon: <IconUsers size={16} /> },
  { href: "/platform/billing",   label: "Cobros",    icon: <IconCreditCard size={16} /> },
  { href: "/platform/plans",     label: "Planes",    icon: <IconPackage size={16} /> },
  { href: "/platform/analytics", label: "Analytics", icon: <IconChartBar size={16} /> },
  { href: "/platform/pqrs",       label: "PQRs",        icon: <IconChat size={16} /> },
  { href: "/platform/suppliers",  label: "Proveedores", icon: <IconPackage size={16} /> },
  { href: "/platform/settings",   label: "Ajustes",     icon: <IconCog size={16} /> },
];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pqrPending, setPqrPending] = useState(0);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data } = await supabase
        .from("platform_admins").select("user_id")
        .eq("user_id", session.user.id).maybeSingle();
      if (!data) { router.push("/admin"); return; }
      setAdminEmail(session.user.email ?? "");

      // Load pending PQR count
      const { count } = await supabase.from("pqrs").select("id", { count: "exact", head: true }).eq("status", "pending");
      setPqrPending(count ?? 0);

      setLoading(false);
    }
    check();
  }, [router]);

  // Realtime: badge auto-updates when a new PQR arrives
  useEffect(() => {
    if (loading) return;
    const ch = supabase
      .channel("layout-pqrs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pqrs" }, () => {
        setPqrPending(n => n + 1);
        if (typeof window !== "undefined" && Notification.permission === "granted") {
          new Notification("Nuevo PQR recibido", { body: "Hay un nuevo PQR pendiente de revisión en la plataforma." });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#070712", flexDirection: "column", gap: 14 }}>
        <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.06)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif" }}>Verificando acceso...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif", overflow: "hidden", position: "relative", background: "#07071280" }}>

      {/* ── Ambient background orbs ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", background: "#07071a", inset: 0 }} />
        {/* Indigo orb — top left */}
        <div style={{ position: "absolute", top: "-10%", left: "5%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)", filter: "blur(1px)" }} />
        {/* Red orb — bottom right */}
        <div style={{ position: "absolute", bottom: "-15%", right: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,15,5,0.12) 0%, transparent 65%)", filter: "blur(1px)" }} />
        {/* Cyan orb — center right */}
        <div style={{ position: "absolute", top: "40%", right: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 65%)" }} />
        {/* Purple orb — bottom left */}
        <div style={{ position: "absolute", bottom: "10%", left: "15%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 65%)" }} />
      </div>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 40, backdropFilter: "blur(4px)" }} />
      )}

      {/* ── Sidebar ── */}
      <style>{`
        @media(min-width:768px){.platform-sidebar{position:relative!important;left:0!important}}
        @media(max-width:767px){.platform-hamburger{display:flex!important}}
        .nav-link:hover{background:rgba(255,255,255,0.07)!important;color:rgba(255,255,255,0.8)!important}
        .logout-btn:hover{background:rgba(239,68,68,0.08)!important}
      `}</style>

      <aside className="platform-sidebar" style={{
        width: 224, display: "flex", flexDirection: "column", flexShrink: 0,
        position: "fixed", top: 0, left: sidebarOpen ? 0 : "-224px", bottom: 0, zIndex: 50,
        transition: "left .28s cubic-bezier(.4,0,.2,1)",
        /* Liquid glass sidebar */
        background: "rgba(5,5,16,0.72)",
        backdropFilter: "blur(40px) saturate(200%)",
        WebkitBackdropFilter: "blur(40px) saturate(200%)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.35)",
      }}>

        {/* Brand */}
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
            backdropFilter: "blur(12px)",
            borderRadius: 10, padding: "7px 14px", display: "inline-flex", marginBottom: 14,
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <Image src="/zyncra-logo.png" alt="Zyncra" height={20} width={70} style={{ height: 20, width: "auto" }} />
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#ff7d72", textTransform: "uppercase", letterSpacing: "0.18em", fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace", opacity: 0.8 }}>
            Platform Admin
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(item => {
            const active = item.href === "/platform" ? pathname === "/platform" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className="nav-link"
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 600,
                  transition: "all .18s ease",
                  ...(active ? {
                    background: "linear-gradient(135deg, rgba(251,15,5,0.18), rgba(251,15,5,0.08))",
                    backdropFilter: "blur(12px)",
                    color: "#fff",
                    border: "1px solid rgba(251,15,5,0.25)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(251,15,5,0.12)",
                  } : {
                    background: "transparent",
                    color: "rgba(255,255,255,0.38)",
                    border: "1px solid transparent",
                  }),
                }}>
                <span style={{ display: "flex", alignItems: "center", opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                {item.label}
                {item.href === "/platform/pqrs" && pqrPending > 0 && (
                  <span style={{
                    marginLeft: "auto", fontSize: 9, fontWeight: 800, lineHeight: 1,
                    background: "#fb0f05", color: "white", borderRadius: 20,
                    padding: "2px 6px", minWidth: 16, textAlign: "center",
                    boxShadow: "0 0 6px rgba(251,15,5,0.6)",
                  }}>
                    {pqrPending > 99 ? "99+" : pqrPending}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ padding: "8px 12px", marginBottom: 2 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Sesión activa</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, wordBreak: "break-all" }}>{adminEmail}</div>
          </div>
          <button onClick={handleLogout} className="logout-btn"
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "none", background: "transparent", color: "rgba(239,68,68,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "background .18s" }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", marginLeft: 0, position: "relative", zIndex: 1 }}
        className="platform-main">
        <style>{`@media(min-width:768px){.platform-main{margin-left:224px}}`}</style>

        {/* Header */}
        <header style={{
          padding: "0 28px", height: 56, display: "flex", alignItems: "center",
          justifyContent: "space-between", flexShrink: 0,
          /* Liquid glass header */
          background: "rgba(5,5,16,0.6)",
          backdropFilter: "blur(32px) saturate(180%)",
          WebkitBackdropFilter: "blur(32px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.2)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setSidebarOpen(o => !o)} className="platform-hamburger"
              style={{ display: "none", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span style={{ color: "rgba(255,255,255,0.88)", fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em" }}>
              {NAV.find(n => n.href === "/platform" ? pathname === "/platform" : pathname.startsWith(n.href))?.label ?? "Platform"}
            </span>
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            background: "rgba(251,15,5,0.12)",
            color: "#ff7d72",
            border: "1px solid rgba(251,15,5,0.22)",
            fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace",
            letterSpacing: "0.12em",
            backdropFilter: "blur(8px)",
          }}>
            SUPER ADMIN
          </span>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", background: "transparent" }}>
          <div style={{ padding: "28px 28px 80px" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
