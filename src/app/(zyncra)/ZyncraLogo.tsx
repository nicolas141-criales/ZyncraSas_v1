interface ZyncraLogoProps {
  height?: number;
  wordmarkColor?: string; // dark by default, pass "white" for footer
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
          <linearGradient id="zl-bg" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E8192C" />
            <stop offset="0.52" stopColor="#9B3FC8" />
            <stop offset="1" stopColor="#2042E8" />
          </linearGradient>
          <linearGradient id="zl-letter" x1="10" y1="10" x2="50" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0.97" />
            <stop offset="1" stopColor="white" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Rounded square background */}
        <rect width="60" height="60" rx="14" fill="url(#zl-bg)" />

        {/* Z letter — filled polygon shape */}
        <path
          d="M11 11 L49 11 L49 21 L23 39 L49 39 L49 49 L11 49 L11 39 L37 21 L11 21 Z"
          fill="url(#zl-letter)"
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
