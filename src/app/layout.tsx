import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import AppShell from "@/components/AppShell";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-ibm-mono",
});

export const metadata: Metadata = {
  title: "Frontier — Multiplanetary Infrastructure",
  description: "The directory of every company building the infrastructure for humanity beyond Earth.",
};

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        {PLAUSIBLE_DOMAIN && (
          <Script
            src="https://plausible.io/js/script.js"
            data-domain={PLAUSIBLE_DOMAIN}
            strategy="afterInteractive"
          />
        )}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
