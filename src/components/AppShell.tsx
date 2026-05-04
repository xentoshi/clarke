"use client";

import Nav from "@/components/Nav";
import Ticker from "@/components/Ticker";
import Link from "next/link";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#060608]">

      {/* Footer image — fixed at the bottom of the viewport, always behind content */}
      <div className="fixed inset-x-0 bottom-0 h-screen pointer-events-none z-0"
        style={{
          backgroundImage: "url('/nasa-footer.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 100%",
        }}>
        <div className="absolute inset-0" style={{ background: "rgba(6,6,8,0.2)" }} />
      </div>

      {/* All content sits above the fixed images */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Ticker />
        <Nav />
        <main className="flex-1">{children}</main>

        <footer className="relative mt-24">
          <div className="border-t border-white/[0.05]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
                <div className="col-span-2 sm:col-span-1">
                  <div className="font-bold text-white text-lg mb-2">FRONTIER</div>
                  <p className="text-white/40 text-xs leading-relaxed">
                    The directory of every company building the infrastructure for humanity beyond Earth.
                  </p>
                </div>
                <div>
                  <div className="text-white/30 text-xs uppercase tracking-widest mb-4 font-medium">Directory</div>
                  <div className="flex flex-col gap-1">
                    {[
                      { label: "Companies", href: "/companies" },
                      { label: "Narratives", href: "/narratives" },
                      { label: "Stocks", href: "/stocks" },
                      { label: "Investors", href: "/investors" },
                      { label: "Events", href: "/events" },
                    ].map((l) => (
                      <Link key={l.href} href={l.href} className="text-white/30 text-xs hover:text-white/80 transition-colors py-0.5">{l.label}</Link>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-white/30 text-xs uppercase tracking-widest mb-4 font-medium">Data</div>
                  <div className="flex flex-col gap-1">
                    {[
                      { label: "Solana × Hardware", href: "/solana" },
                      { label: "API", href: "/api-docs" },
                      { label: "About", href: "/about" },
                    ].map((l) => (
                      <Link key={l.href} href={l.href} className="text-white/30 text-xs hover:text-white/80 transition-colors py-0.5">{l.label}</Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/25 text-xs">
                <span>FRONTIER</span>
                <span>Not financial advice.</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

    </div>
  );
}
