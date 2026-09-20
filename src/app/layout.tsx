import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import AppShell from "@/components/AppShell";
import Analytics from "@/components/Analytics";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { slots as curatedSlots } from "@/data/orbital-slots";
import { mergeWithUcs } from "@/lib/satellites";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-mono",
});

export const metadata: Metadata = {
  title: "Clarke · Orbital Infrastructure",
  description: "Clarke is a live registry of GEO orbital positions: congestion, operators, and FCC filing status, the reference-data layer for a market that runs on PDFs and phone calls.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
  },
};

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const allSlots = mergeWithUcs(curatedSlots);
  return (
    <html lang="en" className={`h-full ${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-full flex flex-col bg-canvas text-ink overflow-x-hidden">
        {PLAUSIBLE_DOMAIN && (
          <Script
            src="https://plausible.io/js/script.js"
            data-domain={PLAUSIBLE_DOMAIN}
            strategy="afterInteractive"
          />
        )}
        <Analytics />
        <VercelAnalytics />
        <AppShell slots={allSlots}>{children}</AppShell>
      </body>
    </html>
  );
}
