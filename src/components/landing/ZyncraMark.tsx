export default function ZyncraMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs>
        <linearGradient id="zgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb0f05" />
          <stop offset="100%" stopColor="#0027fe" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="32" height="32" rx="8" fill="url(#zgrad)" />
      <path d="M9 10h14l-9 12h9" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
