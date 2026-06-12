"use client";

/* ============================================================
   ZYNCRA MOTION KIT — primitivas de motion design premium
   Framer Motion (motion/react) · respeta prefers-reduced-motion
   ============================================================ */

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ── Reveal: aparición al entrar en viewport (fade + rise + blur) ── */
export const Reveal = ({
  children,
  delay = 0,
  y = 26,
  blur = 6,
  duration = 0.75,
  amount = 0.2,
  style,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  blur?: number;
  duration?: number;
  amount?: number;
  style?: CSSProperties;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div style={style} className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: `blur(${blur}px)` }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount, margin: "0px 0px -60px 0px" }}
      transition={{ duration, delay, ease: EASE }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ── Stagger: contenedor que escalona la entrada de sus hijos ── */
export const Stagger = ({
  children,
  gap = 0.08,
  delay = 0,
  amount = 0.15,
  style,
  className,
}: {
  children: ReactNode;
  gap?: number;
  delay?: number;
  amount?: number;
  style?: CSSProperties;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div style={style} className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount, margin: "0px 0px -60px 0px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap, delayChildren: delay } },
      }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({
  children,
  y = 24,
  scale = 1,
  style,
  className,
}: {
  children: ReactNode;
  y?: number;
  scale?: number;
  style?: CSSProperties;
  className?: string;
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y, scale, filter: "blur(5px)" },
      show: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: { duration: 0.65, ease: EASE },
      },
    }}
    style={style}
    className={className}
  >
    {children}
  </motion.div>
);

/* ── LineReveal: texto que emerge desde una máscara (hero) ── */
export const LineReveal = ({
  children,
  delay = 0,
  style,
  className,
}: {
  children: ReactNode;
  delay?: number;
  style?: CSSProperties;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <span style={{ display: "inline-block", ...style }} className={className}>
        {children}
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        verticalAlign: "bottom",
        padding: "0.08em 0.05em 0.12em",
        margin: "-0.08em -0.05em -0.12em",
      }}
    >
      <motion.span
        initial={{ y: "112%", opacity: 0.001 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay, ease: EASE }}
        style={{ display: "inline-block", willChange: "transform", ...style }}
        className={className}
      >
        {children}
      </motion.span>
    </span>
  );
};

/* ── Magnetic: el elemento sigue sutilmente al cursor (botones CTA) ── */
export const Magnetic = ({
  children,
  strength = 0.28,
  style,
  className,
}: {
  children: ReactNode;
  strength?: number;
  style?: CSSProperties;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 180, damping: 16, mass: 0.5 });
  const y = useSpring(0, { stiffness: 180, damping: 16, mass: 0.5 });

  const onMove = (e: React.MouseEvent) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x, y, display: "inline-block", ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ── TiltCard: profundidad 3D + spotlight que sigue al mouse ── */
export const TiltCard = ({
  children,
  max = 5,
  spotlight = "rgba(0,39,254,0.08)",
  lift = -4,
  style,
  className,
}: {
  children: ReactNode;
  max?: number;
  spotlight?: string;
  lift?: number;
  style?: CSSProperties;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(0, { stiffness: 160, damping: 18 });
  const ry = useSpring(0, { stiffness: 160, damping: 18 });
  const px = useMotionValue(50);
  const py = useMotionValue(50);
  const glowOpacity = useSpring(0, { stiffness: 140, damping: 20 });
  const spotlightBg = useMotionTemplate`radial-gradient(420px circle at ${px}% ${py}%, ${spotlight}, transparent 65%)`;

  const onMove = (e: React.MouseEvent) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width;
    const cy = (e.clientY - r.top) / r.height;
    px.set(cx * 100);
    py.set(cy * 100);
    ry.set((cx - 0.5) * 2 * max);
    rx.set(-(cy - 0.5) * 2 * max);
    glowOpacity.set(1);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
    glowOpacity.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={reduce ? undefined : { y: lift }}
      style={{
        rotateX: rx,
        rotateY: ry,
        transformPerspective: 1000,
        position: "relative",
        ...style,
      }}
      className={className}
    >
      {children}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: spotlightBg,
          opacity: glowOpacity,
          pointerEvents: "none",
          borderRadius: "inherit",
          zIndex: 3,
        }}
      />
    </motion.div>
  );
};

/* ── CountUp: contador que arranca al entrar en viewport ── */
export const CountUp = ({
  to,
  prefix = "",
  suffix = "",
  duration = 1.8,
  decimals = 0,
  format,
  className = "mono",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  format?: (v: number) => string;
  className?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) =>
        setVal(decimals === 0 ? Math.round(v) : Number(v.toFixed(decimals))),
    });
    return () => controls.stop();
  }, [inView, to, duration, decimals, reduce]);

  const fmt = format || ((v: number) => v.toLocaleString("es-CO"));
  return (
    <span ref={ref} className={className}>
      {prefix}
      {fmt(reduce ? to : val)}
      {suffix}
    </span>
  );
};

/* ── TickerNumber: odómetro — dígitos que ruedan al cambiar ── */
export const TickerNumber = ({
  value,
  style,
  className,
}: {
  value: number;
  style?: CSSProperties;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  const str = value.toLocaleString("es-CO");
  if (reduce) {
    return (
      <span className={className} style={style}>
        {str}
      </span>
    );
  }
  return (
    <span
      className={className}
      style={{ display: "inline-flex", overflow: "hidden", ...style }}
      aria-label={str}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {str.split("").map((ch, i) => (
          <motion.span
            key={`${i}-${ch}`}
            initial={{ y: "-105%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "105%", opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            style={{ display: "inline-block" }}
            aria-hidden
          >
            {ch}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
};

/* ── Parallax: desplazamiento suave ligado al scroll ── */
export const Parallax = ({
  children,
  speed = 0.12,
  style,
  className,
}: {
  children: ReactNode;
  speed?: number;
  style?: CSSProperties;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 160, speed * -160]);
  return (
    <motion.div ref={ref} style={{ y: reduce ? 0 : y, ...style }} className={className}>
      {children}
    </motion.div>
  );
};

/* ── ScrollProgress: barra de progreso de lectura ── */
export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 28,
    restDelta: 0.001,
  });
  return (
    <motion.div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        transformOrigin: "0%",
        scaleX,
        background: "linear-gradient(90deg, #fb0f05, #0027fe)",
        zIndex: 120,
        pointerEvents: "none",
      }}
    />
  );
};

/* ── CursorFX: cursor personalizado (solo pointer fino) ── */
export const CursorFX = () => {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hoverLink, setHoverLink] = useState(false);
  const [down, setDown] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 260, damping: 24, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 260, damping: 24, mass: 0.6 });
  const glowX = useSpring(x, { stiffness: 60, damping: 20, mass: 1.1 });
  const glowY = useSpring(y, { stiffness: 60, damping: 20, mass: 1.1 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    // Activación asíncrona: evita un re-render en cascada dentro del efecto
    const enableRaf = requestAnimationFrame(() => setEnabled(true));
    document.documentElement.classList.add("zn-cursor-on");

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const t = e.target as HTMLElement | null;
      setHoverLink(
        !!t?.closest?.('a, button, [role="button"], [data-cursor="link"]'),
      );
    };
    const onDown = () => setDown(true);
    const onUp = () => setDown(false);
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    return () => {
      cancelAnimationFrame(enableRaf);
      document.documentElement.classList.remove("zn-cursor-on");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      {/* Glow ambiental que sigue al cursor con retardo */}
      <motion.div
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          x: glowX,
          y: glowY,
          translateX: "-50%",
          translateY: "-50%",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,39,254,0.05) 0%, rgba(251,15,5,0.03) 40%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 95,
          opacity: visible ? 1 : 0,
          transition: "opacity .4s ease",
        }}
      />
      {/* Anillo */}
      <motion.div
        aria-hidden
        animate={{
          scale: down ? 0.8 : hoverLink ? 1.7 : 1,
          opacity: visible ? 1 : 0,
          borderColor: hoverLink ? "rgba(0,39,254,0.7)" : "rgba(130,124,148,0.55)",
          backgroundColor: hoverLink ? "rgba(0,39,254,0.06)" : "rgba(0,39,254,0)",
        }}
        transition={{ duration: 0.25, ease: EASE }}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "1.5px solid rgba(130,124,148,0.55)",
          pointerEvents: "none",
          zIndex: 130,
        }}
        className="zn-cursor-ring"
      />
      {/* Punto */}
      <motion.div
        aria-hidden
        animate={{
          scale: down ? 0.6 : hoverLink ? 0.45 : 1,
          opacity: visible ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: EASE }}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          x,
          y,
          translateX: "-50%",
          translateY: "-50%",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #fb0f05, #0027fe)",
          boxShadow: "0 0 12px rgba(0,39,254,0.5)",
          pointerEvents: "none",
          zIndex: 131,
        }}
      />
    </>
  );
};

/* ── Particles: partículas de fondo extremadamente sutiles ── */
type Particle = {
  x: number;
  y: number;
  r: number;
  vy: number;
  sway: number;
  phase: number;
  a: number;
  warm: boolean;
};

export const Particles = ({
  count = 26,
  style,
}: {
  count?: number;
  style?: CSSProperties;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || window.innerWidth < 760) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let parts: Particle[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      w = rect?.width || window.innerWidth;
      h = rect?.height || window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.8 + Math.random() * 1.6,
        vy: 0.08 + Math.random() * 0.22,
        sway: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        a: 0.04 + Math.random() * 0.1,
        warm: Math.random() > 0.6,
      }));
    };

    let t = 0;
    const tick = () => {
      t += 0.008;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.vy;
        if (p.y < -8) {
          p.y = h + 8;
          p.x = Math.random() * w;
        }
        const sx = p.x + Math.sin(t * 2 + p.phase) * p.sway * 14;
        ctx.beginPath();
        ctx.arc(sx, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.warm
          ? `rgba(251,15,5,${p.a})`
          : `rgba(0,39,254,${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    seed();
    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(() => {
      resize();
      seed();
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
};

/* ── FadeSwitch: transición entre vistas (tabs) ── */
export const FadeSwitch = ({
  id,
  children,
  style,
  className,
}: {
  id: string | number;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) => (
  <AnimatePresence mode="wait" initial={false}>
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 14, scale: 0.995, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, scale: 0.995, filter: "blur(4px)" }}
      transition={{ duration: 0.38, ease: EASE }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

export { AnimatePresence, motion };
