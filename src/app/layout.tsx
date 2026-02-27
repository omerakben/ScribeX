import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import { ToasterProvider } from "@/components/shared/toaster-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
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
        className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
