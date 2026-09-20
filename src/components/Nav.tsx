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
      <header className="border-b border-line bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <Link href="/orbital" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.svg" alt="Clarke" width={28} height={28} />
            <span className="text-ink font-semibold text-[17px] leading-none tracking-tight">Clarke</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`text-[15px] tracking-tight transition-colors ${navActive(pathname, link.href) ? "text-ink" : "text-muted hover:text-ink"}`}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <button onClick={() => setSearchOpen(true)}
              className="text-[15px] text-muted hover:text-ink transition-colors">
              Search
            </button>
            <Link href="/login" className="hidden sm:block text-[15px] text-muted hover:text-ink">Sign in</Link>
            <button onClick={() => setMobileOpen((o) => !o)} className="lg:hidden p-2 text-muted hover:text-ink transition-colors" aria-label="Menu">
              {mobileOpen
                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16M4 12h16M4 17h16" /></svg>}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-line bg-canvas px-4 py-4">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  className={`px-1 py-2 text-[15px] ${navActive(pathname, link.href) ? "text-ink" : "text-muted hover:text-ink"}`}>
                  {link.label}
                </Link>
              ))}
              <Link href="/login" className="px-1 py-2 text-[15px] text-muted hover:text-ink">Sign in</Link>
            </nav>
          </div>
        )}
      </header>

      {searchOpen && <SearchPalette slots={slots} onClose={() => setSearchOpen(false)} />}
    </>
  );
}
