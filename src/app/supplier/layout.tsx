"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/supplier",          label: "Dashboard",  icon: "▦" },
  { href: "/supplier/products", label: "Productos",  icon: "📦" },
  { href: "/supplier/orders",   label: "Pedidos",    icon: "🛒" },
];

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [pendingOrders, setPendingOrders] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: supplier } = await supabase
        .from("suppliers")
        .select("id, company_name, status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!supplier) { router.push("/suppliers/register"); return; }
      if (supplier.status === "pending") { router.push("/suppliers/pending"); return; }
      if (supplier.status === "rejected" || supplier.status === "suspended") {
        router.push("/login"); return;
      }

      setCompanyName(supplier.company_name);

      const { count } = await supabase
        .from("supplier_orders")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", supplier.id)
        .eq("status", "pending");
      setPendingOrders(count ?? 0);

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
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#070712", flexDirection: "column", gap: 14 }}>
        <div style={{ width: 38, height: 38, border: "3px solid rgba(255,255,255,0.06)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>Verificando acceso...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)", overflow: "hidden", background: "#07071a" }}>

      {/* Ambient orbs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", background: "#07071a", inset: 0 }} />
        <div style={{ position: "absolute", top: "-10%", left: "5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)", filter: "blur(1px)" }} />
        <div style={{ position: "absolute", bottom: "-15%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,15,5,0.10) 0%, transparent 65%)" }} />
      </div>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 40, backdropFilter: "blur(4px)" }} />
      )}

      {/* Sidebar */}
      <style>{`
        @media(min-width:768px){.sup-sidebar{position:relative!important;left:0!important}}
        @media(max-width:767px){.sup-hamburger{display:flex!important}}
        .sup-nav-link:hover{background:rgba(255,255,255,0.07)!important;color:rgba(255,255,255,0.8)!important}
      `}</style>

      <aside className="sup-sidebar" style={{
        width: 220, display: "flex", flexDirection: "column", flexShrink: 0,
        position: "fixed", top: 0, left: sidebarOpen ? 0 : "-220px", bottom: 0, zIndex: 50,
        transition: "left .28s cubic-bezier(.4,0,.2,1)",
        background: "rgba(5,5,16,0.72)", backdropFilter: "blur(40px) saturate(200%)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.35)",
      }}>

        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Image src="/zyncra-icon.png" alt="Zyncra" height={24} width={24} style={{ height: 24, width: "auto" }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: "white", letterSpacing: "-0.5px" }}>Zyncra</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#fb0f05", textTransform: "uppercase", letterSpacing: "0.18em" }}>
            Portal Proveedor
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(item => {
            const active = item.href === "/supplier" ? pathname === "/supplier" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className="sup-nav-link"
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 600,
                  transition: "all .18s ease",
                  ...(active ? {
                    background: "linear-gradient(135deg, rgba(251,15,5,0.18), rgba(251,15,5,0.08))",
                    color: "#fff", border: "1px solid rgba(251,15,5,0.25)",
                    boxShadow: "0 2px 8px rgba(251,15,5,0.12)",
                  } : {
                    background: "transparent", color: "rgba(255,255,255,0.38)", border: "1px solid transparent",
                  }),
                }}>
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
                {item.href === "/supplier/orders" && pendingOrders > 0 && (
                  <span style={{
                    marginLeft: "auto", fontSize: 9, fontWeight: 800,
                    background: "#fb0f05", color: "white", borderRadius: 20, padding: "2px 6px",
                    boxShadow: "0 0 6px rgba(251,15,5,0.6)",
                  }}>
                    {pendingOrders > 99 ? "99+" : pendingOrders}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ padding: "8px 12px", marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Empresa</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 600, wordBreak: "break-all" }}>{companyName}</div>
          </div>
          <button onClick={handleLogout}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "none", background: "transparent", color: "rgba(239,68,68,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", marginLeft: 0, position: "relative", zIndex: 1 }} className="sup-main">
        <style>{`@media(min-width:768px){.sup-main{margin-left:220px}}`}</style>

        <header style={{
          padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, background: "rgba(5,5,16,0.6)", backdropFilter: "blur(32px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setSidebarOpen(o => !o)} className="sup-hamburger"
              style={{ display: "none", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span style={{ color: "rgba(255,255,255,0.88)", fontWeight: 700, fontSize: 14 }}>
              {NAV.find(n => n.href === "/supplier" ? pathname === "/supplier" : pathname.startsWith(n.href))?.label ?? "Portal"}
            </span>
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            background: "rgba(251,15,5,0.12)", color: "#ff7d72",
            border: "1px solid rgba(251,15,5,0.22)",
            letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            PROVEEDOR
          </span>
        </header>

        <main style={{ flex: 1, overflowY: "auto", background: "transparent" }}>
          <div style={{ padding: "28px 28px 80px" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
