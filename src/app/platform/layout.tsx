"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { IconGrid, IconUsers, IconCreditCard, IconPackage, IconChartBar, IconCog } from "../admin/ZyncraIcons";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const NAV: NavItem[] = [
  { href: "/platform",           label: "Dashboard", icon: <IconGrid size={16} /> },
  { href: "/platform/clients",   label: "Clientes",  icon: <IconUsers size={16} /> },
  { href: "/platform/billing",   label: "Cobros",    icon: <IconCreditCard size={16} /> },
  { href: "/platform/plans",     label: "Planes",    icon: <IconPackage size={16} /> },
  { href: "/platform/analytics", label: "Analytics", icon: <IconChartBar size={16} /> },
  { href: "/platform/settings",  label: "Ajustes",   icon: <IconCog size={16} /> },
];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data } = await supabase
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!data) { router.push("/admin"); return; }

      setAdminEmail(session.user.email ?? "");
      setLoading(false);
    }
    check();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#0a0a14", flexDirection: "column", gap: 14 }}>
        <div style={{ width: 40, height: 40, border: "3px solid #181824", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 13, fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif" }}>Verificando acceso...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#10101B", fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif", overflow: "hidden" }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 40 }} />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, background: "#0a0a14", display: "flex", flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.08)", flexShrink: 0,
        position: "fixed", top: 0, left: sidebarOpen ? 0 : "-220px", bottom: 0, zIndex: 50,
        transition: "left .25s",
      }}
        className="platform-sidebar">
        <style>{`
          @media(min-width:768px){.platform-sidebar{position:relative!important;left:0!important}}
          @media(max-width:767px){.platform-hamburger{display:flex!important}}
        `}</style>

        {/* Brand */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ background: "#15151F", borderRadius: 8, padding: "6px 12px", display: "inline-flex", marginBottom: 12 }}>
            <Image src="/zyncra-logo.png" alt="Zyncra" height={22} width={70} style={{ height: 22, width: "auto" }} />
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: "#ff7d72", textTransform: "uppercase", letterSpacing: "0.16em", fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace" }}>
            Platform Admin
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(item => {
            const active = item.href === "/platform" ? pathname === "/platform" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 600,
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.42)",
                  borderLeft: active ? "3px solid #fb0f05" : "3px solid transparent",
                  transition: "background .16s ease, color .16s ease",
                }}>
                <span style={{ display: "flex", alignItems: "center", opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "14px 10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ padding: "8px 12px", marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", marginBottom: 2 }}>Sesión activa</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 600, wordBreak: "break-all" }}>{adminEmail}</div>
          </div>
          <button onClick={handleLogout}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "none", background: "transparent", color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", marginLeft: 0 }}
        className="platform-main">
        <style>{`@media(min-width:768px){.platform-main{margin-left:220px}}`}</style>

        {/* Header */}
        <header style={{ background: "#0a0a14", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setSidebarOpen(o => !o)} className="platform-hamburger"
              style={{ display: "none", background: "none", border: "none", color: "rgba(255,255,255,0.42)", cursor: "pointer", padding: 4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span style={{ color: "rgba(255,255,255,0.92)", fontWeight: 700, fontSize: 15 }}>
              {NAV.find(n => n.href === "/platform" ? pathname === "/platform" : pathname.startsWith(n.href))?.label ?? "Platform"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9.5, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(251,15,5,0.16)", color: "#ff7d72", border: "1px solid rgba(251,15,5,0.35)", fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace", letterSpacing: "0.1em" }}>
              SUPER ADMIN
            </span>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", background: "#10101B" }}>
          <div style={{ padding: "28px 28px 60px" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
