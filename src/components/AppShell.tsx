import Nav from "@/components/Nav";
import Link from "next/link";
import type { OrbitalSlot } from "@/data/orbital-slots";
import { PageBackdrop } from "@/components/PageBackdrop";

export default function AppShell({ children, slots }: { children: React.ReactNode; slots: OrbitalSlot[] }) {
  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <PageBackdrop />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Nav slots={slots} />
        <main className="flex-1">{children}</main>

        <footer className="relative mt-24">
          <div className="border-t border-line">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-10">
                <div className="col-span-2 sm:col-span-1">
                  <div className="font-semibold text-ink text-lg mb-2">Clarke</div>
                  <p className="text-muted text-sm leading-relaxed">
                    The registry for orbital infrastructure.
                  </p>
                </div>
                <div>
                  <div className="text-faint text-sm mb-4">Product</div>
                  <div className="flex flex-col gap-1">
                    {[
                      { label: "Orbital Registry", href: "/orbital" },
                      { label: "GEO belt", href: "/orbital/map" },
                      { label: "GEO Slot Index", href: "/index" },
                      { label: "Sample Terminal", href: "/orbital/101w" },
                      { label: "Pricing", href: "/pricing" },
                      { label: "Blog", href: "/blog" },
                    ].map((l) => (
                      <Link key={l.href} href={l.href} className="text-muted text-sm hover:text-ink transition-colors py-0.5">{l.label}</Link>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-faint text-sm mb-4">Resources</div>
                  <div className="flex flex-col gap-1">
                    {[
                      { label: "Docs", href: "/docs" },
                      { label: "About", href: "/about" },
                      { label: "Registry FAQ", href: "/orbital/faq" },
                      { label: "Data trust", href: "/docs/data-trust" },
                      { label: "Valuation v0", href: "/docs/valuation" },
                      { label: "FCC refresh", href: "/docs/fcc-refresh" },
                    ].map((l) => (
                      <Link key={l.href} href={l.href} className="text-muted text-sm hover:text-ink transition-colors py-0.5">{l.label}</Link>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-faint text-sm mb-4">Connect</div>
                  <div className="flex flex-col gap-1">
                    <a
                      href="https://x.com/ClarkeBeltFi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted text-sm hover:text-ink transition-colors py-0.5"
                    >
                      X / Twitter
                    </a>
                  </div>
                </div>
              </div>
              <div className="border-t border-line pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-faint text-sm">
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
