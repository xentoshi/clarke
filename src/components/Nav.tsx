"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { OrbitalSlot } from "@/data/orbital-slots";

const SearchPalette = dynamic(() => import("./SearchPalette"), { ssr: false });

const navLinks = [
  { href: "/orbital", label: "Registry" },
  { href: "/index", label: "Index" },
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
];

function navActive(pathname: string, href: string): boolean {
  if (href === "/orbital") return pathname === "/orbital" || pathname.startsWith("/orbital/");
  if (href === "/docs") return pathname === "/docs" || pathname.startsWith("/docs/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") { setSearchOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="border-b border-line bg-canvas/95 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/orbital" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.svg" alt="Clarke" width={28} height={28} />
            <div className="flex flex-col">
              <span className="text-ink font-semibold text-[15px] leading-none tracking-tight">Clarke</span>
              <span className="text-faint text-[11px] hidden sm:block leading-none mt-0.5">Orbital registry</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${navActive(pathname, link.href) ? "text-ink bg-line/70" : "text-muted hover:text-ink hover:bg-line/40"}`}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 sm:py-1.5 bg-surface border border-line rounded-sm text-faint hover:text-ink hover:border-line-strong transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:block text-xs">Search</span>
              <kbd className="hidden sm:block text-[10px] bg-canvas border border-line px-1 py-0.5 rounded font-mono">/</kbd>
            </button>

            <Link href="/login" className="hidden sm:block text-sm text-muted hover:text-ink px-2">Sign in</Link>
            <button onClick={() => setMobileOpen((o) => !o)} className="lg:hidden p-2.5 sm:p-2 text-muted hover:text-ink transition-colors">
              {mobileOpen
                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-line bg-canvas px-4 py-3">
            <nav className="grid grid-cols-1 gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  className={`px-3 py-2 text-sm rounded-sm transition-colors ${navActive(pathname, link.href) ? "text-ink bg-line/70" : "text-muted hover:text-ink hover:bg-line/40"}`}>
                  {link.label}
                </Link>
              ))}
              <Link href="/login" className="px-3 py-2 text-sm text-muted hover:text-ink">Sign in</Link>
            </nav>
          </div>
        )}
      </header>

      {searchOpen && <SearchPalette slots={slots} onClose={() => setSearchOpen(false)} />}
    </>
  );
}
