"use client";
import { useState } from "react";
import Link from "next/link";

export default function ZyncraNav({ active }: { active: "inicio" | "funciones" | "precios" | "resenas" }) {
  const [open, setOpen] = useState(false);
  return (
    <nav className="z-nav">
      <Link href="/" className="z-nav-logo">
        <span className="logo-mark">✂</span>Zyncra
      </Link>
      <ul className={`z-nav-links${open ? " open" : ""}`}>
        <li><Link href="/"          className={active === "inicio"    ? "active" : ""}>Inicio</Link></li>
        <li><Link href="/features"  className={active === "funciones" ? "active" : ""}>Funciones</Link></li>
        <li><Link href="/pricing"   className={active === "precios"   ? "active" : ""}>Precios</Link></li>
        <li><Link href="/reviews"   className={active === "resenas"   ? "active" : ""}>Reseñas</Link></li>
      </ul>
      <div className="z-nav-right">
        <Link href="/login" className="z-btn-ghost">Iniciar sesión</Link>
        <Link href="/pricing" className="z-btn-red">Empezar gratis →</Link>
      </div>
      <button className="z-nav-mobile-btn" onClick={() => setOpen(o => !o)}>☰</button>
    </nav>
  );
}
