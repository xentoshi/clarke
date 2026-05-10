"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Always use the public devnet faucet for airdrops — RPC providers like Helius block requestAirdrop
const FAUCET_CONNECTION = new Connection("https://api.devnet.solana.com", "confirmed");

const SearchPalette = dynamic(() => import("./SearchPalette"), { ssr: false });
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

const primaryLinks = [
  { href: "/orbital", label: "Orbital Slots" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/stocks", label: "Stocks" },
];

const moreLinks = [
  { href: "/operator", label: "Operator" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
];

const allLinks = [...primaryLinks, ...moreLinks];

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [airdropping, setAirdropping] = useState(false);
  const [airdropFailed, setAirdropFailed] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const { connected, publicKey } = useWallet();

  async function handleAirdrop() {
    if (!publicKey || airdropping) return;
    setAirdropping(true);
    setAirdropFailed(false);
    try {
      const sig = await FAUCET_CONNECTION.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL);
      await FAUCET_CONNECTION.confirmTransaction(sig, "confirmed");
    } catch (e) {
      console.error("Airdrop failed:", e);
      setAirdropFailed(true);
    } finally {
      setAirdropping(false);
    }
  }

  useEffect(() => { setMobileOpen(false); setMoreOpen(false); }, [pathname]);
  useEffect(() => { setAirdropFailed(false); }, [publicKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen((o) => !o); }
      if (e.key === "Escape") { setSearchOpen(false); setMoreOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isMoreActive = moreLinks.some((l) => l.href === pathname);

  return (
    <>
      <header className="border-b border-white/[0.05] bg-[#060608]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.svg" alt="Clarke" width={32} height={32} />
            <div className="flex flex-col">
              <span className="text-white font-bold text-base tracking-[0.15em] leading-none">CLARKE</span>
              <span className="text-white/20 text-[10px] tracking-widest uppercase hidden sm:block leading-none mt-0.5 font-mono">Space Infrastructure</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${pathname === link.href ? "text-white bg-white/8" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                {link.label}
              </Link>
            ))}
            <div ref={moreRef} className="relative">
              <button onClick={() => setMoreOpen((o) => !o)}
                className={`px-3 py-1.5 text-sm rounded-sm transition-colors flex items-center gap-1 ${isMoreActive || moreOpen ? "text-white bg-white/8" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                More
                <svg className={`w-3 h-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {moreOpen && (
                <div className="absolute top-full right-0 mt-1 w-44 bg-[#0a0a0e] border border-white/10 rounded-sm shadow-2xl py-1 z-50">
                  {moreLinks.map((link) => (
                    <Link key={link.href} href={link.href}
                      className={`block px-3 py-2 text-sm transition-colors ${pathname === link.href ? "text-white bg-white/8" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
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

            {connected && (
              airdropFailed ? (
                <a
                  href="https://faucet.solana.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Devnet faucet rate-limited — get SOL at faucet.solana.com"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 bg-red-500/10 border border-red-500/20
                             text-red-400 text-xs rounded-sm hover:bg-red-500/20 transition-colors"
                >
                  Rate limited · faucet.solana.com ↗
                </a>
              ) : (
                <button
                  onClick={handleAirdrop}
                  disabled={airdropping}
                  title="Airdrop 2 devnet SOL"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 bg-emerald-500/10 border border-emerald-500/20
                             text-emerald-400 text-xs rounded-sm hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
                >
                  {airdropping ? "…" : "⬇ SOL"}
                </button>
              )
            )}

            <WalletMultiButton style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "2px",
              fontSize: "12px",
              height: "32px",
              padding: "0 12px",
              color: "rgba(255,255,255,0.5)",
            }} />

            <button onClick={() => setMobileOpen((o) => !o)} className="lg:hidden p-2.5 sm:p-2 text-zinc-400 hover:text-white transition-colors">
              {mobileOpen
                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-white/[0.05] bg-[#060608] px-4 py-3">
            <nav className="grid grid-cols-2 gap-1">
              {allLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  className={`px-3 py-2 text-sm rounded-sm transition-colors ${pathname === link.href ? "text-white bg-white/8" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
    </>
  );
}
