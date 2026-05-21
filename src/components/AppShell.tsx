import Nav from "@/components/Nav";
import Link from "next/link";
import type { OrbitalSlot } from "@/data/orbital-slots";

export default function AppShell({ children, slots }: { children: React.ReactNode; slots: OrbitalSlot[] }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#060608]">

      {/* Background image fixed behind all content */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0"
          style={{
            backgroundImage: "url('/nasa-footer.jpg')",
            backgroundSize: "180%",
            backgroundPosition: "center center",
            opacity: 0.42,
          }} />
        <div className="absolute inset-0" style={{ background: "rgba(6,6,8,0.72)" }} />
      </div>

      {/* All content sits above the fixed images */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Nav slots={slots} />
        <main className="flex-1">{children}</main>

        <footer className="relative mt-24">
          <div className="border-t border-white/[0.05]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-10">
                <div className="col-span-2 sm:col-span-1">
                  <div className="font-bold text-white text-lg mb-2">CLARKE</div>
                  <p className="text-white/40 text-xs leading-relaxed">
                    The data and intelligence layer for orbital infrastructure.
                  </p>
                </div>
                <div>
                  <div className="text-white/30 text-xs uppercase tracking-widest mb-4 font-medium">Product</div>
                  <div className="flex flex-col gap-1">
                    {[
                      { label: "Orbital Slots", href: "/orbital" },
                      { label: "Companies", href: "/companies" },
                      { label: "Space Markets", href: "/stocks" },
                      { label: "Blog", href: "/blog" },
                    ].map((l) => (
                      <Link key={l.href} href={l.href} className="text-white/30 text-xs hover:text-white/80 transition-colors py-0.5">{l.label}</Link>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-white/30 text-xs uppercase tracking-widest mb-4 font-medium">Resources</div>
                  <div className="flex flex-col gap-1">
                    {[
                      { label: "About", href: "/about" },
                      { label: "Docs", href: "/docs" },
                      { label: "Data Sources", href: "/data" },
                      { label: "Operator", href: "/operator" },
                    ].map((l) => (
                      <Link key={l.href} href={l.href} className="text-white/30 text-xs hover:text-white/80 transition-colors py-0.5">{l.label}</Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/25 text-xs">
                <span>© {new Date().getFullYear()} Clarke</span>
                <span>Not financial advice.</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

    </div>
  );
}
