import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// CSP justification:
// - 'unsafe-eval' in script-src: Required by the Mermaid diagram library which
//   uses Function() for SVG math label parsing, and by html2pdf.js (html2canvas)
//   for PDF export rendering. These are third-party dependencies we cannot modify.
// - 'unsafe-inline' in script-src & style-src: Required by TipTap editor which
//   applies inline styles for text formatting (colors, alignment, font size),
//   by Framer Motion for animation style injection, and by KaTeX for math
//   typesetting inline styles.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  async headers() {
    return isDev
      ? []
      : [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
