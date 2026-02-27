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
  title: "ScribeX — Academic Writing Assistant",
  description:
    "An AI-powered academic writing assistant built on Mercury diffusion language models. Write, edit, and cite with speed and precision.",
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
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${manrope.variable} ${newsreader.variable} ${ibmPlexMono.variable} font-sans bg-white text-ink-800 antialiased`}
      >
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
