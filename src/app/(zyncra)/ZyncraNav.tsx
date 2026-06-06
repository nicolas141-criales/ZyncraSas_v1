"use client";
import { useState } from "react";
import Link from "next/link";
import ZyncraLogo from "./ZyncraLogo";

export default function ZyncraNav({ active }: { active: "inicio" | "funciones" | "precios" | "resenas" | "blog" }) {
  const [open, setOpen] = useState(false);
  return (
    <nav className="z-nav">
      <Link href="/" className="z-nav-logo" style={{ display: "flex", alignItems: "center" }}>
        <ZyncraLogo height={34} />
      </Link>
      <ul className={`z-nav-links${open ? " open" : ""}`}>
        <li><Link href="/"          onClick={() => setOpen(false)} className={active === "inicio"    ? "active" : ""}>Inicio</Link></li>
        <li><Link href="/features"  onClick={() => setOpen(false)} className={active === "funciones" ? "active" : ""}>Funciones</Link></li>
        <li><Link href="/pricing"   onClick={() => setOpen(false)} className={active === "precios"   ? "active" : ""}>Precios</Link></li>
        <li><Link href="/reviews"   onClick={() => setOpen(false)} className={active === "resenas"   ? "active" : ""}>Reseñas</Link></li>
        <li><Link href="/blog"      onClick={() => setOpen(false)} className={active === "blog"      ? "active" : ""}>Blog</Link></li>
        <li className="z-nav-mobile-cta">
          <Link href="/login"   onClick={() => setOpen(false)} className="z-nav-mobile-login">Iniciar sesión</Link>
          <Link href="/pricing" onClick={() => setOpen(false)} className="z-btn-red z-nav-mobile-start">Empezar gratis →</Link>
        </li>
      </ul>
      <div className="z-nav-right">
        <Link href="/login" className="z-btn-ghost">Iniciar sesión</Link>
        <Link href="/pricing" className="z-btn-red">Empezar gratis →</Link>
      </div>
      <button className="z-nav-mobile-btn" onClick={() => setOpen(o => !o)} aria-label={open ? "Cerrar menú" : "Abrir menú"}>
        {open ? "✕" : "☰"}
      </button>
    </nav>
  );
}
