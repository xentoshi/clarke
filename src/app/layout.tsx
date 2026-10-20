import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import AppShell from "@/components/AppShell";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { Geist, IBM_Plex_Mono } from "next/font/google";

const geist = Geist({
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
  description: "Clarke is a reference record of who sits at each GEO longitude, with FCC filings, orbit freshness, and disputes.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
  },
};

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${geist.variable} ${ibmPlexMono.variable}`}>
      <body className={`${geist.className} min-h-full flex flex-col bg-canvas text-ink overflow-x-hidden`}>
        {PLAUSIBLE_DOMAIN && (
          <Script
            src="https://plausible.io/js/script.js"
            data-domain={PLAUSIBLE_DOMAIN}
            strategy="afterInteractive"
          />
        )}
        <VercelAnalytics />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
