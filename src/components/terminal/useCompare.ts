"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "clarke:compare";
const EVENT = "clarke:compare";
const MAX = 4;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((s) => typeof s === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function write(slugs: string[]) {
  localStorage.setItem(KEY, JSON.stringify(slugs.slice(0, MAX)));
  window.dispatchEvent(new Event(EVENT));
}

export function useCompare() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  if (typeof window !== "undefined" && !hydrated) {
    setHydrated(true);
    setSlugs(read());
  }

  useEffect(() => {
    const on = () => setSlugs(read());
    window.addEventListener(EVENT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(EVENT, on);
      window.removeEventListener("storage", on);
    };
  }, []);

  const toggle = useCallback((slug: string) => {
    const cur = read();
    const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : cur.length >= MAX ? cur : [...cur, slug];
    write(next);
    setSlugs(next);
    return next;
  }, []);

  const clear = useCallback(() => {
    write([]);
    setSlugs([]);
  }, []);

  return { slugs, toggle, clear, max: MAX };
}
