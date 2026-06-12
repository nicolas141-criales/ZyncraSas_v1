import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Content-Security-Policy.
// The app uses inline styles extensively (style={{}}) and Next injects inline
// bootstrap scripts, so 'unsafe-inline' is required for style/script. Images
// allow https: because tenants set arbitrary logo/background URLs. connect-src
// is allow-listed to Supabase (REST + Realtime websocket) and same-origin APIs.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${supabaseUrl} https://*.supabase.co wss://*.supabase.co`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Force HTTPS for 2 years incl. subdomains (only sent over HTTPS by browsers).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Clickjacking protection (belt-and-suspenders with frame-ancestors).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // Disable powerful features the app does not use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  // Required for Docker standalone deployment
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  poweredByHeader: false,
  async redirects() {
    // Case-insensitive redirects — Next.js App Router is case-sensitive
    return [
      { source: "/ADMIN",           destination: "/admin",    permanent: false },
      { source: "/ADMIN/:path*",    destination: "/admin/:path*",    permanent: false },
      { source: "/Admin",           destination: "/admin",    permanent: false },
      { source: "/Admin/:path*",    destination: "/admin/:path*",    permanent: false },
      { source: "/PLATFORM",        destination: "/platform", permanent: false },
      { source: "/PLATFORM/:path*", destination: "/platform/:path*", permanent: false },
      { source: "/Platform",        destination: "/platform", permanent: false },
      { source: "/Platform/:path*", destination: "/platform/:path*", permanent: false },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
