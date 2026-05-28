"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";

// ── Container ──
export const Container = ({
  children,
  style,
  max = 1200,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  max?: number;
  className?: string;
}) => (
  <div
    className={className}
    style={{ maxWidth: max, margin: "0 auto", padding: "0 28px", ...style }}
  >
    {children}
  </div>
);

// ── Button ──
type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: () => void;
  style?: CSSProperties;
  icon?: ReactNode;
  iconRight?: ReactNode;
  target?: string;
  rel?: string;
};

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  style = {},
  icon,
  iconRight,
  target,
  rel,
}: ButtonProps) => {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
    border: "none",
    cursor: "pointer",
    transition:
      "transform .15s ease, box-shadow .25s ease, background .2s ease, color .2s ease, border-color .2s ease",
    textDecoration: "none",
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
  };
  const sizes: Record<string, CSSProperties> = {
    sm: { fontSize: 13.5, padding: "8px 14px", borderRadius: 10 },
    md: { fontSize: 14.5, padding: "11px 18px", borderRadius: 12 },
    lg: { fontSize: 16, padding: "14px 22px", borderRadius: 14 },
  };
  const variants: Record<string, CSSProperties> = {
    primary: {
      background:
        "linear-gradient(135deg, #fb0f05 0%, #0027fe 100%)",
      color: "white",
      boxShadow:
        "0 8px 30px -10px rgba(0,39,254,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
    },
    secondary: {
      background: "var(--bg-card)",
      color: "var(--fg)",
      border: "1px solid var(--line-strong)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
    },
    ghost: {
      background: "transparent",
      color: "var(--fg-dim)",
    },
  };
  const merged = { ...base, ...sizes[size], ...variants[variant], ...style };

  const onMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (variant === "primary") {
      e.currentTarget.style.transform = "translateY(-1px)";
      e.currentTarget.style.boxShadow =
        "0 14px 40px -10px rgba(0,39,254,0.55), inset 0 1px 0 rgba(255,255,255,0.3)";
    } else if (variant === "secondary") {
      e.currentTarget.style.background = "var(--bg-elev)";
    } else {
      e.currentTarget.style.color = "var(--fg)";
    }
  };
  const onMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (variant === "primary") {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow =
        "0 8px 30px -10px rgba(0,39,254,0.45), inset 0 1px 0 rgba(255,255,255,0.25)";
    } else if (variant === "secondary") {
      e.currentTarget.style.background = "var(--bg-card)";
    } else {
      e.currentTarget.style.color = "var(--fg-dim)";
    }
  };

  const content = (
    <>
      {icon}
      <span>{children}</span>
      {iconRight}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        style={merged}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={merged}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {content}
    </button>
  );
};

// ── Eyebrow ──
export const Eyebrow = ({
  children,
  accent = false,
}: {
  children: ReactNode;
  accent?: boolean;
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 12px",
      borderRadius: 999,
      border: "1px solid var(--line-strong)",
      background: accent ? "rgba(0,39,254,0.08)" : "rgba(255,255,255,0.03)",
      fontSize: 12,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      fontWeight: 500,
      color: accent ? "var(--violet-2)" : "var(--fg-dim)",
      fontFamily: "var(--font-mono)",
    }}
  >
    {accent && (
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: "var(--violet-2)",
          boxShadow: "0 0 10px var(--violet-2)",
          animation: "pulseGlow 1.8s ease-in-out infinite",
        }}
      />
    )}
    {children}
  </div>
);

// ── Section Title ──
export const SectionTitle = ({
  eyebrow,
  title,
  sub,
  align = "left",
  accent = true,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  align?: "left" | "center";
  accent?: boolean;
  children?: ReactNode;
}) => (
  <div
    style={{
      textAlign: align,
      marginBottom: 56,
      display: "flex",
      flexDirection: "column",
      alignItems: align === "center" ? "center" : "flex-start",
      gap: 18,
    }}
  >
    {eyebrow && <Eyebrow accent={accent}>{eyebrow}</Eyebrow>}
    <h2
      style={{
        fontSize: "clamp(32px, 4.6vw, 56px)",
        lineHeight: 1.1,
        letterSpacing: "-0.03em",
        margin: 0,
        fontWeight: 500,
        maxWidth: 820,
      }}
    >
      {title}
    </h2>
    {sub && (
      <p
        style={{
          fontSize: "clamp(15px, 1.4vw, 18px)",
          lineHeight: 1.55,
          color: "var(--fg-dim)",
          margin: 0,
          maxWidth: 620,
        }}
      >
        {sub}
      </p>
    )}
    {children}
  </div>
);

// ── GradientOrb ──
export const GradientOrb = ({
  color = "#fb0f05",
  size = 600,
  x = 0,
  y = 0,
  blur = 120,
  opacity = 0.35,
  style = {},
}: {
  color?: string;
  size?: number;
  x?: number | string;
  y?: number | string;
  blur?: number;
  opacity?: number;
  style?: CSSProperties;
}) => (
  <div
    aria-hidden
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
      filter: `blur(${blur}px)`,
      opacity,
      left: x,
      top: y,
      pointerEvents: "none",
      ...style,
    }}
  />
);

// ── GridBackdrop ──
export const GridBackdrop = ({ style = {} }: { style?: CSSProperties }) => (
  <div
    aria-hidden
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage:
        "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
      backgroundSize: "64px 64px",
      maskImage:
        "radial-gradient(ellipse at center, black 30%, transparent 70%)",
      WebkitMaskImage:
        "radial-gradient(ellipse at center, black 30%, transparent 70%)",
      pointerEvents: "none",
      ...style,
    }}
  />
);

// ── Card ──
export const Card = ({
  children,
  style = {},
  hover = false,
  glow = false,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  hover?: boolean;
  glow?: boolean;
  className?: string;
}) => {
  const [h, setH] = useState(false);
  return (
    <div
      className={className}
      onMouseEnter={() => hover && setH(true)}
      onMouseLeave={() => hover && setH(false)}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        backdropFilter: "blur(10px)",
        transition:
          "transform .25s ease, border-color .25s ease, box-shadow .35s ease",
        transform: hover && h ? "translateY(-4px)" : "translateY(0)",
        borderColor: hover && h ? "var(--line-strong)" : "var(--line)",
        boxShadow: glow ? "0 0 60px -20px rgba(0,39,254,0.3)" : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ── Counter ──
export const Counter = ({
  to,
  prefix = "",
  suffix = "",
  duration = 1800,
  decimals = 0,
  format,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  format?: (v: number) => string;
}) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const steps = 40;
    const stepDur = Math.max(16, Math.floor(duration / steps));
    let i = 0;
    const id = setInterval(() => {
      i++;
      const k = Math.min(i / steps, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      const cur = to * eased;
      setVal(decimals === 0 ? Math.round(cur) : Number(cur.toFixed(decimals)));
      if (k >= 1) clearInterval(id);
    }, stepDur);
    return () => clearInterval(id);
  }, [to, duration, decimals]);
  const fmt =
    format || ((v: number) => v.toLocaleString("es-CO"));
  return (
    <span className="mono">
      {prefix}
      {typeof val === "number" ? fmt(val) : val}
      {suffix}
    </span>
  );
};

// ── PageHero ──
export const PageHero = ({
  eyebrow,
  title,
  sub,
  accent = "#fb0f05",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  accent?: string;
}) => (
  <section
    style={{
      position: "relative",
      paddingTop: 150,
      paddingBottom: 60,
      overflowX: "clip",
      textAlign: "center",
    }}
  >
    <GradientOrb color={accent} size={700} x="-10%" y="-30%" opacity={0.25} />
    <GradientOrb color="#0027fe" size={500} x="75%" y="-10%" opacity={0.18} />
    <GridBackdrop style={{ opacity: 0.5 }} />
    <Container max={1100}>
      <div style={{ position: "relative", zIndex: 2 }}>
        {eyebrow && (
          <div
            style={{
              marginBottom: 24,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Eyebrow accent>{eyebrow}</Eyebrow>
          </div>
        )}
        <h1
          style={{
            fontSize: "clamp(40px, 6.4vw, 88px)",
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            fontWeight: 500,
            margin: 0,
            marginBottom: 22,
            maxWidth: 1000,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {title}
        </h1>
        {sub && (
          <p
            style={{
              fontSize: "clamp(15px, 1.3vw, 18px)",
              lineHeight: 1.55,
              color: "var(--fg-dim)",
              margin: "0 auto",
              maxWidth: 600,
            }}
          >
            {sub}
          </p>
        )}
      </div>
    </Container>
  </section>
);
