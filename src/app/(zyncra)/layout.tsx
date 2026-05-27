"use client";

import "../zyncra.css";
import "../zyncra-new.css";
import { Space_Grotesk, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import WaFab from "@/components/landing/WaFab";
import { useEffect, useState } from "react";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export default function ZyncraLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("zyncra-theme") as "light" | "dark" | null;
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("zyncra-theme", theme);
    window.dispatchEvent(new CustomEvent("zyncra:theme", { detail: theme }));
  }, [theme]);

  useEffect(() => {
    (window as any).__zyncraToggleTheme = () =>
      setTheme((t) => (t === "dark" ? "light" : "dark"));
    return () => {
      delete (window as any).__zyncraToggleTheme;
    };
  }, []);

  return (
    <div
      data-theme={theme}
      className={`${spaceGrotesk.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} zn-grain`}
      style={{
        background: "var(--bg)",
        color: "var(--fg)",
        fontFamily: "var(--font-sans)",
        fontSize: 16,
        lineHeight: 1.6,
        overflowX: "clip",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        minHeight: "100vh",
      } as React.CSSProperties}
    >
      <Nav />
      <main>{children}</main>
      <Footer />
      <WaFab />
    </div>
  );
}
