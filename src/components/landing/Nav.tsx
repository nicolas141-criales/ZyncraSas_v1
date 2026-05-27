"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const links = [
  { label: "Funciones", href: "/features" },
  { label: "Precios", href: "/pricing" },
  { label: "Reseñas", href: "/reviews" },
  { label: "Blog", href: "/blog" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("zyncra-theme") as "light" | "dark" | null;
    if (saved === "dark" || saved === "light") setTheme(saved);

    const onThemeChange = (e: Event) => {
      const detail = (e as CustomEvent<"light" | "dark">).detail;
      setTheme(detail);
    };
    window.addEventListener("zyncra:theme", onThemeChange);
    return () => window.removeEventListener("zyncra:theme", onThemeChange);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: "14px 0",
        transition: "all .3s ease",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "blur(0px)",
        background: scrolled
          ? theme === "dark"
            ? "rgba(9,9,15,0.85)"
            : "rgba(255,255,255,0.85)"
          : "transparent",
        borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/zyncra-icon.png" alt="Zyncra" width={32} height={32} style={{ borderRadius: 9 }} priority />
            <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)", fontFamily: "var(--font-sans)" }}>Zyncra</span>
          </Link>

          <nav className="zn-desktop-nav" style={{ display: "flex", alignItems: "center", gap: 30 }}>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{ fontSize: 14.5, color: "var(--fg-dim)", fontWeight: 400, transition: "color .15s ease", fontFamily: "var(--font-sans)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg-dim)")}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/login"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 13.5, padding: "8px 14px", borderRadius: 10,
                background: "transparent", color: "var(--fg-dim)", border: "none",
                cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500,
                transition: "color .15s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg-dim)")}
            >
              Iniciar sesión
            </Link>
            <button
              type="button"
              onClick={() => (window as any).__zyncraToggleTheme?.()}
              aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(20,15,30,0.06)",
                border: "1px solid var(--line-strong)",
                cursor: "pointer",
                color: "var(--fg-dim)",
                flexShrink: 0,
                transition: "background .2s ease, color .2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(20,15,30,0.12)";
                (e.currentTarget as HTMLElement).style.color = "var(--fg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(20,15,30,0.06)";
                (e.currentTarget as HTMLElement).style.color = "var(--fg-dim)";
              }}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <Link
              href="/register"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 13.5, padding: "8px 14px", borderRadius: 10,
                background: "linear-gradient(135deg, #fb0f05 0%, #0027fe 100%)",
                color: "white", border: "none", cursor: "pointer",
                fontFamily: "var(--font-sans)", fontWeight: 500,
                boxShadow: "0 8px 30px -10px rgba(0,39,254,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
                textDecoration: "none",
              }}
            >
              <span>Empezar gratis</span>
              <ArrowIcon />
            </Link>
            <button
              style={{
                display: "none",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--fg)",
                padding: 4,
              }}
              className="zn-mobile-menu-btn"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
            >
              {open ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: theme === "dark" ? "rgba(9,9,15,0.97)" : "rgba(255,255,255,0.97)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--line)",
            padding: "20px 28px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                fontSize: 16,
                color: "var(--fg-dim)",
                padding: "10px 0",
                borderBottom: "1px solid var(--line)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {l.label}
            </Link>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Link href="/login" onClick={() => setOpen(false)} style={{ flex: 1, textAlign: "center", padding: "10px", borderRadius: 10, border: "1px solid var(--line-strong)", fontSize: 14, fontFamily: "var(--font-sans)", color: "var(--fg-dim)" }}>
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              style={{
                flex: 1, textAlign: "center", padding: "10px", borderRadius: 10,
                background: "linear-gradient(135deg, #fb0f05 0%, #0027fe 100%)",
                color: "white", fontSize: 14, fontFamily: "var(--font-sans)", fontWeight: 500,
              }}
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 760px) {
          .zn-mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
