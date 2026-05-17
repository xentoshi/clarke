"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function Analytics() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    fetch("/api/pv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, ref: document.referrer }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
