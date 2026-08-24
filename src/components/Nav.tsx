"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { OrbitalSlot } from "@/data/orbital-slots";

const SearchPalette = dynamic(() => import("./SearchPalette"), { ssr: false });

const navLinks = [
  { href: "/orbital", label: "Orbital Slots" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

export default function Nav({ slots }: { slots: OrbitalSlot[] }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Close menus on route change. Adjusted during render (not an effect) so the
  // close happens in the same commit as the navigation, not a render later.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen((o) => !o); }
      if (e.key === "Escape") { setSearchOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="border-b border-white/[0.05] bg-[#060608]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/orbital" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.svg" alt="Clarke" width={32} height={32} />
            <div className="flex flex-col">
              <span className="text-white font-bold text-base tracking-[0.15em] leading-none">CLARKE</span>
              <span className="text-white/20 text-[10px] tracking-widest uppercase hidden sm:block leading-none mt-0.5 font-mono">Orbital Infrastructure</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${pathname === link.href ? "text-white bg-white/8" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 sm:py-1.5 bg-white/[0.03] border border-white/[0.07] rounded-sm text-white/30 hover:text-white/70 hover:border-white/15 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:block text-xs">Search</span>
              <kbd className="hidden sm:block text-xs bg-zinc-800 px-1 py-0.5 rounded font-mono">⌘K</kbd>
            </button>

            <button onClick={() => setMobileOpen((o) => !o)} className="lg:hidden p-2.5 sm:p-2 text-zinc-400 hover:text-white transition-colors">
              {mobileOpen
                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-white/[0.05] bg-[#060608] px-4 py-3">
            <nav className="grid grid-cols-1 gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  className={`px-3 py-2 text-sm rounded-sm transition-colors ${pathname === link.href ? "text-white bg-white/8" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {searchOpen && <SearchPalette slots={slots} onClose={() => setSearchOpen(false)} />}
    </>
  );
}
