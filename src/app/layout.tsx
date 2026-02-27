import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Newsreader } from "next/font/google";
import { ToasterProvider } from "@/components/shared/toaster-provider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ScribeX — Academic Writing at the Speed of Thought",
  description:
    "The first academic writing assistant powered by Mercury diffusion language models. 1,000+ tokens/second. Sub-second response times. Full-paper awareness.",
  keywords: [
    "academic writing",
    "research assistant",
    "Mercury AI",
    "diffusion language model",
    "paper writing",
    "citation management",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${newsreader.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
