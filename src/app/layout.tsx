import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import AppShell from "@/components/AppShell";
import SolanaWalletProvider from "@/components/WalletProvider";
import { Manrope, IBM_Plex_Mono } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-ibm-mono",
});

export const metadata: Metadata = {
  title: "Clarke · Orbital Slot Registry",
  description: "The first transparent market for geostationary orbital slots. Browse, tokenize, and invest in GEO orbital positions on Solana.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
  },
};

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${manrope.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        {PLAUSIBLE_DOMAIN && (
          <Script
            src="https://plausible.io/js/script.js"
            data-domain={PLAUSIBLE_DOMAIN}
            strategy="afterInteractive"
          />
        )}
        <SolanaWalletProvider>
          <AppShell>{children}</AppShell>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
