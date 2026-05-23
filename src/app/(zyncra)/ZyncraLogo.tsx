interface ZyncraLogoProps {
  height?: number;
  wordmarkColor?: string;
}

export default function ZyncraLogo({ height = 36, wordmarkColor = "var(--z-ink)" }: ZyncraLogoProps) {
  const iconSize = height;
  const textSize = Math.round(height * 0.58);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(height * 0.28) }}>
      {/* Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          {/* Background gradient: red → purple → blue */}
          <linearGradient id="zl-bg" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E8192C" />
            <stop offset="0.5" stopColor="#9B3FC8" />
            <stop offset="1" stopColor="#2042E8" />
          </linearGradient>
          {/* Z bars gradient: bright white → semi-transparent */}
          <linearGradient id="zl-z" x1="10" y1="10" x2="50" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0.97" />
            <stop offset="1" stopColor="white" stopOpacity="0.48" />
          </linearGradient>
        </defs>

        {/* Rounded square background */}
        <rect width="60" height="60" rx="14" fill="url(#zl-bg)" />

        {/* ── Z made of 3 rounded pill bars ── */}

        {/* Top horizontal bar */}
        <rect x="11" y="11" width="38" height="11" rx="5.5" fill="url(#zl-z)" />

        {/* Bottom horizontal bar */}
        <rect x="11" y="38" width="38" height="11" rx="5.5" fill="url(#zl-z)" />

        {/*
          Diagonal bar: connects right end of top bar to left end of bottom bar.
          Centers: top-right (49,16.5) → bottom-left (11,43.5)
          Length ≈ 47.2px · Angle ≈ 143.7° clockwise from +x (SVG coords, y-down)
        */}
        <rect
          x="6.4"
          y="25"
          width="47.2"
          height="11"
          rx="5.5"
          fill="url(#zl-z)"
          transform="rotate(143.7, 30, 30)"
        />
      </svg>

      {/* Wordmark */}
      <span
        style={{
          fontFamily: "var(--z-font)",
          fontWeight: 800,
          fontSize: textSize,
          color: wordmarkColor,
          letterSpacing: "-0.3px",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        zyncra
      </span>
    </div>
  );
}
