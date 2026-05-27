import "../zyncra.css";
import "../zyncra-new.css";
import { Space_Grotesk, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import WaFab from "@/components/landing/WaFab";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
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
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export default function ZyncraLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${spaceGrotesk.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} zn-grain`}
      style={{
        background: "var(--bg)",
        color: "var(--fg)",
        fontFamily: "var(--font-sans)",
        fontSize: 16,
        lineHeight: 1.6,
        overflowX: "hidden",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      } as React.CSSProperties}
    >
      <Nav />
      <main>{children}</main>
      <Footer />
      <WaFab />
    </div>
  );
}
