"use client";

import { usePathname } from "next/navigation";

/** Registry + Terminal are data surfaces: solid near-black, no Earth wallpaper. */
export function isDataSurface(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/orbital" || pathname.startsWith("/orbital/");
}

export function PageBackdrop() {
  const pathname = usePathname();
  if (isDataSurface(pathname)) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/nasa-footer.jpg')",
          backgroundSize: "180%",
          backgroundPosition: "center center",
          opacity: 0.42,
        }}
      />
      <div className="absolute inset-0" style={{ background: "rgba(6,6,8,0.72)" }} />
    </div>
  );
}
