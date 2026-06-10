"use client";

// ─── Zyncra Admin — chart & data-display kit ──────────────────────
// SVG hecho a mano, sin librerías. Números siempre en JetBrains Mono
// tabular. Animaciones de entrada vía keyframes globales zn* (layout).

import { useEffect, useRef, useState } from "react";

export const MONO = "var(--font-jetbrains-mono),'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
export const SANS = "var(--font-space-grotesk),'Space Grotesk',ui-sans-serif,system-ui,sans-serif";
export const SERIF = "var(--font-instrument-serif),'Instrument Serif',ui-serif,Georgia,serif";

export const INK = "#14111C";
export const DIM = "#564E66";
export const MUTE = "#8E879B";
export const LINE = "rgba(20,15,30,0.08)";
export const RED = "#fb0f05";
export const BLUE = "#0027fe";
export const GRAD = "linear-gradient(135deg,#fb0f05 0%,#0027fe 100%)";

// ─── Helpers ──────────────────────────────────────────────────────
export const fmtCompact = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1).replace(".", ",") + " M";
  if (n >= 1_000) return Math.round(n / 1_000) + " k";
  return String(Math.round(n));
};

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setW(entries[0].contentRect.width));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}

// Número que cuenta hasta su valor al montar / cambiar
export function useCountUp(target: number, dur = 650) {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const d = reducedMotion() ? 0 : dur;
    const from = d === 0 ? target : fromRef.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = d === 0 ? 1 : Math.min(1, (t - t0) / d);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, dur]);
  return val;
}

// Curva suave (Catmull-Rom → Bézier), con control points acotados al plot
function smoothPath(pts: { x: number; y: number }[], yMin: number, yMax: number) {
  if (pts.length < 2) return "";
  const cl = (y: number) => Math.max(yMin, Math.min(yMax, y));
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = cl(p1.y + (p2.y - p0.y) / 6);
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = cl(p2.y - (p3.y - p1.y) / 6);
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

let uid = 0;
const nextId = () => `zn${++uid}`;

// ─── Sparkline ────────────────────────────────────────────────────
export function Spark({ data, w = 84, h = 30, light = false }: { data: number[]; w?: number; h?: number; light?: boolean }) {
  const [id] = useState(nextId);
  if (data.length < 2 || data.every(v => v === 0)) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * (w - 4) + 2, y: h - 4 - (v / max) * (h - 8) }));
  const line = smoothPath(pts, 2, h - 3);
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${h} L ${pts[0].x.toFixed(1)} ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={light ? "#ff6a5e" : RED} />
          <stop offset="100%" stopColor={light ? "#7d92ff" : BLUE} />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={light ? "rgba(255,255,255,0.22)" : "rgba(251,15,5,0.13)"} />
          <stop offset="100%" stopColor="rgba(251,15,5,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id}f)`} style={{ animation: "znFade .8s ease both .2s" }} />
      <path d={line} fill="none" stroke={`url(#${id}s)`} strokeWidth="2" strokeLinecap="round"
        pathLength={1} strokeDasharray={1} style={{ animation: "znDraw .9s cubic-bezier(.4,0,.2,1) both" }} />
    </svg>
  );
}

// ─── Area chart — interactiva, con crosshair y tooltip ────────────
export function AreaChart({ data, fmt, height = 190 }: {
  data: { label: string; value: number }[];
  fmt: (v: number) => string;
  height?: number;
}) {
  const { ref, w } = useSize<HTMLDivElement>();
  const [hov, setHov] = useState<number | null>(null);
  const [id] = useState(nextId);

  if (data.length < 2 || data.every(d => d.value === 0))
    return <Empty msg="Sin movimientos en este período." />;

  const padL = 44, padR = 14, padT = 14, padB = 26;
  const plotW = Math.max(w - padL - padR, 10);
  const plotH = height - padT - padB;
  const max = Math.max(...data.map(d => d.value), 1);
  const niceMax = max * 1.12;

  const pts = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * plotW,
    y: padT + plotH - (d.value / niceMax) * plotH,
  }));
  const line = smoothPath(pts, padT, padT + plotH);
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${padT + plotH} L ${pts[0].x.toFixed(1)} ${padT + plotH} Z`;

  const gridYs = [0, 1 / 3, 2 / 3, 1].map(f => padT + plotH * f);
  const gridVals = [1, 2 / 3, 1 / 3, 0].map(f => niceMax * f);
  const labelEvery = Math.ceil(data.length / Math.max(Math.floor(plotW / 64), 2));

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const i = Math.round(((x - padL) / plotW) * (data.length - 1));
    setHov(Math.max(0, Math.min(data.length - 1, i)));
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {w > 0 && (
        <svg width={w} height={height} onMouseMove={onMove} onMouseLeave={() => setHov(null)}
          style={{ display: "block", cursor: "crosshair" }}>
          <defs>
            <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={RED} />
              <stop offset="100%" stopColor={BLUE} />
            </linearGradient>
            <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(251,15,5,0.12)" />
              <stop offset="55%" stopColor="rgba(0,39,254,0.05)" />
              <stop offset="100%" stopColor="rgba(0,39,254,0)" />
            </linearGradient>
          </defs>

          {gridYs.map((y, i) => (
            <g key={i}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} stroke={LINE} strokeWidth="1"
                strokeDasharray={i === gridYs.length - 1 ? "none" : "2 4"} />
              <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="9" fill={MUTE}
                fontFamily={MONO}>{fmtCompact(gridVals[i])}</text>
            </g>
          ))}

          <path d={area} fill={`url(#${id}f)`} style={{ animation: "znFade 1s ease both .25s" }} />
          <path d={line} fill="none" stroke={`url(#${id}s)`} strokeWidth="2.2" strokeLinecap="round"
            pathLength={1} strokeDasharray={1} style={{ animation: "znDraw 1.1s cubic-bezier(.4,0,.2,1) both" }} />

          {data.map((d, i) => (
            i % labelEvery === 0 && (
              <text key={i} x={pts[i].x} y={height - 8} textAnchor="middle" fontSize="9"
                fill={hov === i ? INK : MUTE} fontFamily={MONO}
                fontWeight={hov === i ? 700 : 400}>{d.label}</text>
            )
          ))}

          {hov !== null && (
            <g>
              <line x1={pts[hov].x} x2={pts[hov].x} y1={padT} y2={padT + plotH}
                stroke="rgba(20,15,30,0.22)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={pts[hov].x} cy={pts[hov].y} r="4.5" fill="white" stroke={RED} strokeWidth="2.2" />
            </g>
          )}
        </svg>
      )}

      {hov !== null && w > 0 && (
        <div style={{
          position: "absolute", top: Math.max(pts[hov].y - 46, 0),
          left: Math.min(Math.max(pts[hov].x - 50, 0), w - 104),
          background: INK, color: "white", borderRadius: 8, padding: "5px 10px",
          pointerEvents: "none", whiteSpace: "nowrap", zIndex: 5,
          boxShadow: "0 8px 24px rgba(20,15,30,0.25)", animation: "znFade .12s ease both",
        }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", fontFamily: MONO, textTransform: "uppercase" }}>{data[hov].label}</div>
          <div style={{ fontSize: 12, fontWeight: 600, fontFamily: MONO }}>{fmt(data[hov].value)}</div>
        </div>
      )}
    </div>
  );
}

// ─── Barras verticales ────────────────────────────────────────────
export function Bars({ data, fmt, height = 150, accent = "brand" }: {
  data: { label: string; value: number }[];
  fmt: (v: number) => string;
  height?: number;
  accent?: "brand" | "green";
}) {
  const [hov, setHov] = useState<number | null>(null);
  if (data.length === 0) return <Empty msg="Sin datos para este período." />;
  const max = Math.max(...data.map(d => d.value), 1);
  const barH = height - 24;
  const bg = accent === "green"
    ? "linear-gradient(to top,#0d9488,#34d399)"
    : "linear-gradient(to top,#0027fe,#fb0f05)";

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height, position: "relative" }}>
      {data.map((d, i) => {
        const h = d.value > 0 ? Math.max((d.value / max) * barH, 4) : 2;
        const active = hov === i;
        return (
          <div key={i}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative", minWidth: 0 }}>
            {active && d.value > 0 && (
              <div style={{
                position: "absolute", bottom: h + 26, left: "50%", transform: "translateX(-50%)",
                background: INK, color: "white", fontSize: 11, fontWeight: 600, fontFamily: MONO,
                padding: "4px 9px", borderRadius: 7, whiteSpace: "nowrap", pointerEvents: "none",
                zIndex: 10, boxShadow: "0 8px 20px rgba(20,15,30,0.22)", animation: "znFade .12s ease both",
              }}>
                {fmt(d.value)}
                <div style={{
                  position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                  borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `4px solid ${INK}`,
                }} />
              </div>
            )}
            <div style={{
              width: "100%", maxWidth: 34, height: h,
              borderRadius: "5px 5px 2px 2px",
              background: d.value > 0 ? bg : "rgba(20,15,30,0.05)",
              opacity: hov !== null && !active ? 0.38 : 1,
              transition: "opacity .18s ease, height .45s cubic-bezier(.22,1,.36,1)",
              animation: `znRise .55s cubic-bezier(.22,1,.36,1) both ${i * 0.03}s`,
              transformOrigin: "bottom", cursor: d.value > 0 ? "pointer" : "default",
            }} />
            <span style={{
              fontSize: 9, fontFamily: MONO, lineHeight: 1, whiteSpace: "nowrap",
              color: active ? INK : MUTE, fontWeight: active ? 700 : 400, transition: "color .15s",
              overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%",
            }}>{d.label}</span>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 17, height: 1, background: LINE, pointerEvents: "none" }} />
    </div>
  );
}

// ─── Donut ────────────────────────────────────────────────────────
export function Donut({ data, fmt, centerLabel = "total", size = 148 }: {
  data: { label: string; value: number; color: string }[];
  fmt: (v: number) => string;
  centerLabel?: string;
  size?: number;
}) {
  const [on, setOn] = useState(false);
  const [hov, setHov] = useState<number | null>(null);
  useEffect(() => {
    // Doble rAF para que la transición parta del estado inicial pintado.
    // Con reduced-motion, la regla global deja la transición en ~0 ms.
    let inner = 0;
    const outer = requestAnimationFrame(() => { inner = requestAnimationFrame(() => setOn(true)); });
    return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); };
  }, []);

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0 || data.length === 0) return <Empty msg="Sin movimientos en este período." />;

  const sw = 17;
  const r = (size - sw) / 2 - 1;
  const C = 2 * Math.PI * r;
  const gap = data.length > 1 ? 2.5 : 0;

  const segs: { start: number; len: number }[] = [];
  for (let i = 0, acc = 0; i < data.length; i++) {
    const frac = data[i].value / total;
    segs.push({ start: acc, len: Math.max(frac * C - gap, 0.5) });
    acc += frac * C;
  }

  const shown = hov !== null ? data[hov] : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(20,15,30,0.05)" strokeWidth={sw} />
          {data.map((d, i) => (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={d.color} strokeWidth={hov === i ? sw + 3 : sw} strokeLinecap="butt"
              strokeDasharray={on ? `${segs[i].len} ${C - segs[i].len}` : `0.5 ${C}`}
              strokeDashoffset={-segs[i].start}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
              style={{
                cursor: "pointer",
                opacity: hov !== null && hov !== i ? 0.3 : 1,
                transition: `stroke-dasharray .8s cubic-bezier(.4,0,.2,1) ${i * 0.08}s, opacity .18s ease, stroke-width .18s ease`,
              }} />
          ))}
        </svg>
        <div style={{
          position: "absolute", inset: sw + 6, borderRadius: "50%",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center", pointerEvents: "none",
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: MONO, color: shown ? shown.color : INK, letterSpacing: "-0.3px", transition: "color .15s" }}>
            {fmtCompact(shown ? shown.value : total)}
          </div>
          <div style={{ fontSize: 8.5, fontFamily: MONO, color: MUTE, textTransform: "uppercase", letterSpacing: ".08em", marginTop: 2, maxWidth: size - sw * 2 - 20, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {shown ? shown.label : centerLabel}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9, minWidth: 150, flex: 1 }}>
        {data.map((d, i) => (
          <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
            style={{
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              opacity: hov !== null && hov !== i ? 0.42 : 1, transition: "opacity .15s",
            }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, fontWeight: 500, color: DIM, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
            <span style={{ fontSize: 11, fontFamily: MONO, color: MUTE }}>{((d.value / total) * 100).toFixed(0)}%</span>
            <span style={{ fontSize: 12, fontFamily: MONO, fontWeight: 600, color: INK }}>{fmt(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Ranking horizontal ───────────────────────────────────────────
export function RankBars({ items, fmt, maxLabel }: {
  items: { label: string; value: number; sub?: string }[];
  fmt: (v: number) => string;
  maxLabel?: number;
}) {
  if (items.length === 0) return <Empty msg="Sin datos en este período." />;
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, animation: `znFadeUp .45s cubic-bezier(.22,1,.36,1) both ${i * 0.06}s` }}>
          <div style={{
            width: 22, height: 22, borderRadius: 7, flexShrink: 0,
            background: i === 0 ? GRAD : "rgba(20,15,30,0.05)",
            color: i === 0 ? "white" : MUTE,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, fontFamily: MONO,
          }}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
              <span style={{
                fontSize: 12.5, fontWeight: 600, color: INK, overflow: "hidden", textOverflow: "ellipsis",
                whiteSpace: "nowrap", maxWidth: maxLabel ?? 180,
              }}>{it.label}</span>
              <span style={{ fontSize: 11.5, fontFamily: MONO, fontWeight: 600, color: DIM, flexShrink: 0 }}>
                {fmt(it.value)}{it.sub ? <span style={{ color: MUTE, fontWeight: 400 }}> · {it.sub}</span> : null}
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: "rgba(20,15,30,0.05)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${(it.value / max) * 100}%`, borderRadius: 3,
                background: i === 0 ? GRAD : "rgba(20,15,30,0.22)",
                animation: `znGrow .7s cubic-bezier(.22,1,.36,1) both ${0.15 + i * 0.06}s`,
                transformOrigin: "left",
              }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty / Skeleton ─────────────────────────────────────────────
export function Empty({ msg, action }: { msg: string; action?: React.ReactNode }) {
  return (
    <div style={{ padding: "28px 16px", textAlign: "center" }}>
      <div style={{
        width: 38, height: 38, margin: "0 auto 10px", borderRadius: "50%",
        border: "1.5px dashed rgba(20,15,30,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center", color: MUTE, fontSize: 15,
      }}>·</div>
      <p style={{ color: MUTE, fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>{msg}</p>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

export function Skel({ h = 16, w = "100%", r = 8, style }: { h?: number; w?: number | string; r?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: r,
      background: "linear-gradient(90deg, rgba(20,15,30,0.05) 25%, rgba(20,15,30,0.09) 50%, rgba(20,15,30,0.05) 75%)",
      backgroundSize: "200% 100%", animation: "znShimmer 1.4s ease-in-out infinite",
      ...style,
    }} />
  );
}
